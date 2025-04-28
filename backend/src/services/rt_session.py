# src/services/rtmiddle.py
import os, json, asyncio, logging
from enum import Enum
from typing import Any, Callable, Optional

import aiohttp
from openai import AsyncOpenAI
from socketio import AsyncServer
from ..config.settings import SYSTEM_PROMPT

RT_NS = "/realtime"

logger = logging.getLogger("rt_session")

class RTSession:
    def __init__(
        self,
        sio: AsyncServer,
        session_id: str,
        socket_id: str,
        voice_choice: Optional[str] = "alloy"  # Default to alloy voice
    ):
        self.sio = sio
        self.session_id = session_id
        self.socket_id = socket_id
        self.voice_choice = voice_choice
        self.system_prompt = SYSTEM_PROMPT

        # queue of messages from socket.io → OpenAI
        self._to_server = asyncio.Queue()
        # flag to stop the background tasks
        self._shutdown = asyncio.Event()
        # start the forwarder task
        self._task = asyncio.create_task(self._run_bridge())

        self.model = "gpt-4o-realtime-preview-2024-12-17"
        self._api_key = os.getenv("OPENAI_API_KEY")

    async def shutdown(self):
        self._shutdown.set()
        await self._task

    async def send_client_message(self, msg: dict):
        """Called by socket.io handler when client emits 'rt_request'."""
        await self._to_server.put(msg)

    async def _run_bridge(self):
        """Background task connecting to OpenAI WS and shuttling messages."""
        
        url = f"wss://api.openai.com/v1/realtime?model={self.model}"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            # needed to access the beta realtime endpoint
            "OpenAI-Beta": "realtime=v1",
        }

        print(f"[DEBUG] Attempting to connect to OpenAI RT for session {self.session_id}")
        logger.info(f"[OpenAI RT] Attempting connection for session {self.session_id}")

        try:
            async with aiohttp.ClientSession() as session:
                print(f"[DEBUG] Created ClientSession for session {self.session_id}")
                async with session.ws_connect(url, headers=headers) as openai_ws:
                    print(f"[DEBUG] Successfully connected to OpenAI RT for session {self.session_id}")
                    logger.info(f"[OpenAI RT] Successfully connected to realtime endpoint for session {self.session_id}")
                    
                    # Send system prompt if provided
                    if self.system_prompt:
                        system_message = {
                            "type": "session.update",
                            "session": {
                                "instructions": self.system_prompt
                            }
                        }
                        await openai_ws.send_str(json.dumps(system_message))
                    
                    async def client_to_openai():
                        while not self._shutdown.is_set():
                            msg = await self._to_server.get()
                            print(f"[DEBUG] Sending message to OpenAI: {msg.get('type', 'unknown')}")
                            await openai_ws.send_str(json.dumps(msg))

                    async def openai_to_client():
                        try:
                            async for msg in openai_ws:
                                if msg.type != aiohttp.WSMsgType.TEXT:
                                    print(f"[DEBUG] Received non-text message type: {msg.type}")
                                    continue
                                data = json.loads(msg.data)
                                print(f"[DEBUG] Received message from OpenAI: {data.get('type', 'unknown')}")
                                await self.sio.emit(
                                    "rt_response",
                                    data,
                                    room=self.socket_id,
                                    namespace=RT_NS
                                )
                        except Exception as e:
                            print(f"[DEBUG] Error in openai_to_client: {str(e)}")
                            logger.error(f"[OpenAI RT] Error in openai_to_client for session {self.session_id}: {str(e)}")
                        finally:
                            print(f"[DEBUG] Connection closed for session {self.session_id}")
                            logger.info(f"[OpenAI RT] Connection closed for session {self.session_id}")

                    # run both directions until shutdown
                    await asyncio.gather(
                        client_to_openai(),
                        openai_to_client(),
                        return_exceptions=True
                    )
        except Exception as e:
            print(f"[DEBUG] Failed to connect to OpenAI RT: {str(e)}")
            logger.error(f"[OpenAI RT] Failed to connect for session {self.session_id}: {str(e)}")
            raise