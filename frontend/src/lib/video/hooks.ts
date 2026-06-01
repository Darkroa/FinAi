import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const durationsRef = useRef(durations);
  
  useEffect(() => {
    const keys = Object.keys(durationsRef.current);
    if (keys.length === 0) return;

    let timeoutId: NodeJS.Timeout;
    let sceneIndex = 0;
    let hasCompletedFirstPass = false;
    
    // Call start on mount
    window.startRecording?.();
    
    const playNext = () => {
      const currentKey = keys[sceneIndex];
      const currentDuration = durationsRef.current[currentKey] || 3000;
      
      timeoutId = setTimeout(() => {
        sceneIndex++;
        if (sceneIndex >= keys.length) {
          if (!hasCompletedFirstPass) {
            window.stopRecording?.();
            hasCompletedFirstPass = true;
          }
          sceneIndex = 0; // Loop back
        }
        setCurrentScene(sceneIndex);
        playNext();
      }, currentDuration);
    };
    
    playNext();
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return { currentScene };
}