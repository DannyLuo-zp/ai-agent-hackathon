import asyncio
import socketio
import json
import uuid
import time

async def chat_with_backend():
    # Generate a unique session ID
    session_id = str(uuid.uuid4())
    
    # Create a Socket.IO client
    sio = socketio.AsyncClient()
    
    # Create an event to wait for responses
    response_received = asyncio.Event()
    last_response = None
    
    # Connect to the Socket.IO server
    try:
        await sio.connect('http://localhost:8000', 
                         transports=['websocket'],
                         auth={'session_id': session_id})
        print(f"Connected to server with session ID: {session_id}")
        
        # Define message handler
        @sio.on('message')
        def on_message(data):
            nonlocal last_response
            try:
                response = json.loads(data) if isinstance(data, str) else data
                last_response = response
                if response['status'] == 'success':
                    print(f"Assistant: {response['content']}")
                else:
                    print(f"Error: {response['content']}")
                # Signal that we received a response
                response_received.set()
            except Exception as e:
                print(f"Error parsing message: {e}")
                response_received.set()
        
        # Main chat loop
        while True:
            # Get user input
            message = input("You: ")
            
            # Prepare the message
            data = {
                "content": message,
                "type": "chat",
                "session_id": session_id
            }
            
            # Reset the event before sending
            response_received.clear()
            
            # Send the message
            await sio.emit('message', json.dumps(data))
            
            # Wait for the response
            await response_received.wait()
            
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        await sio.disconnect()

if __name__ == "__main__":
    asyncio.run(chat_with_backend()) 