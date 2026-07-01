const CookieManager = {
  set: async (url, cookie) => {
    return window.electronCookies.set(url, cookie.name, cookie.value);
  },
  get: async (url) => {
    return window.electronCookies.get(url);
  },
  getAll: async () => ({}),
  clearAll: async () => {
    return window.electronCookies.clearAll();
  },
  clearByName: async () => true,
  flush: async () => {},
  setFromResponse: async () => true,
  getFromResponse: async () => ({}),
};

export default CookieManager;