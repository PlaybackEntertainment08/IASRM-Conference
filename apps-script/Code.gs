/**
 * IASRM — Longevity Revolution 2026
 * Lead collector for the congress landing page.
 *
 * Every submission from index.html (the hero form, the popup form and the
 * brochure form) is POSTed here and appended as a row to the leads sheet.
 *
 * ---------------------------------------------------------------------------
 * SETUP — about two minutes, once
 * ---------------------------------------------------------------------------
 * 1. Go to https://script.google.com and click "New project".
 * 2. Delete whatever is in the editor and paste this whole file in.
 * 3. Rename the project (top left) to "IASRM Leads" so you can find it later.
 * 4. Save (Ctrl+S).
 * 5. Run the `setup` function once from the toolbar dropdown. Google will ask
 *    for authorisation — approve it. On the "Google hasn't verified this app"
 *    screen choose Advanced > Go to IASRM Leads (unsafe). It is your own
 *    script; that warning is shown for every unpublished personal script.
 *    This writes the header row into the sheet and proves the connection.
 * 6. Click Deploy > New deployment.
 *      Type ...................... Web app
 *      Description ............... anything, e.g. "v1"
 *      Execute as ................ Me
 *      Who has access ............ Anyone            <-- must be "Anyone"
 *    Click Deploy and copy the "Web app" URL. It ends in /exec.
 * 7. Paste that URL into LEAD_ENDPOINT near the bottom of index.html.
 *
 * If you later edit this script, you must Deploy > New deployment again (or
 * Manage deployments > edit > New version) for the change to go live.
 * ---------------------------------------------------------------------------
 */

/** The leads spreadsheet. Already pointed at your sheet. */
var SHEET_ID = '1RAfJiZnqHJQbuUkvrQRriJ16q2K0QPbIu2NFgwbxmi0';

/** Tab inside that spreadsheet. Created automatically if missing. */
var SHEET_NAME = 'Leads';

/**
 * Optional. Put an address here to get an email on every new lead, e.g.
 * 'info@iasrmglobal.org'. Leave as '' for no email.
 * Note: Gmail caps Apps Script at roughly 100 emails a day on a free account.
 */
var NOTIFY_EMAIL = '';

var HEADERS = [
  'Timestamp',
  'Name',
  'WhatsApp',
  'Email',
  'City',
  'I am a',
  'Interested in',
  'Consent',
  'Source',
  'Page'
];

/**
 * Receives a lead from the website.
 * The page sends JSON as text/plain, which keeps it a "simple" CORS request
 * so the browser does not fire a preflight that Apps Script cannot answer.
 */
function doPost(e) {
  try {
    var data = parsePayload_(e);

    // A name and some way to reach them is the minimum worth recording.
    if (!data.name && !data.phone && !data.email) {
      return json_({ ok: false, error: 'Empty submission ignored' });
    }

    getSheet_().appendRow([
      new Date(),
      data.name || '',
      data.phone || '',
      data.email || '',
      data.city || '',
      data.role || '',
      data.interest || '',
      data.consent || '',
      data.source || '',
      data.page || ''
    ]);

    notify_(data);
    return json_({ ok: true });
  } catch (err) {
    // Logged to Executions in the Apps Script console so a failure is findable.
    console.error('Lead capture failed: ' + err);
    return json_({ ok: false, error: String(err) });
  }
}

/** Visiting the /exec URL in a browser hits this — handy for checking it is live. */
function doGet() {
  return json_({ ok: true, status: 'IASRM lead endpoint is live' });
}

/**
 * Run this once from the editor after pasting the script.
 * Creates the tab, writes the header row, and appends a test lead so you can
 * see the whole path working. Delete the test row afterwards.
 */
function setup() {
  var sheet = getSheet_();
  sheet.appendRow([
    new Date(),
    'Test Lead — delete me',
    '+91 90000 00000',
    'test@example.com',
    'New Delhi',
    'Doctor / Physician',
    'Both',
    'Yes',
    'setup() test',
    'apps-script'
  ]);
  Logger.log('Wrote header + test row to: ' + sheet.getParent().getUrl());
}

/** Returns the leads tab, creating and formatting it on first use. */
function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#3f021f')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160); // Timestamp
    sheet.setColumnWidth(2, 200); // Name
    sheet.setColumnWidth(4, 220); // Email
  }
  return sheet;
}

/** Accepts JSON body, form-encoded body, or query parameters. */
function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (ignored) {
      // Not JSON — fall through to the parameter form below.
    }
  }
  return (e && e.parameter) ? e.parameter : {};
}

/** Sends the optional new-lead email. Never blocks the sheet write. */
function notify_(data) {
  if (!NOTIFY_EMAIL) return;
  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New congress lead: ' + (data.name || 'unnamed'),
      body: [
        'Name:          ' + (data.name || '-'),
        'WhatsApp:      ' + (data.phone || '-'),
        'Email:         ' + (data.email || '-'),
        'City:          ' + (data.city || '-'),
        'I am a:        ' + (data.role || '-'),
        'Interested in: ' + (data.interest || '-'),
        'Source:        ' + (data.source || '-'),
        '',
        'Sheet: https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit'
      ].join('\n')
    });
  } catch (err) {
    console.error('Notification email failed (the lead was still saved): ' + err);
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
