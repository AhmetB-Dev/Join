(() => {
  "use strict";

  const REDIRECT_AFTER_AUTH = "../summary.html";
  const EMAIL_REGEX = /^[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

  /** Liefert aktives Meldungs-Element. */
  function getMessageElement() {
    const mode =
      window.mode ||
      (document.getElementById("signupPanel")?.classList.contains("show") ? "signup" : "login");
    return (
      (mode === "signup"
        ? document.getElementById("authMessageSignup")
        : document.getElementById("authMessageLogin")) || document.getElementById("authMessage")
    );
  }

  /** Reserviert Platz im Meldungs-Element. */
  function ensureMsgSpace(el) {
    if (!el || el.dataset.reserved) return;
    const h = el.offsetHeight || 0;
    el.style.minHeight = (h || 24) + "px";
    el.dataset.reserved = "1";
  }

  /** Zeigt globale Meldung. */
  function showGlobalMessage(text, ok = false) {
    const el = getMessageElement();
    if (!el) return;
    ensureMsgSpace(el);
    el.textContent = text || "";
    el.style.color = ok ? "#1B5E20" : "#DC2626";
    el.classList.toggle("is-hidden", !text);
  }

  /** Entfernt aria-invalid. */
  function clearInvalidState(...els) {
    els.filter(Boolean).forEach((n) => n.removeAttribute("aria-invalid"));
  }

  /** Setzt aria-invalid. */
  function applyInvalidState(...els) {
    els.filter(Boolean).forEach((n) => n.setAttribute("aria-invalid", "true"));
  }

  /** Prüft E-Mail-Format. */
  function isValidEmailAddress(email) {
    return EMAIL_REGEX.test(String(email || "").trim());
  }

  /** Erzeugt Demo-Hash. */
  function generateSimpleHash(raw) {
    const bytes = new TextEncoder().encode(String(raw));
    const sum = bytes.reduce((a, n) => a + n, 0);
    return "h:" + sum.toString(16);
  }

  /** Holt User via Index. */
  async function fetchByIndex(lower) {
    const key = String(lower).replace(/[.#$\[\]\/]/g, "_");
    try {
      const id = await window.firebaseGet(`/emailIndex/${key}`);
      if (id) return window.firebaseGet(`/users/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
    return null;
  }

  /** Holt User via Scan. */
  async function fetchByScan(lower) {
    try {
      const all = await window.firebaseGet("/users");
      return Object.values(all || {}).find((u) => (u?.email || "").toLowerCase().trim() === lower) || null;
    } catch {
      return null;
    }
  }

  /** Holt User per E-Mail. */
  async function fetchUserByEmail(lower) {
    return (await fetchByIndex(lower)) || (await fetchByScan(lower));
  }

  /** Erzeugt User-ID. */
  function createUserId() {
    return "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  /** Baut User-Datensatz. */
  function createUserRecord(id, fullName, lower, pass) {
    return {
      uid: id,
      name: fullName,
      email: lower,
      passwordHash: generateSimpleHash(pass),
      createdAt: Date.now(),
    };
  }

  /** Speichert User. */
  async function saveUserRecord(id, rec) {
    return window.firebasePut(`/users/${encodeURIComponent(id)}`, rec);
  }

  /** Indiziert E-Mail. */
  async function saveEmailIndex(lower, id) {
    const key = String(lower).replace(/[.#$\[\]\/]/g, "_");
    return window.firebasePut(`/emailIndex/${key}`, id);
  }

  /** Legt neuen User an. */
  async function createNewUser({ fullName, emailAddress, rawPassword }) {
    const lower = String(emailAddress || "")
      .toLowerCase()
      .trim();
    if (!lower) throw new Error("Bitte E-Mail angeben.");
    if (await fetchUserByEmail(lower)) throw new Error("E-Mail ist bereits registriert.");
    const id = createUserId();
    const rec = createUserRecord(id, fullName, lower, rawPassword);
    await saveUserRecord(id, rec);
    await saveEmailIndex(lower, id);
    return rec;
  }

  /** Prüft Login-Zugangsdaten. */
  async function verifyLoginCredentials(email, pass) {
    const lower = String(email || "")
      .toLowerCase()
      .trim();
    const user = await fetchUserByEmail(lower);
    if (!user || user.passwordHash !== generateSimpleHash(pass)) throw new Error("auth/wrong-credentials");
    return user;
  }

  /** Liefert Element per ID. */
  function get(id) {
    return document.getElementById(id);
  }

  /** Liefert getrimmten Wert. */
  function getValue(id) {
    return (get(id)?.value || "").trim();
  }

  /** Sammelt Signup-Daten. */
  function collectSignupData() {
    return {
      name: getValue("signupName"),
      email: getValue("signupEmail"),
      password: getValue("signupPassword"),
      passwordConfirm: getValue("signupPasswordConfirm"),
      acceptedPolicy: !!get("acceptPolicy")?.checked,
    };
  }

  /** Prüft Pflichtfelder. */
  function validateMissing(p) {
    const miss = [];
    if (!p.name) miss.push(get("signupName"));
    if (!p.email) miss.push(get("signupEmail"));
    if (!p.password) miss.push(get("signupPassword"));
    if (!p.passwordConfirm) miss.push(get("signupPasswordConfirm"));
    if (!p.acceptedPolicy) miss.push(get("acceptPolicy"));
    return miss;
  }

  /** Prüft E-Mail-Format im Payload. */
  function validateEmailFormat(p) {
    return isValidEmailAddress(p.email) ? null : "Bitte gültige E-Mail-Adresse eingeben.";
  }

  /** Prüft Passwort-Gleichheit. */
  function validatePasswordMatch(p) {
    return p.password === p.passwordConfirm ? null : "Passwörter stimmen nicht überein.";
  }

  /** Setzt Signup-Formular zurück. */
  function resetSignupForm() {
    ["signupName", "signupEmail", "signupPassword", "signupPasswordConfirm"].forEach((id) => {
      const el = get(id);
      if (el) el.value = "";
    });
    const cb = get("acceptPolicy");
    if (cb) cb.checked = false;
    clearInvalidState(
      get("signupName"),
      get("signupEmail"),
      get("signupPassword"),
      get("signupPasswordConfirm"),
      get("acceptPolicy")
    );
  }

  /** Zeigt Signup-Toast. */
  function showSignupToast(msg = "Erfolgreich registriert") {
    document.querySelector(".toast-signup")?.remove();
    const t = document.createElement("div");
    t.className = "toast-signup";
    t.role = "status";
    t.setAttribute("aria-live", "polite");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.classList.add("hide");
      t.addEventListener("transitionend", () => t.remove(), { once: true });
    }, 700);
  }

  /** Schaltet nach Signup zum Login. */
  function switchToLoginAfterSignup() {
    setTimeout(() => {
      if (typeof window.renderAuthUI === "function") {
        window.mode = "login";
        window.renderAuthUI();
      }
      get("loginEmail")?.focus();
    }, 900);
  }

  /** Handhabt Signup-Submit. */
  async function handleSignupSubmit(ev) {
    ev?.preventDefault();
    const p = collectSignupData();
    clearInvalidState(
      get("signupName"),
      get("signupEmail"),
      get("signupPassword"),
      get("signupPasswordConfirm"),
      get("acceptPolicy")
    );
    showGlobalMessage("");
    const miss = validateMissing(p);
    if (miss.length) {
      applyInvalidState(...miss);
      return showGlobalMessage("Bitte alle Felder ausfüllen.");
    }
    const eMsg = validateEmailFormat(p) || validatePasswordMatch(p);
    if (eMsg) {
      applyInvalidState(get("signupEmail"));
      return showGlobalMessage(eMsg);
    }
    try {
      await createNewUser({ fullName: p.name, emailAddress: p.email, rawPassword: p.password });
      resetSignupForm();
      showSignupToast();
      switchToLoginAfterSignup();
    } catch (err) {
      applyInvalidState(get("signupEmail"));
      showGlobalMessage(err?.message || "Registrierung fehlgeschlagen.");
    }
  }

  /** Setzt Login-State nach Erfolg. */
  function setLoginStateAfterSuccess(user) {
    const name =
      String(user.name || "").trim() || [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    localStorage.setItem("isGuest", "false");
    localStorage.setItem("name", name || "");
    sessionStorage.setItem("summary.triggerSplash", "1");
    localStorage.setItem("summary.triggerSplash", "1");
  }

  /** Handhabt Login-Submit. */
  async function handleLoginSubmit(ev) {
    ev?.preventDefault();
    const email = getValue("loginEmail");
    const pass = getValue("loginPassword");
    clearInvalidState(get("loginEmail"), get("loginPassword"));
    showGlobalMessage("");
    if (!isValidEmailAddress(email)) {
      applyInvalidState(get("loginEmail"));
      return showGlobalMessage("Bitte gültige E-Mail-Adresse eingeben.");
    }
    if (!email || !pass) {
      applyInvalidState(get("loginEmail"), get("loginPassword"));
      return showGlobalMessage("Bitte E-Mail und Passwort eingeben.");
    }
    try {
      const u = await verifyLoginCredentials(email, pass);
      setLoginStateAfterSuccess(u);
      showGlobalMessage("Login erfolgreich. Weiterleiten …", true);
      window.location.href = REDIRECT_AFTER_AUTH;
    } catch {
      applyInvalidState(get("loginEmail"), get("loginPassword"));
      showGlobalMessage("E-Mail und Passwort prüfen.");
    }
  }

  /** Checkbox-Fixup. */
  function onCheckboxChange() {
    const cb = get("acceptPolicy");
    if (cb?.checked) {
      clearInvalidState(cb);
      showGlobalMessage("");
    }
  }

  /** Bindet Button-Events. */
  function initAuthHandlers() {
    get("createAccountBtn")?.addEventListener("click", handleSignupSubmit);
    get("loginBtn")?.addEventListener("click", handleLoginSubmit);
  }

  /** Bindet Checkbox-Event. */
  function attachCheckboxFixup() {
    get("acceptPolicy")?.addEventListener("change", onCheckboxChange);
  }

  /** Initialisiert Datei. */
  function init() {
    initAuthHandlers();
    attachCheckboxFixup();
  }

  init();
})();
