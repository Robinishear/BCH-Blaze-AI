import { startDevtoolsWatch } from "./devtools";
import { startListeners } from "./listeners";

// Starts all listeners at once and returns a single function to stop them
export const startTracking = (): (() => void) => {
  const stopListeners = startListeners();
  const stopDevtools = startDevtoolsWatch();
  return () => {
    stopListeners();
    stopDevtools();
  };
};