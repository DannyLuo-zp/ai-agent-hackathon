class AudioPlaybackWorklet extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = this.handleMessage.bind(this);
        this.buffer = [];
        console.log("[AudioWorklet] Worklet initialized");
    }

    handleMessage(event) {
        if (event.data === null) {
            console.log("[AudioWorklet] Received stop command");
            this.buffer = [];
            return;
        }
        console.log("[AudioWorklet] Received audio buffer, length:", event.data.length);
        this.buffer.push(...event.data);
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];

        if (this.buffer.length > channel.length) {
            const toProcess = this.buffer.slice(0, channel.length);
            this.buffer = this.buffer.slice(channel.length);
            channel.set(toProcess.map(v => v / 32768));
        } else {
            channel.set(this.buffer.map(v => v / 32768));
            this.buffer = [];
        }

        return true;
    }
}

registerProcessor("audio-playback-worklet", AudioPlaybackWorklet);