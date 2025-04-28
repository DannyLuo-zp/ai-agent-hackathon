import { useRef } from "react";

import { Player } from "@/audio/player";

const SAMPLE_RATE = 24000;

export default function useAudioPlayer() {
    const audioPlayer = useRef<Player | null>(null);

    const reset = async () => {
        console.log("[AudioPlayer] Initializing new player");
        audioPlayer.current = new Player();
        await audioPlayer.current.init(SAMPLE_RATE);
    };

    const play = (base64Audio: string) => {
        try {
            if (!audioPlayer.current) {
                console.error("[AudioPlayer] Player not initialized");
                return;
            }
            console.log("[AudioPlayer] Playing audio, base64 length:", base64Audio.length);
            
            // Validate base64 string
            if (!base64Audio || typeof base64Audio !== 'string') {
                console.error("[AudioPlayer] Invalid base64 audio data");
                return;
            }

            try {
                const binary = atob(base64Audio);
                console.log("[AudioPlayer] Binary length:", binary.length);
                
                const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
                console.log("[AudioPlayer] Bytes array length:", bytes.length);
                
                const pcmData = new Int16Array(bytes.buffer);
                console.log("[AudioPlayer] PCM data length:", pcmData.length);
                
                if (pcmData.length === 0) {
                    console.error("[AudioPlayer] Empty PCM data");
                    return;
                }

                console.log("[AudioPlayer] Sending to audio worklet...");
                audioPlayer.current.play(pcmData);
                console.log("[AudioPlayer] Sent to audio worklet successfully");
            } catch (error) {
                console.error("[AudioPlayer] Error processing audio data:", error);
            }
        } catch (error) {
            console.error("[AudioPlayer] Unexpected error in play function:", error);
        }
    };

    const stop = () => {
        console.log("[AudioPlayer] Stopping playback");
        audioPlayer.current?.stop();
    };

    // Test function to verify audio pipeline
    const testPlayback = async () => {
        console.log("[AudioPlayer] Starting playback test");
        await reset();
        
        // Create a simple test tone (440Hz sine wave)
        const duration = 1; // seconds
        const sampleCount = SAMPLE_RATE * duration;
        const pcmData = new Int16Array(sampleCount);
        
        for (let i = 0; i < sampleCount; i++) {
            const t = i / SAMPLE_RATE;
            pcmData[i] = Math.sin(2 * Math.PI * 440 * t) * 32767;
        }
        
        // Convert to base64 for testing
        const bytes = new Uint8Array(pcmData.buffer);
        const binary = String.fromCharCode(...bytes);
        const base64Audio = btoa(binary);
        
        console.log("[AudioPlayer] Generated test tone, playing...");
        play(base64Audio);
    };

    return { reset, play, stop, testPlayback };
}