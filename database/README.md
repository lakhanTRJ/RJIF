# Database

SQL migrations are immutable and applied in filename order by `server/scripts/migrate.js`. Seed data is intentionally limited to content supported by indexed evidence. It is safe to rerun; existing route records are updated and their seeded sections are replaced.

Create a dedicated database/user in production:

```sql
CREATE DATABASE rjif CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rjif_app'@'127.0.0.1' IDENTIFIED BY 'use-a-secret-manager-generated-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON rjif.* TO 'rjif_app'@'127.0.0.1';
```

After deployment migrations, consider reducing the runtime user's DDL privileges and using a separate migration identity.

