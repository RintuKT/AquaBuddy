// AquaBuddy - Desktop Mascot Overlay Script
// Dual 3D Engine: Hydration Reminder (Left Entry) & Walk Routine (Right Entry with Chair)

// Stage Elements
const overlayStage = document.getElementById('overlayStage');
const screenImpactOverlay = document.getElementById('screenImpactOverlay');

// 1. Water Reminder Elements
const actorUnit = document.getElementById('actorUnit');
const mascotActor = document.getElementById('mascotActor');
const mascot3DBox = document.getElementById('mascot3DBox');
const speechToast = document.getElementById('speechToast');
const toastCloseBtn = document.getElementById('toastCloseBtn');
const btnYes = document.getElementById('btnYes');
const btnLater = document.getElementById('btnLater');
const stateQuestion = document.getElementById('stateQuestion');
const stateSuccess = document.getElementById('stateSuccess');
const stateSnooze = document.getElementById('stateSnooze');
const successGapText = document.getElementById('successGapText');
const snoozeGapText = document.getElementById('snoozeGapText');

// 2. Walk & Chair Reminder Elements
const actorUnitWalk = document.getElementById('actorUnitWalk');
const mascotActorWalk = document.getElementById('mascotActorWalk');
const mascot3DBoxWalk = document.getElementById('mascot3DBoxWalk');
const walkSpeechToast = document.getElementById('walkSpeechToast');
const walkToastCloseBtn = document.getElementById('walkToastCloseBtn');
const walkStateQuestion = document.getElementById('walkStateQuestion');
const walkStateSuccess = document.getElementById('walkStateSuccess');
const walkStateThrow = document.getElementById('walkStateThrow');
const btnWalkYes = document.getElementById('btnWalkYes');
const btnWalkNo = document.getElementById('btnWalkNo');
const btnWalkYesLabel = document.getElementById('btnWalkYesLabel');
const cameraBadge = document.getElementById('cameraBadge');
const camStatusText = document.getElementById('camStatusText');
const camCountdownTag = document.getElementById('camCountdownTag');

let soundEnabled = true;
let currentIntervalMinutes = 30;
let currentSnoozeMinutes = 10;
let character3D = null;
let walkChair3D = null;
let cameraLockTimer = null;

// Sound Synthesizer (Realistic Procedural Audio)
function playSound(type) {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
    } else if (type === 'chairThud') {
      // Deep wooden thud when chair is set down
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.23);
    } else if (type === 'chairWhoosh') {
      // Whoosh sound as chair is launched
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } else if (type === 'chairCrash') {
      // Violent glass and wood crash impact
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(220, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.45);
      osc2.frequency.setValueAtTime(90, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.65, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.56);
      osc2.stop(ctx.currentTime + 0.56);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.39);
      });
    } else if (type === 'unlock') {
      // Pleasant unlock chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } else if (type === 'crying') {
      const notes = [440, 415.3, 392, 349.23];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.32);
      });
    }
  } catch (e) {
    console.log('[AquaBuddy] Audio error:', e);
  }
}

// ============================================================================
// ATTENTION LOCK (2-Second Focus Countdown - No Camera Needed)
// ============================================================================
function startCameraAttentionLock(onUnlock) {
  if (cameraLockTimer) clearInterval(cameraLockTimer);

  let remainingMs = 2000;

  // Lock buttons initially
  btnWalkYes.classList.add('is-locked');
  btnWalkYes.disabled = true;
  btnWalkNo.classList.add('is-locked');
  btnWalkNo.disabled = true;

  if (cameraBadge) cameraBadge.classList.remove('face-detected');
  if (camStatusText) camStatusText.textContent = 'Stretch & Take a Walk';
  if (camCountdownTag) camCountdownTag.textContent = '2.0s';
  if (btnWalkYesLabel) btnWalkYesLabel.textContent = "Yes, I'll walk! (2s)";

  // 100ms interval countdown
  cameraLockTimer = setInterval(() => {
    remainingMs -= 100;
    const sec = Math.max(0, (remainingMs / 1000)).toFixed(1);
    if (camCountdownTag) camCountdownTag.textContent = `${sec}s`;
    if (btnWalkYesLabel) btnWalkYesLabel.textContent = `Yes, I'll walk! (${Math.ceil(remainingMs / 1000)}s)`;

    if (remainingMs <= 0) {
      clearInterval(cameraLockTimer);
      cameraLockTimer = null;

      // Unlock buttons!
      btnWalkYes.classList.remove('is-locked');
      btnWalkYes.disabled = false;
      btnWalkNo.classList.remove('is-locked');
      btnWalkNo.disabled = false;

      if (btnWalkYesLabel) btnWalkYesLabel.textContent = "Yes, I'll take a walk!";
      if (camCountdownTag) camCountdownTag.textContent = '✓ Ready';
      if (cameraBadge) cameraBadge.classList.add('face-detected');
      playSound('unlock');

      if (typeof onUnlock === 'function') {
        onUnlock();
      }
    }
  }, 100);
}

