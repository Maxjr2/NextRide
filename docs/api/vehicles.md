# Vehicles API

Vehicles are the trishaw fleet managed by the chapter. Only pilots certified for a given vehicle can post offers using it.

---

## Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/vehicles` | any | List all active vehicles |
| `GET` | `/vehicles/mine` | pilot | List own registered vehicles |
| `GET` | `/vehicles/:id` | any | Get vehicle by ID |
| `POST` | `/vehicles` | pilot | Register a new vehicle |
| `PATCH` | `/vehicles/:id` | owner, coordinator | Update vehicle details |

---

## List Vehicles

```http
GET /api/v1/vehicles
```

Returns all vehicles with `status: "active"`. Used to populate the vehicle selector when creating an offer post.

### Example response

```json
{
  "data": [
    {
      "id": "veh-lotte",
      "name": "Flotte Lotte",
      "type": "standard",
      "seats": 2,
      "requiresCertLevel": "standard",
      "status": "active"
    },
    {
      "id": "veh-doppelt",
      "name": "Doppeltes Lottchen",
      "type": "tandem",
      "seats": 2,
      "requiresCertLevel": "tandem",
      "status": "active"
    }
  ]
}
```

---

## List Own Vehicles

```http
GET /api/v1/vehicles/mine
```

Pilot only. Returns vehicles registered by the authenticated pilot.

---

## Get a Vehicle

```http
GET /api/v1/vehicles/:id
```

---

## Register a Vehicle

```http
POST /api/v1/vehicles
Content-Type: application/json
```

Pilot only. Registers a new vehicle for the chapter fleet:

```json
{
  "name": "Flotte Lotte",
  "type": "standard",
  "seats": 2,
  "requiresCertLevel": "standard",
  "neighborhood": "Bilk"
}
```

---

## Update a Vehicle

```http
PATCH /api/v1/vehicles/:id
Content-Type: application/json
```

Owner (pilot) or coordinator only. Partial update:

```json
{
  "status": "inactive",
  "note": "Under repair until May"
}
```

---

## Certification Levels

Pilots have a list of certification levels (`certLevels[]`) on their profile. When creating an offer post, the API validates that the pilot is certified for the selected vehicle.

| Level | Required for |
|---|---|
| `standard` | Standard single-passenger trishaw |
| `tandem` | Tandem two-passenger trishaw (additional training required) |
