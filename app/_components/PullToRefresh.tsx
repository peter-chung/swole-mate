"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

type Props = {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
};

const PullToRefresh = ({ onRefresh, children, threshold = 80 }: Props) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshingRef.current) return;
      startYRef.current = e.touches[0]!.clientY;
      isPullingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return;
      const delta = e.touches[0]!.clientY - startYRef.current;
      if (delta <= 0) {
        isPullingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      // Rubber-band damping so it doesn't fly off-screen
      const distance = Math.min(delta * 0.4, threshold + 20);
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      const dist = pullDistanceRef.current;
      pullDistanceRef.current = 0;
      setPullDistance(0);

      if (dist >= threshold) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        try {
          await onRefreshRef.current();
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [threshold]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 8 || isRefreshing;

  return (
    <div>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: isRefreshing ? 48 : showIndicator ? pullDistance : 0 }}
      >
        {showIndicator && (
          <RefreshCw
            className={`h-5 w-5 text-[#3ecf8e] ${isRefreshing ? "animate-spin" : ""}`}
            style={!isRefreshing ? { transform: `rotate(${progress * 360}deg)` } : undefined}
          />
        )}
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
