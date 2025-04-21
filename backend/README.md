# Agentic Hackathon Backend

A FastAPI backend for managing LLM agent interactions with WebSocket support for real-time communication.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with the following variables:
```
OPENAI_API_KEY=your_openai_api_key_here
MODEL_NAME=gpt-4-turbo-preview
HOST=0.0.0.0
PORT=8000
```

4. Run the server:
```bash
python main.py
```

## Features

- WebSocket-based real-time communication
- Session management for multiple chat sessions
- Streaming responses from OpenAI API
- Extensible architecture for future LLM agent integrations

## API Endpoints

- WebSocket: `/ws/{session_id}` - Connect to chat session
- GET `/` - Health check endpoint

## Project Structure

- `main.py` - FastAPI application and WebSocket endpoints
- `session_manager.py` - Manages WebSocket connections and chat sessions
- `chat_session.py` - Handles message processing and OpenAI API communication 

## Continuous Deployment

The backend is configured for continuous deployment to Azure Container Apps using GitHub Actions.

### Deployment Process

1. When changes are pushed to the `main` branch, the GitHub workflow automatically:
   - Builds a Docker container from the Dockerfile
   - Pushes the container to Azure Container Registry
   - Deploys the container to Azure Container Apps

2. Required GitHub Secrets:
   - `AZURE_CLIENT_ID` - Azure service principal client ID
   - `AZURE_CLIENT_SECRET` - Azure service principal client secret
   - `AZURE_TENANT_ID` - Azure tenant ID
   - `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
   - `REGISTRY_ENDPOINT` - Azure Container Registry endpoint
   - `REGISTRY_USERNAME` - ACR username
   - `REGISTRY_PASSWORD` - ACR password
   - `AZURE_RESOURCE_GROUP` - Resource group name
   - `AZURE_CONTAINER_APP_ENV` - Container Apps environment name
   - `OPENAI_API_KEY` - OpenAI API key
