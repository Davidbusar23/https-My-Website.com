/* Javascripts.js - shared script for Index and Log in pages */

// Replace with your Google OAuth Client ID
const GOOGLE_CLIENT_ID = '414372901780-teomd9sqcjfs2carhmv3a4j9rt2pk4gh.apps.googleusercontent.com';

// Play a short "ting" using Web Audio
function playTing(duration = 160, freq = 1200) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  try {
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);

    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration/1000);

    o.start();
    setTimeout(() => { o.stop(); try { ctx.close(); } catch (e) {} }, duration);
  } catch (e) {
    // ignore if WebAudio unavailable
  }
}

function isGoogleAccount(email) {
  if (!email) return false;
  email = email.trim().toLowerCase();
  return /@(gmail\.com|googlemail\.com)$/i.test(email);
}

// Decode the JWT payload (lightweight)
function decodeJwtResponse(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch (e) {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e2) { return {}; }
  }
}

// Global handler called by Google Identity Services
function handleCredentialResponse(response) {
  const user = decodeJwtResponse(response.credential || response);
  playTing(180, 1400);
  const messageEl = document.getElementById('message');
  if (messageEl) {
    messageEl.textContent = 'Logged in!';
    messageEl.className = 'message success';
  }
  const profileEl = document.getElementById('googleProfile');
  if (profileEl) profileEl.textContent = (user.name ? user.name + ' — ' : '') + (user.email || '');
  const signOutBtn = document.getElementById('googleSignOut');
  if (signOutBtn) signOutBtn.style.display = 'inline-block';
}
window.handleCredentialResponse = handleCredentialResponse;

// Initialize Google Identity Services button
console.log('Javascripts.js loaded. GOOGLE_CLIENT_ID=', GOOGLE_CLIENT_ID);
function initGoogle() {
  console.log('initGoogle called; GOOGLE_CLIENT_ID=', GOOGLE_CLIENT_ID, 'window.google=', !!window.google);
  try {
    if (window.google && google.accounts && google.accounts.id && !window._gsiInitialized) {
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: window.handleCredentialResponse });
      const el = document.getElementById('gSignIn');
      if (el) google.accounts.id.renderButton(el, { theme: 'outline', size: 'large' });
      google.accounts.id.prompt();
      window._gsiInitialized = true;
      console.log('GSI initialized');
    } else {
      console.log('GSI not initialized: missing google.accounts or already initialized');
    }
  } catch (err) {
    console.error('GSI init error', err);
  }
}
window.initGoogle = initGoogle;

// DOM bindings for both pages
document.addEventListener('DOMContentLoaded', function() {
  // Index: Continue button
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', function() {
      playTing();
      setTimeout(() => { window.location.href = 'Log in.html'; }, 180);
    });
  }

  // Log in: form behavior
  const form = document.getElementById('loginForm');
  if (form) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageEl = document.getElementById('message');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = emailInput.value;
      const password = passwordInput.value;
      if (!email || !password) {
        if (messageEl) {
          messageEl.textContent = 'Please enter your email and password.';
          messageEl.className = 'message error';
        }
        return;
      }

      // Play feedback
      playTing();

      if (isGoogleAccount(email)) {
        if (messageEl) {
          messageEl.textContent = 'Logged in!';
          messageEl.className = 'message success';
        }
      } else {
        if (messageEl) {
          messageEl.textContent = 'Wrong password or email';
          messageEl.className = 'message error';
        }
        if (passwordInput) passwordInput.value = '';
      }
    });
  }

  // Google Sign-out
  const googleSignOut = document.getElementById('googleSignOut');
  if (googleSignOut) {
    googleSignOut.addEventListener('click', function() {
      if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
      const profileEl = document.getElementById('googleProfile'); if (profileEl) profileEl.textContent = '';
      const messageEl = document.getElementById('message'); if (messageEl) { messageEl.textContent = 'Signed out'; messageEl.className = 'message'; }
      this.style.display = 'none';
    });
  }

  // Try initializing Google (GSI script may load after us)
  setTimeout(function(){ if (window.google && window.initGoogle) window.initGoogle(); }, 300);
});