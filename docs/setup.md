# Local setup

Requirements: Node.js 22+, npm 10+, MySQL 8+.

1. `npm install`
2. Copy `server/.env.example` to `server/.env` and set a strong session secret and MySQL values.
3. Create the database named in `DB_NAME`.
4. `npm run migrate -w server`
5. `npm run seed -w server`
6. `npm run create-admin -w server -- --email administrator@example.com`
7. `npm run dev`

The public reference pages load approved assets from `client/public/reference`. The generated asset/content inventory can be rebuilt from the ignored authorized package with the scripts in `database/scripts`; do not commit the source backup package. Missing portraits use neutral initial placeholders, never stock images.

Uploaded files are stored under `server/uploads` locally and are ignored by Git. Production should use a dedicated durable media directory or S3 with private administrative credentials.
