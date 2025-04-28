import json
from socketio import AsyncServer
from src.services.rt_session_manager import RTSessionManager

RT_NS = "/realtime"

def register_realtime_handlers(sio: AsyncServer, session_manager: RTSessionManager):
    """Register all realtime namespace event handlers"""
    
    @sio.event(namespace=RT_NS)
    async def connect(sid, environ, auth):
        session_id = (auth.get('session_id') if auth else None) or sid
        session_manager.connect(session_id, sid)
    
    @sio.event(namespace=RT_NS)
    async def disconnect(sid):
        session_manager.disconnect(sid)

    @sio.event(namespace=RT_NS)
    async def rt_request(sid, data):
        """Handle realtime requests from clients"""
        try:
            # Parse the message data
            message_data = json.loads(data) if isinstance(data, str) else data
            
            # Get the session_id from the message data
            session_id = message_data.get('session_id') or sid

            # Get the RT session
            rt = session_manager.get_session(session_id)
            if not rt:
                return await sio.emit(
                    "rt_error",
                    {"error": "RT tier not found"}, room=sid, namespace=RT_NS
                )
            
            # Send the message to the RT session
            await rt.send_client_message(message_data)
            
        except Exception as e:
            print(f"Error processing RT request: {str(e)}")
            await sio.emit('rt_response', {
                "status": "error",
                "content": str(e),
                "session_id": session_id
            }, room=sid, namespace=RT_NS)
