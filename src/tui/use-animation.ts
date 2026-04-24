import { useState, useEffect } from "react";

export function useAnimation(frameCount: number, intervalMs: number = 500): number {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (frameCount <= 1) return;
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % frameCount);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [frameCount, intervalMs]);

  return frame;
}
