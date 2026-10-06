# Run RJIF locally with XAMPP and VS Code

XAMPP commonly installs MariaDB rather than Oracle MySQL 8. It is suitable for this local preview and the current schema is compatible. AWS production should use MySQL 8 as planned.

## 1. Start the database

1. Open the XAMPP Control Panel.
2. Start **MySQL**. Apache is optional; React and Express provide the local web servers.
3. Open `http://localhost/phpmyadmin/` if Apache is running, or use the MySQL console.
4. In phpMyAdmin, open **SQL** and run:

```sql
CREATE DATABASE rjif_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rjif_local_app'@'127.0.0.1' IDENTIFIED BY 'choose-a-local-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
ON rjif_local.* TO 'rjif_local_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

If XAMPP uses a port other than 3306, use the port displayed in the XAMPP Control Panel.

## 2. Open the project in VS Code

Open this folder:

```text
C:\Users\USER\Documents\ChatGPT\India Forum
```

Open **Terminal → New Terminal** in VS Code.

## 3. Create the local environment file

Copy `server/.env.example` to `server/.env`, then use:

```env
NODE_ENV=development
PORT=3000
PUBLIC_ORIGIN=http://localhost:3000
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=replace-this-with-a-long-random-value
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=rjif_local
DB_USER=rjif_local_app
DB_PASSWORD=choose-a-local-password
TRUST_PROXY=0
STAGING_NOINDEX=true
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=8

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
FORM_NOTIFICATION_TO=info@theretailjeweller.com

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Generate a session secret in the VS Code terminal:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste that output as `SESSION_SECRET`. Do not commit `server/.env`.

## 4. Install and prepare the application

Run these commands from the project root:

```powershell
npm install
npm run migrate -w server
npm run seed -w server
npm run create-admin -w server -- --email info@theretailjeweller.com
```

The final command asks for a password. Use at least 12 characters.

## 5. Start the website

```powershell
npm run dev
```

Open:

- Public site: `http://localhost:5173/`
- Admin login: `http://localhost:5173/admin/login`
- South Forum: `http://localhost:5173/conference-south/`
- Partner page: `http://localhost:5173/partner/`
- Felicitation: `http://localhost:5173/felicitation/`

Stop the application with `Ctrl+C` in the terminal. XAMPP MySQL can then be stopped from the XAMPP Control Panel.

## Common local issues

- `ECONNREFUSED 127.0.0.1:3306`: start XAMPP MySQL and confirm its port.
- `Access denied`: check `DB_USER`, `DB_PASSWORD`, and the MySQL grant.
- Port 3000 or 5173 in use: close the earlier Node/Vite process before starting again.
- Blank dynamic/admin data: run both `migrate` and `seed`, then restart `npm run dev`.
- Public reference pages can render without MySQL, but admin, articles, dynamic pricing, submissions, and sessions require it.
