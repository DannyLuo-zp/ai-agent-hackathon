"""
Data models for chat sessions and messages.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class Message(BaseModel):
    """Represents a single message in a chat session."""
    role: str = Field(..., description="The role of the message sender (user/assistant)")
    content: str = Field(..., description="The content of the message")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    id: str = Field(..., description="Unique identifier for the message")

class ChatSession(BaseModel):
    """Represents a chat session with a user."""
    session_id: str = Field(..., description="Unique identifier for the session")
    user_id: str = Field(..., description="Identifier for the user")
    messages: List[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True) 