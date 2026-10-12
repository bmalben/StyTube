# StudyTube

StudyTube is an educational video app for students in classes 8 to 12. The app keeps the original frontend design while layering in curated, language-aware video discovery and a minimal backend.

## Quick start

1. Install dependencies in the root, client, and server folders.
2. Start the backend and frontend:
   - `npm run dev` in the repo root
3. Visit the app locally and use the Browse flow.

## MongoDB

The server uses MongoDB Atlas by default. Set the `MONGODB_URI` in `server/.env`.

## Seed channels

```bash
cd server
npm run seed:channels
```

This loads the starter channel catalog from `server/src/data/channels.seed.json`.

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

## Quota model

The ingestion process is designed to be cheap on API quota. The starter implementation keeps the refresh job conservative and logs its summary so it can be tuned before enabling a larger channel list. The daily budget is configurable in the refresh logic.

## Advertisements

We cannot control the ads served by YouTube. The app never claims a video is ad-free. The UI clearly states that ads remain controlled by YouTube and the creator.
