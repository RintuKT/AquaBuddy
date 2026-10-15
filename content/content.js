// AquaBuddy - Water Reminder Content Script
// Powered by Real Three.js 3D Pixar Character Engine (Leo & Fennec Fox)

(function () {
  if (window.__AQUABUDDY_INITIALIZED__) return;
  window.__AQUABUDDY_INITIALIZED__ = true;

  let currentHost = null;
  let shadowRoot = null;
  let autoDismissTimer = null;
  let character3D = null;

  // Listen for messages from background script or demo page
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SHOW_WATER_REMINDER') {
      showWaterReminder(message.settings);
      sendResponse({ status: 'displayed' });
    } else if (message.action === 'SHOW_WALK_REMINDER') {
      showWalkReminder(message.settings);
      sendResponse({ status: 'displayed' });
    }
  });

  // Melodic audio synthesizer for rich sound effects
  function playSound(type) {
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

  function showWaterReminder(customSettings) {
    if (currentHost && document.body.contains(currentHost)) {
      if (character3D) character3D.destroy();
      currentHost.remove();
    }

    if (autoDismissTimer) clearTimeout(autoDismissTimer);

    const intervalMin = customSettings?.intervalMinutes || 30;
    const snoozeMin = customSettings?.snoozeMinutes || 10;
    const charName = customSettings?.characterName || 'Leo & Fox';

    // Create host container with Shadow DOM
    currentHost = document.createElement('div');
    currentHost.id = 'aquabuddy-water-reminder-container';
    currentHost.style.position = 'fixed';
    currentHost.style.left = '32px';
    currentHost.style.bottom = '20px';
    currentHost.style.zIndex = '2147483647';
    currentHost.style.pointerEvents = 'none';

    shadowRoot = currentHost.attachShadow({ mode: 'open' });

    // Inject Shadow DOM Styles
    const styleEl = document.createElement('style');
    styleEl.textContent = getShadowStyles();
    shadowRoot.appendChild(styleEl);

    const wrapper = document.createElement('div');
    wrapper.className = 'aquabuddy-wrapper';
    wrapper.innerHTML = `
      <!-- Mascot Character (Real 3D WebGL Canvas Viewport) -->
      <div class="aquabuddy-mascot-wrapper" id="mascot">
        <div id="mascot3DBox" class="mascot-3d-box"></div>
      </div>

      <!-- Speech Bubble Toast (Positioned comfortably to the right of character inside screen) -->
      <div class="aquabuddy-toast-card" id="toastCard">
        <button class="aquabuddy-close-btn" id="closeBtn" title="Dismiss">✕</button>

        <!-- Initial Prompt State -->
        <div id="promptState" class="toast-state active-state">
          <div class="toast-header">
            <span class="water-icon-badge">💧</span>
            <div class="toast-title-box">
              <h4 class="toast-title">${charName}</h4>
              <p class="toast-subtitle">Hydration Reminder</p>
            </div>
          </div>

          <div class="toast-question">
            Did you drink water?
          </div>

          <div class="toast-actions">
            <button class="btn btn-yes" id="btnYes">
              <span class="btn-icon">✨</span>
              <span class="btn-text">Yes, I drank!</span>
            </button>
            <button class="btn btn-later" id="btnLater">
              <span class="btn-icon">⏰</span>
              <span class="btn-text">No, remind later</span>
            </button>
          </div>
        </div>

        <!-- Success "Yey! Good Job!" State -->
        <div id="successState" class="toast-state" style="display: none;">
          <div class="success-animation-wrap">
            <div class="celebration-badge">🎉</div>
            <div class="success-content">
              <h4 class="success-title">Yey! Good Job! 🌟</h4>
              <p class="success-desc">Stay fresh & energized! Next reminder in <strong>${intervalMin} minutes</strong>.</p>
              <div class="intake-pill" id="intakePill">
                <span>💧 +1 Glass logged</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Crying Snooze State -->
        <div id="snoozeState" class="toast-state" style="display: none;">
          <div class="snooze-animation-wrap">
            <div class="snooze-badge">😭</div>
            <div class="snooze-content">
              <h4 class="snooze-title">Aww... Don't forget!</h4>
              <p class="snooze-desc">Ok, I will remind you after <strong>${snoozeMin} minutes</strong>!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    shadowRoot.appendChild(wrapper);
    document.body.appendChild(currentHost);

    const mascot3DBox = shadowRoot.getElementById('mascot3DBox');
    const toastCard = shadowRoot.getElementById('toastCard');

    // Instantiate Real 3D Pixar Animated Character
    const CharEngine = typeof window.AquaBuddy3DCharacter === 'function'
      ? window.AquaBuddy3DCharacter
      : window.AquaBuddy3DCharacter?.AquaBuddy3DCharacter;

    if (CharEngine && mascot3DBox) {
      character3D = new CharEngine({
        container: mascot3DBox,
        width: 200,
        height: 250,
        onBottleRaised: () => {
          // ONLY after Leo stops, faces the camera, and offers the water bottle: pop toast
          playSound('pop');
          toastCard.classList.add('show-toast');
        }
      });
    }

    const btnYes = shadowRoot.getElementById('btnYes');
    const btnLater = shadowRoot.getElementById('btnLater');
    const closeBtn = shadowRoot.getElementById('closeBtn');

    const promptState = shadowRoot.getElementById('promptState');
    const successState = shadowRoot.getElementById('successState');
    const snoozeState = shadowRoot.getElementById('snoozeState');

    // Helper: Turn 3D mascot around and walk out
    function walkOutToLeft() {
      toastCard.classList.remove('show-toast');
      toastCard.classList.add('hide-toast');

      if (character3D) {
        character3D.triggerWalkOut(() => {
          if (currentHost && document.body.contains(currentHost)) {
            currentHost.remove();
            currentHost = null;
          }
        });
      } else {
        setTimeout(() => {
          if (currentHost && document.body.contains(currentHost)) {
            currentHost.remove();
            currentHost = null;
          }
        }, 3000);
      }
    }

    // 1. User clicked "Yes, I drank!"
    btnYes.addEventListener('click', () => {
      playSound('success');

      // Trigger 3D jumping celebration
      if (character3D) {
        character3D.triggerCelebrate();
      }

      promptState.style.display = 'none';
      successState.style.display = 'block';

      chrome.runtime.sendMessage({ action: 'YES_WATER_DRANK' }, (response) => {
        if (response && response.stats) {
          const pill = shadowRoot.getElementById('intakePill');
          if (pill) {
            pill.innerHTML = `<span>💧 Total today: <strong>${response.stats.count} glasses</strong></span>`;
          }
        }
      });

      // After 1.8s celebration: toast hides, 3D character turns and walks back out
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

      promptState.style.display = 'none';
      snoozeState.style.display = 'block';

      chrome.runtime.sendMessage({ action: 'REMIND_LATER' });

      // After 1.8s crying: toast hides, 3D character turns and walks back out
      setTimeout(() => {
        walkOutToLeft();
      }, 1800);
    });

    // 3. Close button
    closeBtn.addEventListener('click', () => {
      walkOutToLeft();
    });

    autoDismissTimer = setTimeout(() => {
      if (currentHost && document.body.contains(currentHost)) {
        walkOutToLeft();
      }
    }, 45000);
  }

  function showWalkReminder(customSettings) {
    if (currentHost && document.body.contains(currentHost)) {
      if (character3D) character3D.destroy();
      currentHost.remove();
    }

    if (autoDismissTimer) clearTimeout(autoDismissTimer);

    const charName = customSettings?.characterName || 'Leo & Fox';

    currentHost = document.createElement('div');
    currentHost.id = 'aquabuddy-walk-reminder-container';
    currentHost.style.position = 'fixed';
    currentHost.style.left = '50%';
    currentHost.style.bottom = '20px';
    currentHost.style.transform = 'translateX(-50%)';
    currentHost.style.zIndex = '2147483647';
    currentHost.style.pointerEvents = 'none';

    shadowRoot = currentHost.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = getShadowStyles();
    shadowRoot.appendChild(styleEl);

    const wrapper = document.createElement('div');
    wrapper.className = 'aquabuddy-wrapper walk-wrapper';
    wrapper.innerHTML = `
      <div class="aquabuddy-mascot-wrapper" id="mascotWalk">
        <div id="mascot3DBoxWalk" class="mascot-3d-box"></div>
      </div>

      <div class="aquabuddy-toast-card walk-toast-card" id="walkToastCard">
        <button class="aquabuddy-close-btn" id="walkCloseBtn" title="Dismiss">✕</button>

        <div id="walkPromptState" class="toast-state active-state">
          <div class="toast-header">
            <span class="water-icon-badge" style="background: linear-gradient(135deg, #f59e0b, #d97706);">🪑</span>
            <div class="toast-title-box">
              <h4 class="toast-title">${charName}</h4>
              <p class="toast-subtitle" style="color: #d97706;">Take a Walk Reminder</p>
            </div>
          </div>

          <div class="camera-pill" id="camPill">
            <span class="cam-dot-pulse"></span>
            <span id="camText">Stretch & Take a Walk</span>
            <span class="cam-timer" id="camTimerTag">2.0s</span>
          </div>

          <div class="toast-question" style="color: #78350f;">
            Time to stand up and take a walk! Stretch your legs and move around.
          </div>

          <div class="toast-actions">
            <button class="btn btn-yes is-locked" id="btnWalkYes" disabled style="background: linear-gradient(135deg, #10b981, #059669);">
              <span class="btn-icon">🚶</span>
              <span class="btn-text" id="btnWalkYesText">Yes, I'll walk! (2s)</span>
            </button>
            <button class="btn btn-later is-locked" id="btnWalkNo" disabled>
              <span class="btn-icon">🪑</span>
              <span class="btn-text">No, not now</span>
            </button>
          </div>
        </div>

        <div id="walkSuccessState" class="toast-state" style="display: none;">
          <div class="success-animation-wrap">
            <div class="celebration-badge">🌟</div>
            <div class="success-content">
              <h4 class="success-title" style="color: #059669;">Good Job! Stay Healthy! 🌟</h4>
              <p class="success-desc">Great job! Moving around regularly keeps you sharp and healthy. Make it a routine!</p>
              <div class="intake-pill" style="background:#fef3c7; border-color:#fde68a; color:#b45309;">
                <span>🚶 +1 Walk logged</span>
              </div>
            </div>
          </div>
        </div>

        <div id="walkThrowState" class="toast-state" style="display: none;">
          <div class="snooze-animation-wrap">
            <div class="snooze-badge" style="animation: angryShake 0.4s infinite;">🪑💥</div>
            <div class="snooze-content">
              <h4 class="snooze-title" style="color: #dc2626; font-size: 16px;">YOU WILL DIE HERE! 💥</h4>
              <p class="snooze-desc" style="color: #991b1b; font-weight: 600;">Stand up and take a walk before it's too late!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    shadowRoot.appendChild(wrapper);
    document.body.appendChild(currentHost);

    const mascot3DBoxWalk = shadowRoot.getElementById('mascot3DBoxWalk');
    const walkToastCard = shadowRoot.getElementById('walkToastCard');
    const btnWalkYes = shadowRoot.getElementById('btnWalkYes');
    const btnWalkNo = shadowRoot.getElementById('btnWalkNo');
    const btnWalkYesText = shadowRoot.getElementById('btnWalkYesText');
    const walkCloseBtn = shadowRoot.getElementById('walkCloseBtn');
    const camTimerTag = shadowRoot.getElementById('camTimerTag');
    const camText = shadowRoot.getElementById('camText');
    const camPill = shadowRoot.getElementById('camPill');

    const walkPromptState = shadowRoot.getElementById('walkPromptState');
    const walkSuccessState = shadowRoot.getElementById('walkSuccessState');
    const walkThrowState = shadowRoot.getElementById('walkThrowState');

    const screenW = window.innerWidth || 1440;
    const startOffset = Math.max(1300, Math.round(screenW * 0.5 + 650));
    const WalkEngine = typeof window.AquaBuddy3DWalkChair === 'function'
      ? window.AquaBuddy3DWalkChair
      : (window.AquaBuddy3DCharacter?.WalkChair || window.AquaBuddy3DCharacter?.AquaBuddy3DWalkChair);
    if (WalkEngine && mascot3DBoxWalk) {
      character3D = new WalkEngine({
        container: mascot3DBoxWalk,
        width: 230,
        height: 270,
        startX: startOffset,
        endX: startOffset,
        targetX: 0,
        onSeated: () => {
          playSound('pop');
          walkToastCard.classList.add('show-toast');
          startLockCountdown();
        },
        onWalkOutStart: () => {
          walkToastCard.classList.remove('show-toast');
          walkToastCard.classList.add('hide-toast');
        },
        onScreenImpact: () => {
          document.body.classList.remove('aquabuddy-screen-shake');
          void document.body.offsetWidth;
          document.body.classList.add('aquabuddy-screen-shake');
          setTimeout(() => document.body.classList.remove('aquabuddy-screen-shake'), 800);
        }
      });
    }

    function startLockCountdown() {
      let remaining = 2000;
      const timer = setInterval(() => {
        remaining -= 100;
        const s = Math.max(0, remaining / 1000).toFixed(1);
        if (camTimerTag) camTimerTag.textContent = `${s}s`;
        if (btnWalkYesText) btnWalkYesText.textContent = `Yes, I'll walk! (${Math.ceil(remaining / 1000)}s)`;

        if (remaining <= 0) {
          clearInterval(timer);
          btnWalkYes.classList.remove('is-locked');
          btnWalkYes.disabled = false;
          btnWalkNo.classList.remove('is-locked');
          btnWalkNo.disabled = false;
          if (btnWalkYesText) btnWalkYesText.textContent = "Yes, I'll take a walk!";
          if (camTimerTag) camTimerTag.textContent = '✓ Ready';
          if (camText) camText.textContent = '✓ Ready to walk!';
          if (camPill) camPill.style.background = '#dcfce7';
        }
      }, 100);
    }

    function closeWalkOverlay() {
      walkToastCard.classList.remove('show-toast');
      walkToastCard.classList.add('hide-toast');
      if (currentHost && document.body.contains(currentHost)) {
        currentHost.remove();
        currentHost = null;
      }
    }

    btnWalkYes.addEventListener('click', () => {
      if (btnWalkYes.classList.contains('is-locked')) return;
      playSound('success');
      walkPromptState.style.display = 'none';
      walkSuccessState.style.display = 'block';

      chrome.runtime.sendMessage({ action: 'YES_WALK_TAKEN' });

      if (character3D && character3D.triggerCelebrateWalk) {
        character3D.triggerCelebrateWalk(() => {
          closeWalkOverlay();
        });
      } else {
        setTimeout(closeWalkOverlay, 1800);
      }
    });

    btnWalkNo.addEventListener('click', () => {
      if (btnWalkNo.classList.contains('is-locked')) return;
      walkPromptState.style.display = 'none';
      walkThrowState.style.display = 'block';

      chrome.runtime.sendMessage({ action: 'REMIND_WALK_LATER' });

      if (character3D && character3D.triggerThrowChair) {
        character3D.triggerThrowChair(() => {
          closeWalkOverlay();
        });
      } else {
        setTimeout(closeWalkOverlay, 1800);
      }
    });

    walkCloseBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'REMIND_WALK_LATER' });
      walkToastCard.classList.remove('show-toast');
      walkToastCard.classList.add('hide-toast');
      if (character3D && character3D.walkOutToRight) {
        character3D.walkOutToRight(() => {
          closeWalkOverlay();
        });
      } else {
        closeWalkOverlay();
      }
    });
  }

  function getShadowStyles() {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      /* Base resting state is firmly at translateX(0), comfortably inside the viewport */
      .aquabuddy-wrapper {
        display: flex;
        align-items: flex-end;
        gap: 28px;
        pointer-events: auto;
        transform: translateX(0);
        will-change: transform;
        background: transparent !important;
      }

      /* Mascot Viewport */
      .aquabuddy-mascot-wrapper {
        width: 200px;
        height: 250px;
        cursor: pointer;
        position: relative;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        user-select: none;
        background: transparent !important;
        flex-shrink: 0;
      }

      .mascot-3d-box {
        width: 100%;
        height: 100%;
        position: relative;
        display: block;
      }

      /* === Pixar 3D Animated Character DOM Engine Styles === */
      .ab-stage {
        position: relative;
        width: 100%;
        height: 100%;
        perspective: 1000px;
        transform-style: preserve-3d;
        overflow: visible;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        user-select: none;
        pointer-events: none;
      }

      .ab-actor-carrier {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        transform-origin: bottom center;
        will-change: transform;
      }

      .ab-kinematics-carrier {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        transform-origin: bottom center;
        will-change: transform;
      }

      .ab-pivot-layer {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        transform-origin: bottom center;
        transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;
      }

      .ab-ground-shadow {
        position: absolute;
        bottom: 2px;
        width: 58%;
        height: 14px;
        background: radial-gradient(ellipse at center, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.2) 50%, rgba(15, 23, 42, 0) 75%);
        border-radius: 50%;
        transform-origin: center center;
        z-index: 1;
        pointer-events: none;
        transition: transform 0.08s ease-out, opacity 0.08s ease-out;
      }

      .ab-pose-stack {
        position: relative;
        width: 100%;
        height: 100%;
        z-index: 2;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .ab-pose-img {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        object-position: bottom center;
        filter: drop-shadow(0 12px 22px rgba(2, 6, 23, 0.35));
        image-rendering: -webkit-optimize-contrast;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.24s cubic-bezier(0.4, 0, 0.2, 1), transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: bottom center;
      }

      .ab-pose-img.active {
        opacity: 1;
        pointer-events: auto;
      }

      .ab-fx-sparkles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .ab-fx-sparkles.active {
        opacity: 1;
      }

      .ab-sparkle-item {
        position: absolute;
        animation: abSparklePop 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
      }

      @keyframes abSparklePop {
        0% { transform: translateY(0) scale(0.65) rotate(0deg); opacity: 0.5; }
        100% { transform: translateY(-22px) scale(1.25) rotate(45deg); opacity: 1; }
      }

      .ab-fx-tears {
        position: absolute;
        top: 15%;
        left: 0;
        width: 100%;
        height: 85%;
        pointer-events: none;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .ab-fx-tears.active {
        opacity: 1;
      }

      .ab-teardrop {
        position: absolute;
        width: 10px;
        height: 14px;
        background: linear-gradient(180deg, rgba(224, 242, 254, 0.9) 0%, rgba(56, 189, 248, 0.95) 100%);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        box-shadow: 0 0 6px rgba(56, 189, 248, 0.6);
        animation: abTearFall 1.1s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite;
      }

      @keyframes abTearFall {
        0% { transform: translateY(0) scale(0.5); opacity: 0; }
        25% { opacity: 0.95; transform: translateY(8px) scale(1.1); }
        85% { opacity: 0.95; transform: translateY(70px) scale(1.0); }
        100% { transform: translateY(85px) scale(0.4); opacity: 0; }
      }

      .ab-breathing {
        animation: abBreatheLoop 3.2s ease-in-out infinite alternate;
      }

      @keyframes abBreatheLoop {
        0% { transform: translateY(0) scale(1.0, 1.0); }
        50% { transform: translateY(-2px) scale(1.008, 1.018); }
        100% { transform: translateY(0) scale(1.0, 1.0); }
      }

      .ab-offer-bottle {
        animation: abBottleGesture 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      @keyframes abBottleGesture {
        0% { transform: translateY(12px) scale(0.96) rotate(-2.2deg); opacity: 0.85; }
        60% { transform: translateY(-6px) scale(1.02) rotate(1.2deg); opacity: 1; }
        100% { transform: translateY(0) scale(1.0) rotate(0deg); opacity: 1; }
      }

      /* =======================================================
         === SPEECH BUBBLE TOAST (STABLE & NEVER COVERS LEO) ===
         ======================================================= */
      .aquabuddy-toast-card {
        position: relative;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 255, 0.96) 100%);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1.5px solid rgba(56, 189, 248, 0.45);
        border-radius: 20px;
        box-shadow: 0 16px 36px -4px rgba(2, 132, 199, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.7) inset;
        padding: 18px 22px;
        min-width: 300px;
        max-width: 340px;
        color: #0f172a;
        margin-bottom: 24px;
        opacity: 0;
        transform: scale(0.85) translateY(16px);
        pointer-events: none;
        transition: opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        flex-shrink: 0;
      }

      /* Speech bubble pointer arrow pointing towards Leo */
      .aquabuddy-toast-card::before {
        content: '';
        position: absolute;
        bottom: 24px;
        left: -9px;
        width: 16px;
        height: 16px;
        background: #ffffff;
        border-left: 1.5px solid rgba(56, 189, 248, 0.45);
        border-bottom: 1.5px solid rgba(56, 189, 248, 0.45);
        transform: rotate(45deg);
        border-bottom-left-radius: 4px;
      }

      .aquabuddy-toast-card.show-toast {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: auto;
      }

      .aquabuddy-toast-card.hide-toast {
        opacity: 0;
        transform: scale(0.9) translateY(12px);
        pointer-events: none;
      }

      .aquabuddy-close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(148, 163, 184, 0.15);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #64748b;
        font-size: 11px;
        font-weight: 700;
        transition: all 0.2s ease;
      }

      .aquabuddy-close-btn:hover {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }

      .toast-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .water-icon-badge {
        font-size: 20px;
        background: rgba(2, 132, 199, 0.12);
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(56, 189, 248, 0.3);
      }

      .toast-title-box {
        display: flex;
        flex-direction: column;
      }

      .toast-title {
        font-size: 15px;
        font-weight: 800;
        color: #0369a1;
        letter-spacing: -0.3px;
      }

      .toast-subtitle {
        font-size: 11.5px;
        color: #64748b;
        font-weight: 500;
      }

      .toast-question {
        font-size: 16.5px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 14px;
        line-height: 1.35;
      }

      .toast-actions {
        display: flex;
        gap: 10px;
      }

      .btn {
        flex: 1;
        padding: 9px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
      }

      .btn-yes {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
      }

      .btn-yes:hover {
        background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(2, 132, 199, 0.45);
      }

      .btn-later {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
      }

      .btn-later:hover {
        background: #e2e8f0;
        color: #1e293b;
        transform: translateY(-2px);
      }

      /* Success Toast Body */
      .success-animation-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 6px 2px;
      }

      .celebration-badge {
        font-size: 34px;
        animation: bouncePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .success-content {
        flex: 1;
      }

      .success-title {
        font-size: 16px;
        font-weight: 800;
        color: #0284c7;
        margin-bottom: 4px;
      }

      .success-desc {
        font-size: 13px;
        color: #475569;
        line-height: 1.4;
        margin-bottom: 8px;
      }

      .intake-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(2, 132, 199, 0.12);
        color: #0369a1;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        border: 1px solid rgba(56, 189, 248, 0.3);
      }

      /* Snooze / Crying Toast Body */
      .snooze-animation-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 6px 2px;
      }

      .snooze-badge {
        font-size: 34px;
        animation: bouncePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .snooze-content {
        flex: 1;
      }

      .snooze-title {
        font-size: 16px;
        font-weight: 800;
        color: #0284c7;
        margin-bottom: 4px;
      }

      .snooze-desc {
        font-size: 13px;
        color: #475569;
        line-height: 1.4;
      }

      @keyframes bouncePop {
        0% { transform: scale(0.3); opacity: 0; }
        60% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(1); }
      }

      /* Walk & Chair Specific Shadow Styles */
      .walk-wrapper {
        justify-content: center;
      }

      .walk-toast-card {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(245, 158, 11, 0.4);
        box-shadow: 0 24px 52px -6px rgba(180, 83, 9, 0.22), 0 8px 18px -4px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.85) inset;
        border-radius: 22px;
        padding: 20px 24px;
        backdrop-filter: blur(28px) saturate(180%);
        -webkit-backdrop-filter: blur(28px) saturate(180%);
      }

      .camera-pill {
        display: flex;
        align-items: center;
        gap: 9px;
        background: linear-gradient(135deg, rgba(254, 243, 199, 0.92) 0%, rgba(253, 230, 138, 0.78) 100%);
        border: 1px solid rgba(245, 158, 11, 0.35);
        padding: 6px 14px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 700;
        color: #92400e;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);
        transition: all 0.3s ease;
      }

      .cam-dot-pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f59e0b;
        box-shadow: 0 0 8px #f59e0b;
        animation: camPulse 1s infinite alternate;
      }

      @keyframes camPulse {
        0% { opacity: 0.6; transform: scale(0.85); }
        100% { opacity: 1; transform: scale(1.3); }
      }

      .cam-timer {
        margin-left: auto;
        background: #f59e0b;
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
        box-shadow: 0 1px 4px rgba(245, 158, 11, 0.35);
      }

      .btn.is-locked {
        opacity: 0.55;
        cursor: not-allowed;
        filter: grayscale(0.25);
        transform: none !important;
        box-shadow: none !important;
      }

      @keyframes angryShake {
        0% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg) scale(1.15); }
        100% { transform: rotate(-5deg); }
      }
    `;
  }
})();
