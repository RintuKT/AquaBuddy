// AquaBuddy - Desktop Walking Mascot Overlay Script
// Powered by Real Three.js 3D Character Engine (Leo + Fennec Fox + Water Bottle)

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

let soundEnabled = true;
let currentIntervalMinutes = 30;
let currentSnoozeMinutes = 10;
let character3D = null;

// Sound Synthesizer
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

// Start 3D Mascot Walking Sequence from Left
function startWalkingSequence(data) {
  const settings = data?.settings || {};
  soundEnabled = settings.soundEnabled !== false;
  currentIntervalMinutes = settings.intervalMinutes || 30;
  currentSnoozeMinutes = settings.snoozeMinutes || 10;

  if (successGapText) successGapText.textContent = `${currentIntervalMinutes} minutes`;
  if (snoozeGapText) snoozeGapText.textContent = `${currentSnoozeMinutes} minutes`;

  const scale = settings.characterScale || 1.3;
  document.documentElement.style.setProperty('--mascot-scale', scale);

  speechToast.classList.remove('show-toast', 'hide-toast');
  stateQuestion.style.display = 'block';
  stateSuccess.style.display = 'none';
  stateSnooze.style.display = 'none';

  actorUnit.className = 'actor-unit is-walking';

  // Instantiate Real 3D Pixar Animated Character in Three.js
  if (character3D) {
    character3D.destroy();
  }

  if (window.AquaBuddy3DCharacter && mascot3DBox) {
    character3D = new window.AquaBuddy3DCharacter({
      container: mascot3DBox,
      width: Math.round(200 * scale),
      height: Math.round(260 * scale),
      onBottleRaised: () => {
        // ONLY after character stops and raises the water bottle: pop toast
        playSound('pop');
        speechToast.classList.add('show-toast');
      }
    });
  }
}

// Helper: walk mascot back out off-screen to the left
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

// 1. User clicked "Yes, I drank!"
btnYes.addEventListener('click', () => {
  playSound('success');

  // Trigger 3D jumping celebration
  if (character3D) {
    character3D.triggerCelebrate();
  }

  // Show Yey! Good Job in toast
  stateQuestion.style.display = 'none';
  stateSuccess.style.display = 'block';

  if (window.aquaBuddyAPI) {
    window.aquaBuddyAPI.respondWaterDrank();
  }

  // After 1.8s of celebration: toast disappears, character pivots in 3D and walks out
  setTimeout(() => {
    walkOutToLeft();
  }, 1800);
});

// 2. User clicked "No / Remind later"
btnLater.addEventListener('click', () => {
  playSound('crying');

  // Trigger 3D crying mannerism
  if (character3D) {
    character3D.triggerCrying();
  }

  // Show snooze message in toast
  stateQuestion.style.display = 'none';
  stateSnooze.style.display = 'block';

  if (window.aquaBuddyAPI) {
    window.aquaBuddyAPI.respondRemindLater();
  }

  // After 1.8s of crying: toast disappears, character pivots in 3D and walks out
  setTimeout(() => {
    walkOutToLeft();
  }, 1800);
});

// Close button
toastCloseBtn.addEventListener('click', () => {
  if (window.aquaBuddyAPI) window.aquaBuddyAPI.respondRemindLater();
  walkOutToLeft();
});

// Listen to main process IPC
if (window.aquaBuddyAPI) {
  window.aquaBuddyAPI.onStartWalk((data) => {
    startWalkingSequence(data);
  });
}
