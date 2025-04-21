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