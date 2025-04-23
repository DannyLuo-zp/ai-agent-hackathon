"""
Main FastAPI application module.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import socketio
from src.services.session_manager import SessionManager
import asyncio
from contextlib import asynccontextmanager
from src.config.settings import WS_PING_INTERVAL, WS_PING_TIMEOUT, SESSION_CLEANUP_INTERVAL


# Initialize session manager
session_manager = SessionManager()

async def periodic_cleanup():
    """Periodically clean up inactive sessions."""
    try:
        while True:
            # run blocking cleanup in a thread so we don't block the loop
            await asyncio.to_thread(session_manager.cleanup_inactive_sessions)
            await asyncio.sleep(SESSION_CLEANUP_INTERVAL)
    except asyncio.CancelledError:
        # graceful exit on shutdown
        pass
    except Exception as e:
        print(f"Error during session cleanup: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: launch background task
    app.state.cleanup_task = asyncio.create_task(periodic_cleanup())
    yield
    # shutdown: cancel and await it
    task = app.state.cleanup_task
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

# Create FastAPI app
app = FastAPI(lifespan=lifespan)

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
    engineio_logger=True,
    ping_timeout=WS_PING_TIMEOUT,
    ping_interval=WS_PING_INTERVAL
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


# Socket.IO event handlers
@sio.event
async def connect(sid, environ, auth):
    print("Handshake Origin:", environ.get("HTTP_ORIGIN"))
    session_id = (auth.get('session_id') if auth else None) or sid
    session_manager.connect(session_id, sid)

@sio.event
async def disconnect(sid):
    session_manager.disconnect(sid)


@sio.event
async def message(sid, data):
    print(f"Received message from {sid}: {data}")
    try:
        # Parse the message data
        message_data = json.loads(data) if isinstance(data, str) else data
        
        # Get the session_id from the message data
        session_id = message_data.get('session_id') or sid
        
        # Get the chat session
        chat_session = session_manager.get_session(session_id)
        
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
                "session_id": session_id
            }), room=sid)

    except Exception as e:
        print(f"Error processing message: {str(e)}")
        await sio.emit('message', json.dumps({
            "status": "error",
            "content": str(e),
            "session_id": session_id
        }), room=sid)

@sio.event
async def fetch_history(sid, data):
    """Fetch chat history for a session"""
    try:
        session_id = data.get('session_id') or sid
        chat_session = session_manager.get_session(session_id)
        
        if chat_session:
            history = chat_session.get_chat_history()
            await sio.emit('history', json.dumps({
                "status": "success",
                "messages": history,
                "session_id": session_id
            }), room=sid)
        else:
            await sio.emit('history', json.dumps({
                "status": "error",
                "content": "Session not found",
                "session_id": session_id
            }), room=sid)
    except Exception as e:
        print(f"Error fetching history: {str(e)}")
        await sio.emit('history', json.dumps({
            "status": "error",
            "content": str(e),
            "session_id": session_id
        }), room=sid)

@app.get("/")
async def root():
    return {"message": "Agentic Hackathon Backend API"}

# Use the Socket.IO app as the main application
app = socket_app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 