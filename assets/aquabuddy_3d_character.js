// AquaBuddy - Master 3D Pixar Character Engine
// Renders the exact 3D Pixar Boy (Leo) & Fennec Fox Companion holding the blue water bottle
// Features: True 60 FPS Biomechanical Gait, Inverted Pendulum Weight Transfer,
// Torso Contrapposto, Impact Ground Shadow, Bottle Offering Gesture, 3D Turning,
// Joyful Jumping Celebration with Sparkles, Empathetic Crying with Teardrops, and Organic Breathing.

(function (root, factory) {
  const lib = factory();
  if (typeof define === 'function' && define.amd) {
    define([], () => lib);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = lib;
  } else {
    root.AquaBuddy3DCharacter = lib;
    root.AquaBuddy3DWalkChair = lib.WalkChair || lib.AquaBuddy3DWalkChair;
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Helper to resolve asset paths across Extension, Electron, and Standalone Demo
  function getAssetUrl(filename) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      try {
        return chrome.runtime.getURL('assets/' + filename);
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.location) {
      const p = window.location.pathname;
      if (p.includes('/app/') || p.includes('\\app\\')) {
        return '../assets/' + filename;
      }
    }
    return 'assets/' + filename;
  }

  function getCharacterStyles() {
    return `
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

      /* Master Actor Carrier (Controls Horizontal Travel across screen) */
      .ab-actor-carrier {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        transform-origin: bottom center;
        will-change: transform;
        transition: transform 0.05s linear;
      }

      /* Biomechanical Kinematics Carrier (Bobbing, Tilt, Jump, Slump) */
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

      /* 3D Perspective Rotation Layer */
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

      /* Realistic Impact Ground Shadow */
      .ab-ground-shadow {
        position: absolute;
        bottom: 2px;
        width: 58%;
        height: 16px;
        background: radial-gradient(ellipse at center, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.2) 50%, rgba(15, 23, 42, 0) 75%);
        border-radius: 50%;
        transform-origin: center center;
        z-index: 1;
        pointer-events: none;
        transition: transform 0.08s ease-out, opacity 0.08s ease-out;
      }

      /* Character Pose Image Stack */
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
        object-fit: contain;
        object-position: bottom center;
        filter: drop-shadow(0 14px 24px rgba(2, 6, 23, 0.35));
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

      /* Secondary FX: Sparkles for Celebration */
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

      /* Secondary FX: Teardrops for Crying */
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

      /* Living Idle Breathing */
      .ab-breathing {
        animation: abBreatheLoop 3.2s ease-in-out infinite alternate;
      }

      @keyframes abBreatheLoop {
        0% { transform: translateY(0) scale(1.0, 1.0); }
        50% { transform: translateY(-2px) scale(1.008, 1.018); }
        100% { transform: translateY(0) scale(1.0, 1.0); }
      }

      /* Bottle Offering / Greeting Gesture */
      .ab-offer-bottle {
        animation: abBottleGesture 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      @keyframes abBottleGesture {
        0% { transform: translateY(12px) scale(0.96) rotate(-2.2deg); opacity: 0.85; }
        60% { transform: translateY(-6px) scale(1.02) rotate(1.2deg); opacity: 1; }
        100% { transform: translateY(0) scale(1.0) rotate(0deg); opacity: 1; }
      }

      /* Walk & Chair Stage and Flying Chair Styles */
      .ab-chair-stage {
        perspective: 1200px;
      }

      .ab-flying-chair {
        position: absolute;
        bottom: 18px;
        left: 50%;
        width: 160px;
        height: 180px;
        object-fit: contain;
        pointer-events: none;
        opacity: 0;
        z-index: 99;
        transform-origin: center center;
        will-change: transform, opacity;
      }
    `;
  }

  class AquaBuddy3DCharacter {
    constructor(options = {}) {
      this.container = options.container;
      this.width = options.width || 200;
      this.height = options.height || 250;
      this.onArrival = options.onArrival || null;
      this.onBottleRaised = options.onBottleRaised || null;

      // State Machine
      // 'WALK_IN', 'OFFER_BOTTLE', 'IDLE', 'CELEBRATE', 'CRYING', 'TURNING', 'WALK_OUT'
      this.state = 'WALK_IN';
      this.walkStartTime = performance.now();
      this.walkDuration = 2800; // 2.8s walk in from left
      this.travelStartX = -260; // Off-screen left (px)
      this.travelTargetX = 0;   // Arrived rest spot (px)
      this.currentX = this.travelStartX;

      // Gait Cadence
      this.stepFrequency = 2.4; // Steps per second (natural human walking tempo)
      this.animId = null;
      this.isDestroyed = false;

      this.buildDOM();
      this.startLoop();
    }

    buildDOM() {
      if (!this.container) return;
      this.container.innerHTML = '';

      // Stage
      this.stage = document.createElement('div');
      this.stage.className = 'ab-stage';

      // Inject styles directly into stage so it works inside Shadow DOM, regular DOM, or Electron
      const styleEl = document.createElement('style');
      styleEl.textContent = getCharacterStyles();
      this.stage.appendChild(styleEl);

      // Actor Carrier (horizontal movement)
      this.actorCarrier = document.createElement('div');
      this.actorCarrier.className = 'ab-actor-carrier';
      this.actorCarrier.style.transform = `translateX(${this.travelStartX}px)`;

      // Kinematics Carrier (vertical gait oscillation, leaning, jumping)
      this.kinematicsCarrier = document.createElement('div');
      this.kinematicsCarrier.className = 'ab-kinematics-carrier';

      // Pivot Layer (3D perspective rotation)
      this.pivotLayer = document.createElement('div');
      this.pivotLayer.className = 'ab-pivot-layer';

      // Ground Shadow
      this.groundShadow = document.createElement('div');
      this.groundShadow.className = 'ab-ground-shadow';

      // Pose Stack
      this.poseStack = document.createElement('div');
      this.poseStack.className = 'ab-pose-stack';

      // Strict containment style for image elements (immune to inheritance issues)
      const imgBaseStyle = 'position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:100%; height:100%; max-width:100%; max-height:100%; object-fit:contain; object-position:bottom center; pointer-events:none;';

      // 1. Walk Pose
      this.imgWalk = document.createElement('img');
      this.imgWalk.className = 'ab-pose-img active';
      this.imgWalk.style.cssText = imgBaseStyle;
      this.imgWalk.style.opacity = '1';
      this.imgWalk.src = getAssetUrl('pixar_walk.png');
      this.imgWalk.alt = 'Leo Walking';

      // 2. Stand & Offer Bottle Pose
      this.imgStand = document.createElement('img');
      this.imgStand.className = 'ab-pose-img';
      this.imgStand.style.cssText = imgBaseStyle;
      this.imgStand.style.opacity = '0';
      this.imgStand.src = getAssetUrl('pixar_stand.png');
      this.imgStand.alt = 'Leo Standing';

      // 3. Celebrate Jump Pose
      this.imgCelebrate = document.createElement('img');
      this.imgCelebrate.className = 'ab-pose-img';
      this.imgCelebrate.style.cssText = imgBaseStyle;
      this.imgCelebrate.style.opacity = '0';
      this.imgCelebrate.src = getAssetUrl('pixar_celebrate.png');
      this.imgCelebrate.alt = 'Leo Celebrating';

      // 4. Crying Pose
      this.imgCrying = document.createElement('img');
      this.imgCrying.className = 'ab-pose-img';
      this.imgCrying.style.cssText = imgBaseStyle;
      this.imgCrying.style.opacity = '0';
      this.imgCrying.src = getAssetUrl('pixar_crying.png');
      this.imgCrying.alt = 'Leo Crying';

      this.poseStack.appendChild(this.imgWalk);
      this.poseStack.appendChild(this.imgStand);
      this.poseStack.appendChild(this.imgCelebrate);
      this.poseStack.appendChild(this.imgCrying);

      // Sparkles FX
      this.fxSparkles = document.createElement('div');
      this.fxSparkles.className = 'ab-fx-sparkles';
      this.fxSparkles.innerHTML = `
        <span class="ab-sparkle-item" style="top:4%; left:8%; font-size:24px; animation-delay:0.1s;">✨</span>
        <span class="ab-sparkle-item" style="top:-6%; right:14%; font-size:28px; animation-delay:0.25s;">🌟</span>
        <span class="ab-sparkle-item" style="top:28%; left:2%; font-size:20px; animation-delay:0.4s;">⭐</span>
        <span class="ab-sparkle-item" style="top:12%; right:4%; font-size:26px; animation-delay:0.2s;">✨</span>
        <span class="ab-sparkle-item" style="top:-14%; left:42%; font-size:22px; animation-delay:0.35s;">🎉</span>
      `;

      // Teardrops FX
      this.fxTears = document.createElement('div');
      this.fxTears.className = 'ab-fx-tears';
      this.fxTears.innerHTML = `
        <div class="ab-teardrop" style="left: 36%; top: 40px; animation-delay: 0.1s;"></div>
        <div class="ab-teardrop" style="left: 58%; top: 44px; animation-delay: 0.45s;"></div>
        <div class="ab-teardrop" style="left: 38%; top: 50px; animation-delay: 0.8s;"></div>
      `;

      // Assemble hierarchy
      this.pivotLayer.appendChild(this.poseStack);
      this.pivotLayer.appendChild(this.fxSparkles);
      this.pivotLayer.appendChild(this.fxTears);

      this.kinematicsCarrier.appendChild(this.groundShadow);
      this.kinematicsCarrier.appendChild(this.pivotLayer);

      this.actorCarrier.appendChild(this.kinematicsCarrier);
      this.stage.appendChild(this.actorCarrier);
      this.container.appendChild(this.stage);
    }

    setPose(poseName) {
      const poses = [
        { name: 'walk', el: this.imgWalk },
        { name: 'stand', el: this.imgStand },
        { name: 'celebrate', el: this.imgCelebrate },
        { name: 'crying', el: this.imgCrying }
      ];

      poses.forEach(p => {
        if (p.name === poseName) {
          p.el.classList.add('active');
          p.el.style.opacity = '1';
        } else {
          p.el.classList.remove('active');
          p.el.style.opacity = '0';
        }
      });
    }

    startLoop() {
      const animate = (timestamp) => {
        if (this.isDestroyed) return;
        this.update(timestamp);
        this.animId = requestAnimationFrame(animate);
      };
      this.animId = requestAnimationFrame(animate);
    }

    update(now) {
      if (this.state === 'WALK_IN') {
        const elapsed = now - this.walkStartTime;
        let progress = elapsed / this.walkDuration;

        if (progress < 1.0) {
          // Smooth human deceleration curve (ease-out cubic with settle)
          const easeProgress = 1 - Math.pow(1 - progress, 2.6);
          this.currentX = this.travelStartX + (this.travelTargetX - this.travelStartX) * easeProgress;
          this.actorCarrier.style.transform = `translateX(${this.currentX}px)`;

          // True Biomechanical Gait Kinematics
          // Step oscillation at 60 FPS
          const gaitPhase = (elapsed / 1000) * this.stepFrequency * Math.PI * 2;
          
          // As character approaches destination, dampen step amplitude
          const dampener = Math.max(0.15, 1 - progress * 0.85);

          // 1. Vertical inverted pendulum hip bounce (drops on foot strike, rises on midstance)
          const bounceY = Math.abs(Math.sin(gaitPhase)) * 8 * dampener;
          // 2. Torso contrapposto tilt
          const tiltDeg = Math.sin(gaitPhase) * 1.8 * dampener;

          this.kinematicsCarrier.style.transform = `translateY(${bounceY}px) rotate(${tiltDeg}deg)`;

          // 3. Ground shadow pulses with foot impact
          const shadowScale = 1.0 + (bounceY / 8) * 0.12;
          const shadowOpacity = 0.65 - (bounceY / 8) * 0.25;
          this.groundShadow.style.transform = `scale(${shadowScale}, 1.0)`;
          this.groundShadow.style.opacity = shadowOpacity;

          // Subtle 3D perspective depth during entry
          const angleY = (1 - progress) * 12; // 12deg -> 0deg
          this.pivotLayer.style.transform = `rotateY(${angleY}deg)`;
        } else {
          // Arrived!
          this.state = 'OFFER_BOTTLE';
          this.actorCarrier.style.transform = `translateX(${this.travelTargetX}px)`;
          this.transitionToOfferBottle();
        }
      } else if (this.state === 'WALK_OUT') {
        const elapsed = now - this.walkOutStartTime;
        let progress = elapsed / this.walkOutDuration;

        if (progress < 1.0) {
          // Smooth acceleration and exit
          const easeProgress = Math.pow(progress, 1.4);
          this.currentX = this.travelTargetX + (this.travelStartX - this.travelTargetX) * easeProgress;
          this.actorCarrier.style.transform = `translateX(${this.currentX}px)`;

          // Active stepping gait
          const gaitPhase = (elapsed / 1000) * this.stepFrequency * Math.PI * 2;
          const bounceY = Math.abs(Math.sin(gaitPhase)) * 8;
          const tiltDeg = Math.sin(gaitPhase) * 1.8;

          this.kinematicsCarrier.style.transform = `translateY(${bounceY}px) rotate(${tiltDeg}deg)`;

          const shadowScale = 1.0 + (bounceY / 8) * 0.12;
          this.groundShadow.style.transform = `scale(${shadowScale}, 1.0)`;
        } else {
          // Off-screen
          this.state = 'OFFSCREEN';
          this.actorCarrier.style.transform = `translateX(${this.travelStartX}px)`;
          if (this.walkOutCallback) {
            this.walkOutCallback();
            this.walkOutCallback = null;
          }
        }
      }
    }

    transitionToOfferBottle() {
      // 1. Smooth 3D pivot and crossfade to Standing pose (raising water bottle)
      this.pivotLayer.style.transform = 'perspective(600px) rotateY(18deg) scale(0.97)';
      
      setTimeout(() => {
        // Crossfade to standing pose (holding water bottle up to offer)
        this.setPose('stand');
        this.pivotLayer.style.transform = 'perspective(600px) rotateY(0deg) scale(1.0)';
        this.kinematicsCarrier.style.transform = 'translateY(0) rotate(0deg)';
        this.groundShadow.style.transform = 'scale(1.0, 1.0)';
        this.groundShadow.style.opacity = '0.55';

        // Add bottle raising mannerism
        this.pivotLayer.classList.add('ab-offer-bottle');

        // 2. ONLY after raising bottle gesture completes: fire onBottleRaised callback
        setTimeout(() => {
          this.pivotLayer.classList.remove('ab-offer-bottle');
          this.state = 'IDLE';
          this.kinematicsCarrier.classList.add('ab-breathing');

          if (typeof this.onBottleRaised === 'function') {
            this.onBottleRaised();
          }
          if (typeof this.onArrival === 'function') {
            this.onArrival();
          }
        }, 550);
      }, 180);
    }

    triggerCelebrate() {
      this.state = 'CELEBRATE';
      this.kinematicsCarrier.classList.remove('ab-breathing');

      // 1. Crossfade to celebrate pose (water bottle high, thumbs up, wide smile)
      this.setPose('celebrate');
      this.fxSparkles.classList.add('active');

      // 2. Joyful jumping physics sequence
      // Anticipation dip
      this.kinematicsCarrier.style.transition = 'transform 0.14s cubic-bezier(0.2, 0, 0, 1)';
      this.kinematicsCarrier.style.transform = 'translateY(10px) scale(1.05, 0.94)';
      this.groundShadow.style.transform = 'scale(1.15, 1.0)';

      setTimeout(() => {
        // Explosive Leap
        this.kinematicsCarrier.style.transition = 'transform 0.38s cubic-bezier(0.15, 0.85, 0.35, 1)';
        this.kinematicsCarrier.style.transform = 'translateY(-54px) scale(0.96, 1.06) rotate(2deg)';
        this.groundShadow.style.transform = 'scale(0.65, 0.6)';
        this.groundShadow.style.opacity = '0.25';

        setTimeout(() => {
          // Landing compression
          this.kinematicsCarrier.style.transition = 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)';
          this.kinematicsCarrier.style.transform = 'translateY(4px) scale(1.04, 0.96) rotate(-1deg)';
          this.groundShadow.style.transform = 'scale(1.1, 1.0)';
          this.groundShadow.style.opacity = '0.6';

          setTimeout(() => {
            // Settle upright
            this.kinematicsCarrier.style.transition = 'transform 0.25s ease-out';
            this.kinematicsCarrier.style.transform = 'translateY(0) scale(1.0, 1.0) rotate(0deg)';
            this.groundShadow.style.transform = 'scale(1.0, 1.0)';
            this.groundShadow.style.opacity = '0.52';
          }, 220);
        }, 380);
      }, 140);
    }

    triggerCrying() {
      this.state = 'CRYING';
      this.kinematicsCarrier.classList.remove('ab-breathing');

      // 1. Crossfade to crying pose (drooping shoulders, sad expression, sad fox)
      this.setPose('crying');
      this.fxTears.classList.add('active');

      // 2. Empathetic crying slump physics sequence
      this.kinematicsCarrier.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      this.kinematicsCarrier.style.transform = 'translateY(8px) rotate(-1.5deg) scale(0.98, 0.99)';

      // Gentle sobbing shiver
      let shiverCount = 0;
      const shiverInterval = setInterval(() => {
        if (this.state !== 'CRYING' || this.isDestroyed) {
          clearInterval(shiverInterval);
          return;
        }
        shiverCount++;
        const dy = 8 + (shiverCount % 2 === 0 ? 2 : -2);
        this.kinematicsCarrier.style.transform = `translateY(${dy}px) rotate(${-1.5 + (shiverCount % 2) * 0.8}deg) scale(0.98, 0.99)`;
        if (shiverCount > 8) clearInterval(shiverInterval);
      }, 160);
    }

    triggerWalkOut(callback) {
      this.state = 'TURNING';
      this.walkOutCallback = callback || null;
      this.fxSparkles.classList.remove('active');
      this.fxTears.classList.remove('active');
      this.kinematicsCarrier.classList.remove('ab-breathing');
      this.kinematicsCarrier.style.transition = 'transform 0.2s ease-out';
      this.kinematicsCarrier.style.transform = 'translateY(0) rotate(0deg) scale(1, 1)';

      // 1. Natural 3D Turn towards the left
      this.pivotLayer.style.transform = 'perspective(600px) rotateY(90deg) scale(0.96)';

      setTimeout(() => {
        // Switch to walk pose and face left (scaleX -1)
        this.setPose('walk');
        this.pivotLayer.style.transform = 'perspective(600px) rotateY(0deg) scaleX(-1)';

        setTimeout(() => {
          // 2. Start walking out to left
          this.state = 'WALK_OUT';
          this.walkOutStartTime = performance.now();
          this.walkOutDuration = 2500;
        }, 150);
      }, 220);
    }

    destroy() {
      this.isDestroyed = true;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  }

  // Voice helper for character speech
  function speakCharacter(text, options = {}) {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = options.rate || 1.0;
        utter.pitch = options.pitch || 1.15;
        if (options.angry) {
          utter.rate = 1.1;
          utter.pitch = 0.85;
          utter.volume = 1.0;
        }
        const voices = window.speechSynthesis.getVoices();
        const en = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('Google') || v.name.includes('Natural')));
        if (en) utter.voice = en;
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      console.warn('[AquaBuddy] Speech synthesis error:', e);
    }
  }

  // --------------------------------------------------------------------------
  // AquaBuddy3DWalkChair - Right-Side Entry, Sitting, & 3D Chair Throw Engine
  // --------------------------------------------------------------------------
  class AquaBuddy3DWalkChair {
    constructor(options = {}) {
      this.container = options.container;
      this.width = options.width || 240;
      this.height = options.height || 280;
      this.onSeated = options.onSeated || null;
      this.onScreenImpact = options.onScreenImpact || null;

      // Start from off-screen right, walk to center
      this.travelStartX = options.startX || 600;
      this.travelTargetX = options.targetX || 0;
      this.currentX = this.travelStartX;

      this.state = 'WALK_IN_RIGHT';
      this.walkStartTime = performance.now();
      this.walkDuration = 3200; // 3.2s smooth walk from right
      this.stepFrequency = 2.4;
      this.animId = null;
      this.isDestroyed = false;

      this.buildDOM();
      this.startLoop();
    }

    buildDOM() {
      if (!this.container) return;
      this.container.innerHTML = '';

      this.stage = document.createElement('div');
      this.stage.className = 'ab-stage ab-chair-stage';

      // Inject styles directly into stage so it works inside Shadow DOM, regular DOM, or Electron
      const styleEl = document.createElement('style');
      styleEl.textContent = getCharacterStyles();
      this.stage.appendChild(styleEl);

      // Carrier
      this.actorCarrier = document.createElement('div');
      this.actorCarrier.className = 'ab-actor-carrier';
      this.actorCarrier.style.transform = `translateX(${this.travelStartX}px)`;

      // Kinematics (gait bounce & tilt)
      this.kinematicsCarrier = document.createElement('div');
      this.kinematicsCarrier.className = 'ab-kinematics-carrier';

      // Pivot Layer (facing LEFT during walk-in)
      this.pivotLayer = document.createElement('div');
      this.pivotLayer.className = 'ab-pivot-layer';
      this.pivotLayer.style.transform = 'scaleX(1)';

      // Ground Shadow
      this.groundShadow = document.createElement('div');
      this.groundShadow.className = 'ab-ground-shadow';
      this.groundShadow.style.width = '68%';

      // Poses Stack
      this.poseStack = document.createElement('div');
      this.poseStack.className = 'ab-pose-stack';

      const imgStyle = 'position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:100%; height:100%; max-width:100%; max-height:100%; object-fit:contain; object-position:bottom center; pointer-events:none;';

      // 1. Carrying Chair Pose
      this.imgCarryChair = document.createElement('img');
      this.imgCarryChair.className = 'ab-pose-img active';
      this.imgCarryChair.style.cssText = imgStyle;
      this.imgCarryChair.style.opacity = '1';
      this.imgCarryChair.src = getAssetUrl('pixar_carry_chair.png');
      this.imgCarryChair.alt = 'Leo Carrying Chair';

      // 2. Sitting in Chair Pose (Facing front)
      this.imgSitChair = document.createElement('img');
      this.imgSitChair.className = 'ab-pose-img';
      this.imgSitChair.style.cssText = imgStyle;
      this.imgSitChair.style.opacity = '0';
      this.imgSitChair.src = getAssetUrl('pixar_sit_chair.png');
      this.imgSitChair.alt = 'Leo Sitting in Chair';

      // 3. Throwing Chair Pose (Angry)
      this.imgThrowChair = document.createElement('img');
      this.imgThrowChair.className = 'ab-pose-img';
      this.imgThrowChair.style.cssText = imgStyle;
      this.imgThrowChair.style.opacity = '0';
      this.imgThrowChair.src = getAssetUrl('pixar_throw_chair.png');
      this.imgThrowChair.alt = 'Leo Throwing Chair';

      // 4. Celebrate Pose (Thumbs up & happy)
      this.imgCelebrate = document.createElement('img');
      this.imgCelebrate.className = 'ab-pose-img';
      this.imgCelebrate.style.cssText = imgStyle;
      this.imgCelebrate.style.opacity = '0';
      this.imgCelebrate.src = getAssetUrl('pixar_celebrate.png');
      this.imgCelebrate.alt = 'Leo Celebrating';

      this.poseStack.appendChild(this.imgCarryChair);
      this.poseStack.appendChild(this.imgSitChair);
      this.poseStack.appendChild(this.imgThrowChair);
      this.poseStack.appendChild(this.imgCelebrate);

      // Dedicated 3D Flying Chair (Hurled toward user screen on No)
      this.flyingChair = document.createElement('img');
      this.flyingChair.className = 'ab-flying-chair';
      this.flyingChair.src = getAssetUrl('pixar_chair.png');
      this.flyingChair.style.cssText = 'position:absolute; bottom:18px; left:50%; width:160px; height:180px; object-fit:contain; pointer-events:none; opacity:0; z-index:99; transform-origin:center center; will-change:transform, opacity;';
      this.poseStack.appendChild(this.flyingChair);

      // Sparkles
      this.fxSparkles = document.createElement('div');
      this.fxSparkles.className = 'ab-fx-sparkles';
      this.fxSparkles.innerHTML = `
        <span class="ab-sparkle-item" style="top:4%; left:8%; font-size:24px; animation-delay:0.1s;">✨</span>
        <span class="ab-sparkle-item" style="top:-6%; right:14%; font-size:28px; animation-delay:0.25s;">🌟</span>
        <span class="ab-sparkle-item" style="top:28%; left:2%; font-size:20px; animation-delay:0.4s;">⭐</span>
        <span class="ab-sparkle-item" style="top:12%; right:4%; font-size:26px; animation-delay:0.2s;">✨</span>
        <span class="ab-sparkle-item" style="top:-14%; left:42%; font-size:22px; animation-delay:0.35s;">🎉</span>
      `;

      this.pivotLayer.appendChild(this.poseStack);
      this.pivotLayer.appendChild(this.fxSparkles);

      this.kinematicsCarrier.appendChild(this.groundShadow);
      this.kinematicsCarrier.appendChild(this.pivotLayer);

      this.actorCarrier.appendChild(this.kinematicsCarrier);
      this.stage.appendChild(this.actorCarrier);
      this.container.appendChild(this.stage);
    }

    setPose(poseName) {
      const poses = [
        { name: 'carry', el: this.imgCarryChair },
        { name: 'sit', el: this.imgSitChair },
        { name: 'throw', el: this.imgThrowChair },
        { name: 'celebrate', el: this.imgCelebrate }
      ];

      poses.forEach(p => {
        if (p.name === poseName) {
          p.el.classList.add('active');
          p.el.style.opacity = '1';
        } else {
          p.el.classList.remove('active');
          p.el.style.opacity = '0';
        }
      });
    }

    startLoop() {
      const animate = (timestamp) => {
        if (this.isDestroyed) return;
        this.update(timestamp);
        this.animId = requestAnimationFrame(animate);
      };
      this.animId = requestAnimationFrame(animate);
    }

    update(now) {
      if (this.state === 'WALK_IN_RIGHT') {
        const elapsed = now - this.walkStartTime;
        const progress = Math.min(1.0, elapsed / this.walkDuration);

        // Smooth human deceleration curve
        const easeProgress = 1 - Math.pow(1 - progress, 2.8);
        this.currentX = this.travelStartX + (this.travelTargetX - this.travelStartX) * easeProgress;
        this.actorCarrier.style.transform = `translateX(${this.currentX}px)`;

        // Gait bounce & tilt
        const gaitPhase = (elapsed / 1000) * this.stepFrequency * Math.PI * 2;
        const dampener = Math.max(0.2, 1 - progress * 0.8);
        const bounceY = Math.abs(Math.sin(gaitPhase)) * 8 * dampener;
        const tiltDeg = Math.sin(gaitPhase) * 2 * dampener;

        this.kinematicsCarrier.style.transform = `translateY(${bounceY}px) rotate(${tiltDeg}deg)`;
        this.groundShadow.style.transform = `scale(${1.0 + (bounceY / 8) * 0.15}, 1.0)`;

        if (progress >= 1.0) {
          this.state = 'TRANSITION_SEATED';
          this.transitionToSeated();
        }
      } else if (this.state === 'WALK_OUT_RIGHT') {
        const elapsed = now - this.walkOutStartTime;
        const progress = Math.min(1.0, elapsed / this.walkOutDuration);

        const easeProgress = Math.pow(progress, 1.4);
        this.currentX = this.travelTargetX + (this.travelStartX - this.travelTargetX) * easeProgress;
        this.actorCarrier.style.transform = `translateX(${this.currentX}px)`;

        const gaitPhase = (elapsed / 1000) * this.stepFrequency * Math.PI * 2;
        const bounceY = Math.abs(Math.sin(gaitPhase)) * 8;
        const tiltDeg = Math.sin(gaitPhase) * 2;

        this.kinematicsCarrier.style.transform = `translateY(${bounceY}px) rotate(${tiltDeg}deg)`;

        if (progress >= 1.0) {
          this.state = 'OFFSCREEN';
          if (typeof this.walkOutCallback === 'function') {
            this.walkOutCallback();
            this.walkOutCallback = null;
          }
        }
      }
    }

    transitionToSeated() {
      // Chair placed down gently, character sits down comfortably
      this.kinematicsCarrier.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      this.kinematicsCarrier.style.transform = 'translateY(12px) scale(1.04, 0.94)';

      setTimeout(() => {
        // Crossfade to sitting in chair pose
        this.setPose('sit');
        this.pivotLayer.style.transform = 'perspective(800px) rotateY(0deg) scale(1.0)';
        this.kinematicsCarrier.style.transition = 'transform 0.4s ease-out';
        this.kinematicsCarrier.style.transform = 'translateY(0) scale(1, 1)';
        this.groundShadow.style.transform = 'scale(1.2, 1.1)';
        this.groundShadow.style.opacity = '0.7';

        // Organic breathing while seated
        this.kinematicsCarrier.classList.add('ab-breathing');
        this.state = 'SEATED_ASKING';

        if (typeof this.onSeated === 'function') {
          this.onSeated();
        }
      }, 260);
    }

    // 1. User clicked "Yes, I'll take a walk"
    triggerCelebrateWalk(callback) {
      this.state = 'CELEBRATE';
      this.kinematicsCarrier.classList.remove('ab-breathing');

      // Voice: "Good job! Stay healthy, make it a routine!"
      speakCharacter("Good job! Stay healthy, make it a routine!");

      // Stand up and celebrate
      this.setPose('celebrate');
      this.fxSparkles.classList.add('active');

      // Joyful celebratory jump
      this.kinematicsCarrier.style.transition = 'transform 0.15s ease-in';
      this.kinematicsCarrier.style.transform = 'translateY(8px) scale(1.05, 0.95)';

      setTimeout(() => {
        this.kinematicsCarrier.style.transition = 'transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        this.kinematicsCarrier.style.transform = 'translateY(-50px) scale(0.96, 1.06)';

        setTimeout(() => {
          this.kinematicsCarrier.style.transition = 'transform 0.25s ease-out';
          this.kinematicsCarrier.style.transform = 'translateY(0) scale(1, 1)';

          // After celebration: turn and walk out to right
          setTimeout(() => {
            this.walkOutToRight(callback);
          }, 1200);
        }, 400);
      }, 150);
    }

    // 2. User clicked "No / Not now" -> Throw the chair straight towards user with "You will die here!"
    triggerThrowChair(callback) {
      this.state = 'THROW_CHAIR';
      this.kinematicsCarrier.classList.remove('ab-breathing');

      // Voice: "You will die here!"
      speakCharacter("You will die here!", { angry: true });

      // Switch to furious throw pose
      this.setPose('throw');

      // Anticipation wind-up
      this.kinematicsCarrier.style.transition = 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)';
      this.kinematicsCarrier.style.transform = 'translateY(-14px) rotate(-4deg) scale(0.96, 1.04)';

      setTimeout(() => {
        // Dramatic forward thrust throw
        this.kinematicsCarrier.style.transition = 'transform 0.18s cubic-bezier(0.15, 0.85, 0.35, 1)';
        this.kinematicsCarrier.style.transform = 'translateY(8px) rotate(6deg) scale(1.06, 0.94)';

        // 3D Flying Chair trajectory launching directly toward user camera screen!
        this.flyingChair.style.opacity = '1';
        this.flyingChair.style.transition = 'transform 0.85s cubic-bezier(0.1, 0.82, 0.25, 1), opacity 0.85s ease-in';
        // Massive 3D zoom straight into screen with 3D rotation and spin
        this.flyingChair.style.transform = 'translate3d(-20px, -90px, 800px) scale(5.8) rotateZ(1080deg) rotateX(160deg)';

        setTimeout(() => {
          // Impact on screen!
          if (typeof this.onScreenImpact === 'function') {
            this.onScreenImpact();
          }

          // Chair fades after impact
          this.flyingChair.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
          this.flyingChair.style.opacity = '0';
          this.flyingChair.style.transform += ' translateY(80px)';

          // Angry Leo stomps off screen to right
          setTimeout(() => {
            this.walkOutToRight(callback, true);
          }, 600);
        }, 820);
      }, 220);
    }

    walkOutToRight(callback, isAngry = false) {
      this.state = 'WALK_OUT_RIGHT';
      this.walkOutCallback = callback || null;
      this.fxSparkles.classList.remove('active');
      this.kinematicsCarrier.classList.remove('ab-breathing');

      // Face right (scaleX -1 for carry/walk pose)
      this.setPose('carry');
      this.pivotLayer.style.transform = 'scaleX(-1)';

      this.walkOutStartTime = performance.now();
      this.walkOutDuration = isAngry ? 1800 : 2500; // Angry stomps faster
      this.stepFrequency = isAngry ? 3.4 : 2.4;
    }

    destroy() {
      this.isDestroyed = true;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  }

  // Export both engines
  AquaBuddy3DCharacter.WalkChair = AquaBuddy3DWalkChair;
  AquaBuddy3DCharacter.AquaBuddy3DWalkChair = AquaBuddy3DWalkChair;
  AquaBuddy3DCharacter.AquaBuddy3DCharacter = AquaBuddy3DCharacter;

  if (typeof window !== 'undefined') {
    window.AquaBuddy3DCharacter = AquaBuddy3DCharacter;
    window.AquaBuddy3DWalkChair = AquaBuddy3DWalkChair;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.AquaBuddy3DCharacter = AquaBuddy3DCharacter;
    globalThis.AquaBuddy3DWalkChair = AquaBuddy3DWalkChair;
  }

  return AquaBuddy3DCharacter;
}));
