# Matches API

A match pairs a pilot offer post with a rider/facility request post. Coordinators propose matches; pilots, riders, and facilities confirm their side.

---

## Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/matches` | any | List matches with optional filters |
| `POST` | `/matches` | coordinator | Propose a new match |
| `GET` | `/matches/:id` | any | Get match by ID |
| `POST` | `/matches/:id/confirm` | pilot, rider, coordinator | Confirm your side |
| `POST` | `/matches/:id/cancel` | participant, coordinator | Cancel the match |
| `POST` | `/matches/:id/complete` | pilot, coordinator | Mark the ride as completed |

---

## List Matches

```http
GET /api/v1/matches
```

### Query parameters

| Parameter | Type | Example | Description |
|---|---|---|---|
| `status` | string | `?status=confirmed` | `proposed` \| `confirmed` \| `completed` \| `cancelled` |
| `postId` | string | `?postId=post-123` | Filter by offer or request post ID |

---

## Propose a Match

```http
POST /api/v1/matches
Content-Type: application/json
```

Coordinator only. Links an offer post and a request post:

```json
{
  "offerPostId": "post-offer-001",
  "requestPostId": "post-request-002"
}
```

Both posts must be in `open` or `matched` status. Creating the match sets both posts to `matched` and sends notifications to the pilot and rider/facility.

---

## Confirm a Match

```http
POST /api/v1/matches/:id/confirm
```

The match moves to `confirmed` once **both** the pilot **and** the rider (or facility) confirm. Coordinators can confirm on behalf of either party.

Once confirmed, both parties receive full ride details (pickup address, accessibility notes, contact info).

---

## Cancel a Match

```http
POST /api/v1/matches/:id/cancel
Content-Type: application/json
```

Optional body:

```json
{
  "reason": "Illness — pilot unable to ride"
}
```

Cancelling a match returns both posts to `open` status so they can be re-matched.

---

## Complete a Match

```http
POST /api/v1/matches/:id/complete
```

Pilot or coordinator only. Marks the ride as completed and transitions the match to `completed` status. Triggers the ride log entry.

---

## Match Status Flow

```
proposed → (pilot confirms)  → pilot_confirmed
         → (rider confirms)  → rider_confirmed
         → (both confirm)    → confirmed → completed
         → (either cancels)  → cancelled
```

!!! note "Simplified status in the API"
    The API exposes a simplified status: `proposed`, `confirmed`, `completed`, `cancelled`. Internal confirmation tracking is managed server-side.
