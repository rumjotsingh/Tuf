# Interactive Wall Calendar (Frontend Engineering Challenge)

A polished, responsive React/Next.js wall-calendar component inspired by a physical hanging calendar.

## What This Includes

- Wall-calendar aesthetic with a prominent hero artwork panel.
- Day range selection with distinct visual states:
	- start date
	- end date
	- in-between highlighted dates
- Integrated notes system:
	- monthly notes
	- per-day notes
	- range notes linked to selected dates
- Visual indicators on day cells when notes are present.
- Local persistence via `localStorage` (no backend required).
- Mobile-first responsive behavior with desktop and touch-friendly layouts.

## Tech Choices

- Next.js App Router + TypeScript
- Client-side React state management
- CSS Modules for custom visual design and animation

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Check

```bash
npm run build
npm start
```

## Submission Links

- Source Code Repo: `ADD_YOUR_GITHUB_OR_GITLAB_LINK`
- Video Demo (Required): `ADD_LOOM_OR_YOUTUBE_LINK`
- Live Demo (Optional): `ADD_VERCEL_OR_NETLIFY_LINK`

## UX Notes

- Click a date once to start range selection.
- Click a later date to close the range.
- Use the range notes box to attach meaning to the selected dates.
- Tap any date and use Day Note to add date-specific detail.
- Dots inside cells show if that date contains note data.
