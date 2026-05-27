# Postman REST API Testing Reference - Coop Ledger

This reference documents the API endpoints for the Cooperative Loan Ledger MVP, providing complete JSON payloads and HTTP paths to copy directly into Postman.

## Global Configurations
- **Base URL:** `http://localhost:3050` (or whichever port Next.js is running on)
- **Headers:** `Content-Type: application/json` for all requests containing a body.

---

## 1. Members Endpoints

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

### POST login credentials
- **Method:** `POST`
- **URL:** `{{base_url}}/api/member/login`
- **Request Body (JSON):**
```json
{
  "email": "juan@example.com",
  "access_code": "123456"
}
```

---

## 3. Loans Endpoints

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
- **Request Body (JSON):**
```json
{
  "release_date": "2026-06-01"
}
```
*Note: If you attempt to update `principal_amount`, `interest_rate`, or `term_months` after active payments have been registered, this request will return a 400 Bad Request.*

---

## 4. Payments Endpoints

### GET all payments
- **Method:** `GET`
- **URL:** `{{base_url}}/api/payments`
- **Optional Queries:**
  - `{{base_url}}/api/payments?member_id=MBR-000001`
  - `{{base_url}}/api/payments?loan_id=LOAN-000001`

### RECORD a new payment
- **Method:** `POST`
- **URL:** `{{base_url}}/api/payments`
- **Request Body (JSON):**
```json
{
  "loan_id": "LOAN-000001",
  "member_id": "MBR-000001",
  "amount_received": 1000,
  "payment_date": "2026-05-27",
  "received_by": "admin@test.com"
}
```

### VOID an active payment
- **Method:** `PATCH`
- **URL:** `{{base_url}}/api/payments/PAY-000001/void`
- **Request Body (JSON):**
```json
{
  "void_reason": "Double entry error",
  "actor_email": "admin@test.com"
}
```
