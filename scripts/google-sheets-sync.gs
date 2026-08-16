// Google Apps Script backend for CAP Tracker's "Google Sheets Sync" setting.
//
// Setup:
//   1. Create a Google Sheet (any name). Note its name doesn't matter — this
//      script reads/writes the sheet/tab named below.
//   2. In the Sheet: Extensions > Apps Script.
//   3. Delete the default code and paste this whole file in.
//   4. Run the `setup` function once (Run menu > select "setup" > Run). It
//      will ask for permissions the first time — approve them. This
//      generates a random API token and stores it in Script Properties.
//   5. View > Logs (or the execution log after running setup) to see the
//      generated token. Copy it.
//   6. Deploy > New deployment > type "Web app".
//        - Execute as: Me
//        - Who has access: Anyone
//      Deploy, then copy the Web App URL.
//   7. In CAP Tracker: Settings > Google Sheets Sync > paste the Web App URL
//      into "Apps Script Web App URL" and the token into "API Token". Tap
//      "Test Connection".
//
// Data model: one row per cadet, one column per field, header row holds
// field names. Columns are created/reordered automatically from whatever
// fields the app sends, so you never need to touch the sheet by hand.

const SHEET_NAME = 'Cadets';
const TOKEN_PROPERTY = 'CAP_TRACKER_TOKEN';

function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(TOKEN_PROPERTY)) {
    const token = Utilities.getUuid();
    props.setProperty(TOKEN_PROPERTY, token);
  }
  Logger.log('API token: ' + props.getProperty(TOKEN_PROPERTY));
  getSheet(); // creates the sheet/tab if it doesn't exist yet
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function checkToken(token) {
  const expected = PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
  return expected && token === expected;
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const token = e.parameter.token || '';
  if (!checkToken(token)) return jsonOutput({ error: 'Invalid token' });

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return jsonOutput([]);

  const headers = values[0];
  const rows = values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((key, i) => {
      if (key) obj[key] = row[i];
    });
    return obj;
  });
  return jsonOutput(rows);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOutput({ error: 'Invalid JSON body' });
  }

  if (!checkToken(body.token || '')) return jsonOutput({ error: 'Invalid token' });

  const records = Array.isArray(body.data) ? body.data : [];

  // Union of keys across all records, preserving first-seen order.
  const headers = [];
  const seen = new Set();
  records.forEach((record) => {
    Object.keys(record).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    });
  });

  const sheet = getSheet();
  sheet.clearContents();

  if (headers.length === 0) return jsonOutput({ ok: true, rows: 0 });

  const rows = records.map((record) => headers.map((key) => (record[key] !== undefined ? record[key] : '')));
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  return jsonOutput({ ok: true, rows: rows.length });
}
