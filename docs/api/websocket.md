# WebSocket API

NextRide uses a WebSocket connection for real-time updates. When a post is created, a match is proposed, or a ride is confirmed, all connected clients receive an event instantly — no polling required.

---

## Connecting

```
ws://localhost:3001/ws
```

In production:

```
wss://your-domain.org/ws
```

The connection does not require authentication. Events are broadcast to all connected clients. The frontend filters events by relevance to the current user.

---

## Event Format

All events share the same envelope:

```json
{
  "type": "post:new",
  "payload": { ... },
  "timestamp": "2026-04-04T12:00:00.000Z"
}
```

---

## Event Types

### `post:new`

A new ride offer or ride request has been published.

```json
{
  "type": "post:new",
  "payload": {
    "id": "post-123",
    "type": "offer",
    "neighborhood": "Bilk",
    "date": "2026-05-01T10:00:00Z",
    "timeSlot": { "start": "10:00", "end": "12:00" },
    "passengerCount": 2,
    "status": "open"
  },
  "timestamp": "2026-04-04T12:00:00.000Z"
}
```

### `post:updated`

A post's fields or status have changed.

```json
{
  "type": "post:updated",
  "payload": {
    "id": "post-123",
    "status": "matched"
  },
  "timestamp": "2026-04-04T12:05:00.000Z"
}
```

### `post:cancelled`

A post has been cancelled (status set to `cancelled`).

```json
{
  "type": "post:cancelled",
  "payload": {
    "id": "post-123"
  },
  "timestamp": "2026-04-04T12:10:00.000Z"
}
```

### `match:proposed`

A coordinator has proposed a match between an offer and a request.

```json
{
  "type": "match:proposed",
  "payload": {
    "id": "match-456",
    "offerPostId": "post-offer-001",
    "requestPostId": "post-request-002",
    "status": "proposed"
  },
  "timestamp": "2026-04-04T13:00:00.000Z"
}
```

### `match:confirmed`

Both parties have confirmed the match. Ride details are now available.

```json
{
  "type": "match:confirmed",
  "payload": {
    "id": "match-456",
    "status": "confirmed"
  },
  "timestamp": "2026-04-04T13:30:00.000Z"
}
```

### `match:cancelled`

A match has been cancelled.

```json
{
  "type": "match:cancelled",
  "payload": {
    "id": "match-456",
    "status": "cancelled",
    "reason": "Pilot unavailable"
  },
  "timestamp": "2026-04-04T14:00:00.000Z"
}
```

### `match:completed`

The ride has taken place and been marked as completed.

```json
{
  "type": "match:completed",
  "payload": {
    "id": "match-456",
    "status": "completed"
  },
  "timestamp": "2026-05-01T16:15:00.000Z"
}
```

---

## Frontend Usage

The frontend uses the `useWebSocket` hook (`apps/web/src/hooks/useWebSocket.ts`) to subscribe to events and invalidate React Query caches automatically when relevant events arrive.

---

## Nginx WebSocket Proxy

If serving behind Nginx, ensure the WebSocket proxy is configured:

```nginx
location /ws {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

See the [Deployment Guide](../DEPLOYMENT.md) for the full Nginx configuration.
