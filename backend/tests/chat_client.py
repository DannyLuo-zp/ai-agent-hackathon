"""
Test client for the AI Cat Assistant backend.
This module provides a command-line interface to test the Socket.IO communication
with the backend server.
"""
import asyncio
import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
import socketio
from dataclasses import dataclass
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

@dataclass
class ChatMessage:
    """Represents a chat message with metadata."""
    content: str
    role: str
    timestamp: datetime
    id: str = None

    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())
        if isinstance(self.timestamp, str):
            self.timestamp = datetime.fromisoformat(self.timestamp)

    def to_dict(self) -> Dict[str, Any]:
        """Convert the message to a dictionary format."""
        return {
            "id": self.id,
            "content": self.content,
            "role": self.role,
            "timestamp": self.timestamp.isoformat()
        }

class ChatClient:
    """Client for testing the AI Cat Assistant backend."""
    
    def __init__(self, server_url: str = "http://localhost:8000"):
        self.server_url = server_url
        self.session_id = str(uuid.uuid4())
        self.sio = socketio.AsyncClient()
        self.console = Console()
        self.response_received = asyncio.Event()
        self.last_response: Optional[Dict] = None
        
        # Set up event handlers
        self.sio.on('message')(self._on_message)
        self.sio.on('connect')(self._on_connect)
        self.sio.on('disconnect')(self._on_disconnect)
        self.sio.on('error')(self._on_error)

    async def _on_message(self, data: Dict[str, Any]):
        """Handle incoming messages from the server."""
        try:
            if isinstance(data, str):
                data = json.loads(data)
            
            # Store the response
            self.last_response = data
            
            # Display the message with rich formatting
            if data.get('status') == 'success':
                content = data.get('content', '')
                self.console.print(Panel(
                    Markdown(content),
                    title="🐱 AI Cat",
                    border_style="purple"
                ))
            else:
                self.console.print(f"[red]Error: {data.get('content', 'Unknown error')}[/red]")
            
            # Signal that we've received a response
            self.response_received.set()
            
        except Exception as e:
            self.console.print(f"[red]Error processing message: {str(e)}[/red]")
            self.response_received.set()

    async def _on_connect(self):
        """Handle successful connection to the server."""
        self.console.print("[green]Connected to server![/green]")
        self.console.print(f"[dim]Session ID: {self.session_id}[/dim]")

    async def _on_disconnect(self):
        """Handle disconnection from the server."""
        self.console.print("[yellow]Disconnected from server[/yellow]")

    async def _on_error(self, error: str):
        """Handle server errors."""
        self.console.print(f"[red]Server error: {error}[/red]")

    async def connect(self):
        """Connect to the Socket.IO server."""
        try:
            await self.sio.connect(
                self.server_url,
                transports=['websocket'],
                auth={'session_id': self.session_id}
            )
        except Exception as e:
            self.console.print(f"[red]Connection error: {str(e)}[/red]")
            raise

    async def send_message(self, content: str):
        """Send a message to the server and wait for response."""
        # Clear the response event and last response
        self.response_received.clear()
        self.last_response = None
        
        # Create and send the message
        message = {
            "content": content,
            "role": "user",
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": self.session_id
        }
        
        # Send the message
        await self.sio.emit('message', json.dumps(message))
        
        # Wait for response with timeout
        try:
            await asyncio.wait_for(self.response_received.wait(), timeout=30.0)
        except asyncio.TimeoutError:
            self.console.print("[red]Timeout waiting for server response[/red]")
            return None
            
        return self.last_response

    async def disconnect(self):
        """Disconnect from the server."""
        await self.sio.disconnect()

async def main():
    """Main entry point for the test client."""
    client = ChatClient()
    try:
        await client.connect()
        
        while True:
            try:
                # Get user input
                user_input = input("\nYou: ")
                
                # Check for exit command
                if user_input.lower() in ['exit', 'quit', 'q']:
                    break
                
                # Send message and wait for response
                response = await client.send_message(user_input)
                if response and response.get('status') == 'error':
                    self.console.print(f"[red]Error from server: {response.get('content')}[/red]")
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                client.console.print(f"[red]Error: {str(e)}[/red]")
                
    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main()) 