import { useCallback, useEffect, useRef } from "react";

const DELAY = 400;
const SLOP = 10;

export function useLongPress(onLongPress: () => void) {
  const timer = useRef<number>(0);
  const origin = useRef({ x: 0, y: 0 });

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = 0;
  }, []);

  useEffect(() => cancel, [cancel]);

  return {
    onPointerDown(e: React.PointerEvent) {
      // Only trigger if we're on a touchscreen
      if (e.pointerType !== "touch") return;

      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        timer.current = 0;
        onLongPress();
      }, DELAY);
    },
    onPointerMove(e: React.PointerEvent) {
      // Abort if the user moves more than 10px -> Scrolling motion
      if (!timer.current) return;
      if (
        Math.abs(e.clientX - origin.current.x) > SLOP ||
        Math.abs(e.clientY - origin.current.y) > SLOP
      )
        cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
  };
}
