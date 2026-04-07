# Posts API

Posts represent both pilot **offers** (`type: "offer"`) and rider/facility **requests** (`type: "request"`). All authenticated users can read and create posts; editing and deletion require authorship or coordinator role.

---

## Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/posts` | any | List posts with optional filters |
| `POST` | `/posts` | any | Create an offer or request |
| `GET` | `/posts/:id` | any | Get a single post by ID |
| `PATCH` | `/posts/:id` | author, coordinator | Update fields or status |
| `DELETE` | `/posts/:id` | author, coordinator | Cancel a post |

---

## List Posts

```http
GET /api/v1/posts
```

### Query parameters

| Parameter | Type | Example | Description |
|---|---|---|---|
| `type` | `offer` \| `request` | `?type=offer` | Filter by post type |
| `status` | string | `?status=open` | `open` \| `matched` \| `confirmed` \| `completed` \| `cancelled` |
| `neighborhood` | string | `?neighborhood=Bilk` | Filter by neighborhood |
| `date` | ISO date | `?date=2026-05-01` | Filter by ride date |
| `authorId` | string | `?authorId=user-123` | Filter by author |
| `page` | number | `?page=2` | Page number (default: 1) |
| `pageSize` | number | `?pageSize=10` | Results per page (max: 100, default: 20) |

### Example

```bash
curl http://localhost:3001/api/v1/posts?type=offer&status=open&neighborhood=Bilk \
  -H "Authorization: Bearer coord-001"
```

---

## Create a Post

```http
POST /api/v1/posts
Content-Type: application/json
```

### Body — pilot offer

```json
{
  "type": "offer",
  "vehicleId": "veh-lotte",
  "neighborhood": "Bilk",
  "date": "2026-05-01T10:00:00Z",
  "timeSlot": { "start": "10:00", "end": "12:00" },
  "passengerCount": 2,
  "note": "Gerne entlang des Rheins"
}
```

### Body — ride request

```json
{
  "type": "request",
  "neighborhood": "Wersten",
  "date": "2026-05-01T00:00:00Z",
  "timeSlot": { "start": "14:00", "end": "16:00" },
  "passengerCount": 1,
  "accessibilityNotes": "Rollstuhltransfer nötig",
  "routeWish": "Entlang des Rheins"
}
```

---

## Get a Post

```http
GET /api/v1/posts/:id
```

---

## Update a Post

```http
PATCH /api/v1/posts/:id
Content-Type: application/json
```

Partial update — only include the fields you want to change. Coordinators can also update `status` directly.

```json
{
  "note": "Updated note",
  "status": "cancelled"
}
```

---

## Cancel a Post

```http
DELETE /api/v1/posts/:id
```

Sets the post status to `cancelled`. The post is not permanently deleted.

---

## Post Status Flow

```
open → matched → confirmed → completed
                           ↘
                            cancelled (from any state)
```

- `open` — Newly created, visible on the board
- `matched` — A match has been proposed
- `confirmed` — Match confirmed by both parties
- `completed` — Ride has taken place
- `cancelled` — Post was withdrawn or the match cancelled
