// AquaBuddy - Background Service Worker (Manifest V3)

const ALARM_NAME = 'WATER_REMINDER_ALARM';
const DEFAULT_INTERVAL = 30; // minutes
const DEFAULT_SNOOZE = 10;   // minutes
const DEFAULT_GOAL = 8;      // glasses per day

// Initialize defaults on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[AquaBuddy] Extension installed/updated:', details.reason);
  const data = await chrome.storage.local.get(['settings', 'stats']);
  
  const todayKey = getTodayDateKey();
  const initialSettings = data.settings || {
    intervalMinutes: DEFAULT_INTERVAL,
    snoozeMinutes: DEFAULT_SNOOZE,
    dailyGoal: DEFAULT_GOAL,
    soundEnabled: true,
    animationSpeed: 'normal'
  };

  const initialStats = data.stats && data.stats.date === todayKey ? data.stats : {
    date: todayKey,
    count: 0,
    history: []
  };

  await chrome.storage.local.set({
    settings: initialSettings,
    stats: initialStats
  });

  scheduleAlarm(initialSettings.intervalMinutes);
});

// Reschedule alarm on startup
chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get(['settings']);
  const interval = data.settings?.intervalMinutes || DEFAULT_INTERVAL;
  const existingAlarm = await chrome.alarms.get(ALARM_NAME);
  if (!existingAlarm) {
    scheduleAlarm(interval);
  }
});

// Alarm event listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('[AquaBuddy] Water reminder alarm triggered!');
    triggerReminderInTabs();
  }
});

// Helper: schedule alarm
async function scheduleAlarm(minutes) {
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: minutes,
    periodInMinutes: minutes
  });
  console.log(`[AquaBuddy] Next reminder scheduled in ${minutes} minutes.`);
}

// Helper: get YYYY-MM-DD
function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Trigger reminder mascot across tabs
async function triggerReminderInTabs() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    let shownInTab = false;

    if (tabs && tabs.length > 0) {
      for (const tab of tabs) {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('chrome-extension://')) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              action: 'SHOW_WATER_REMINDER',
              timestamp: Date.now()
            });
            shownInTab = true;
            break;
          } catch (err) {
            console.warn(`[AquaBuddy] Failed to message tab ${tab.id}, injecting script directly...`, err);
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content/content.js']
              });
              await chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                files: ['content/content.css']
              });
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'SHOW_WATER_REMINDER',
                  timestamp: Date.now()
                }).catch(() => {});
              }, 200);
              shownInTab = true;
              break;
            } catch (injectErr) {
              console.warn('[AquaBuddy] Script injection also failed:', injectErr);
            }
          }
        }
      }
    }

    // Fallback system notification if not displayed inside tab
    if (!shownInTab) {
      chrome.notifications.create('water-reminder-toast', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'AquaBuddy: Time to Drink Water! 💧',
        message: 'Stay hydrated! Tap to record your water intake.',
        priority: 2,
        requireInteraction: true
      });
    }
  } catch (error) {
    console.error('[AquaBuddy] Error in triggerReminderInTabs:', error);
  }
}

// Handle notification click
chrome.notifications.onClicked.addListener(async (notifId) => {
  if (notifId === 'water-reminder-toast') {
    handleWaterDrank();
    chrome.notifications.clear(notifId);
  }
});

// Handle water drank logic
async function handleWaterDrank() {
  const data = await chrome.storage.local.get(['settings', 'stats']);
  const todayKey = getTodayDateKey();
  let stats = data.stats && data.stats.date === todayKey ? data.stats : {
    date: todayKey,
    count: 0,
    history: []
  };

  stats.count += 1;
  stats.history.push({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now()
  });

  await chrome.storage.local.set({ stats });

  // Reschedule to normal interval (30 min)
  const interval = data.settings?.intervalMinutes || DEFAULT_INTERVAL;
  scheduleAlarm(interval);

  return stats;
}

// Handle remind later (snooze) logic
async function handleRemindLater() {
  const data = await chrome.storage.local.get(['settings']);
  const snooze = data.settings?.snoozeMinutes || DEFAULT_SNOOZE;
  
  // Schedule snooze alarm for 10 minutes
  scheduleAlarm(snooze);
  console.log(`[AquaBuddy] Snoozed for ${snooze} minutes.`);
}

// Message handler from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[AquaBuddy] Received message:', message.action);

  if (message.action === 'YES_WATER_DRANK') {
    handleWaterDrank().then((stats) => {
      sendResponse({ success: true, stats });
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'REMIND_LATER') {
    handleRemindLater().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'TRIGGER_TEST') {
    triggerReminderInTabs().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'GET_STATUS') {
    (async () => {
      const data = await chrome.storage.local.get(['settings', 'stats']);
      const alarm = await chrome.alarms.get(ALARM_NAME);
      const todayKey = getTodayDateKey();
      const stats = data.stats && data.stats.date === todayKey ? data.stats : {
        date: todayKey,
        count: 0,
        history: []
      };

      sendResponse({
        settings: data.settings || {
          intervalMinutes: DEFAULT_INTERVAL,
          snoozeMinutes: DEFAULT_SNOOZE,
          dailyGoal: DEFAULT_GOAL,
          soundEnabled: true
        },
        stats,
        nextAlarmTime: alarm ? alarm.scheduledTime : null
      });
    })();
    return true;
  }

  if (message.action === 'UPDATE_SETTINGS') {
    (async () => {
      const newSettings = message.settings;
      await chrome.storage.local.set({ settings: newSettings });
      // Reschedule with new interval
      scheduleAlarm(newSettings.intervalMinutes || DEFAULT_INTERVAL);
      sendResponse({ success: true });
    })();
    return true;
  }
});
