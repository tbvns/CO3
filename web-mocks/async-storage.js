// @react-native-async-storage/async-storage mock for Electron/web
// Delegates to localStorage — synchronous under the hood but wrapped in promises
// to match the AsyncStorage API contract

const AsyncStorage = {
  getItem: async (key) => localStorage.getItem(key),

  setItem: async (key, value) => {
    localStorage.setItem(key, value);
  },

  removeItem: async (key) => {
    localStorage.removeItem(key);
  },

  mergeItem: async (key, value) => {
    const existing = localStorage.getItem(key);
    const merged = existing
      ? JSON.stringify({ ...JSON.parse(existing), ...JSON.parse(value) })
      : value;
    localStorage.setItem(key, merged);
  },

  clear: async () => localStorage.clear(),

  getAllKeys: async () => Object.keys(localStorage),

  multiGet: async (keys) => keys.map(k => [k, localStorage.getItem(k)]),

  multiSet: async (pairs) => pairs.forEach(([k, v]) => localStorage.setItem(k, v)),

  multiRemove: async (keys) => keys.forEach(k => localStorage.removeItem(k)),

  multiMerge: async (pairs) => {
    pairs.forEach(([key, value]) => {
      const existing = localStorage.getItem(key);
      const merged = existing
        ? JSON.stringify({ ...JSON.parse(existing), ...JSON.parse(value) })
        : value;
      localStorage.setItem(key, merged);
    });
  },

  flushGetRequests: () => {},
};

export default AsyncStorage;
