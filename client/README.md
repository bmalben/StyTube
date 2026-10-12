# StudyTube Frontend

StudyTube is a responsive school-learning app for students in Classes 8 to 12 in India. It helps students pick their class, board, and subject, then browse curated YouTube lessons inside a distraction-free study space.

## Getting started

1. Open a terminal in the `frontend` folder.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Adding a YouTube Data API key

This app is ready for a real backend/API integration. The placeholder in `src/services/youtubeService.js` reads the environment variable `VITE_YOUTUBE_API_KEY`.

Create a `.env` file in the `frontend` folder:

```env
VITE_YOUTUBE_API_KEY=your_youtube_data_api_key_here
```

Then restart the app if it is already running.

The service is structured so that you can later swap the mock data flow for the YouTube Data API v3 search endpoint without changing the page components.

## Features included

- Home page with learning journey and subject discovery
- Class, syllabus, and subject selection flow
- Video listing with search, chapter filter, sort, load-more, loading skeletons, empty states, and retry states
- Embedded YouTube player using `youtube-nocookie.com`
- Responsive design for desktop and mobile
- Light and dark mode
- Accessibility-friendly controls, keyboard focus, and strong contrast

## Notes

- The app uses mock video data for now.
- Videos are hosted by YouTube and all content belongs to the original creators.
- No ads are blocked or bypassed.
