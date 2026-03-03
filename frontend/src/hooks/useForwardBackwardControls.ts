import { useEffect, useState } from 'react';

interface ForwardBackwardControls {
  forward: boolean;
  backward: boolean;
}

export function useForwardBackwardControls(): ForwardBackwardControls {
  const [keys, setKeys] = useState<ForwardBackwardControls>({
    forward: false,
    backward: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          e.preventDefault();
          setKeys((prev) => ({ ...prev, forward: true }));
          break;
        case 's':
          e.preventDefault();
          setKeys((prev) => ({ ...prev, backward: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys((prev) => ({ ...prev, forward: false }));
          break;
        case 's':
          setKeys((prev) => ({ ...prev, backward: false }));
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

  return keys;
}
