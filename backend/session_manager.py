from typing import Dict
from chat_session import ChatSession

class SessionManager:
    def __init__(self):
        self.chat_sessions: Dict[str, ChatSession] = {}

    def get_session(self, session_id: str) -> ChatSession:
        return self.chat_sessions.get(session_id)

    def create_session(self, session_id: str) -> ChatSession:
        if session_id not in self.chat_sessions:
            self.chat_sessions[session_id] = ChatSession(session_id)
        return self.chat_sessions[session_id]

    def remove_session(self, session_id: str):
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id] 