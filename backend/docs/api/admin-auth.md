# Admin Authentication API

Admin authentication endpoints for JWT-based access control.

**Authentication Method:** JWT token via `admin_token` httpOnly cookie

**Token Expiry:** 24 hours (configurable via `ADMIN_JWT_EXPIRY` env var)

---

## POST /admin/auth/login

Admin login with JWT token returned as httpOnly cookie.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Admin username |
| `password` | string | Yes | Admin password |

### Request Example (cURL)

```bash
curl -X POST "http://localhost:3100/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'password'
  }),
  credentials: 'include'
});
const data = await response.json();
console.log(data);
```

### Response (200 OK)

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "created_at": "2026-02-27T10:00:00.000Z",
    "last_login": "2026-02-27T10:00:00.000Z"
  }
}
```

### Cookies

Sets `admin_token` httpOnly cookie (24 hour expiry)

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Missing username or password |
| 401 | Invalid credentials |

---

## POST /admin/auth/logout

Admin logout (clears cookie).

**Authentication:** No authentication required

### Request Example (cURL)

```bash
curl -X POST "http://localhost:3100/admin/auth/logout" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "message": "Logged out successfully"
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | No valid session to logout |

---

## GET /admin/auth/me

Get current authenticated admin user.

**Authentication:** Required (valid JWT cookie)

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/auth/me" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/auth/me', {
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "created_at": "2026-02-27T10:00:00.000Z",
    "last_login": "2026-02-27T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | No token, invalid token, or expired token |

### Error Response (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```
