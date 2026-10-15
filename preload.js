const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aquaBuddyAPI', {
  // Triggers & Actions
  respondWaterDrank: () => ipcRenderer.send('MASCOT_WATER_DRANK'),
  respondRemindLater: () => ipcRenderer.send('MASCOT_REMIND_LATER'),
  respondWalkCompleted: () => ipcRenderer.send('MASCOT_WALK_COMPLETED'),
  respondWalkDeclined: () => ipcRenderer.send('MASCOT_WALK_DECLINED'),
  closeOverlay: () => ipcRenderer.send('MASCOT_CLOSE_OVERLAY'),
  triggerTestWalk: () => ipcRenderer.send('TRIGGER_TEST_WALK'),
  triggerTestWalkReminder: () => ipcRenderer.send('TRIGGER_TEST_WALK_REMINDER'),
  
  // Settings & Status
  getAppStatus: () => ipcRenderer.invoke('GET_APP_STATUS'),
  saveSettings: (settings) => ipcRenderer.invoke('SAVE_SETTINGS', settings),
  resetTodayStats: () => ipcRenderer.invoke('RESET_TODAY_STATS'),
  
  // Events
  onStartWalk: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('START_MASCOT_WALK', subscription);
    return () => ipcRenderer.removeListener('START_MASCOT_WALK', subscription);
  },
  onStartWalkReminder: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('START_WALK_REMINDER', subscription);
    return () => ipcRenderer.removeListener('START_WALK_REMINDER', subscription);
  },
  onSettingsUpdated: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('SETTINGS_UPDATED', subscription);
    return () => ipcRenderer.removeListener('SETTINGS_UPDATED', subscription);
  }
});
