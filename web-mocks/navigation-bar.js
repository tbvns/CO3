// react-native-system-navigation-bar mock for Electron/web
// Android-only API — all calls are silent no-ops

const NavigationBar = {
  setBarMode: async () => {},
  setBackgroundColorAsync: async () => {},
  setNavigationColor: async () => {},
  setNavigationBarColor: async () => {},
  setNavigationBarContrastEnforced: async () => {},
  hideNavigationBar: async () => {},
  showNavigationBar: async () => {},
  fullScreen: async () => {},
  immersive: async () => {},
  stickyImmersive: async () => {},
  navigationHide: async () => {},
  navigationShow: async () => {},
};

export default NavigationBar;
