import { useEffect, useState } from 'react';

interface CarControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  throttle: number;
  steering: number;
}

export function useCarControls(): CarControls {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setKeys((prev) => ({ ...prev, forward: true }));
          break;
        case 's':
        case 'arrowdown':
          setKeys((prev) => ({ ...prev, backward: true }));
          break;
        case 'a':
        case 'arrowleft':
          setKeys((prev) => ({ ...prev, left: true }));
          break;
        case 'd':
        case 'arrowright':
          setKeys((prev) => ({ ...prev, right: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setKeys((prev) => ({ ...prev, forward: false }));
          break;
        case 's':
        case 'arrowdown':
          setKeys((prev) => ({ ...prev, backward: false }));
          break;
        case 'a':
        case 'arrowleft':
          setKeys((prev) => ({ ...prev, left: false }));
          break;
        case 'd':
        case 'arrowright':
          setKeys((prev) => ({ ...prev, right: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const throttle = keys.forward ? 1 : keys.backward ? -1 : 0;
  const steering = keys.left ? -1 : keys.right ? 1 : 0;

  return {
    ...keys,
    throttle,
    steering,
  };
}
