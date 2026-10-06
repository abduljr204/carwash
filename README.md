# Naqa Qurtuba browser demo

Open [index.html](index.html) directly in a browser, or run `npm start` for an optional static preview at http://localhost:3000.

Test logins:

- Admin: `admin` / `admin123` ? admin dashboard
- User: `user` / `user123` ? user dashboard

Login is handled entirely in JavaScript. Incorrect credentials display an alert. These public demo credentials are not production authentication.

Demo sessions and bookings use browser session storage. No backend, API, database, SMS, or payment service is used. The signup URL also opens the demo login. Previously stored database files are not used or modified.
