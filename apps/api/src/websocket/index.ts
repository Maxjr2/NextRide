/**
 * WebSocket server for real-time events.
 *
 * Clients connect to ws://host/ws and receive JSON messages of the form:
 *   { type: WsEventType, payload: ..., timestamp: ISO string }
 *
 * All connected clients receive all events (broadcast).
 * Future: filter by role/chapter once multi-tenancy is needed.
 */
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { logger } from '../config/logger';
import type { WsEvent, WsEventType } from '@nextride/shared';

export interface WsEmitter {
  emit(event: Omit<WsEvent, 'timestamp'>): void;
}

export function createWsServer(httpServer: Server): WsEmitter {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    const ip = req.socket.remoteAddress ?? 'unknown';
    logger.debug({ ip }, 'WebSocket client connected');

    socket.on('close', () => {
      logger.debug({ ip }, 'WebSocket client disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ err, ip }, 'WebSocket error');
    });

    // Keep-alive ping every 30s
    const ping = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.ping();
    }, 30_000);

    socket.on('close', () => clearInterval(ping));
  });

  function emit(event: Omit<WsEvent, 'timestamp'>): void {
    const message = JSON.stringify({ ...event, timestamp: new Date().toISOString() } satisfies WsEvent);
    let sent = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sent++;
      }
    });
    logger.debug({ type: event.type, recipients: sent }, 'WS event broadcast');
  }

  logger.info('WebSocket server ready at /ws');
  return { emit };
}
