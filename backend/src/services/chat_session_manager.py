from datetime import datetime, timedelta, timezone
from typing import Dict
from src.services.chat_session import ChatSession
from src.config.settings import SESSION_TIMEOUT_MINUTES

class ChatSessionManager:
    def __init__(self):
        self.sessions: Dict[str, ChatSession] = {} # session_id -> ChatSession

    def connect(self, session_id: str, socket_id: str) -> ChatSession:
        """Create a new chat session if it doesn't exist.
        If it does, update the socket_id.
        """
        if session_id not in self.sessions:
            self.sessions[session_id] = ChatSession(session_id, socket_id)
        else:
            self.sessions[session_id].socket_id = socket_id

        return self.sessions[session_id]

    def disconnect(self, socket_id: str):
        """Disconnect a socket from a session."""
        for session_id, session in self.sessions.items():
            if session.socket_id == socket_id:
                session.socket_id = None  # Clear the socket_id but keep the session
                session.last_active = datetime.now(timezone.utc)
                print(f"Marked session {session_id} as disconnected (socket {socket_id})")
                break

    def get_session(self, session_id: str) -> ChatSession:
        """Get a session by session_id."""
        return self.sessions.get(session_id)

    def delete_session(self, session_id: str):
        """Delete a chat session."""
        if session_id in self.sessions:
            del self.sessions[session_id]

    def cleanup_inactive_sessions(self):
        """Clean up sessions that have been inactive for too long."""
        print("Cleaning up inactive sessions ... ")
        now = datetime.now(timezone.utc)
        timeout = timedelta(minutes=SESSION_TIMEOUT_MINUTES)
        
        for session_id, session in list(self.sessions.items()):
            if not session.socket_id and now - session.last_active > timeout:
                print(f"Deleting session {session_id} because it has been inactive for too long")
                self.delete_session(session_id)