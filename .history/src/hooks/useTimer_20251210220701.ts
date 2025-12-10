import { useState, useEffect, useRef } from 'react';

export const useTimer = (duration: number, onTimeout: () => void) => {
  const [seconds, setSeconds] = useState(duration);
  const timeoutCallback = useRef(onTimeout);

  // Cập nhật ref khi callback thay đổi
  useEffect(() => {
    timeoutCallback.current = onTimeout;
  }, [onTimeout]);

  // Tự động reset khi prop 'duration' thay đổi (Logic cũ của bạn - Rất tốt)
  useEffect(() => {
    setSeconds(duration);
  }, [duration]);

  // Logic đếm ngược
  useEffect(() => {
    if (seconds <= 0) return;

    const intervalId = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalId);
          timeoutCallback.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [seconds]); // Sửa dependency thành seconds để timer chạy mượt hơn khi reset

  // --- HÀM MỚI: Cho phép reset thủ công từ bên ngoài ---
  const resetTimer = (newSeconds: number) => {
    setSeconds(newSeconds);
  };

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return {
    displayTime: `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`,
    seconds,
    resetTimer, // <--- BẮT BUỘC PHẢI RETURN HÀM NÀY
  };
};