// lib/googleSheets.js
import { google } from 'googleapis';
import { createPrivateKey } from 'node:crypto';

const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function normalizePrivateKey(privateKey) {
  return privateKey?.replace(/\\r/g, '').replace(/\\n/g, '\n');
}

function getGoogleCredentials() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (!email || !privateKey) {
    throw new Error(
      'Google Sheets API credentials (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY) are missing in environment variables.'
    );
  }

  try {
    createPrivateKey({ key: privateKey, format: 'pem' });
  } catch {
    throw new Error(
      'GOOGLE_PRIVATE_KEY is invalid. Paste the exact unencrypted private_key value from the Google service account JSON into .env.local.'
    );
  }

  return { email, privateKey };
}

/**
 * Returns an authenticated Google Sheets client.
 * NOTE: Credentials are loaded from environment variables on the server-side.
 * This file is executed only on the server, ensuring service account details
 * are never exposed to the client-side browser.
 */
export function getSheetsClient() {
  const { email, privateKey } = getGoogleCredentials();

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SHEETS_SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Reads all rows from columns A:Z of the specified sheet.
 */
export async function getRows(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is missing in environment variables.');
  }

  const range = `${sheetName}!A:Z`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

/**
 * Converts a 2D array of spreadsheet rows into an array of objects.
 * Uses the first row as the header array.
 * Each object will contain a non-enumerable or simple `_rowNumber` field representing
 * its physical 1-based row index in the sheet.
 */
export function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const headers = rows[0];
  const objects = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index] : '';
    });
    // Add _rowNumber representing physical row in Google Sheets (1-indexed)
    // Row 0 is headers (row number 1), Row 1 is first data row (row number 2), etc.
    obj._rowNumber = i + 1;
    objects.push(obj);
  }

  return objects;
}

/**
 * Maps an object to a row array matching the ordered list of headers.
 */
export function objectToRow(object, headers) {
  return headers.map((header) => {
    const val = object[header];
    return val !== undefined && val !== null ? val : '';
  });
}

/**
 * Appends an object as a new row to the specified sheet.
 * Queries the headers first to align the object keys correctly.
 */
export async function appendRow(sheetName, object) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is missing in environment variables.');
  }

  // Get headers from first row
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });

  const headers = headerResponse.data.values?.[0];
  if (!headers || headers.length === 0) {
    throw new Error(`Sheet "${sheetName}" has no headers defined. Please create headers first.`);
  }

  const rowData = objectToRow(object, headers);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowData],
    },
  });
}

/**
 * Updates a specific row in the sheet with the provided object.
 * Queries headers to ensure fields are mapped to correct columns.
 */
export async function updateRow(sheetName, rowNumber, object) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is missing in environment variables.');
  }

  // Get headers from first row
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });

  const headers = headerResponse.data.values?.[0];
  if (!headers || headers.length === 0) {
    throw new Error(`Sheet "${sheetName}" has no headers defined. Cannot update.`);
  }

  const rowData = objectToRow(object, headers);
  const range = `${sheetName}!A${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowData],
    },
  });
}