function stopCameraStream() {
  if (cameraLockTimer) {
    clearInterval(cameraLockTimer);
    cameraLockTimer = null;
  }
}

// ============================================================================
// 1. WATER REMINDER SEQUENCE (LEFT ENTRY)
// ============================================================================
function startWalkingSequence(data) {
  stopCameraStream();
  if (walkChair3D) {
    walkChair3D.destroy();
    walkChair3D = null;
  }
  if (actorUnitWalk) actorUnitWalk.style.display = 'none';
  if (actorUnit) actorUnit.style.display = 'flex';

  const settings = data?.settings || {};
  soundEnabled = settings.soundEnabled !== false;
  currentIntervalMinutes = settings.intervalMinutes || 30;
  currentSnoozeMinutes = settings.snoozeMinutes || 10;

  if (successGapText) successGapText.textContent = `${currentIntervalMinutes} minutes`;
  if (snoozeGapText) snoozeGapText.textContent = `${currentSnoozeMinutes} minutes`;

  const charName = settings.characterName || 'Leo & Fox';
  const charNameEl = document.getElementById('charNameDisplay');
  if (charNameEl) charNameEl.textContent = charName;

  const scale = Math.min(1.4, Math.max(0.8, settings.characterScale || 1.4));
  document.documentElement.style.setProperty('--mascot-scale', scale);

  speechToast.classList.remove('show-toast', 'hide-toast');
  stateQuestion.style.display = 'block';
  stateSuccess.style.display = 'none';
  stateSnooze.style.display = 'none';

  actorUnit.className = 'actor-unit is-walking';

  if (character3D) {
    character3D.destroy();
    character3D = null;
  }

  const CharEngine = typeof window.AquaBuddy3DCharacter === 'function'
    ? window.AquaBuddy3DCharacter
    : window.AquaBuddy3DCharacter?.AquaBuddy3DCharacter;

  if (CharEngine && mascot3DBox) {
    character3D = new CharEngine({
      container: mascot3DBox,
      width: Math.round(200 * scale),
      height: Math.round(260 * scale),
      onBottleRaised: () => {
        playSound('pop');
        speechToast.classList.add('show-toast');
      }
    });
  }
}

function walkOutToLeft() {
  speechToast.classList.remove('show-toast');
  speechToast.classList.add('hide-toast');

  if (character3D) {
    character3D.triggerWalkOut(() => {
      if (window.aquaBuddyAPI) window.aquaBuddyAPI.closeOverlay();
    });
  } else {
    setTimeout(() => {
      if (window.aquaBuddyAPI) window.aquaBuddyAPI.closeOverlay();
    }, 2800);
  }
}

btnYes.addEventListener('click', () => {
  playSound('success');
  if (character3D) character3D.triggerCelebrate();

  stateQuestion.style.display = 'none';
  stateSuccess.style.display = 'block';

  if (window.aquaBuddyAPI) window.aquaBuddyAPI.respondWaterDrank();

  setTimeout(() => {
    walkOutToLeft();
  }, 1800);
});

btnLater.addEventListener('click', () => {
  playSound('crying');
  if (character3D) character3D.triggerCrying();

  stateQuestion.style.display = 'none';
  stateSnooze.style.display = 'block';

  if (window.aquaBuddyAPI) window.aquaBuddyAPI.respondRemindLater();

  setTimeout(() => {
    walkOutToLeft();
  }, 1800);
});

toastCloseBtn.addEventListener('click', () => {
  if (window.aquaBuddyAPI) window.aquaBuddyAPI.respondRemindLater();
  walkOutToLeft();
});

