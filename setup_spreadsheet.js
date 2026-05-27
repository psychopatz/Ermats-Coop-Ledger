// setup_spreadsheet.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');

const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Parse .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found at: ' + envPath);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  });
  return env;
}

const SCHEMA = {
  Members: ['member_id', 'full_name', 'email', 'access_code', 'status', 'created_at', 'updated_at'],
  Loans: [
    'loan_id',
    'member_id',
    'principal_amount',
    'interest_rate',
    'term_months',
    'total_payable',
    'balance',
    'status',
    'release_date',
    'created_at',
    'updated_at',
  ],
  Payments: [
    'payment_id',
    'loan_id',
    'member_id',
    'payment_date',
    'amount_received',
    'received_by',
    'status',
    'created_at',
    'updated_at',
    'payment_method',
  ],
  Audit_Log: ['audit_id', 'timestamp', 'actor_email', 'action', 'entity_type', 'entity_id', 'details'],
};

function headersMatch(expectedHeaders, actualHeaders = []) {
  if (expectedHeaders.length !== actualHeaders.length) {
    return false;
  }

  return expectedHeaders.every((header, index) => header === actualHeaders[index]);
}

async function setup() {
  console.log('Reading config from .env.local...');
  const env = loadEnv();
  const email = env.GOOGLE_CLIENT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY?.replace(/\\r/g, '').replace(/\\n/g, '\n');
  const spreadsheetId = env.GOOGLE_SHEET_ID;

  if (!spreadsheetId || spreadsheetId.includes('your_google_spreadsheet_id_here')) {
    console.error('Error: GOOGLE_SHEET_ID is not configured in .env.local');
    console.error('Please create a Google Sheet, copy its ID, and add it to .env.local first.');
    process.exit(1);
  }

  if (!email || !privateKey) {
    console.error('Error: GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY must be configured in .env.local');
    process.exit(1);
  }

  try {
    crypto.createPrivateKey({ key: privateKey, format: 'pem' });
  } catch {
    console.error(
      'Error: GOOGLE_PRIVATE_KEY is invalid. Paste the exact unencrypted private_key value from the Google service account JSON into .env.local.'
    );
    process.exit(1);
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: SHEETS_SCOPES,
    });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Connecting to Google Sheets API...');
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = meta.data.sheets.map((s) => s.properties.title);

    console.log('Current tabs in spreadsheet:', existingSheets);

    // 1. Create missing tabs
    const requests = [];
    const tabsToCreate = Object.keys(SCHEMA).filter((title) => !existingSheets.includes(title));

    for (const title of tabsToCreate) {
      console.log(`Adding missing tab: "${title}"`);
      requests.push({
        addSheet: {
          properties: { title },
        },
      });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });
      console.log('New tabs created.');
    }

    // 2. Initialize or repair header rows so the API schema stays aligned.
    for (const [title, headers] of Object.entries(SCHEMA)) {
      console.log(`Verifying columns for: "${title}"...`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${title}!A1:Z1`,
      });

      const values = response.data.values;
      if (!values || values.length === 0) {
        console.log(`Initializing headers for "${title}":`, headers);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${title}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      } else if (!headersMatch(headers, values[0])) {
        console.log(`Repairing headers for "${title}". Current:`, values[0]);
        console.log(`Expected headers for "${title}":`, headers);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${title}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      } else {
        console.log(`Headers already exist for "${title}":`, values[0]);
      }
    }

    console.log('\nGoogle Sheet setup successful! Ready for CRUD testing.');
  } catch (error) {
    console.error('\nSpreadsheet setup failed:', error.message);
    if (error.message.includes('403') || error.message.includes('permission denied')) {
      console.error(
        `\nTroubleshooting TIP:\nMake sure you shared the Google Sheet with "${email}" as an EDITOR.`
      );
    }
  }
}

setup();
