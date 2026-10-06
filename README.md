# Naqa Qurtuba

Requires Node.js 24 or newer. No dependency installation is needed.

```sh
npm start
```

Open http://localhost:3000. The login and sign-up pages use phone numbers and passwords, backed by SQLite and salted scrypt password hashes. Local Libyan mobile numbers (09xxxxxxxx) and international numbers are accepted; local numbers are normalized to +218. Numbers are identifiers and are not verified by SMS.

Accounts persist in `.data/accounts.sqlite`. Sessions last 24 hours and use HttpOnly, SameSite cookies. Log out invalidates the session on the server. Authentication requires the Node server; opening the HTML directly or publishing it on static-only hosting does not provide authentication. Booking remains a preview and does not reserve appointments.

For deployment, use HTTPS and `NODE_ENV=production` for Secure cookies. Set `HOST`, `PORT`, and `DATA_DIR` as needed; keep the database on persistent private storage. The built-in IP rate limit is intended for a single process; configure proxy-aware limits at your reverse proxy when deploying behind one.

Run `npm test` for authentication integration tests using a temporary database.
