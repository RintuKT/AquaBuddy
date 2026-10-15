// AquaBuddy - Electron Main Process (Mac & Windows Desktop App)
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let tray = null;
let overlayWindow = null;
let settingsWindow = null;
let reminderTimer = null;
let walkReminderTimer = null;
let nextAlarmTimestamp = null;
let nextWalkAlarmTimestamp = null;

const DEFAULT_SETTINGS = {
  characterName: 'Leo & Fox',
  intervalMinutes: 30,
  walkIntervalMinutes: 45,
  walkReminderEnabled: true,
  cameraCheckEnabled: true,
  snoozeMinutes: 10,
  dailyGoal: 8,
  dailyWalkGoal: 4,
  characterSize: 'Max Large',
  characterScale: 1.4,
  soundEnabled: true,
  autoStartOnBoot: true,
  walkSpeed: 'normal'
};

// Data persistence
function getStoragePath() {
  const userData = app.getPath('userData');
  return path.join(userData, 'aquabuddy-data.json');
}

function loadData() {
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading data:', err);
  }

  const todayKey = getTodayDateKey();
  return {
    settings: { ...DEFAULT_SETTINGS },
    stats: { date: todayKey, count: 0, walkCount: 0, history: [] }
  };
}

function saveData(data) {
  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let appData = loadData();

// Auto-launch / Startup configuration
function applyAutoLaunch(enabled = true) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true
    });
    console.log(`[AquaBuddy] Auto-start on boot configured: ${enabled}`);
  } catch (err) {
    console.error('[AquaBuddy] Error setting login item:', err);
  }
}

// App ready
app.whenReady().then(() => {
  // On macOS, running as an accessory menu bar item prevents Mission Control / Spaces from switching
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }

  applyAutoLaunch(appData.settings.autoStartOnBoot !== false);
  createOverlayWindow();
  createTray();
  scheduleNextReminder(appData.settings.intervalMinutes);
  if (appData.settings.walkReminderEnabled !== false) {
    scheduleNextWalkReminder(appData.settings.walkIntervalMinutes || 45);
  }

  // Trigger mascot walk on startup for immediate desktop preview
  setTimeout(() => {
    triggerMascotWalk();
  }, 1000);

  // Automatically open settings window in dev/test mode so user can test immediately
  if (process.argv.includes('--show-settings') || !app.isPackaged) {
    setTimeout(() => {
      openSettingsWindow();
    }, 400);
  }

  // Show settings window on first launch or open tray
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
    }
    openSettingsWindow();
  });
});

// Avoid app termination when all windows close (keep running in tray)
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

