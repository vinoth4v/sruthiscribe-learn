import { useCallback, useRef, useState } from 'react';
import { mixdownResample } from '../../engine/engine';

export type RecorderStatus = 'idle' | 'recording' | 'processing' | 'error';

export interface RecordedTake {
  pcm: Float32Array; // mono, resampled to engine.DEFAULTS.sr (16 kHz)
  sr: number;
  durationSec: number;
}

// Records via MediaRecorder (mic capture only, never uploaded by default —
// build plan §4), then decodes the blob back to PCM for offline engine
// analysis. Simpler and more robust than a live ScriptProcessor/AudioWorklet
// pipeline for a v1 practice loop; live per-frame decoding (Riyaz-style
// scrolling pitch lane) is scoped as a follow-up refinement.
export function useRecorder(targetSr = 16000) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mediaRecorderRef.current = rec;
      startedAtRef.current = performance.now();
      rec.start();
      setStatus('recording');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not access the microphone.');
      setStatus('error');
    }
  }, []);

  const stop = useCallback((): Promise<RecordedTake> => {
    return new Promise((resolve, reject) => {
      const rec = mediaRecorderRef.current;
      if (!rec) { reject(new Error('Not recording.')); return; }
      setStatus('processing');
      rec.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        try {
          const blob = new Blob(chunksRef.current, { type: rec.mimeType });
          const arrayBuf = await blob.arrayBuffer();
          const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const decoded = await audioCtx.decodeAudioData(arrayBuf);
          const channels: Float32Array[] = [];
          for (let c = 0; c < decoded.numberOfChannels; c++) channels.push(decoded.getChannelData(c));
          const pcm = mixdownResample(channels, decoded.sampleRate, targetSr);
          await audioCtx.close();
          setStatus('idle');
          resolve({ pcm, sr: targetSr, durationSec: (performance.now() - startedAtRef.current) / 1000 });
        } catch (e) {
          setStatus('error');
          setError(e instanceof Error ? e.message : 'Could not process the recording.');
          reject(e);
        }
      };
      rec.stop();
    });
  }, [targetSr]);

  return { status, error, start, stop };
}
