import { useSyncExternalStore } from "react";

let listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;
let currentSecond = Date.now();

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (intervalId === null) {
    intervalId = setInterval(() => {
      currentSecond = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

const getSnapshot = () => currentSecond;

export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
