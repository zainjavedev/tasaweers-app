# Tasaweers

Tasaweers is a studio for turning thoughts into motion. Describe an idea in text, render it as bespoke imagery, bring that image to life as video, edit frames along the way, and extend the finished clip\u2014all powered by Google\u2019s latest Imagen, Gemini, and Veo model releases.

## What You Can Do

- **Text \u2192 Image** &mdash; Craft high-fidelity art direction with prompt optimization, reference image support, and aspect-ratio presets.
- **Image \u2192 Image** &mdash; Iteratively edit or remix existing frames using Gemini Image Flash, download results, or promote them into video generation.
- **Text \u2192 Video** &mdash; Storyboard motion directly with Veo-3.1, preview progress through dynamic status messaging, and export or extend the finished clip.
- **Image \u2192 Video** &mdash; Animate stills in a single click; Tasaweers automatically adapts prompts for cinematic motion.
- **Video \u2192 Video** &mdash; Chain generations together to continue a narrative, looping the latest output back in as the next source.

All generators share consistent controls, loading states, and download/extend affordances, making it easy to navigate from conception to longer-form stories.

## Tech Stack

- **React + TypeScript** \u2014 modern, modular front end.
- **Vite** \u2014 fast dev server and build tooling.
- **Tailwind (CDN)** \u2014 utility-first styling for the interface.
- **@google/genai** \u2014 direct access to Imagen 4, Gemini Image Flash, Gemini Flash 2.5, and Veo 3.1 APIs.

## Getting Started

### Prerequisites

- Node.js 18+
- A Google AI Studio project with billing enabled and access to Imagen 4, Gemini 2.5, and Veo 3.1 models.

### Installation

```bash
npm install
```

Create a `.env.local` (or `.env`) file at the project root and add your key:

```env
GEMINI_API_KEY=your_google_ai_key_here
```

Vite exposes this value to the client as `process.env.API_KEY`.

### Run Locally

```bash
npm run dev
```

Visit the printed URL (default `http://localhost:3000`) and start generating.

### Production Build

```bash
npm run build
```

The compiled assets are emitted to `dist/`.

## Usage Notes

- The app surfaces a banner if the API key is missing.
- Generation jobs can take several minutes; Tasaweers cycles through contextual loading copy so users know the process is still active.
- You can bounce between tabs without losing the latest intermediates; promoting an asset automatically activates the appropriate downstream workflow.

## Roadmap Ideas

- Queue management for simultaneous generations.
- User-defined presets for styles, aspect ratios, or camera moves.
- Session persistence so prior runs can be revisited after a refresh.

## License

This project is provided as-is for experimentation with Google\u2019s multimodal APIs. Review your Google AI Studio terms before deploying publicly. PRs are welcome.
