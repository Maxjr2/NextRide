# Users & Facilities API

---

## Users

### Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/users/me` | any | Get own profile |
| `PATCH` | `/users/me` | any | Update own profile |
| `GET` | `/users` | coordinator | List all users |
| `GET` | `/users/:id` | coordinator | Get any user by ID |

### Get own profile

```http
GET /api/v1/users/me
```

Returns the authenticated user's profile, including role, notification preferences, and training status.

### Example response

```json
{
  "data": {
    "id": "user-001",
    "externalId": "pilot-001",
    "role": "pilot",
    "name": "Martin K.",
    "email": "martin@example.com",
    "phone": "+49 211 000000",
    "trainingStatus": "active",
    "certLevels": ["standard", "tandem"],
    "neighborhoods": ["Bilk", "Wersten"],
    "notificationPrefs": {
      "email": true,
      "sms": false,
      "push": true
    }
  }
}
```

### Update own profile

```http
PATCH /api/v1/users/me
Content-Type: application/json
```

Updatable fields: `name`, `phone`, `notificationPrefs`, `neighborhoods`.

```json
{
  "phone": "+49 211 999999",
  "notificationPrefs": {
    "sms": true
  }
}
```

### List all users (coordinator)

```http
GET /api/v1/users
```

Coordinator only. Returns all users with pagination.

### Get any user (coordinator)

```http
GET /api/v1/users/:id
```

Coordinator only.

---

## Facilities

Facilities represent care homes, day centers, and residential facilities. They post ride requests on behalf of residents.

### Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/facilities` | any | List active facilities |
| `GET` | `/facilities/:id` | any | Get facility by ID |
| `POST` | `/facilities` | coordinator | Create a facility |
| `PATCH` | `/facilities/:id` | coordinator | Update a facility |

### List facilities

```http
GET /api/v1/facilities
```

Returns all active facilities. Used when assigning a user to a facility.

### Create a facility (coordinator)

```http
POST /api/v1/facilities
Content-Type: application/json
```

```json
{
  "name": "Seniorenhaus Am Park",
  "address": "Parkstraße 12, 40215 Düsseldorf",
  "contactUserId": "user-facility-001"
}
```

### Update a facility (coordinator)

```http
PATCH /api/v1/facilities/:id
Content-Type: application/json
```

```json
{
  "name": "Seniorenhaus Am Park (renamed)",
  "address": "Neue Straße 1, 40215 Düsseldorf"
}
```

---

## Resident Privacy

Resident names and mobility notes associated with a facility are:

- Stored as first names only
- Visible only to the matched pilot, the facility, and coordinators
- Never exposed on the public ride board
- Anonymized after 12 months in ride logs
