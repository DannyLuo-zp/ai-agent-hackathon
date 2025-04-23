from typing import Dict, List
from datetime import datetime, timezone

from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from src.config.settings import SYSTEM_PROMPT, INITIAL_MESSAGE

load_dotenv()

class ChatSession:
    def __init__(self, session_id: str, socket_id: str):
        self.session_id = session_id
        self.socket_id = socket_id  # store the socket id, indicates the connection is active
        self.last_active = datetime.now(timezone.utc) 
        
        # Initialize OpenAI client with just the API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.client = AsyncOpenAI(api_key=api_key)
        self.messages: List[Dict[str, str]] = []
        self.system_message = {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
        print(f"Initialized chat session with ID: {session_id}")

    async def get_initial_message(self) -> Dict:
        """
        Get the initial welcome message for the chat session
        """
        return {
            "role": "assistant",
            "content": INITIAL_MESSAGE
        }

    async def process_message(self, message: Dict) -> Dict:
        """
        Process incoming messages and generate responses using OpenAI API
        """
        try:
            print(f"Processing message in session {self.session_id}: {message}")
            # Add user message to conversation history
            self.messages.append({
                "role": "user",
                "content": message.get("content", "")
            })

            # Prepare messages for API call
            api_messages = [self.system_message] + self.messages

            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",  # or your preferred model
                messages=api_messages,
                stream=True,
                max_tokens=150,  # Limit response length
                temperature=0.7,  # Add some creativity but not too much
                presence_penalty=0.6,  # Encourage diversity
                frequency_penalty=0.3  # Reduce repetition
            )

            # Process streaming response
            full_response = ""
            async for chunk in response:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    # Here you could implement streaming to client if needed

            # Add assistant's response to conversation history
            self.messages.append({
                "role": "assistant",
                "content": full_response
            })

            return {
                "status": "success",
                "content": full_response,
                "session_id": self.session_id
            }

        except Exception as e:
            print(f"Error in session {self.session_id}: {str(e)}")
            return {
                "status": "error",
                "content": str(e),
                "session_id": self.session_id
            }

    def clear_history(self):
        """
        Clear the conversation history
        """
        self.messages = []

    def get_chat_history(self) -> List[Dict[str, str]]:
        """
        Get the conversation history
        """
        return self.messages 