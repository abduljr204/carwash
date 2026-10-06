# Naqa Qurtuba

Requires Node.js 24 or newer.

```sh
npm install
npm start
```

Open http://localhost:3000. The login and sign-up pages use phone numbers and passwords, backed by SQLite and salted scrypt password hashes. Local Libyan mobile numbers (09xxxxxxxx) and international numbers are accepted; local numbers are normalized to +218. Numbers are identifiers and are not verified by SMS.

Accounts, appointments, receipts, and the reminder queue persist in `.data/accounts.sqlite`. Sessions last 24 hours and use HttpOnly, SameSite cookies. Log out invalidates the session on the server. Authentication and booking require the Node server; static-only hosting does not support these features.

## Appointment management

Create an account, choose the vehicle type in the booking wizard, and confirm a time. Unauthenticated customers return to their saved draft after logging in or signing up. The dashboard shows active bookings and a separate Past washes tab. Each check-in pass displays the date, Tripoli time, package, extras and vehicle type. Cancelling releases capacity; rescheduling rotates the QR token and replaces pending reminders. Changes are permitted only before the appointment and before check-in.

Prices, USD currency, opening times, the 30-day booking horizon, and capacity (three appointments per slot) are in [journey/config.js](journey/config.js). These are the existing example prices; set real business pricing and capacity before deployment. The server calculates and snapshots the price; clients cannot choose the amount. Completed and paid services have printable receipts (the browser can save them as PDF). Cancelled and missed visits have no paid receipt.

## Staff access

The home page footer links to staff login. First register a normal account with the staff member's phone number, then grant it staff access from the trusted server terminal:

```sh
npm run staff -- +218912345678
```

There are no default staff credentials, and public sign-up cannot grant staff access. Staff sign in with their own phone and password. The staff dashboard lists today's bookings, searches full normalized phone numbers, and supports camera scanning or selecting a QR image. Scanning a valid code checks in automatically; phone search provides a manual check-in button. Camera access requires HTTPS (or localhost) and browser permission. Closing the scanner stops the camera.

Check-in is allowed from one hour before until 30 minutes after the appointment. Late bookings show as missed. A worker completes a checked-in wash only after confirming payment was collected; this creates the customer's receipt. No online payment is taken.

## One-hour SMS reminders

Copy [.env.example](.env.example) to `.env` and set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. The start command loads this file. Restart after changing credentials. Configure a sender and destination permissions suitable for your business with Twilio. No credentials or real SMS delivery were used during development. The [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource) handles SMS submission.

Customers opt into SMS when booking (enabled by default). The server polls the durable queue every 30 seconds and submits the reminder approximately one hour before the appointment. Bookings made less than an hour ahead are queued immediately. Cancellation, rescheduling, check-in, and expiry invalidate unsent jobs. The server must remain running; after downtime, overdue jobs are processed only if the appointment is still in the future.

Without credentials, delivery is disabled and the dashboards say so. A provider-accepted message is recorded as `accepted`, not guaranteed delivered: check the provider's delivery logs for final status. Rate-limit responses retry up to three total attempts. Ambiguous network failures and interrupted sends are marked `unknown` rather than automatically risking duplicate SMS. The staff dashboard flags `unknown` and `failed` reminders; inspect the private database's `reminders` table and the Twilio logs to resolve these. Run a single application process per database for the reminder worker.

For deployment, use HTTPS and `NODE_ENV=production` for Secure cookies. Set `HOST`, `PORT`, and `DATA_DIR` as needed; keep the database on persistent private storage. The built-in IP rate limit is intended for a single process; configure proxy-aware limits at your reverse proxy when deploying behind one.

Run `npm test` for authentication, booking ownership and capacity, QR image decoding, staff check-in, receipts, and reminder-queue tests. Tests use temporary databases and a mock SMS sender, never real SMS.
