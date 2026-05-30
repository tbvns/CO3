export default {
  displayNotification: async (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || '', { body: notification.body });
    }
    return '';
  },
  requestPermission: async () => ({ status: 1 }),
  createChannel: async () => 'default',
  onBackgroundEvent: () => {},
  onForegroundEvent: () => () => {},
  EventType: {
    DISMISSED: 0,
    PRESS: 1,
    DELIVERED: 2,
  },
  AndroidImportance: {
    HIGH: 4,
  }
};