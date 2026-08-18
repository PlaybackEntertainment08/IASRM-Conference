# Lead capture → Google Sheet

Both forms on the site (the hero form, the popup form, and the brochure
download form) POST every submission to a Google Apps Script web app, which
appends a row to a Google Sheet.

## The sheet

Create the leads spreadsheet in the **same Google account that runs the Apps
Script**, then paste its id into `SHEET_ID` in `Code.gs`. A sheet owned by a
different account cannot be opened by the script — that fails with a
permission error and nothing is recorded.

The id is the long string in the sheet's own URL, between `/d/` and `/edit`:

```
https://docs.google.com/spreadsheets/d/THIS_PART_HERE/edit
```

Columns: Timestamp · Name · WhatsApp · Email · City · I am a · Interested in ·
Consent · Source · Page

`Source` says which entry point the lead came from — `Hero form`,
`Popup form` or `Brochure download` — so you can see what is actually
converting.

## Turning it on

1. Paste your sheet id into `SHEET_ID` in `Code.gs`.
2. Run `setup` once from the editor and approve the authorisation prompt. It
   writes the header row plus one test row, which proves the script can reach
   the sheet.
3. Deploy `Code.gs` as a web app — **Execute as: Me**, **Who has access:
   Anyone**. Full steps are in the comment block at the top of the file.
4. Copy the deployment URL — it ends in `/exec`.
5. Paste it into `LEAD_ENDPOINT` in `index.html`:

   ```js
   var LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfy…/exec";
   ```

To check the endpoint is live, open the `/exec` URL in a browser. It should
return `{"ok":true,"status":"IASRM lead endpoint is live"}`.

## Until it is turned on

With `LEAD_ENDPOINT` empty the forms still validate, still hand over the
brochure and still reach the thank-you page — but nothing is recorded, and the
browser console logs a warning naming the lead that was dropped.

## Notes

- **"Who has access" must be `Anyone`.** With `Anyone with a Google account`
  the browser gets a login redirect and the row is never written.
- The page sends JSON as `text/plain` on purpose. That keeps it a *simple*
  CORS request, so the browser skips the preflight `OPTIONS` call that Apps
  Script cannot answer.
- The response is opaque (`mode: "no-cors"`), so the page cannot read whether
  the write succeeded. A failed or slow POST never blocks the visitor: the
  redirect goes ahead after at most 6 seconds and the error is logged to the
  console. Trust the sheet, not the page, for what was captured.
- Editing `Code.gs` does not change the live endpoint until you deploy a new
  version (Deploy → Manage deployments → edit → New version).
- Set `NOTIFY_EMAIL` in `Code.gs` to get an email per lead.
