# AI Agent Hackathon Frontend

A Next.js frontend with a ChatGPT-like UI for interacting with AI agents.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- ChatGPT-like UI using Next.js and Tailwind CSS
- Real-time WebSocket communication with the backend
- Session persistence across reconnections
- TypeScript for type safety

## Project Structure

- `src/contexts/WebSocketContext.tsx` - WebSocket connection management
- `src/components/` - UI components
- `src/config/` - Configuration files for endpoints and version

## Continuous Deployment

The frontend is configured for continuous deployment to Azure Container Apps using GitHub Actions.

### Deployment Process

1. When changes are pushed to the `main` branch, the GitHub workflow automatically:
   - Builds a Docker container from the Dockerfile
   - Pushes the container to Azure Container Registry
   - Deploys the container to Azure Container Apps
   - Updates the endpoint configuration to point to the deployed backend

2. Required GitHub Secrets:
   - Same secrets as the backend deployment
   - No additional secrets required

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

