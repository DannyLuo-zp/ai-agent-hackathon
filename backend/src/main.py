"""
Main FastAPI application module.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import json
import socketio
from src.services.session_manager import SessionManager
from src.services.chat_session import ChatSession

# Create FastAPI app
app = FastAPI()

# Define allowed origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Local development
    "https://ai-agent-hackathon-frontend.redbeach-bcf4c30d.westus2.azurecontainerapps.io",  # Production frontend
    "https://*.azurecontainerapps.io",  # Any Azure Container Apps domain
]

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=ALLOWED_ORIGINS,  # Allow both local and production origins
    logger=True,
    engineio_logger=True
)

# Create Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Allow both local and production origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize session manager
session_manager = SessionManager()

# Socket.IO event handlers
@sio.event
async def connect(sid, environ, auth):
    print(f"Client connected: {sid}")
    
    # Get session_id from auth parameter
    session_id = auth.get('session_id') if auth else None
    
    # If not found in auth, use the socket ID
    if not session_id:
        session_id = sid
    
    # Create a chat session for this connection
    session_manager.chat_sessions[session_id] = ChatSession(session_id)
    print(f"Created chat session for {session_id}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    # Find and remove the session
    for session_id, session in list(session_manager.chat_sessions.items()):
        if session.session_id == sid:
            del session_manager.chat_sessions[session_id]
            break

@sio.event
async def message(sid, data):
    print(f"Received message from {sid}: {data}")
    try:
        # Parse the message data
        message_data = json.loads(data) if isinstance(data, str) else data
        
        # Get the session_id from the message data
        session_id = message_data.get('session_id')
        if not session_id:
            # If no session_id in message, try to find it from the sid
            for s_id, session in session_manager.chat_sessions.items():
                if session.session_id == sid:
                    session_id = s_id
                    break
        
        # Get the chat session
        chat_session = session_manager.chat_sessions.get(session_id)
        
        if chat_session:
            # Process the message
            response = await chat_session.process_message(message_data)
            # Send the response back to the client
            await sio.emit('message', json.dumps(response), room=sid)
        else:
            print(f"Session not found for sid: {sid}, session_id: {session_id}")
            await sio.emit('message', json.dumps({
                "status": "error",
                "content": "Session not found",
                "session_id": sid
            }), room=sid)
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        await sio.emit('message', json.dumps({
            "status": "error",
            "content": str(e),
            "session_id": sid
        }), room=sid)

@app.get("/")
async def root():
    return {"message": "Agentic Hackathon Backend API"}

# Use the Socket.IO app as the main application
app = socket_app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 