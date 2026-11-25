# Truth Lens

Truth Lens is an AI-assisted fact-checking and misinformation analysis app built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

It analyzes text, articles, images, and claims, then returns a structured credibility report with a score, verdict, red flags, supporting signals, and a shareable debunk script.

## Features

- **Text analysis** — evaluate a claim or paragraph for credibility, bias, and manipulation markers.
- **Article review** — assess an article URL and body for journalistic standards and source reliability.
- **Source comparison** — compare multiple reports about the same topic and surface agreements, conflicts, and bias differences.
- **Image inspection** — run a heuristic visual-authenticity check on an uploaded image.
- **Claim fact-check** — get a direct verdict with confidence, key facts, and expert consensus.
- **Conversational assistant** — a chat experience that remembers context and can write polite, shareable debunks.
- **Dashboard** — history, trending misinformation examples, and aggregate stats.
- **Graceful fallback** — when `GROQ_API_KEY` is missing or the Groq API is rate-limited, a built-in heuristic engine keeps the app usable.

## Tech stack

- [Next.js 16](https://nextjs.org) App Router with Turbopack
- React 19 + TypeScript
- Tailwind CSS 4
- shadcn-style UI primitives
- Framer Motion and GSAP for animation
- [Groq](https://groq.com) for LLM inference via `groq-sdk`

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the environment file:

   ```bash
   cp .env.local.example .env.local
   ```

3. Add your Groq API key to `.env.local`:

   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

   The key is optional. Without it, analyses use the heuristic fallback engine.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/analyze/text` | `POST` | Analyze a text claim |
| `/api/analyze/article` | `POST` | Analyze an article URL and content |
| `/api/analyze/compare` | `POST` | Compare two or more sources |
| `/api/analyze/image` | `POST` | Inspect an uploaded image |
| `/api/analyze/trending` | `GET` | Return trending misinformation examples |
| `/api/factcheck` | `POST` | Fact-check a single claim |
| `/api/chat` | `POST` | Conversational fact-checking with history |
| `/api/chat/conversations` | `GET`, `POST`, `DELETE` | List, create, or delete conversations |
| `/api/history` | `GET` | Return analysis history |
| `/api/stats` | `GET` | Return aggregate analysis stats |
| `/api/auth/login` | `POST` | Demo login |
| `/api/auth/register` | `POST` | Demo registration |

## Project structure

```text
src/
  app/
    api/                  Route handlers
    chat/                 Conversational assistant page
    dashboard/            Analysis dashboard
    layout.tsx            Root layout and metadata
    page.tsx              Cinematic landing page
  components/
    chat/                 Chat UI, formatted text, verdict report
    ui/                   Shared UI primitives and landing hero
  lib/
    groq.ts               Groq client, model fallback, JSON helpers
    storage.ts            In-memory history and conversation store
    utils.ts              Shared utilities
```

## Notes and limitations

- **Demo auth.** The login and registration routes return a local demo token and do not persist real accounts. Do not use them as production authentication.
- **In-memory storage.** History and conversations live in the server process. They reset on restart and are not shared across serverless instances. Connect a database before relying on persistence in production.
- **Heuristic fallback.** The image endpoint and the fallback analyzer produce deterministic/heuristic results, not a forensic guarantee. Treat every score as a starting point for human review.
- **Never commit `.env.local`.** It is already ignored by git.

## Deploying

The app deploys cleanly to Vercel. Add `GROQ_API_KEY` as an environment variable in the project settings before deploying.

## License

This project is provided for educational and demonstration purposes.
