# Naqa Qurtuba browser demo

Open [index.html](index.html) directly in a browser, or run `npm start` for an optional static preview at http://localhost:3000.

Test logins:

- Admin: `admin` / `admin123` ? admin dashboard
- User: `user` / `user123` ? user dashboard

Login is handled entirely in JavaScript. Incorrect credentials display an alert. These public demo credentials are not production authentication.

Demo logins use tab-local session storage. Bookings persist in local storage and sync automatically between tabs on the same browser and origin. Existing session bookings are migrated when their tab is opened. No cross-device sync, backend, API, database, SMS, or payment service is used. The signup URL also opens the demo login. Previously stored database files are not used or modified.

Users can edit upcoming appointment dates, times, vehicle details, wash services, and extras, or confirm a cancellation. Canceled appointments move to the user's History. Admins see a Canceled badge in the active queue and can dismiss the appointment to History without deleting the user's record. To try live sync, sign in as user in one tab and admin in another at http://localhost:3000.
