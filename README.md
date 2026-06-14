# PRism AI

PRism AI is an AI-powered pull request review assistant for developers. The app accepts a GitHub pull request URL, fetches real pull request metadata from GitHub, and displays a reviewer-friendly analysis preview. The AI review content is currently mocked while the project is prepared for a future OpenAI integration.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- GitHub REST API
- OpenAI API planned for future review generation

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Add any local secrets to `.env.local`.

4. Start the development server:

```bash
npm run dev
```

5. Open the app:

```txt
http://localhost:3000
```

## Environment Variables

```bash
OPENAI_API_KEY=
GITHUB_TOKEN=
```

`OPENAI_API_KEY` is reserved for future AI review generation. The app does not call OpenAI yet.

`GITHUB_TOKEN` is optional. Public pull requests can work without it, but adding a token helps avoid GitHub API rate limits and will be useful for repositories that require authentication.

Do not commit `.env.local`. It is for local secrets only.

## Current Behavior

- Parses GitHub pull request URLs.
- Fetches real GitHub PR metadata and changed files.
- Shows PR title, author, branches, changed files, additions, and deletions.
- Displays mocked review summary, risk score, and findings.
- Does not call OpenAI yet.

## Verification

Run the standard checks before sharing changes:

```bash
npm run lint
npm run build
```
