import { useState, useEffect, useRef } from 'react';

export const useTimer = (duration: number, onTimeout: () => void) => {
  const [seconds, setSeconds] = useState(duration);
  const timeoutCallback = useRef(onTimeout); // Use a ref to hold the callback

  // When the component re-renders with a new callback, update the ref
  useEffect(() => {
    timeoutCallback.current = onTimeout;
  }, [onTimeout]);

  // When the input duration changes, reset the timer state
  useEffect(() => {
    setSeconds(duration);
  }, [duration]);

  // The interval effect
  useEffect(() => {
    // Don't start the timer if the duration is not positive
    if (duration <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalId);
          timeoutCallback.current(); // Call the latest callback from the ref
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // The cleanup function clears the interval
    return () => clearInterval(intervalId);

  }, [duration]); // This effect should only re-run when the total duration changes

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return {
    displayTime: `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`,
    seconds,
  };
};