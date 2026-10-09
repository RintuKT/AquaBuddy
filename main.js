// AquaBuddy - Electron Main Process (Mac & Windows Desktop App)
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let tray = null;
let overlayWindow = null;
let settingsWindow = null;
let reminderTimer = null;
let nextAlarmTimestamp = null;

const DEFAULT_SETTINGS = {
  intervalMinutes: 30,
  snoozeMinutes: 10,
  dailyGoal: 8,
  characterSize: 'large', // 'small' (120px), 'medium' (170px), 'large' (220px), 'xlarge' (280px)
  characterScale: 1.3,
  soundEnabled: true,
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
    stats: { date: todayKey, count: 0, history: [] }
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

// App ready
app.whenReady().then(() => {
  createOverlayWindow();
  createTray();
  scheduleNextReminder(appData.settings.intervalMinutes);

  // Trigger mascot walk on startup for immediate desktop preview
  setTimeout(() => {
    triggerMascotWalk();
  }, 1000);

  // Show settings window on first launch or open tray
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
    }
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
  const overlayHeight = 440;
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
    focusable: true,
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
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
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
  const iconPath = path.join(__dirname, 'icons', 'icon16.png');
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('AquaBuddy - Water Drink Reminder');

  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;

  const todayKey = getTodayDateKey();
  if (appData.stats.date !== todayKey) {
    appData.stats = { date: todayKey, count: 0, history: [] };
    saveData(appData);
  }

  const remainingMins = nextAlarmTimestamp 
    ? Math.max(0, Math.ceil((nextAlarmTimestamp - Date.now()) / (1000 * 60))) 
    : appData.settings.intervalMinutes;

  const contextMenu = Menu.buildFromTemplate([
    { label: '💧 AquaBuddy Water Reminder', enabled: false },
    { label: `⏱️ Next reminder in: ~${remainingMins} min`, enabled: false },
    { label: `📊 Today: ${appData.stats.count} / ${appData.settings.dailyGoal} glasses`, enabled: false },
    { type: 'separator' },
    {
      label: '🚶 Test Walking Mascot Animation',
      click: () => triggerMascotWalk()
    },
    {
      label: '➕ Quick Log 1 Glass',
      click: () => {
        handleWaterDrank();
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
  console.log(`[AquaBuddy] Next walking mascot reminder scheduled in ${minutes} minutes.`);
  updateTrayMenu();

  reminderTimer = setTimeout(() => {
    triggerMascotWalk();
  }, minutes * 60 * 1000);
}

function triggerMascotWalk() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
  }

  // Adjust window width in case display changed
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const overlayHeight = 360;
  overlayWindow.setBounds({
    x: 0,
    y: height - overlayHeight,
    width: width,
    height: overlayHeight
  });

  overlayWindow.show();
  overlayWindow.webContents.send('START_MASCOT_WALK', {
    settings: appData.settings,
    stats: appData.stats
  });
}

// 5. Handle user actions from Mascot Overlay
function handleWaterDrank() {
  const todayKey = getTodayDateKey();
  if (appData.stats.date !== todayKey) {
    appData.stats = { date: todayKey, count: 0, history: [] };
  }

  appData.stats.count += 1;
  appData.stats.history.push({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now()
  });

  saveData(appData);
  updateTrayMenu();

  // Reset to standard 30 minutes gap
  scheduleNextReminder(appData.settings.intervalMinutes);
  return appData.stats;
}

function handleRemindLater() {
  // Snooze for 10 minutes (or custom snooze setting)
  const snooze = appData.settings.snoozeMinutes || 10;
  scheduleNextReminder(snooze);
  console.log(`[AquaBuddy] Snoozed. Character will walk out again in ${snooze} minutes.`);
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

ipcMain.on('MASCOT_CLOSE_OVERLAY', () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.hide();
  }
});

ipcMain.on('TRIGGER_TEST_WALK', () => {
  triggerMascotWalk();
});

ipcMain.handle('GET_APP_STATUS', () => {
  const todayKey = getTodayDateKey();
  if (appData.stats.date !== todayKey) {
    appData.stats = { date: todayKey, count: 0, history: [] };
    saveData(appData);
  }
  return {
    settings: appData.settings,
    stats: appData.stats,
    nextAlarmTimestamp
  };
});

ipcMain.handle('SAVE_SETTINGS', (event, newSettings) => {
  appData.settings = { ...appData.settings, ...newSettings };
  saveData(appData);
  updateTrayMenu();
  scheduleNextReminder(appData.settings.intervalMinutes);
  return { success: true, settings: appData.settings };
});

ipcMain.handle('RESET_TODAY_STATS', () => {
  const todayKey = getTodayDateKey();
  appData.stats = { date: todayKey, count: 0, history: [] };
  saveData(appData);
  updateTrayMenu();
  return { success: true, stats: appData.stats };
});
