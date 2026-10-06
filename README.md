# Retail Jeweller India Forum rebuild

React/Vite public and admin client, Express API/SEO delivery layer, and MySQL content store.

The owner-supplied WordPress WXR, Elementor kit, uploads archive, and desktop/mobile screenshots are the reference source. The public India and South forum page families use the approved local assets; the source backup package remains Git-ignored. Read [the reference audit](docs/reference-audit.md) and [remaining gaps](docs/unresolved-gaps.md) before approving staging.

## Quick start

1. Copy `server/.env.example` to `server/.env` and fill local values.
2. Create a MySQL database, then run `npm install`.
3. Run `npm run migrate -w server` and `npm run seed -w server`.
4. Run `npm run dev`.

Public app: `http://localhost:5173`  
API: `http://localhost:3000`  
Admin: `http://localhost:5173/admin`

No administrator is created automatically. Create the first user with:

```powershell
npm run create-admin -w server -- --email you@example.com
```

See [local setup](docs/setup.md), [deployment](docs/deployment.md), and [unresolved gaps](docs/unresolved-gaps.md).
