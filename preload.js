const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aquaBuddyAPI', {
  // Triggers & Actions
  respondWaterDrank: () => ipcRenderer.send('MASCOT_WATER_DRANK'),
  respondRemindLater: () => ipcRenderer.send('MASCOT_REMIND_LATER'),
  closeOverlay: () => ipcRenderer.send('MASCOT_CLOSE_OVERLAY'),
  triggerTestWalk: () => ipcRenderer.send('TRIGGER_TEST_WALK'),
  
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
  onSettingsUpdated: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('SETTINGS_UPDATED', subscription);
    return () => ipcRenderer.removeListener('SETTINGS_UPDATED', subscription);
  }
});