// 1. Desktop Walking Mascot Overlay Window
function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Window spans across bottom area of screen so mascot can walk across smoothly
  const overlayHeight = 520;
  const overlayY = height - overlayHeight;

  overlayWindow = new BrowserWindow({
    width: width,
    height: overlayHeight,
    x: 0,
    y: overlayY,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false, // Prevents stealing window focus and avoids space switching on macOS
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Cross-platform always on top configuration
  if (process.platform === 'darwin') {
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
    overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  } else {
    overlayWindow.setAlwaysOnTop(true, 'topmost');
  }

  overlayWindow.loadFile(path.join(__dirname, 'app', 'overlay.html'));

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

// 2. Settings & Preferences Window
function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 640,
    title: 'AquaBuddy Preferences & Character Size',
    resizable: false,
    maximizable: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'app', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// 3. System Tray Menu
function createTray() {
  const trayIconPath = path.join(__dirname, 'icons', 'tray-icon.png');
  const fallbackPath = path.join(__dirname, 'icons', 'icon16.png');
  const iconPath = fs.existsSync(trayIconPath) ? trayIconPath : fallbackPath;

  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (process.platform === 'darwin') {
      trayIcon = trayIcon.resize({ width: 26, height: 18 });
    }
  } else {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('AquaBuddy - Leo & Fox Hydration Reminder');

  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;

  const charName = appData.settings.characterName || 'Leo & Fox';
  tray.setToolTip(`AquaBuddy - ${charName} Hydration & Walk Reminder`);

  const todayKey = getTodayDateKey();
  if (appData.stats.date !== todayKey) {
    appData.stats = { date: todayKey, count: 0, walkCount: 0, history: [] };
    saveData(appData);
  }

  const remainingMins = nextAlarmTimestamp 
    ? Math.max(0, Math.ceil((nextAlarmTimestamp - Date.now()) / (1000 * 60))) 
    : appData.settings.intervalMinutes;

  const remainingWalkMins = nextWalkAlarmTimestamp 
    ? Math.max(0, Math.ceil((nextWalkAlarmTimestamp - Date.now()) / (1000 * 60))) 
    : (appData.settings.walkIntervalMinutes || 45);

  const contextMenu = Menu.buildFromTemplate([
    { label: `💧 ${charName} Hydration & Activity`, enabled: false },
    { label: `⏱️ Next Water Reminder: ~${remainingMins} min`, enabled: false },
    { label: `🚶 Next Walk Reminder: ~${remainingWalkMins} min`, enabled: false },
    { label: `📊 Today: ${appData.stats.count}/${appData.settings.dailyGoal} glasses • ${appData.stats.walkCount || 0}/${appData.settings.dailyWalkGoal || 4} walks`, enabled: false },
    { type: 'separator' },
    {
      label: '🪑 Test Walk Reminder (Right Entry & Chair)',
      click: () => triggerWalkReminder()
    },
    {
      label: '💧 Test Water Reminder (Left Entry)',
      click: () => triggerMascotWalk()
    },
    {
      label: '➕ Quick Log 1 Glass',
      click: () => {
        handleWaterDrank();
      }
    },
    {
      label: '🚶 Quick Log 1 Walk',
      click: () => {
        handleWalkCompleted();
      }
    },
    {
      label: '⚙️ Preferences & Character Size...',
      click: () => openSettingsWindow()
    },
    { type: 'separator' },
    {
      label: 'Quit AquaBuddy',
      click: () => {
        app.exit(0);
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// 4. Timer and Reminder Triggering
function scheduleNextReminder(minutes) {
  if (reminderTimer) clearTimeout(reminderTimer);
  
  nextAlarmTimestamp = Date.now() + minutes * 60 * 1000;
  console.log(`[AquaBuddy] Next water reminder scheduled in ${minutes} minutes.`);
  updateTrayMenu();

  reminderTimer = setTimeout(() => {
    triggerMascotWalk();
  }, minutes * 60 * 1000);
}

function scheduleNextWalkReminder(minutes) {
  if (walkReminderTimer) clearTimeout(walkReminderTimer);
  
  if (appData.settings.walkReminderEnabled === false) {
    nextWalkAlarmTimestamp = null;
    updateTrayMenu();
    return;
  }

  nextWalkAlarmTimestamp = Date.now() + minutes * 60 * 1000;
  console.log(`[AquaBuddy] Next take-a-walk reminder scheduled in ${minutes} minutes.`);
  updateTrayMenu();

  walkReminderTimer = setTimeout(() => {
    triggerWalkReminder();
  }, minutes * 60 * 1000);
}

function sendToOverlay(channel, payload) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const overlayHeight = 520;
  overlayWindow.setBounds({
    x: 0,
    y: height - overlayHeight,
    width: width,
    height: overlayHeight
  });

  if (process.platform === 'darwin') {
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
    overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  }

  overlayWindow.showInactive();

  const doSend = () => {
    try {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send(channel, payload);
      }
    } catch (err) {
      console.error(`[AquaBuddy] Error sending ${channel} to overlay:`, err);
    }
  };

  if (overlayWindow.webContents.isLoading()) {
    overlayWindow.webContents.once('did-finish-load', doSend);
  } else {
    doSend();
  }
}

function triggerMascotWalk() {
  sendToOverlay('START_MASCOT_WALK', {
    settings: appData.settings,
    stats: appData.stats
  });
}

function triggerWalkReminder() {
  sendToOverlay('START_WALK_REMINDER', {
    settings: appData.settings,
    stats: appData.stats
  });
}

// 5. Handle user actions from Mascot Overlay
function handleWaterDrank() {
  const todayKey = getTodayDateKey();
  if (appData.stats.date !== todayKey) {
    appData.stats = { date: todayKey, count: 0, walkCount: 0, history: [] };
  }

  appData.stats.count += 1;
  appData.stats.history.push({
    type: 'water',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now()
  });

  saveData(appData);
  updateTrayMenu();
  scheduleNextReminder(appData.settings.intervalMinutes);
  return appData.stats;
}

function handleWalkCompleted() {
  const todayKey = getTodayDateKey();
  if (appData.stats.date !== todayKey) {
    appData.stats = { date: todayKey, count: 0, walkCount: 0, history: [] };
  }

  appData.stats.walkCount = (appData.stats.walkCount || 0) + 1;
  appData.stats.history.push({
    type: 'walk',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now()
  });

  saveData(appData);
  updateTrayMenu();
  scheduleNextWalkReminder(appData.settings.walkIntervalMinutes || 45);
  return appData.stats;
}

function handleRemindLater() {
  const snooze = appData.settings.snoozeMinutes || 10;
  scheduleNextReminder(snooze);
  console.log(`[AquaBuddy] Water snoozed. Character will walk out again in ${snooze} minutes.`);
}

function handleWalkLater() {
  const snooze = appData.settings.snoozeMinutes || 10;
  scheduleNextWalkReminder(snooze);
  console.log(`[AquaBuddy] Walk snoozed. Character will appear with chair again in ${snooze} minutes.`);
}

// IPC Handlers
ipcMain.on('MASCOT_WATER_DRANK', () => {
  const updatedStats = handleWaterDrank();
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('SETTINGS_UPDATED', { settings: appData.settings, stats: updatedStats });
  }
});

ipcMain.on('MASCOT_REMIND_LATER', () => {
  handleRemindLater();
});

ipcMain.on('MASCOT_WALK_COMPLETED', () => {
  const updatedStats = handleWalkCompleted();
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('SETTINGS_UPDATED', { settings: appData.settings, stats: updatedStats });
  }
});

ipcMain.on('MASCOT_WALK_DECLINED', () => {
  handleWalkLater();
});

ipcMain.on('MASCOT_CLOSE_OVERLAY', () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.hide();
  }
});

ipcMain.on('TRIGGER_TEST_WALK', () => {
  triggerMascotWalk();
});

ipcMain.on('TRIGGER_TEST_WALK_REMINDER', () => {
  triggerWalkReminder();
});

ipcMain.handle('GET_APP_STATUS', () => {
  const todayKey = getTodayDateKey();
  if (appData.stats.date !== todayKey) {
    appData.stats = { date: todayKey, count: 0, walkCount: 0, history: [] };
    saveData(appData);
  }
  return {
    settings: appData.settings,
    stats: appData.stats,
    nextAlarmTimestamp,
    nextWalkAlarmTimestamp
  };
});

ipcMain.handle('SAVE_SETTINGS', (event, newSettings) => {
  appData.settings = { ...appData.settings, ...newSettings };
  if (typeof newSettings.autoStartOnBoot === 'boolean') {
    applyAutoLaunch(newSettings.autoStartOnBoot);
  }
  saveData(appData);
  updateTrayMenu();
  scheduleNextReminder(appData.settings.intervalMinutes);
  if (appData.settings.walkReminderEnabled !== false) {
    scheduleNextWalkReminder(appData.settings.walkIntervalMinutes || 45);
  } else if (walkReminderTimer) {
    clearTimeout(walkReminderTimer);
    walkReminderTimer = null;
    nextWalkAlarmTimestamp = null;
    updateTrayMenu();
  }
  return { success: true, settings: appData.settings };
});

ipcMain.handle('RESET_TODAY_STATS', () => {
  const todayKey = getTodayDateKey();
  appData.stats = { date: todayKey, count: 0, walkCount: 0, history: [] };
  saveData(appData);
  updateTrayMenu();
  return { success: true, stats: appData.stats };
});
