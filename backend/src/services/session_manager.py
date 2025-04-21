"""
Session management service for handling chat sessions.
"""
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import WebSocket
from src.services.chat_session import ChatSession
from src.models.chat import ChatSession as ChatSessionModel
from src.config.settings import SESSION_TIMEOUT_MINUTES

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, ChatSessionModel] = {}
        self.active_connections: Dict[str, WebSocket] = {}
        self.chat_sessions: Dict[str, ChatSession] = {}

    async def create_session(self, user_id: str) -> ChatSessionModel:
        """Create a new chat session."""
        session_id = str(uuid.uuid4())
        session = ChatSessionModel(
            session_id=session_id,
            user_id=user_id,
            messages=[],
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            is_active=True
        )
        self.sessions[session_id] = session
        self.chat_sessions[session_id] = ChatSession(session_id)
        return session

    async def send_initial_message(self, session_id: str):
        """Send the initial welcome message through WebSocket."""
        if websocket := self.active_connections.get(session_id):
            chat_session = self.chat_sessions.get(session_id)
            if chat_session:
                initial_message = await chat_session.get_initial_message()
                await websocket.send_json({
                    "type": "message",
                    "data": {
                        "id": str(uuid.uuid4()),
                        "role": initial_message["role"],
                        "content": initial_message["content"],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })

    async def process_message(self, session_id: str, content: str) -> Optional[Dict]:
        """Process a message using the ChatSession."""
        chat_session = self.chat_sessions.get(session_id)
        if chat_session:
            return await chat_session.process_message({"content": content})
        return None

    def get_session(self, session_id: str) -> Optional[ChatSessionModel]:
        """Get a session by ID."""
        return self.sessions.get(session_id)

    async def connect(self, websocket: WebSocket, session_id: str):
        """Connect a WebSocket to a session."""
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        """Disconnect a WebSocket from a session."""
        self.active_connections.pop(session_id, None)
        self.chat_sessions.pop(session_id, None)

    async def send_message(self, session_id: str, message: dict):
        """Send a message through the WebSocket connection."""
        if websocket := self.active_connections.get(session_id):
            await websocket.send_json(message)

    def cleanup_inactive_sessions(self):
        """Clean up sessions that have been inactive for too long."""
        now = datetime.utcnow()
        timeout = timedelta(minutes=SESSION_TIMEOUT_MINUTES)
        
        for session_id, session in list(self.sessions.items()):
            if now - session.last_activity > timeout:
                self.disconnect(session_id)
                session.is_active = False 