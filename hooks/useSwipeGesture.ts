import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX = 110;

interface UseSwipeGestureReturn {
  swipeX: number;
  isSwiping: boolean;
  isRevealed: boolean;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  close: () => void;
}

/**
 * Hook for managing swipe gesture detection and animation
 * Useful for swipeable list items that reveal actions on swipe
 */
export function useSwipeGesture(): UseSwipeGestureReturn {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Detect horizontal vs vertical movement
    if (!isSwiping && Math.abs(deltaY) > Math.abs(deltaX)) return;
    
    if (deltaX < 0) {
      setIsSwiping(true);
      setSwipeX(Math.max(-SWIPE_MAX, isRevealed ? -SWIPE_MAX + Math.min(0, deltaX + SWIPE_MAX) : deltaX));
    } else if (isRevealed) {
      setSwipeX(Math.min(0, -SWIPE_MAX + deltaX));
    }
  };

  const handleTouchEnd = () => {
    const revealed = swipeX < -SWIPE_THRESHOLD;
    setIsRevealed(revealed);
    setSwipeX(revealed ? -SWIPE_MAX : 0);
    setIsSwiping(false);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const close = () => {
    setIsRevealed(false);
    setSwipeX(0);
  };

  return {
    swipeX,
    isSwiping,
    isRevealed,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    close,
  };
}
