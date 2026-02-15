import { useRef, useEffect, useState } from 'react';

interface EngineAudioControls {
  start: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  updateSpeed: (speed: number) => void;
  isRunning: boolean;
}

export function useEngineAudio(): EngineAudioControls {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const start = () => {
    if (isRunning) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Main oscillator for engine tone
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 80; // Base engine frequency

      // Filter for engine character
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 1;

      // Gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.3;

      // Noise for texture
      const bufferSize = 4096;
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseGain = audioContext.createGain();
      noiseGain.gain.value = 0.05;

      // Connect nodes
      oscillator.connect(filter);
      filter.connect(gainNode);
      noiseSource.connect(noiseGain);
      noiseGain.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      noiseSource.start();

      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
      filterRef.current = filter;
      noiseGainRef.current = noiseGain;
      setIsRunning(true);
    } catch (error) {
      console.error('Failed to start engine audio:', error);
    }
  };

  const stop = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    gainNodeRef.current = null;
    filterRef.current = null;
    noiseGainRef.current = null;
    setIsRunning(false);
  };

  const setVolume = (volume: number) => {
    if (gainNodeRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      gainNodeRef.current.gain.value = clampedVolume;
    }
  };

  const updateSpeed = (speed: number) => {
    if (oscillatorRef.current && filterRef.current && noiseGainRef.current) {
      // Map speed (0-60) to frequency (80-400 Hz)
      const normalizedSpeed = Math.max(0, Math.min(60, Math.abs(speed)));
      const frequency = 80 + (normalizedSpeed / 60) * 320;
      oscillatorRef.current.frequency.value = frequency;

      // Adjust filter cutoff with speed
      const filterFreq = 800 + (normalizedSpeed / 60) * 1200;
      filterRef.current.frequency.value = filterFreq;

      // Increase noise with speed
      const noiseLevel = 0.05 + (normalizedSpeed / 60) * 0.1;
      noiseGainRef.current.gain.value = noiseLevel;
    }
  };

  return {
    start,
    stop,
    setVolume,
    updateSpeed,
    isRunning,
  };
}
