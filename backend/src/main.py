"""
Main FastAPI application module.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
import asyncio
from contextlib import asynccontextmanager
from src.services.chat_session_manager import ChatSessionManager
from src.services.rt_session_manager import RTSessionManager
from src.config.settings import WS_PING_INTERVAL, WS_PING_TIMEOUT, SESSION_CLEANUP_INTERVAL
from src.namespaces.chat import register_chat_handlers
from src.namespaces.realtime import register_realtime_handlers

# Initialize session manager
chat_session_manager = ChatSessionManager()

async def periodic_cleanup():
    """Periodically clean up inactive sessions."""
    try:
        while True:
            # run blocking cleanup in a thread so we don't block the loop
            await asyncio.to_thread(chat_session_manager.cleanup_inactive_sessions)
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

# Register chat namespace handlers
register_chat_handlers(sio, chat_session_manager)
# Register realtime namespace handlers
rt_session_manager = RTSessionManager(sio)
register_realtime_handlers(sio, rt_session_manager)

@app.get("/")
async def root():
    return {"message": "Agentic Hackathon Backend API"}

# Use the Socket.IO app as the main application
app = socket_app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 