export class Player {
    private playbackNode: AudioWorkletNode | null = null;
    private audioContext: AudioContext | null = null;

    async init(sampleRate: number) {
        this.audioContext = new AudioContext({ sampleRate });
        
        try {
            await this.audioContext.audioWorklet.addModule("audio-playback-worklet.js");
            this.playbackNode = new AudioWorkletNode(this.audioContext, "audio-playback-worklet");
            this.playbackNode.connect(this.audioContext.destination);
        } catch (error) {
            console.error("[Player] Error initializing audio:", error);
            throw error;
        }
    }

    play(buffer: Int16Array) {
        if (this.playbackNode) {
            this.playbackNode.port.postMessage(buffer);
        } else {
            console.error("[Player] Cannot play: playback node not initialized");
        }
    }

    stop() {
        if (this.playbackNode) {
            this.playbackNode.port.postMessage(null);
        }
    }
}