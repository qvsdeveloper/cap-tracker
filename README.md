# cap-tracker

## Google Sheets Sync

The app can read/write cadet records from a Google Sheet instead of (well, in
addition to — it always falls back to local storage) on-device storage only.
This requires deploying a small Google Apps Script as a Web App to act as the
backend; the script is at [scripts/google-sheets-sync.gs](scripts/google-sheets-sync.gs).

1. Create a Google Sheet (any name — a "Cadets" tab is created automatically).
2. In the Sheet, go to **Extensions → Apps Script**.
3. Delete the placeholder code and paste in the contents of
   [scripts/google-sheets-sync.gs](scripts/google-sheets-sync.gs).
4. Select the `setup` function from the dropdown and click **Run**. Approve
   the permissions prompt on first run.
5. Check **View → Logs** for a line like `API token: xxxxxxxx-...` and copy it.
6. **Deploy → New deployment**, type **Web app**, with:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Deploy, then copy the Web app URL.
7. In the app: **Settings → ☁️ Google Sheets Sync**, paste in the Web app URL
   and the token, then tap **🔌 Test Connection**.

The same steps are available in-app under Settings → Google Sheets Sync →
"How do I set this up?", including a button to copy the script straight to
your clipboard so you don't need to leave the app to grab it.

The URL and token are generated per-deployment and are never stored in this
repo — each person who follows these steps gets their own private pair.
