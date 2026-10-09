// AquaBuddy - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const timerCountdown = document.getElementById('timerCountdown');
  const timerSubtext = document.getElementById('timerSubtext');
  const glassCount = document.getElementById('glassCount');
  const glassGoal = document.getElementById('glassGoal');
  const metaPercentage = document.getElementById('metaPercentage');
  const progressRingBar = document.getElementById('progressRingBar');
  const btnQuickAdd = document.getElementById('btnQuickAdd');
  const btnTestReminder = document.getElementById('btnTestReminder');
  
  // Settings elements
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsBody = document.getElementById('settingsBody');
  const settingsChevron = document.getElementById('settingsChevron');
  const intervalSelect = document.getElementById('intervalSelect');
  const snoozeSelect = document.getElementById('snoozeSelect');
  const goalInput = document.getElementById('goalInput');
  const soundToggle = document.getElementById('soundToggle');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const btnResetStats = document.getElementById('btnResetStats');

  let nextAlarmTimestamp = null;
  let countdownInterval = null;
  const CIRCLE_CIRCUMFERENCE = 263.89; // 2 * PI * 42

  // Fetch status from background
  async function loadStatus() {
    chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
      if (!response) return;

      const { settings, stats, nextAlarmTime } = response;
      nextAlarmTimestamp = nextAlarmTime;

      // Update UI Stats
      updateStatsUI(stats.count, settings.dailyGoal);

      // Update Settings Form values
      intervalSelect.value = String(settings.intervalMinutes || 30);
      snoozeSelect.value = String(settings.snoozeMinutes || 10);
      goalInput.value = String(settings.dailyGoal || 8);
      soundToggle.checked = settings.soundEnabled !== false;
      timerSubtext.textContent = `Interval: Every ${settings.intervalMinutes || 30} mins`;

      // Start Countdown
      startCountdown();
    });
  }

  function updateStatsUI(count, goal) {
    glassCount.textContent = count;
    glassGoal.textContent = `/ ${goal}`;
    const percentage = Math.min(Math.round((count / goal) * 100), 100);
    metaPercentage.textContent = `${percentage}% of daily goal`;

    // Update Progress Ring
    const offset = CIRCLE_CIRCUMFERENCE - (percentage / 100) * CIRCLE_CIRCUMFERENCE;
    progressRingBar.style.strokeDashoffset = offset;
  }

  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    function tick() {
      if (!nextAlarmTimestamp) {
        timerCountdown.textContent = '30:00';
        return;
      }

      const now = Date.now();
      const diff = Math.max(0, nextAlarmTimestamp - now);
      
      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      timerCountdown.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (diff <= 0) {
        timerCountdown.textContent = '00:00';
      }
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  // Quick Add Button
  btnQuickAdd.addEventListener('click', () => {
    btnQuickAdd.disabled = true;
    chrome.runtime.sendMessage({ action: 'YES_WATER_DRANK' }, (res) => {
      btnQuickAdd.disabled = false;
      if (res && res.stats) {
        loadStatus();
      }
    });
  });

  // Test Reminder Button
  btnTestReminder.addEventListener('click', async () => {
    btnTestReminder.disabled = true;
    btnTestReminder.innerHTML = '<span>🚀 Triggered! Check your screen</span>';

    chrome.runtime.sendMessage({ action: 'TRIGGER_TEST' }, () => {
      setTimeout(() => {
        btnTestReminder.disabled = false;
        btnTestReminder.innerHTML = '<span class="icon">✨</span><span>Test Mascot Animation</span>';
      }, 2000);
    });
  });

  // Settings Accordion Toggle
  settingsToggle.addEventListener('click', () => {
    const isShowing = settingsBody.classList.toggle('show');
    settingsChevron.classList.toggle('open', isShowing);
  });

  // Save Settings
  btnSaveSettings.addEventListener('click', () => {
    const updated = {
      intervalMinutes: parseInt(intervalSelect.value, 10),
      snoozeMinutes: parseInt(snoozeSelect.value, 10),
      dailyGoal: parseInt(goalInput.value, 10) || 8,
      soundEnabled: soundToggle.checked
    };

    chrome.runtime.sendMessage({ action: 'UPDATE_SETTINGS', settings: updated }, () => {
      btnSaveSettings.textContent = 'Saved! ✓';
      setTimeout(() => {
        btnSaveSettings.textContent = 'Save Settings';
        loadStatus();
      }, 1200);
    });
  });

  // Reset Stats
  btnResetStats.addEventListener('click', async () => {
    if (confirm('Reset today\'s water count back to 0?')) {
      const d = new Date();
      const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      await chrome.storage.local.set({
        stats: { date: todayKey, count: 0, history: [] }
      });
      loadStatus();
    }
  });

  // Initial load
  loadStatus();
});
