/* Unified share handler for SPA + dynamic content. 
   PDF viewer removed so .podcast-read-button works as a normal link. */
(function () {
  if (window.__sr_share_controller_initialized) {
    console.log("🟢 share controller already initialized");
    return;
  }
  window.__sr_share_controller_initialized = true;
  console.log("🟢 initializing unified share controller (no PDF)");

  // --- Firebase init (leave your existing config) ---
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyBHlj9RhhXTBF2M57pTLrivJVrS4lwSsDY",
      authDomain: "saharanrockin-ce936.firebaseapp.com",
      databaseURL: "https://saharanrockin-ce936-default-rtdb.firebaseio.com",
      projectId: "saharanrockin-ce936",
      storageBucket: "saharanrockin-ce936.appspot.com",
      messagingSenderId: "455262827501",
      appId: "1:455262827501:web:ef0f2eaff75c97e4f82de4",
      measurementId: "G-973JBJ5QE1",
    };
    if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.warn("Firebase init skipped or failed:", err);
  }

  // Helper - ensure share modal exists
  function ensureModalExists() {
    let share = document.getElementById('sharePopupModal');
    if (!share) {
      share = document.createElement('div');
      share.id = 'sharePopupModal';
      share.className = 'share-popup-modal';
      share.innerHTML = `
        <div class="share-popup-content">
          <div class="share-header"><p>SHARE</p><button class="share-close">&times;</button></div>
          <div class="share-options">
            <button data-share="whatsapp"><i class="bi bi-whatsapp"></i><p>Whatsapp</p></button>
            <button data-share="twitter"><i class="bi bi-twitter-x"></i><p>X</p></button>
            <button data-share="facebook"><i class="bi bi-facebook"></i><p>Facebook</p></button>
            <button data-share="reddit"><i class="bi bi-reddit"></i><p>Reddit</p></button>
          </div>
          <div class="share-input"><input type="text" readonly id="shareLinkInput"><button id="copyShare">COPY</button></div>
        </div>
      `;
      document.body.appendChild(share);
      console.warn("⚠️ sharePopupModal was missing — created fallback modal.");
    }
  }

  ensureModalExists();

  // Elements
  const shareModal = document.getElementById('sharePopupModal');
  const shareInput = document.getElementById('shareLinkInput');
  const copyBtn = document.getElementById('copyShare');

  let currentShareLink = '';

  // Open/close functions
  function showElement(el) {
    if (!el) return;
    el.classList.add('active');
    el.style.display = 'flex';
    el.style.zIndex = 99999;
    el.setAttribute('aria-hidden', 'false');
  }
  function hideElement(el) {
    if (!el) return;
    el.classList.remove('active');
    el.style.display = 'none';
    el.removeAttribute('aria-hidden');
  }

  function openSharePopup(link) {
    try {
      currentShareLink = link || window.location.href;
      if (shareInput) shareInput.value = currentShareLink;
      showElement(shareModal);
      console.log("🟢 openSharePopup ->", currentShareLink);
    } catch (err) { console.error("openSharePopup error", err); }
  }
  function closeSharePopup() {
    hideElement(shareModal);
    currentShareLink = '';
    if (shareInput) shareInput.value = '';
    console.log("🟡 closeSharePopup");
  }

  // Copy helper
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      }
    } catch (err) {
      console.error("copyToClipboard failed", err);
      return false;
    }
  }

  // Social share builder
  function openSocialShare(type, link) {
    const text = "Check out this chapter from Exodus of Time!";
    const encoded = encodeURIComponent;
    const url = {
      whatsapp: `https://wa.me/?text=${encoded(text + ' ' + link)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encoded(text)}&url=${encoded(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded(link)}`,
      reddit: `https://www.reddit.com/submit?url=${encoded(link)}&title=${encoded(document.title)}`,
    }[type];
    if (url) window.open(url, '_blank');
  }

  // --- Event delegation ---
  document.addEventListener('click', (ev) => {
    const target = ev.target;

    // Main share button
    const mainShare = target.closest && target.closest('#mainShareButton');
    if (mainShare) {
      ev.preventDefault();
      openSharePopup(window.location.href);
      return;
    }

    // Track share buttons
    const trackShare = target.closest && target.closest('.podcast-share-track-button');
    if (trackShare) {
      ev.preventDefault();
      const link = trackShare.dataset.fileLink || trackShare.getAttribute('data-file-link') || window.location.href;
      openSharePopup(link);
      return;
    }

    // Read buttons → let them behave as normal <a>/<button> links
    const readBtn = target.closest && target.closest('.podcast-read-button');
    if (readBtn) {
      // don’t intercept, just let browser follow the link
      return;
    }

    // Copy share button
    const copyBtnClicked = target.closest && target.closest('#copyShare');
    if (copyBtnClicked) {
      ev.preventDefault();
      const linkToCopy = (shareInput && shareInput.value) || window.location.href;
      copyToClipboard(linkToCopy).then(ok => {
        if (ok) {
          copyBtnClicked.textContent = 'COPIED!';
          setTimeout(() => { if (copyBtnClicked) copyBtnClicked.textContent = 'COPY'; }, 1600);
        }
      });
      return;
    }

    // Social share buttons inside modal
    const socialBtn = target.closest && target.closest('[data-share]');
    if (socialBtn) {
      ev.preventDefault();
      const type = socialBtn.getAttribute('data-share');
      const link = currentShareLink || (shareInput && shareInput.value) || window.location.href;
      openSocialShare(type, link);
      closeSharePopup();
      return;
    }

    // modal close buttons
    if (target.closest && target.closest('.share-close')) {
      ev.preventDefault();
      closeSharePopup();
      return;
    }
  }, true);

  // Close share modal when clicking background
  shareModal.addEventListener('click', (ev) => {
    if (ev.target === shareModal) closeSharePopup();
  });

  // Escape key closes share modal
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (shareModal.classList.contains('active')) closeSharePopup();
    }
  });

  // CustomEvent support
  document.addEventListener('openSharePopup', (e) => {
    const link = e?.detail?.link || window.location.href;
    openSharePopup(link);
  });

  console.log("🟢 unified share controller ready (PDF removed)");
})();