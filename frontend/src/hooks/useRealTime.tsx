import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_ENDPOINT } from '../config/endpoints';

interface WebSocketMessage {
    type: string;
    [key: string]: unknown;
}

type Parameters = {
    onWebSocketOpen?: () => void;
    onWebSocketClose?: () => void;
    onWebSocketError?: (event: Event) => void;
    onWebSocketMessage?: (event: MessageEvent<WebSocketMessage>) => void;
    onReceivedResponseAudioDelta?: (message: { delta: string }) => void;
    onReceivedInputAudioBufferSpeechStarted?: (message: WebSocketMessage) => void;
    onReceivedError?: (message: { error: string }) => void;
};

export default function useRealTime({
    onWebSocketOpen,
    onWebSocketClose,
    onWebSocketError,
    onWebSocketMessage,
    onReceivedResponseAudioDelta,
    onReceivedInputAudioBufferSpeechStarted,
    onReceivedError
}: Parameters) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to the WebSocket server with /realtime namespace
        const socketInstance = io(`${API_ENDPOINT}/realtime`, { 
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
            onWebSocketOpen?.();
            console.log('Connected to RT namespace');
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
            onWebSocketClose?.();
            console.log('Disconnected from RT namespace');
        });

        socketInstance.on('connect_error', (error) => {
            onWebSocketError?.(error as unknown as Event);
            console.error('RT connection error:', error);
        });

        // Listen for responses on the realtime namespace
        socketInstance.on('rt_response', (data) => {
            console.log('[RT Response] Received response:', {
                type: data.type,
                data: data,
                timestamp: new Date().toISOString()
            });
            
            onWebSocketMessage?.(new MessageEvent('message', { 
                data: JSON.stringify(data) 
            }) as unknown as MessageEvent<WebSocketMessage>);
            
            switch (data.type) {
                case 'response.audio.delta':
                    console.log('[RT Response] Processing audio delta:', {
                        delta: data.delta,
                        timestamp: new Date().toISOString()
                    });
                    onReceivedResponseAudioDelta?.(data);
                    break;
                    
                case 'input_audio_buffer.speech_started':
                    console.log('[RT Response] Speech started event received:', {
                        timestamp: new Date().toISOString()
                    });
                    onReceivedInputAudioBufferSpeechStarted?.(data);
                    break;
                    
                default:
                    console.log('[RT Response] Unhandled response type:', {
                        type: data.type,
                        timestamp: new Date().toISOString()
                    });
            }
        });

        // Listen for errors on the realtime namespace
        socketInstance.on('rt_error', (data) => {
            onReceivedError?.(data);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const startSession = useCallback(() => {
        if (socket && isConnected) {
            const command = {
                type: "session.update",
                session: {
                    turn_detection: {
                        type: "server_vad"
                    }
                }
            };
            socket.emit('rt_request', command);
        }
    }, [socket, isConnected]);

    const addUserAudio = useCallback((base64Audio: string) => {
        if (socket && isConnected) {
            const command = {
                type: "input_audio_buffer.append",
                audio: base64Audio
            };
            socket.emit('rt_request', command);
        }
    }, [socket, isConnected]);

    const inputAudioBufferClear = useCallback(() => {
        if (socket && isConnected) {
            const command = {
                type: "input_audio_buffer.clear"
            };
            socket.emit('rt_request', command);
        }
    }, [socket, isConnected]);

    return { startSession, addUserAudio, inputAudioBufferClear, isConnected };
}