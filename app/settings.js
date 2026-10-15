// AquaBuddy - Settings Window Script

document.addEventListener('DOMContentLoaded', async () => {
  const scaleBadge = document.getElementById('scaleBadge');
  const previewMascot = document.getElementById('previewMascot');
  const scaleSlider = document.getElementById('scaleSlider');
  const sliderValue = document.getElementById('sliderValue');
  const presetButtons = document.querySelectorAll('.btn-preset');

  const charNameInput = document.getElementById('charNameInput');
  const btnResetName = document.getElementById('btnResetName');
  const intervalInput = document.getElementById('intervalInput');
  const snoozeInput = document.getElementById('snoozeInput');
  const goalInput = document.getElementById('goalInput');
  const soundCheck = document.getElementById('soundCheck');
  const autoStartCheck = document.getElementById('autoStartCheck');
  const statsCounter = document.getElementById('statsCounter');

  const walkIntervalInput = document.getElementById('walkIntervalInput');
  const walkGoalInput = document.getElementById('walkGoalInput');
  const walkReminderCheck = document.getElementById('walkReminderCheck');
  const cameraCheck = document.getElementById('cameraCheck');

  const btnSave = document.getElementById('btnSave');
  const btnResetStats = document.getElementById('btnResetStats');
  const btnTestWaterTop = document.getElementById('btnTestWaterTop');
  const btnTestWalkChairTop = document.getElementById('btnTestWalkChairTop');
  const btnTestWalkChairBottom = document.getElementById('btnTestWalkChairBottom');

  let currentScale = 1.4;
  let currentSizeName = 'Max Large';

  if (btnResetName && charNameInput) {
    btnResetName.addEventListener('click', () => {
      charNameInput.value = 'Leo & Fox';
    });
  }

  // Load existing status
  async function loadSettings() {
    if (!window.aquaBuddyAPI) return;
    const { settings, stats } = await window.aquaBuddyAPI.getAppStatus();

    if (charNameInput) {
      charNameInput.value = settings.characterName || 'Leo & Fox';
    }

    currentScale = Math.min(1.4, Math.max(0.8, settings.characterScale || 1.4));
    currentSizeName = settings.characterSize || 'Max Large';

    // Apply values to form
    scaleSlider.value = currentScale;
    updateSizeDisplay(currentScale);

    intervalInput.value = String(settings.intervalMinutes || 30);
    snoozeInput.value = String(settings.snoozeMinutes || 10);
    goalInput.value = String(settings.dailyGoal || 8);

    if (walkIntervalInput) walkIntervalInput.value = String(settings.walkIntervalMinutes || 45);
    if (walkGoalInput) walkGoalInput.value = String(settings.dailyWalkGoal || 4);
    if (walkReminderCheck) walkReminderCheck.checked = settings.walkReminderEnabled !== false;
    if (cameraCheck) cameraCheck.checked = settings.cameraCheckEnabled !== false;

    soundCheck.checked = settings.soundEnabled !== false;
    if (autoStartCheck) {
      autoStartCheck.checked = settings.autoStartOnBoot !== false;
    }

    // Update stats counter
    if (stats) {
      statsCounter.textContent = `${stats.count || 0} / ${settings.dailyGoal || 8} Glasses Drunk • ${stats.walkCount || 0} / ${settings.dailyWalkGoal || 4} Walks Taken`;
    }
  }

  function updateSizeDisplay(scale) {
    const clamped = Math.min(1.4, Math.max(0.8, scale));
    sliderValue.textContent = `${Number(clamped).toFixed(2)}x`;
    scaleBadge.textContent = `Scale: ${Number(clamped).toFixed(2)}x`;

    // Live preview scaling
    const normalizedPreviewScale = (clamped / 1.4);
    previewMascot.style.transform = `scale(${normalizedPreviewScale})`;

    // Update preset active button state
    presetButtons.forEach((btn) => {
      const btnScale = parseFloat(btn.dataset.scale);
      if (Math.abs(btnScale - clamped) < 0.05) {
        btn.classList.add('active');
        scaleBadge.textContent = `Scale: ${Number(clamped).toFixed(2)}x (${btn.dataset.name})`;
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Slider change
  scaleSlider.addEventListener('input', (e) => {
    currentScale = Math.min(1.4, Math.max(0.8, parseFloat(e.target.value)));
    updateSizeDisplay(currentScale);
  });

  // Preset button clicks
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentScale = Math.min(1.4, Math.max(0.8, parseFloat(btn.dataset.scale)));
      scaleSlider.value = currentScale;
      updateSizeDisplay(currentScale);
    });
  });

  // Save Settings
  btnSave.addEventListener('click', async () => {
    const updated = {
      characterName: (charNameInput ? charNameInput.value.trim() : '') || 'Leo & Fox',
      characterScale: Math.min(1.4, Math.max(0.8, currentScale)),
      intervalMinutes: parseInt(intervalInput.value, 10) || 30,
      snoozeMinutes: parseInt(snoozeInput.value, 10) || 10,
      dailyGoal: parseInt(goalInput.value, 10) || 8,
      walkIntervalMinutes: walkIntervalInput ? (parseInt(walkIntervalInput.value, 10) || 45) : 45,
      dailyWalkGoal: walkGoalInput ? (parseInt(walkGoalInput.value, 10) || 4) : 4,
      walkReminderEnabled: walkReminderCheck ? walkReminderCheck.checked : true,
      cameraCheckEnabled: cameraCheck ? cameraCheck.checked : true,
      soundEnabled: soundCheck.checked,
      autoStartOnBoot: autoStartCheck ? autoStartCheck.checked : true
    };

    if (window.aquaBuddyAPI) {
      await window.aquaBuddyAPI.saveSettings(updated);
      btnSave.textContent = 'Saved Successfully! ✓';
      setTimeout(() => {
        btnSave.textContent = 'Save Preferences';
      }, 1500);
    }
  });

  // Reset Today's Stats
  btnResetStats.addEventListener('click', async () => {
    if (confirm("Reset today's water and walk count to 0?")) {
      if (window.aquaBuddyAPI) {
        const res = await window.aquaBuddyAPI.resetTodayStats();
        if (res && res.stats) {
          statsCounter.textContent = `0 / ${goalInput.value} Glasses Drunk • 0 / ${walkGoalInput ? walkGoalInput.value : 4} Walks Taken`;
        }
      }
    }
  });

  // Test Actions
  if (btnTestWaterTop) {
    btnTestWaterTop.addEventListener('click', () => {
      if (window.aquaBuddyAPI) {
        window.aquaBuddyAPI.triggerTestWalk();
      }
    });
  }

  function runTestWalkReminder() {
    if (window.aquaBuddyAPI) {
      window.aquaBuddyAPI.triggerTestWalkReminder();
    }
  }

  if (btnTestWalkChairTop) {
    btnTestWalkChairTop.addEventListener('click', runTestWalkReminder);
  }
  if (btnTestWalkChairBottom) {
    btnTestWalkChairBottom.addEventListener('click', runTestWalkReminder);
  }

  // Listen to updates from other windows
  if (window.aquaBuddyAPI) {
    window.aquaBuddyAPI.onSettingsUpdated(({ settings, stats }) => {
      if (stats) {
        statsCounter.textContent = `${stats.count || 0} / ${settings.dailyGoal || 8} Glasses Drunk • ${stats.walkCount || 0} / ${settings.dailyWalkGoal || 4} Walks Taken`;
      }
    });
  }

  loadSettings();
});
