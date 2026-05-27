# Coop Ledger - Cooperative Loan Ledger

A testing web application for a cooperative loan ledger system. This application uses Google Sheets as its server-side database through server-side Next.js API routes. 

## Features
- **Zero-DB Hosting:** No Supabase, Firebase, or SQL database required—runs entirely on Google Sheets.
- **RESTful API Routes:** Standard Postman-friendly CRUD endpoints for members, loans, payments, and auditing.
- **Unified Front-End:** Visual dashboard panels for members to check balances and admins to manage ledger sheets.
- **Activity Audits:** Every creation, modification, soft-delete, payment, and void transaction generates logs.

---

## Technical Stack
- **Framework:** Next.js (App Router)
- **Language:** JavaScript
- **Styling:** Tailwind CSS (v4)
- **Integrations:** `googleapis` npm package

---

## 1. Setup Google Sheets & API Credentials

To use Google Sheets as the storage layer, you need a Google Service Account to read and write rows.

### Step 1: Create a Google Cloud Project & Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `Coop-Ledger`).
3. Search for the **Google Sheets API** in the API Library and click **Enable**.
4. Navigate to **IAM & Admin > Service Accounts**.
5. Click **Create Service Account**. Fill in details and click **Create and Continue**.
6. Select the service account you created, go to the **Keys** tab, and click **Add Key > Create New Key**.
7. Select **JSON** as the key type and click **Create**. This downloads a credentials JSON file. Keep it safe.
8. Copy the `client_email` value from the downloaded JSON file (e.g., `coop-ledger-service@project-id.iam.gserviceaccount.com`).

### Step 2: Prepare the Google Sheet
1. Create a new, blank Google Sheet.
2. In the browser, look at the URL and copy the **Spreadsheet ID** (the long string between `/d/` and `/edit` in the URL).
3. **Crucial:** Share your Google Sheet with the Service Account email address `obong-coop-sheets-api@obong-coop-leger.iam.gserviceaccount.com` with **Editor** permissions.
4. Set up the environment variables (see Section 2).
5. Open your terminal in the project directory and run the initialization script to automatically create all sheets (tabs) and populate row headers:
   ```bash
   node setup_spreadsheet.js
   ```

*Alternative (Manual Setup):* If you prefer to set up tabs and headers manually, rename your sheets and set up the column headers in **Row 1** of each tab exactly as shown below:

#### Tab: `Members`
`member_id | full_name | email | access_code | status | created_at | updated_at`

#### Tab: `Loans`
`loan_id | member_id | principal_amount | interest_rate | term_months | total_payable | balance | status | release_date | created_at | updated_at`

#### Tab: `Payments`
`payment_id | loan_id | member_id | payment_date | amount_received | received_by | status | created_at | updated_at`

#### Tab: `Audit_Log`
`audit_id | timestamp | actor_email | action | entity_type | entity_id | details`

---

## 2. Local Installation & Configuration

### Step 1: Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a file named `.env.local` in the project root directory and define the following variables:

```env
GOOGLE_SHEET_ID=your_google_spreadsheet_id_here
GOOGLE_CLIENT_EMAIL=your_service_account_client_email_here
# Note: Copy-paste the entire private key including "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."
APP_SESSION_SECRET=replace_with_a_long_random_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_admin_password
```

> [!CAUTION]
> Do NOT prefix these environment variables with `NEXT_PUBLIC_`. Doing so exposes these credentials to the client browser, compromising your service account.

> [!IMPORTANT]
> `APP_SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are required for the secured admin and member session flows. The app now uses signed HTTP-only cookies instead of trusting `localStorage` for authenticated access.

---

## 3. Run and Test the Application

### Start Development Server
```bash
npm run dev
```
The server will start (usually on [http://localhost:3000](http://localhost:3000)).

### Access UI Routes in the Browser
- **Landing page:** [http://localhost:3000/](http://localhost:3000/)
- **Member portal sign-in:** [http://localhost:3000/member-login](http://localhost:3000/member-login)
- **Admin sign-in:** [http://localhost:3000/admin-login](http://localhost:3000/admin-login)
- **Admin control panel:** [http://localhost:3000/admin](http://localhost:3000/admin) (requires admin login first)

### API & Postman Testing
Refer to [POSTMAN_TESTS.md](file:///home/psychopatz/Desktop/Projects/Coop%20Ledger/POSTMAN_TESTS.md) for full instructions, headers, request body JSON payloads, and the required login steps for admin/member session cookies.

---

## 4. Safety & Security Disclaimers

This is an MVP/testing environment and must be updated before production:
1. **Access Codes:** Currently stored in plain text. Production must implement password hashing (e.g. bcrypt or argon2) and use secure HTTP-only cookies (e.g. iron-session or NextAuth.js).
2. **Admin Access:** This version adds env-configured admin login and signed HTTP-only cookies, but it is still an MVP. Replace the static env password approach with a real identity system before hosting.
3. **Data Security:** Do not store highly sensitive personal records, passwords, bank cards, or bank credentials in Google Sheets. Google Sheets is not a compliant storage layer for highly confidential transaction data.
4. **Credential Hygiene:** Rotate any Google service account key immediately if it has ever been shared in chat, screenshots, or commit history.
