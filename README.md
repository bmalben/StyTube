# StudyTube

StudyTube is an educational video app for students in classes 8 to 12. The app keeps the original frontend design while layering in curated, language-aware video discovery and a minimal backend.

## Quick start

1. Install dependencies in the root, client, and server folders.
2. Start the backend and frontend:
   - `npm run dev` in the repo root
3. Visit the app locally and use the Browse flow.

## MongoDB

The server uses MongoDB Atlas by default. Set the `MONGODB_URI` in `server/.env`.

## Profile photos

StudyTube supports a stored profile photo for each signed-in user. The image is kept in a separate `profilePhotos` collection rather than in the `users` collection so the user document stays lightweight and fast to query.

### Endpoints

- `PUT /api/user/photo` — authenticated upload, accepts a single image file in `multipart/form-data`.
- `DELETE /api/user/photo` — authenticated removal of the profile photo.
- `GET /api/photos/:photoId` — public image download for the avatar URL; the ID is random and unguessable enough to act like a public, one-time asset URL.
- `GET /api/auth/me` and login/register responses include `avatarUrl` for the current user.

### Limits and behavior

- Upload limit: 2 MB per file.
- Accepted formats: JPEG, PNG, and WebP only.
- Server-side processing: EXIF is corrected, metadata stripped, the image is center-cropped to a square, resized to 256x256, and converted to WebP with quality ~80.
- Stored photo metadata is kept separate from the user; `User.avatar` stores only `photoId` and `updatedAt`.
- Photos are stored in a dedicated collection, and the public photo route uses `Cache-Control: public, max-age=31536000, immutable`, `ETag`, `X-Content-Type-Options: nosniff`, and `Cross-Origin-Resource-Policy: cross-origin`.
- Privacy note: your photo is stored with your account and is only visible to you and admins inside the app. The public photo URL is not a user id or email and is intentionally not easy to guess.

### Photo URL construction

The avatar URL is built in one place on the server: `buildAvatarUrl()` in `server/src/utils/avatar.js`. It uses `PUBLIC_API_URL` when set, and otherwise falls back to the request host and protocol. It must always be an absolute URL like `https://api.example.com/api/photos/<photoId>`, never a relative path. On the client, `VITE_API_URL` should be set in `client/.env` or `client/.env.example` to the backend origin so the browser can reach the API correctly in local development.

### Required dependencies

```bash
cd server
npm install multer sharp file-type

cd ../client
npm install react-easy-crop
```

## Refresh curated videos

```bash
cd server
npm run refresh:videos
```

This job updates the curated library using the active channel catalog. It respects the `YOUTUBE_API_KEY` setup and falls back to a small mock set if the key is not configured.

## Coverage report

```bash
cd server
npm run coverage
```

This prints a table with each class x syllabus x subject x language count and highlights any combinations under five curated videos.

## Scoring and fallback ladder

- `computeQualityScore` rewards a healthy like ratio, channel trust, recency, and title quality.
- It explicitly avoids clickbait terms and prefers educational phrasing such as `NCERT`, `chapter`, and `full explanation`.
- The video API prioritizes exact matches first, then broader language matches, then other syllabus matches, and finally a YouTube search fallback.
- The response includes a `fallbackLevel` field and a `badge` label such as `verified-adlight`, `trusted`, or `general`.

## Seed channels

```bash
cd server
npm run seed:channels
```

This loads the starter channel catalog from `server/src/data/channels.seed.json`.

## Quota model

The ingestion process is designed to be cheap on API quota. The starter implementation keeps the refresh job conservative and logs its summary so it can be tuned before enabling a larger channel list. The daily budget is configurable in the refresh logic.

## Advertisements

We cannot control the ads served by YouTube. The app never claims a video is ad-free. The UI clearly states that ads remain controlled by YouTube and the creator.
