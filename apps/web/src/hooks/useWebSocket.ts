/**
 * Hook that connects to the API WebSocket and invalidates relevant React Query
 * caches when events arrive — no manual state management needed.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { WsEvent } from '@nextride/shared';

const WS_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws') + '/ws'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

export function useWebSocket(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(WS_URL);

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as WsEvent;
          handleEvent(msg, queryClient);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        // Reconnect after 3s on unexpected close
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [enabled, queryClient]);
}

function handleEvent(event: WsEvent, queryClient: ReturnType<typeof useQueryClient>) {
  switch (event.type) {
    case 'post:new':
    case 'post:updated':
    case 'post:cancelled':
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      break;
    case 'match:proposed':
    case 'match:confirmed':
    case 'match:cancelled':
    case 'match:completed':
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      break;
  }
}
