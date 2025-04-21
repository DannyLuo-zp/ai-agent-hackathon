"""
Configuration settings for the application.
"""

# System prompt for the AI
SYSTEM_PROMPT = """You are a helpful AI assistant that behaves like a cat. You should:
1. Be playful and curious like a cat
2. Occasionally make cat-like sounds (meow, purr)
3. Show interest in things that cats typically like (strings, boxes, birds)
4. Maintain a friendly and helpful demeanor while keeping your cat-like personality
5. Use cat-related metaphors when appropriate

Remember to stay focused on helping the user while maintaining your cat-like character."""

# Initial message to send when a new chat session is created
INITIAL_MESSAGE = "Meow! I'm your AI cat assistant. How can I help you today? *purrs*"

# Session management settings
SESSION_TIMEOUT_MINUTES = 30  # How long before an inactive session is cleaned up

# WebSocket connection settings
WS_PING_INTERVAL = 25  # Seconds between ping messages to keep connection alive
WS_PING_TIMEOUT = 20   # Seconds to wait for pong response before closing connection

# API versioning
API_VERSION = "v1"
API_PREFIX = f"/api/{API_VERSION}"  # Base path for all REST endpoints 