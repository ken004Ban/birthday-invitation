/* ============================================================
   Google Apps Script – Patrick Bobo's 50th Birthday RSVP
   ============================================================
   
   SETUP INSTRUCTIONS:
   1. Create a new Google Sheet
   2. Go to Extensions → Apps Script
   3. Delete any code in Code.gs and paste this entire file
   4. Create a new Sheet tab named "RSVPs" (or the script will
      create it automatically on first submission)
   5. Add the following column headers in Row 1:
      Timestamp | Full Name | Phone | Email | Family Group |
      Attendance | Guests | Dietary Requirements | Message |
      IP Address | Browser | Device
   6. Deploy → New Deployment → Web App
      - Execute as: Me
      - Who has access: Anyone
   7. Copy the Web App URL and paste it in config.js or Admin panel
   
   ============================================================ */

// ── Sheet name where RSVPs are stored ─────────────────────
const SHEET_NAME = "RSVPs";

// ── CORS headers ──────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

/* ── Handle GET requests (fetch data) ──────────────────── */
function doGet(e) {
  const action = e.parameter.action;

  if (action === "getRSVPs") {
    return getRSVPs();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "API is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Handle POST requests (save RSVP) ──────────────────── */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return saveRSVP(data);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ── Handle OPTIONS (preflight CORS) ───────────────────── */
function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Save a single RSVP ────────────────────────────────── */
function saveRSVP(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "Timestamp", "Full Name", "Phone", "Email",
      "Family Group", "Attendance", "Guests",
      "Dietary Requirements", "Message",
      "IP Address", "Browser", "Device"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#d4a94e")
      .setFontColor("#000000");
    sheet.setFrozenRows(1);
  }

  const row = [
    data.timestamp || new Date().toISOString(),
    data.fullName || "",
    data.phone || "",
    data.email || "",
    data.familyGroup || "",
    data.attendance || "",
    data.guests || "0",
    data.dietaryRequirements || "",
    data.message || "",
    data.ip || "",
    data.browser || "",
    data.device || "",
  ];

  sheet.appendRow(row);

  // Auto-resize columns (best effort)
  for (let i = 1; i <= row.length; i++) {
    sheet.autoResizeColumn(i);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "RSVP saved successfully" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Get all RSVPs ─────────────────────────────────────── */
function getRSVPs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, rsvps: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, rsvps: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0];
  const rsvps = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rsvp = {};
    headers.forEach((header, j) => {
      const key = headerToKey(header);
      rsvp[key] = row[j];
    });
    rsvps.push(rsvp);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, rsvps: rsvps }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Map header names to camelCase keys ────────────────── */
function headerToKey(header) {
  const map = {
    "Timestamp": "timestamp",
    "Full Name": "fullName",
    "Phone": "phone",
    "Email": "email",
    "Family Group": "familyGroup",
    "Attendance": "attendance",
    "Guests": "guests",
    "Dietary Requirements": "dietaryRequirements",
    "Message": "message",
    "IP Address": "ip",
    "Browser": "browser",
    "Device": "device",
  };
  return map[header] || header.toLowerCase().replace(/\s+/g, "_");
}

/* ── Test function (run from editor) ───────────────────── */
function testDoPost() {
  const testData = {
    timestamp: new Date().toISOString(),
    fullName: "Test Guest",
    phone: "+260 971 234 567",
    email: "test@example.com",
    familyGroup: "Friends",
    attendance: "Yes",
    guests: "2",
    dietaryRequirements: "None",
    message: "Happy Birthday!",
    ip: "127.0.0.1",
    browser: "Test Browser",
    device: "Desktop",
  };

  const result = saveRSVP(testData);
  Logger.log(result.getContent());
}
