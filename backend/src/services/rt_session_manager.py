from typing import Dict
from socketio import AsyncServer
from src.services.rt_session import RTSession
import asyncio

class RTSessionManager:
    def __init__(self, sio: AsyncServer):
        self.sio = sio
        self.sessions: Dict[str, RTSession] = {}  # session_id -> RTSession

    def connect(self, session_id: str, socket_id: str, voice_choice: str = None) -> RTSession:
        """Create a new RT session if it doesn't exist.
        If it does, update the socket_id.
        """
        if session_id not in self.sessions:
            self.sessions[session_id] = RTSession(
                sio=self.sio,
                session_id=session_id,
                socket_id=socket_id,
                voice_choice=voice_choice
            )
        else:
            # Update the socket_id in the existing session
            self.sessions[session_id].socket_id = socket_id

        return self.sessions[session_id]

    def disconnect(self, socket_id: str):
        """Disconnect a socket from a session and cleanup if needed."""
        for session_id, session in self.sessions.items():
            if session.socket_id == socket_id:
                # Clear the socket_id but keep the session
                session.socket_id = None
                print(f"Marked RT session {session_id} as disconnected (socket {socket_id})")
                break

    def get_session(self, session_id: str) -> RTSession:
        """Get a session by session_id."""
        return self.sessions.get(session_id)

    def delete_session(self, session_id: str):
        """Delete a RT session and cleanup resources."""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            # Ensure proper cleanup of the RT session
            asyncio.create_task(session.shutdown())
            del self.sessions[session_id]
