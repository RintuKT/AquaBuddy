// AquaBuddy - Settings Window Script

document.addEventListener('DOMContentLoaded', async () => {
  const scaleBadge = document.getElementById('scaleBadge');
  const previewMascot = document.getElementById('previewMascot');
  const scaleSlider = document.getElementById('scaleSlider');
  const sliderValue = document.getElementById('sliderValue');
  const presetButtons = document.querySelectorAll('.btn-preset');

  const intervalInput = document.getElementById('intervalInput');
  const snoozeInput = document.getElementById('snoozeInput');
  const goalInput = document.getElementById('goalInput');
  const soundCheck = document.getElementById('soundCheck');
  const statsCounter = document.getElementById('statsCounter');

  const btnSave = document.getElementById('btnSave');
  const btnResetStats = document.getElementById('btnResetStats');
  const btnTestWalkTop = document.getElementById('btnTestWalkTop');

  let currentScale = 1.4;
  let currentSizeName = 'Large';

  // Load existing status
  async function loadSettings() {
    if (!window.aquaBuddyAPI) return;
    const { settings, stats } = await window.aquaBuddyAPI.getAppStatus();

    currentScale = settings.characterScale || 1.4;
    currentSizeName = settings.characterSize || 'large';

    // Apply values to form
    scaleSlider.value = currentScale;
    updateSizeDisplay(currentScale);

    intervalInput.value = String(settings.intervalMinutes || 30);
    snoozeInput.value = String(settings.snoozeMinutes || 10);
    goalInput.value = String(settings.dailyGoal || 8);
    soundCheck.checked = settings.soundEnabled !== false;

    // Update stats counter
    if (stats) {
      statsCounter.textContent = `${stats.count} / ${settings.dailyGoal || 8} Glasses Drunk`;
    }
  }

  function updateSizeDisplay(scale) {
    sliderValue.textContent = `${Number(scale).toFixed(1)}x`;
    scaleBadge.textContent = `Scale: ${Number(scale).toFixed(1)}x`;

    // Live preview scaling
    const normalizedPreviewScale = (scale / 1.4);
    previewMascot.style.transform = `scale(${normalizedPreviewScale})`;

    // Update preset active button state
    presetButtons.forEach((btn) => {
      const btnScale = parseFloat(btn.dataset.scale);
      if (Math.abs(btnScale - scale) < 0.05) {
        btn.classList.add('active');
        scaleBadge.textContent = `Scale: ${Number(scale).toFixed(1)}x (${btn.dataset.name})`;
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Slider change
  scaleSlider.addEventListener('input', (e) => {
    currentScale = parseFloat(e.target.value);
    updateSizeDisplay(currentScale);
  });

  // Preset button clicks
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentScale = parseFloat(btn.dataset.scale);
      scaleSlider.value = currentScale;
      updateSizeDisplay(currentScale);
    });
  });

  // Save Settings
  btnSave.addEventListener('click', async () => {
    const updated = {
      characterScale: currentScale,
      intervalMinutes: parseInt(intervalInput.value, 10),
      snoozeMinutes: parseInt(snoozeInput.value, 10),
      dailyGoal: parseInt(goalInput.value, 10) || 8,
      soundEnabled: soundCheck.checked
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
    if (confirm("Reset today's water count to 0?")) {
      if (window.aquaBuddyAPI) {
        const res = await window.aquaBuddyAPI.resetTodayStats();
        if (res && res.stats) {
          statsCounter.textContent = `0 / ${goalInput.value} Glasses Drunk`;
        }
      }
    }
  });

  // Test Walk Action
  btnTestWalkTop.addEventListener('click', () => {
    if (window.aquaBuddyAPI) {
      window.aquaBuddyAPI.triggerTestWalk();
    }
  });

  // Listen to updates from other windows
  if (window.aquaBuddyAPI) {
    window.aquaBuddyAPI.onSettingsUpdated(({ settings, stats }) => {
      if (stats) {
        statsCounter.textContent = `${stats.count} / ${settings.dailyGoal || 8} Glasses Drunk`;
      }
    });
  }

  loadSettings();
});
