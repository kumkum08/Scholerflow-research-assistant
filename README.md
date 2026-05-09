# ScholarFlow - AI Research Assistant

A beginner-friendly AI-powered research paper writing assistant with a clean separation between frontend and backend.

## Features

- Section-by-section research paper drafting support
- AI-powered assistance with Gemini integration
- Offline-friendly frontend with fallback responses
- Local document import and analysis workspace
- React frontend and Express backend in separate folders

## Run Locally

Prerequisite: Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a private local `.env` file and keep all secrets only there or in your deployment platform's environment variable settings.
3. Start both apps:
   ```bash
   npm run dev:full
   ```

Do not commit `.env` or put secret values into docs, setup files, frontend source, or build config.

You can also run them separately:

```bash
npm run server
npm run dev
```

## Project Structure

```text
scholarflow_-ai-research-assistant/
|-- backend/
|   |-- server/
|   |   |-- index.ts
|   |   |-- authService.ts
|   |   |-- models/
|   |   `-- services/
|   `-- tsconfig.server.json
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- lib/
|   |   `-- services/
|   |-- index.html
|   |-- tsconfig.json
|   `-- vite.config.ts
|-- package.json
|-- QUICK_START.md
`-- README.md
```

## Usage

1. Sign in or create an account.
2. Choose a paper section from the sidebar.
3. Draft with AI help in the main workspace.
4. Import documents for reading and analysis.
