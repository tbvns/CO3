// react-native-background-actions mock for Electron/web
// Background tasks don't exist in this context — all calls are silent no-ops

const BackgroundService = {
  start: async (task, options) => {
    // Just run the task directly in the foreground
    try {
      await task({ delay: options?.taskParameters?.delay ?? 1000 });
    } catch (e) {
      console.warn('[BackgroundService mock] task threw:', e);
    }
  },
  stop: async () => {},
  updateNotification: async () => {},
  isRunning: () => false,
  on: () => {},
  off: () => {},
};

export default BackgroundService;
