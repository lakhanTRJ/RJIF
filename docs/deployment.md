# AWS staging and production deployment

No production change has been made. Inspect the current instance first with read-only commands: OS/version, CPU/RAM/disk, running services, Nginx virtual hosts, ports, Node/PHP versions, process manager, MySQL size/connections, certificate renewal, backup jobs, and load. Because two unrelated sites already share the instance, prefer a separate instance if memory headroom is below 2 GB, disk headroom below 25%, MySQL is already constrained, or deploy/rollback ownership is unclear.

## Isolation

- Dedicated Linux user and directory, e.g. `/srv/rjif/app`.
- Dedicated MySQL database and restricted user with privileges only on that database.
- Dedicated service bound to `127.0.0.1:3100`; never expose Node directly.
- Dedicated media directory and backup policy.
- Separate staging hostname and environment; staging sends `X-Robots-Tag: noindex, nofollow`.

## Build and service

Run `npm ci`, `npm run build`, migrations, then start `server/src/index.js`. A systemd service is preferred:

```ini
[Unit]
Description=RJIF web application
After=network.target mysql.service

[Service]
Type=simple
User=rjif
WorkingDirectory=/srv/rjif/app
EnvironmentFile=/etc/rjif/rjif.env
ExecStart=/usr/bin/node server/src/index.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

## Nginx server block (staging example)

```nginx
server {
    listen 80;
    server_name staging.example.com;
    client_max_body_size 8m;

    location /assets/ {
        alias /srv/rjif/app/client/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /reference/ {
        alias /srv/rjif/app/client/dist/reference/;
        expires 30d;
    }

    location /media/ {
        alias /srv/rjif/media/;
        expires 7d;
    }

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
    }

    add_header X-Robots-Tag "noindex, nofollow" always;
}
```

Use Certbot or the instance's existing certificate workflow only after the vhost is validated. Do not alter the existing Laravel/React vhosts.

## Backups and rollback

- Nightly encrypted MySQL dump and media snapshot; retain daily/weekly/monthly copies and test restores.
- Keep versioned releases (`releases/<timestamp>`) with an atomic `current` symlink.
- Before migration, dump the application database and record the current release.
- Rollback: point `current` to the previous release, restart the service, and restore the database only if the migration is not backward-compatible.
- Health check: `GET /api/health`; monitor status, latency, disk, memory, Node restarts, Nginx 5xx, and database errors.

Production DNS, WordPress removal, payment activation, and database cutover require explicit authorization after staging sign-off.
