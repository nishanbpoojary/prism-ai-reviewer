# PRism AI - Codex Instructions

## Project Goal
Build PRism AI, an AI-powered Pull Request Review Assistant for developers.

The app should help users paste a GitHub pull request URL and receive:
- PR summary
- Risk score
- Code quality findings
- Suggested test cases
- Suggested PR description
- Reviewer-friendly comments

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI API later
- GitHub REST API later

## Important Next.js Note
This project uses a newer Next.js version. Before making framework-specific changes, check the installed docs in:

node_modules/next/dist/docs/

Do not assume older Next.js behavior if the local docs say otherwise.

## Working Rules
- Always analyze before editing.
- Keep changes small and focused.
- Do not modify unrelated files.
- Do not add unnecessary dependencies.
- Avoid using `any`.
- Use TypeScript-safe code.
- Keep UI responsive for desktop and mobile.
- Keep API keys server-side only.
- Do not expose secrets in client components.
- Do not commit `.env.local`.

## Coding Rules
- Keep `src/app/page.tsx` simple.
- Put feature-specific UI inside `src/features/pull-request-review/components`.
- Put feature-specific helpers inside `src/features/pull-request-review/lib`.
- Put mock data inside `src/features/pull-request-review/data`.
- Put shared types in clear `types.ts` files.
- Use `"use client"` only when interactivity is required.
- Keep API route logic inside `src/app/api`.

## Verification Commands
Use these commands after changes:

```bash
npm run lint
npm run build