# Postman REST API Testing Reference - Coop Ledger

This reference documents the API endpoints for the Cooperative Loan Ledger MVP, providing complete JSON payloads and HTTP paths to copy directly into Postman.

## Global Configurations
- **Base URL:** `http://localhost:3000` (or whichever port Next.js is running on)
- **Headers:** `Content-Type: application/json` for all requests containing a body.
- **Authentication:** Admin and member routes now use signed HTTP-only session cookies. In Postman, log in first and keep the cookie jar enabled for subsequent requests.

---

## 1. Members Endpoints

These endpoints are **admin-only**.

### GET all members
- **Method:** `GET`
- **URL:** `{{base_url}}/api/members`
- **Description:** Returns all registered members in the system.

### GET single member
- **Method:** `GET`
- **URL:** `{{base_url}}/api/members/MBR-000001`
- **Description:** Returns a single member by their ID.

### CREATE a new member
- **Method:** `POST`
- **URL:** `{{base_url}}/api/members`
- **Request Body (JSON):**
```json
{
  "full_name": "Juan Dela Cruz",
  "email": "juan@example.com",
  "access_code": "123456"
}
```

### UPDATE member fields
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/members/MBR-000001`
- **Request Body (JSON):**
```json
{
  "full_name": "Juan Dela Cruz Jr."
}
```

### DEACTIVATE a member (Soft-Delete)
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/members/MBR-000001`
- **Description:** Sets member's status to `inactive` in the Google Sheet.

---

## 2. Authentication (Testing Only)

### POST admin login credentials
- **Method:** `POST`
- **URL:** `{{base_url}}/api/admin/login`
- **Description:** Creates an admin session cookie for the admin dashboard and admin-only API routes.
- **Request Body (JSON):**
```json
{
  "email": "admin@test.com",
  "password": "ChangeMe123!"
}
```

### POST login credentials
- **Method:** `POST`
- **URL:** `{{base_url}}/api/member/login`
- **Description:** Creates a member session cookie. Use that cookie when testing member-scoped endpoints like `GET /api/loans` and `GET /api/payments`.
- **Request Body (JSON):**
```json
{
  "email": "juan@example.com",
  "access_code": "123456"
}
```

### POST logout current session
- **Method:** `POST`
- **URL:** `{{base_url}}/api/session/logout`
- **Description:** Clears the current signed session cookie for either an admin or a member.

---

## 3. Loans Endpoints

- `GET /api/loans` requires a signed session cookie.
- With an admin session, it returns all loans or an optional filtered member view.
- With a member session, it returns only that member's own loans.

### GET all loans
- **Method:** `GET`
- **URL:** `{{base_url}}/api/loans`
- **Optional Query:** `{{base_url}}/api/loans?member_id=MBR-000001` (filter by borrower)

### GET single loan
- **Method:** `GET`
- **URL:** `{{base_url}}/api/loans/LOAN-000001`

### CREATE a new loan
- **Method:** `POST`
- **URL:** `{{base_url}}/api/loans`
- **Access:** Admin session required
- **Request Body (JSON):**
```json
{
  "member_id": "MBR-000001",
  "principal_amount": 10000,
  "interest_rate": 0.03,
  "term_months": 12,
  "release_date": "2026-05-27"
}
```

### UPDATE loan fields
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/loans/LOAN-000001`
- **Access:** Admin session required
- **Request Body (JSON):**
```json
{
  "release_date": "2026-06-01"
}
```
*Note: If you attempt to update `principal_amount`, `interest_rate`, or `term_months` after active payments have been registered, this request will return a 400 Bad Request.*

---

## 4. Payments Endpoints

- `GET /api/payments` requires a signed session cookie.
- With an admin session, it returns all payments or filtered results.
- With a member session, it returns only that member's own payments.

### GET all payments
- **Method:** `GET`
- **URL:** `{{base_url}}/api/payments`
- **Optional Queries:**
  - `{{base_url}}/api/payments?member_id=MBR-000001`
  - `{{base_url}}/api/payments?loan_id=LOAN-000001`

### RECORD a new payment
- **Method:** `POST`
- **URL:** `{{base_url}}/api/payments`
- **Access:** Admin session required
- **Request Body (JSON):**
```json
{
  "loan_id": "LOAN-000001",
  "member_id": "MBR-000001",
  "amount_received": 1000,
  "payment_date": "2026-05-27"
}
```

*Note:* `received_by` is now recorded from the authenticated admin session rather than trusted from the request body.

### VOID an active payment
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/payments/PAY-000001/void`
- **Access:** Admin session required
- **Request Body (JSON):**
```json
{
  "void_reason": "Double entry error"
}
```

## 5. Audit Endpoints

### GET audit log entries
- **Method:** `GET`
- **URL:** `{{base_url}}/api/audits`
- **Access:** Admin session required
- **Description:** Returns audit log entries sorted newest-first.
