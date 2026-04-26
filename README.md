# MasterPost AI

MasterPost AI is a production-ready full-stack Facebook Page post manager with a mobile-first blue robot UI. It supports admin authentication, Facebook page connection, video/photo publishing, post history, and app settings.

## Tech stack
- Node.js + Express
- SQLite (better-sqlite3)
- Vanilla HTML/CSS/JS frontend
- Multer for uploads
- Facebook Graph API via axios

## Quick start
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## Environment
Copy `.env.example` to `.env`:
```env
PORT=3000
SESSION_SECRET=change_me
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ENCRYPTION_KEY=32_character_key_here
```

## Login
- Default login from env:
  - Username: `admin`
  - Password: `admin123`
- Password is hashed with bcrypt and stored in `admins` table.

## Facebook token connection flow
1. Login as admin.
2. Open **Choose Pages** card.
3. Paste your Facebook User token (with required page scopes).
4. Click **Verify Token**.
5. Click **Fetch Pages** to import pages and save encrypted page access tokens.

## Required Facebook permissions
Depending on your use case and app review status, commonly required:
- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `pages_manage_metadata`
- `pages_read_user_content`
- `pages_manage_engagement`
- For video/photo publishing, ensure your app has the proper page publishing permissions approved by Meta.

## REST API endpoints
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `POST /api/facebook/verify-token`
- `POST /api/facebook/fetch-pages`
- `GET /api/pages`
- `DELETE /api/pages/:id`
- `POST /api/posts/video`
- `POST /api/posts/photos`
- `GET /api/history`
- `DELETE /api/history/:id`
- `POST /api/history/:id/retry`
- `GET /api/settings`
- `PUT /api/settings`

## Security features
- Session authentication with HTTP-only cookies
- Password hashing with bcrypt
- Page tokens encrypted at rest (AES-256-CBC)
- Helmet, CORS, and rate-limit enabled
- Upload type/size validation via settings
- Sensitive tokens are masked in frontend responses
- `.gitignore` excludes uploads, DB, and `.env`

## File uploads
- Upload directory: `/uploads`
- Max upload size and allowed MIME types configurable in Settings.

## Hosting (Anajak Cloud / Pterodactyl)
1. Create a Node.js app/server instance.
2. Upload project files.
3. Set startup command: `npm start`.
4. Set environment variables from `.env.example`.
5. Ensure persistent volume includes `/database` and `/uploads`.
6. Expose port from `PORT` env (default `3000`).

## Troubleshooting
- **Invalid token**: Ensure token is valid and has required Facebook scopes.
- **No pages fetched**: Confirm account is admin on pages and token has `pages_show_list`.
- **Upload failed**: Check `max_upload_size_mb` and `allowed_file_types` in Settings.
- **Facebook publish error**: Inspect error message in Post History; verify page permissions/app review status.
- **Session not persisted behind proxy**: set secure cookie/proxy settings for HTTPS deployment.

## Notes
This project only uses official Facebook Graph API methods and does not use scraping, login bypass, or illegal token methods.
