import { useEffect, useRef, useState } from "react";

interface UseRaceAudioOptions {
  autoPlay?: boolean;
  loop?: boolean;
  initialVolume?: number;
}

interface RaceAudioControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  volume: number;
  isPlaying: boolean;
  isMuted: boolean;
  toggleMute: () => void;
}

export function useRaceAudio(
  audioSrc: string,
  options: UseRaceAudioOptions = {},
): RaceAudioControls {
  const { autoPlay = false, loop = true, initialVolume = 0.5 } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(audioSrc);
    audio.loop = loop;
    audio.volume = initialVolume;
    audioRef.current = audio;

    // Event listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    // Auto play if enabled
    if (autoPlay) {
      audio.play().catch((err) => {
        console.warn("Auto-play prevented by browser:", err);
      });
    }

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, [audioSrc, loop, initialVolume, autoPlay]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error("Failed to play audio:", err);
      });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  return {
    play,
    pause,
    stop,
    setVolume,
    volume,
    isPlaying,
    isMuted,
    toggleMute,
  };
}
