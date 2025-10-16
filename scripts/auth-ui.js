(() => {
  "use strict";
  const REDIRECT_AFTER_AUTH = "../summary.html";
  const { isValidEmail, createUser, verifyLogin } = window.AuthCore || {};

  /** Get element by id. @param {string} id @returns {HTMLElement|null} */
  const byId = (id) => document.getElementById(id);

  /** Get trimmed value of input by id. @param {string} id @returns {string} */
  const valueOf = (id) => (byId(id)?.value || "").trim();

  /** Mark elements invalid (aria-invalid). @param {HTMLElement[]} els */
  const setInvalid = (els) => els.filter(Boolean).forEach((n) => n.setAttribute("aria-invalid", "true"));

  /** Clear aria-invalid on elements. @param {HTMLElement[]} els */
  const clearInvalid = (els) => els.filter(Boolean).forEach((n) => n.removeAttribute("aria-invalid"));

  /**
   * Show a status message (creates host if missing).
   * @param {string} text
   * @param {boolean=} ok
   */
  const showMsg = (text, ok = false) => {
    const isSignup = window.mode === "signup" || byId("signupPanel")?.classList.contains("show");
    const id = isSignup ? "authMessageSignup" : "authMessageLogin";
    let host = byId(id) || byId("authMessage");
    if (!host) {
      const panel = isSignup ? byId("signupPanel") : byId("loginPanel");
      if (!panel) return;
      host = document.createElement("div");
      host.id = id;
      host.className = "auth-message";
      panel.prepend(host);
    }
    host.textContent = text || "";
    host.style.color = ok ? "#1B5E20" : "#DC2626";
    host.classList.toggle("is-hidden", !text);
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    if (!host.style.minHeight) host.style.minHeight = "24px";
  };

  /** Read signup values. @returns {{name:string,email:string,pass:string,pass2:string,accepted:boolean}} */
  const readSignup = () => ({
    name: valueOf("signupName"),
    email: valueOf("signupEmail"),
    pass: valueOf("signupPassword"),
    pass2: valueOf("signupPasswordConfirm"),
    accepted: !!byId("acceptPolicy")?.checked,
  });

  /** Return missing/invalid signup elements. @param {ReturnType<readSignup>} p @returns {HTMLElement[]} */
  const findMissing = (p) => {
    const m = [];
    if (!p.name) m.push(byId("signupName"));
    if (!p.email) m.push(byId("signupEmail"));
    if (!p.pass) m.push(byId("signupPassword"));
    if (!p.pass2) m.push(byId("signupPasswordConfirm"));
    if (!p.accepted) m.push(byId("acceptPolicy"));
    return m;
  };

  /** Reset signup fields & errors. */
  const resetSignup = () => {
    ["signupName", "signupEmail", "signupPassword", "signupPasswordConfirm"].forEach((id) => {
      const e = byId(id);
      if (e) e.value = "";
    });
    const cb = byId("acceptPolicy");
    if (cb) cb.checked = false;
    clearInvalid([
      byId("signupName"),
      byId("signupEmail"),
      byId("signupPassword"),
      byId("signupPasswordConfirm"),
      byId("acceptPolicy"),
    ]);
  };

  /** Show short success toast. @param {string=} msg */
  const toast = (msg = "Erfolgreich registriert") => {
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
  };

  /** Switch UI to login after signup. */
  const postSignupSwitch = () =>
    setTimeout(() => {
      window.mode = "login";
      renderAuth();
      byId("loginEmail")?.focus();
    }, 900);

  /** Store login flags (non-guest). @param {{name?:string}} user */
  const setLoggedIn = (user) => {
    const name = String(user?.name || "").trim();
    localStorage.setItem("isGuest", "false");
    localStorage.setItem("name", name || "");
    sessionStorage.setItem("summary.triggerSplash", "1");
    localStorage.setItem("summary.triggerSplash", "1");
  };

  /** Validate signup inputs. @returns {{msg:string,els:HTMLElement[]}|null} */
  const validateSignup = (p) => {
    const miss = findMissing(p);
    if (miss.length) return { msg: "Bitte alle Felder ausfüllen.", els: miss };
    if (!isValidEmail(p.email))
      return { msg: "Bitte gültige E-Mail-Adresse eingeben.", els: [byId("signupEmail")] };
    if (p.pass !== p.pass2)
      return {
        msg: "Passwörter stimmen nicht überein.",
        els: [byId("signupPassword"), byId("signupPasswordConfirm")],
      };
    return null;
  };

  /** Handle signup submit. @param {Event} e */
  const onSignupSubmit = async (e) => {
    e?.preventDefault();
    const p = readSignup();
    clearInvalid([
      byId("signupName"),
      byId("signupEmail"),
      byId("signupPassword"),
      byId("signupPasswordConfirm"),
      byId("acceptPolicy"),
    ]);
    showMsg("");
    const err = validateSignup(p);
    if (err) return setInvalid(err.els), showMsg(err.msg);
    try {
      await createUser({ fullName: p.name, emailAddress: p.email, password: p.pass });
      resetSignup();
      toast();
      postSignupSwitch();
    } catch (ex) {
      setInvalid([byId("signupEmail")]);
      showMsg(ex?.message || "Registrierung fehlgeschlagen.");
    }
  };

  /** Validate login inputs. @returns {{msg:string,els:HTMLElement[]}|null} */
  const validateLogin = (email, pass) => {
    if (!isValidEmail(email))
      return { msg: "Bitte gültige E-Mail-Adresse eingeben.", els: [byId("loginEmail")] };
    if (!email || !pass)
      return { msg: "Bitte E-Mail und Passwort eingeben.", els: [byId("loginEmail"), byId("loginPassword")] };
    return null;
  };

  /** Handle login submit. @param {Event} e */
  const onLoginSubmit = async (e) => {
    e?.preventDefault();
    const email = valueOf("loginEmail"),
      pass = valueOf("loginPassword");
    clearInvalid([byId("loginEmail"), byId("loginPassword")]);
    showMsg("");
    const err = validateLogin(email, pass);
    if (err) return setInvalid(err.els), showMsg(err.msg);
    try {
      const u = await verifyLogin(email, pass);
      setLoggedIn(u);
      showMsg("Login erfolgreich. Weiterleiten …", true);
      window.location.href = REDIRECT_AFTER_AUTH;
    } catch {
      setInvalid([byId("loginEmail"), byId("loginPassword")]);
      showMsg("E-Mail und Passwort prüfen.");
    }
  };

  /** Clear error when policy checked. */
  const onPolicyChange = () => {
    const cb = byId("acceptPolicy");
    if (cb?.checked) {
      clearInvalid([cb]);
      showMsg("");
    }
  };

  /** Bind click/submit handlers and guest login. */
  const bindAuthUI = () => {
    const login = byId("loginBtn"),
      signup = byId("createAccountBtn");
    [login, signup].forEach((b) => {
      if (b) b.type = "button";
    });
    signup?.addEventListener("click", onSignupSubmit);
    login?.addEventListener("click", onLoginSubmit);
    login?.closest("form")?.addEventListener("submit", onLoginSubmit);
    signup?.closest("form")?.addEventListener("submit", onSignupSubmit);
    byId("acceptPolicy")?.addEventListener("change", onPolicyChange);
    byId("btn-guest-log-in")?.addEventListener("click", handleGuestLogin);
  };

  /** True if pointer is in right-side hitbox. @param {PointerEvent} ev @param {HTMLInputElement} el @param {number=} px */
  const isRightHitbox = (ev, el, px = 36) => el.getBoundingClientRect().right - ev.clientX <= px;

  /** Toggle password visibility & icon classes. @param {HTMLInputElement} el */
  const togglePass = (el) => {
    const isPass = el.type === "password";
    el.type = isPass ? "text" : "password";
    el.classList.toggle("passwort-icon", !isPass);
    el.classList.toggle("visibile-icon", isPass);
  };

  /** Add right-hitbox toggle to an input. @param {string} id */
  const attachPassToggle = (id) => {
    const el = byId(id);
    if (!el) return;
    el.type = "password";
    el.classList.add("passwort-icon");
    const onDown = (e) => {
      if (isRightHitbox(e, el)) {
        e.preventDefault();
        togglePass(el);
      }
    };
    el.addEventListener("pointerdown", onDown);
  };

  /** Enable password toggles for all inputs. */
  const setupPassToggles = () =>
    ["loginPassword", "signupPassword", "signupPasswordConfirm"].forEach(attachPassToggle);

  /** Show the main view (CSS hook). */
  const revealMain = () => document.body.classList.add("show-login");

  /** Animate splash logo via CSS and remove splash. */
  const animateSplash = () => {
    const s = byId("splash"),
      l = byId("joinLogo");
    const brand = byId("brandSlot") || document.querySelector("header .brand");
    if (!s || !l) return;
    if (!brand) return void s.remove();
    brand.appendChild(l);
    l.classList.remove("splash-logo");
    l.classList.add("header-logo", "logo-anim");
    const reduce = !!matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) {
      s.classList.add("is-fading");
      s.addEventListener("transitionend", () => s.remove(), { once: true });
      return;
    }
    s.classList.add("is-fading");
    l.addEventListener("animationend", () => s.remove(), { once: true });
  };

  /** Render auth view for current mode. */
  const renderAuth = () => {
    const isS = window.mode === "signup";
    byId("loginPanel")?.classList.toggle("show", !isS);
    byId("signupPanel")?.classList.toggle("show", isS);
    (
      document.querySelector(".header-right-side") || document.querySelector(".header-right")
    )?.classList.toggle("hidden", isS);
    document.querySelector(".sign-container")?.classList.toggle("hidden", isS);
  };

  /** Switch to signup mode. @param {Event} e */
  const openSignup = (e) => {
    e?.preventDefault?.();
    window.mode = "signup";
    renderAuth();
  };

  /** Switch back to login mode. @param {Event} e */
  const backToLogin = (e) => {
    e?.preventDefault?.();
    window.mode = "login";
    renderAuth();
  };

  /** Bind mode switch buttons. */
  const bindModeButtons = () => {
    byId("switchAuthBtn")?.addEventListener("click", openSignup);
    byId("switchAuthBtnBottom")?.addEventListener("click", openSignup);
    byId("openSignupBtn")?.addEventListener("click", openSignup);
    byId("backToLoginBtn")?.addEventListener("click", backToLogin);
  };

  /** Guest login: mark and redirect. */
  const handleGuestLogin = () => {
    try {
      localStorage.setItem("isGuest", "true");
      ["name", "firstName", "lastName"].forEach((k) => localStorage.removeItem(k));
      sessionStorage.setItem("summary.triggerSplash", "1");
      localStorage.setItem("summary.triggerSplash", "1");
    } catch {}
    window.location.href = REDIRECT_AFTER_AUTH;
  };

  /** Initialize module, bind UI, run splash. */
  const init = () => {
    window.mode = new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "login";
    window.renderAuth = renderAuth;
    bindModeButtons();
    bindAuthUI();
    setupPassToggles();
    renderAuth();
    revealMain();
    setTimeout(() => {
      try {
        animateSplash();
      } catch {
        byId("splash")?.remove();
      }
    }, 860);
  };

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