// ============================================================================
// 2. TAKE A WALK REMINDER SEQUENCE (RIGHT ENTRY, SITS CENTER WITH CHAIR)
// ============================================================================
function startWalkReminderSequence(data) {
  stopCameraStream();
  if (character3D) {
    character3D.destroy();
    character3D = null;
  }
  if (actorUnit) actorUnit.style.display = 'none';
  if (actorUnitWalk) actorUnitWalk.style.display = 'flex';

  const settings = data?.settings || {};
  soundEnabled = settings.soundEnabled !== false;

  const charName = settings.characterName || 'Leo & Fox';
  const walkCharNameEl = document.getElementById('walkCharNameDisplay');
  if (walkCharNameEl) walkCharNameEl.textContent = charName;

  const scale = Math.min(1.4, Math.max(0.8, settings.characterScale || 1.4));
  document.documentElement.style.setProperty('--mascot-scale', scale);

  walkSpeechToast.classList.remove('show-toast', 'hide-toast');
  walkStateQuestion.style.display = 'block';
  walkStateSuccess.style.display = 'none';
  walkStateThrow.style.display = 'none';

  if (walkChair3D) {
    walkChair3D.destroy();
    walkChair3D = null;
  }

  const WalkEngine = typeof window.AquaBuddy3DWalkChair === 'function'
    ? window.AquaBuddy3DWalkChair
    : (window.AquaBuddy3DCharacter?.WalkChair || window.AquaBuddy3DCharacter?.AquaBuddy3DWalkChair);

  if (WalkEngine && mascot3DBoxWalk) {
    const screenW = window.innerWidth || screen.width || 1440;
    const startOffset = Math.max(1300, Math.round(screenW * 0.5 + 650));
    walkChair3D = new WalkEngine({
      container: mascot3DBoxWalk,
      width: Math.round(240 * scale),
      height: Math.round(280 * scale),
      startX: startOffset,
      endX: startOffset,
      targetX: 0,
      onSeated: () => {
        // Chair placed down & mascot is seated!
        playSound('chairThud');
        playSound('pop');
        walkSpeechToast.classList.add('show-toast');

        // Activate 2-second attention lock
        startCameraAttentionLock();
      },
      onWalkOutStart: () => {
        // Toast smoothly fades away as Leo starts walking off
        walkSpeechToast.classList.remove('show-toast');
        walkSpeechToast.classList.add('hide-toast');
      },
      onScreenImpact: () => {
        // Chair hits user screen!
        playSound('chairCrash');
        screenImpactOverlay.classList.remove('active');
        void screenImpactOverlay.offsetWidth;
        screenImpactOverlay.classList.add('active');

        overlayStage.classList.remove('screen-shatter-shake');
        void overlayStage.offsetWidth;
        overlayStage.classList.add('screen-shatter-shake');
      }
    });
  }
}

// User clicked "Yes, I'll walk!"
btnWalkYes.addEventListener('click', () => {
  if (btnWalkYes.classList.contains('is-locked')) return;

  playSound('success');
  walkStateQuestion.style.display = 'none';
  walkStateSuccess.style.display = 'block';

  if (window.aquaBuddyAPI) {
    window.aquaBuddyAPI.respondWalkCompleted();
  }

  if (walkChair3D) {
    walkChair3D.triggerCelebrateWalk(() => {
      // Called when Leo has walked completely off-screen past the right edge!
      if (window.aquaBuddyAPI) window.aquaBuddyAPI.closeOverlay();
    });
  }
});

// User clicked "No, not now" -> Throw Chair + "You will die here!"
btnWalkNo.addEventListener('click', () => {
  if (btnWalkNo.classList.contains('is-locked')) return;

  playSound('chairWhoosh');
  walkStateQuestion.style.display = 'none';
  walkStateThrow.style.display = 'block';

  if (window.aquaBuddyAPI) {
    window.aquaBuddyAPI.respondWalkDeclined();
  }

  if (walkChair3D) {
    walkChair3D.triggerThrowChair(() => {
      // Called when Leo has stomped completely off-screen past the right edge!
      if (window.aquaBuddyAPI) window.aquaBuddyAPI.closeOverlay();
    });
  }
});

walkToastCloseBtn.addEventListener('click', () => {
  if (window.aquaBuddyAPI) window.aquaBuddyAPI.respondWalkDeclined();
  walkSpeechToast.classList.remove('show-toast');
  walkSpeechToast.classList.add('hide-toast');
  if (walkChair3D) {
    walkChair3D.walkOutToRight(() => {
      if (window.aquaBuddyAPI) window.aquaBuddyAPI.closeOverlay();
    });
  } else {
    if (window.aquaBuddyAPI) window.aquaBuddyAPI.closeOverlay();
  }
});

// Listen to main process IPC triggers
if (window.aquaBuddyAPI) {
  window.aquaBuddyAPI.onStartWalk((data) => {
    startWalkingSequence(data);
  });
  window.aquaBuddyAPI.onStartWalkReminder((data) => {
    startWalkReminderSequence(data);
  });
}

// Standalone test support via URL query or window message
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get('test');
  if (testMode === 'walk') {
    startWalkReminderSequence();
  } else if (testMode === 'water') {
    startWalkingSequence();
  }
});
window.addEventListener('message', (event) => {
  if (event.data?.action === 'START_MASCOT_WALK') {
    startWalkingSequence(event.data);
  } else if (event.data?.action === 'START_WALK_REMINDER') {
    startWalkReminderSequence(event.data);
  }
});

