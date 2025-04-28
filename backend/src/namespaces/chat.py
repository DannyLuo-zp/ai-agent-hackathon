import json
from socketio import AsyncServer
from src.services.chat_session_manager import ChatSessionManager

CHAT_NS = "/chat"

def register_chat_handlers(sio: AsyncServer, session_manager: ChatSessionManager):
    """Register all chat namespace event handlers"""
    
    @sio.event(namespace=CHAT_NS)
    async def connect(sid, environ, auth):
        print("Handshake Origin:", environ.get("HTTP_ORIGIN"))
        session_id = (auth.get('session_id') if auth else None) or sid
        session_manager.connect(session_id, sid)

    @sio.event(namespace=CHAT_NS)
    async def disconnect(sid):
        session_manager.disconnect(sid)

    @sio.event(namespace=CHAT_NS)
    async def message(sid, data):
        print(f"Received message from {sid}: {data}")
        try:
            # Parse the message data
            message_data = json.loads(data) if isinstance(data, str) else data
            
            # Get the session_id from the message data
            session_id = message_data.get('session_id') or sid
            
            # Get the chat session
            chat_session = session_manager.get_session(session_id)
            
            if chat_session:
                # Process the message
                response = await chat_session.process_message(message_data)
                # Send the response back to the client with namespace
                await sio.emit('message', json.dumps(response), room=sid, namespace=CHAT_NS)
            else:
                print(f"Session not found for sid: {sid}, session_id: {session_id}")
                await sio.emit('message', json.dumps({
                    "status": "error",
                    "content": "Session not found",
                    "session_id": session_id
                }), room=sid, namespace=CHAT_NS)

        except Exception as e:
            print(f"Error processing message: {str(e)}")
            await sio.emit('message', json.dumps({
                "status": "error",
                "content": str(e),
                "session_id": session_id
            }), room=sid, namespace=CHAT_NS)

    @sio.event(namespace=CHAT_NS)
    async def fetch_history(sid, data):
        """Fetch chat history for a session"""
        try:
            session_id = data.get('session_id') or sid
            chat_session = session_manager.get_session(session_id)
            
            if chat_session:
                history = chat_session.get_chat_history()
                await sio.emit('history', json.dumps({
                    "status": "success",
                    "messages": history,
                    "session_id": session_id
                }), room=sid, namespace=CHAT_NS)
            else:
                await sio.emit('history', json.dumps({
                    "status": "error",
                    "content": "Session not found",
                    "session_id": session_id
                }), room=sid, namespace=CHAT_NS)
        except Exception as e:
            print(f"Error fetching history: {str(e)}")
            await sio.emit('history', json.dumps({
                "status": "error",
                "content": str(e),
                "session_id": session_id
            }), room=sid, namespace=CHAT_NS) 