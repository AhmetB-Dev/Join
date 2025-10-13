(() => {
  "use strict";

  const splash = document.getElementById("splash");
  const logo = document.getElementById("joinLogo");
  const loginPanel = document.getElementById("loginPanel");
  const signupPanel = document.getElementById("signupPanel");
  const signContainer = document.querySelector(".sign-container");
  const headerRight =
    document.querySelector(".header-right-side") ||
    document.querySelector(".header-right") ||
    document.getElementById("headerRight") ||
    document.querySelector("header .header-right") ||
    document.querySelector("header .header-right-side");
  const SPLASH_HOLD_MS = 800;

  /** Schaltet die Hauptansicht sichtbar. */
  function revealMain() {
    document.body.classList.add("show-login");
  }

  /** Prüft Reduced-Motion. */
  function prefersReduced() {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    return !!mq && mq.matches;
  }

  /** Liefert Marken-Container im Header. */
  function getBrand() {
    return document.getElementById("brandSlot") || document.querySelector("header .brand");
  }

  /** Platziert Logo im Header. */
  function setLogoInHeader() {
    const brand = getBrand();
    if (!logo || !brand) return false;
    brand.appendChild(logo);
    logo.classList.remove("splash-logo");
    logo.classList.add("header-logo");
    return true;
  }

  /** Berechnet FLIP-Werte. */
  function computeFlip(first, last) {
    return {
      dx: first.left - last.left,
      dy: first.top - last.top,
      sx: first.width / Math.max(last.width, 1),
      sy: first.height / Math.max(last.height, 1),
    };
  }

  /** Führt FLIP-Transform aus. */
  function runFlip(logoEl, t) {
    logoEl.style.transformOrigin = "top left";
    logoEl.style.willChange = "transform, opacity";
    logoEl.style.transform = `translate(${t.dx}px,${t.dy}px) scale(${t.sx},${t.sy})`;
    void logoEl.getBoundingClientRect();
    logoEl.style.transition = "transform 1400ms cubic-bezier(.2,.8,.2,1), opacity 1400ms ease";
    logoEl.style.transform = "none";
  }

  /** Registriert Cleanup nach Animation. */
  function addFlipCleanup() {
    const onEnd = () => {
      Object.assign(logo.style, { transition: "", transform: "", willChange: "" });
      splash?.remove();
      logo.removeEventListener("transitionend", onEnd);
    };
    logo.addEventListener("transitionend", onEnd);
  }

  /** Animiert Logo in den Header. */
  function animateLogoIntoHeader() {
    const brand = getBrand();
    if (!logo || !brand) {
      splash?.remove();
      return;
    }
    const first = logo.getBoundingClientRect();
    if (!setLogoInHeader()) {
      splash?.remove();
      return;
    }
    const last = logo.getBoundingClientRect();
    if (prefersReduced()) {
      splash?.remove();
      return;
    }
    runFlip(logo, computeFlip(first, last));
    splash?.classList.add("is-fading");
    addFlipCleanup();
  }

  /** Aktiviert Gastmodus und leitet weiter. */
  function handleGuestLogin() {
    try {
      localStorage.setItem("isGuest", "true");
      ["name", "firstName", "lastName"].forEach((k) => localStorage.removeItem(k));
      sessionStorage.setItem("summary.triggerSplash", "1");
      localStorage.setItem("summary.triggerSplash", "1");
    } catch {}
    window.location.href = "../summary.html";
  }

  /** Schaltet Panels. */
  function setPanels(isSignup) {
    loginPanel?.classList.toggle("show", !isSignup);
    signupPanel?.classList.toggle("show", isSignup);
  }

  /** Schaltet Header-Rechts. */
  function setHeaderRight(isSignup) {
    headerRight?.classList.toggle("hidden", isSignup);
  }

  /** Schaltet Umschaltcontainer. */
  function setSignContainer(isSignup) {
    signContainer?.classList.toggle("hidden", isSignup);
  }

  /** Rendert Auth-UI. */
  function renderAuthUI() {
    const isSignup = window.mode === "signup";
    setPanels(isSignup);
    setHeaderRight(isSignup);
    setSignContainer(isSignup);
  }

  /** Prüft rechte Hitbox. */
  function isRightHitbox(ev, el, px = 36) {
    const r = el.getBoundingClientRect();
    return r.right - ev.clientX <= px;
  }

  /** Schaltet Passwortfeld. */
  function togglePassword(el) {
    const isPass = el.type === "password";
    el.type = isPass ? "text" : "password";
    el.classList.toggle("passwort-icon", !isPass);
    el.classList.toggle("visibile-icon", isPass);
  }

  /** Bindet Toggle an Feld. */
  function attachPasswordToggleById(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.type = "password";
    el.classList.add("passwort-icon");
    function onPointerDown(ev) {
      if (isRightHitbox(ev, el)) {
        ev.preventDefault();
        togglePassword(el);
      }
    }
    el.addEventListener("pointerdown", onPointerDown);
  }

  /** Initialisiert Passwort-Toggles. */
  function setupPasswordToggle() {
    attachPasswordToggleById("loginPassword");
    attachPasswordToggleById("signupPassword");
    attachPasswordToggleById("signupPasswordConfirm");
  }

  /** Öffnet Signup per Klick. */
  function handleOpenSignupClick(e) {
    e.preventDefault();
    window.mode = "signup";
    renderAuthUI();
  }

  /** Zurück zum Login. */
  function handleBackToLoginClick(e) {
    e.preventDefault();
    window.mode = "login";
    renderAuthUI();
  }

  /** Bindet Modus-Buttons. */
  function bindModeButtons() {
    document.getElementById("switchAuthBtn")?.addEventListener("click", handleOpenSignupClick);
    document.getElementById("switchAuthBtnBottom")?.addEventListener("click", handleOpenSignupClick);
    document.getElementById("openSignupBtn")?.addEventListener("click", handleOpenSignupClick);
    document.getElementById("backToLoginBtn")?.addEventListener("click", handleBackToLoginClick);
  }

  /** Startsequenz. */
  function boot() {
    revealMain();
    setTimeout(() => {
      try {
        animateLogoIntoHeader();
      } catch {
        if (setLogoInHeader()) splash?.remove();
        else splash?.remove();
      }
    }, SPLASH_HOLD_MS + 60);
  }

  /** Initialisiert Datei. */
  function init() {
    window.mode = new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "login";
    window.renderAuthUI = renderAuthUI;
    bindModeButtons();
    document.getElementById("btn-guest-log-in")?.addEventListener("click", handleGuestLogin);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        renderAuthUI();
        setupPasswordToggle();
        boot();
      });
    } else {
      renderAuthUI();
      setupPasswordToggle();
      boot();
    }
  }

  init();
})();
