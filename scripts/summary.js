(() => {
  "use strict";
  /** @type {const} */
  const BASE_URL =
    (window.FIREBASE_URL && String(window.FIREBASE_URL)) ||
    "https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/";
  /** @type {const} */
  const TASKS_NODE = "tasks";
  /** @type {const} */
  const POLL_MS = 1500;
  /** @type {const} */
  const DATE_LOCALE = "en-US";
  /** @type {const} */
  const LABELS_MAP = {
    "to do": "todo",
    "to-do": "todo",
    done: "done",
    "tasks in board": "total",
    "tasks in progress": "inProgress",
    "awaiting feedback": "awaitFeedback",
  };

  /** Liest Daten von Firebase oder via fetch. */
  /** @param {string} path @returns {Promise<any>} */
  const firebaseGetPath = (path) =>
    typeof window.firebaseGet === "function"
      ? window.firebaseGet(path)
      : fetch(`${BASE_URL}${path}.json`)
          .then((r) => r.json())
          .catch(() => null);

  /** Normalisiert Spaltennamen. */
  /** @param {string} rawColumn @returns {"toDoColumn"|"inProgress"|"awaitFeedback"|"done"|""} */
  const normalizeColumn = (rawColumn) => {
    const lowered = String(rawColumn || "")
      .toLowerCase()
      .replace(/\s|_/g, "");
    if (lowered.includes("todo")) return "toDoColumn";
    if (lowered.includes("inprogress") || lowered === "progress") return "inProgress";
    if (lowered.includes("await") || lowered.includes("feedback") || lowered.includes("review"))
      return "awaitFeedback";
    if (lowered.includes("done") || lowered.includes("complete") || lowered.includes("finished"))
      return "done";
    return "";
  };

  /** Normalisiert Priorität. */
  /** @param {string} rawPriority @returns {"urgent"|"medium"|"low"} */
  const normalizePriority = (rawPriority) => {
    const lowered = String(rawPriority || "").toLowerCase();
    if (lowered.includes("urgent") || lowered === "high") return "urgent";
    if (lowered.includes("low")) return "low";
    return "medium";
  };

  /** Parst Datumstext zu Date. */
  /** @param {string|Date|null} inputDate @returns {Date|null} */
  const parseDate = (inputDate) => {
    if (!inputDate) return null;
    const text = String(inputDate).trim();
    let m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    const d = new Date(text);
    return isNaN(d) ? null : d;
  };

  /** Transformiert Rohdaten in kompakte Tasks. */
  /** @param {any} rawData @returns {{id:string,column:string,priority:string,dueDate:Date|null}[]} */
  const parseAndNormalizeTasks = (rawData) => {
    const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
    const rows = isObj(rawData) ? Object.values(rawData) : Array.isArray(rawData) ? rawData : [];
    return rows.filter(isObj).map((row, i) => ({
      id: row.firebaseKey || row.id || String(i),
      column: normalizeColumn(row.column ?? row.status ?? row.state ?? row.list ?? ""),
      priority: normalizePriority(row.priority ?? row.prio ?? ""),
      dueDate: parseDate(row.dueDate ?? row.deadline ?? row.date ?? ""),
    }));
  };

  /** Zählt Kennzahlen fürs Dashboard. */
  /** @param {ReturnType<parseAndNormalizeTasks>} tasks @returns {{total:number,todo:number,inProgress:number,awaitFeedback:number,done:number,urgent:number}} */
  const computeCounters = (tasks) => {
    const counters = { total: 0, todo: 0, inProgress: 0, awaitFeedback: 0, done: 0, urgent: 0 };
    for (const t of tasks) {
      counters.total++;
      if (t.column === "toDoColumn") counters.todo++;
      else if (t.column === "inProgress") counters.inProgress++;
      else if (t.column === "awaitFeedback") counters.awaitFeedback++;
      else if (t.column === "done") counters.done++;
      if (t.priority === "urgent") counters.urgent++;
    }
    return counters;
  };

  /** Nächste künftige Fälligkeit. */
  /** @param {ReturnType<parseAndNormalizeTasks>} tasks @returns {string} */
  const nextDeadline = (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = tasks
      .map((t) => t.dueDate)
      .filter((d) => d && d >= today)
      .sort((a, b) => a - b);
    const first = future[0] || null;
    return first
      ? first.toLocaleDateString(DATE_LOCALE, { year: "numeric", month: "long", day: "numeric" })
      : "—";
  };

  /** Normalisiert Labeltext fürs DOM-Mapping. */
  /** @param {string} rawLabelHtml @returns {string} */
  const norm = (rawLabelHtml) =>
    String(rawLabelHtml || "")
      .replace(/<br\s*\/?>(?=)/gi, " ")
      .toLowerCase()
      .replace(/[^\w ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  /** Schreibt Zähler/Deadline ins DOM. */
  /** @param {ReturnType<computeCounters>} counters @param {ReturnType<parseAndNormalizeTasks>} tasks */
  const renderCounters = (counters, tasks) => {
    document.querySelectorAll(".js-count-container").forEach((box) => {
      const label = box.querySelector(".counter-text-design"),
        value = box.querySelector(".value");
      if (!label || !value) return;
      const key = LABELS_MAP[norm(label.innerHTML || label.textContent)];
      if (key) value.textContent = counters[key];
    });
    const urgent = document.querySelector(".js-urgent-container .value");
    if (urgent) urgent.textContent = counters.urgent;
    const deadline = document.querySelector(".js-deadline-date");
    if (deadline) deadline.textContent = nextDeadline(tasks);
  };

  /** Rendert Begrüßung & Badge. */
  /** @returns {void} */
  const renderGreeting = () => {
    const greet = document.querySelector(".js-greeting"),
      user = document.querySelector(".js-user-name"),
      badge = document.querySelector(".header-right-side .account div");
    const name = (localStorage.getItem("name") || "").trim();
    const isGuest = (localStorage.getItem("isGuest") || "false") === "true";
    if (greet) greet.textContent = "Good morning!";
    if (user) {
      if (!isGuest && name) {
        user.textContent = name;
        user.style.display = "";
      } else {
        user.textContent = "";
        user.style.display = "none";
      }
    }
    if (badge) {
      const pieces = name.split(/\s+/);
      const a = (pieces[0] || "")[0] || "",
        b = (pieces[pieces.length - 1] || "")[0] || "";
      badge.textContent = !isGuest && name ? (a + b).toUpperCase() : "G";
    }
  };

  /** Prüft Mobile-Breite. */
  /** @returns {boolean} */
  const isMobile = () => window.innerWidth <= 925;

  /** Baut den Begrüßungs‑Splash. */
  /** @returns {HTMLElement} */
  const buildSplash = () => {
    let splash = document.getElementById("greetSplash");
    if (!splash) {
      splash = document.createElement("div");
      splash.id = "greetSplash";
      splash.className = "greet-splash";
      splash.innerHTML = `<div class=\"greet-box\"><p class=\"greet-line\">Good morning!</p><h2 class=\"greet-name\"></h2></div>`;
      document.body.appendChild(splash);
    }
    const name = (localStorage.getItem("name") || "").trim();
    const guest = (localStorage.getItem("isGuest") || "false") === "true";
    splash.querySelector(".greet-name").textContent = !guest && name ? name : "";
    return splash;
  };

  /** Zeigt & blendet den Splash aus. */
  /** @returns {void} */
  const showAndFadeSplash = () => {
    if (!isMobile()) return;
    const splash = buildSplash();
    splash.classList.remove("fade-out");
    setTimeout(() => {
      splash.classList.add("fade-out");
      splash.addEventListener("transitionend", () => splash.remove(), { once: true });
      setTimeout(() => splash.remove(), 600);
    }, 900);
  };

  /** Liest & löscht Trigger, dann zeigt Splash. */
  /** @returns {void} */
  const consumeTrigger = () => {
    const key = "summary.triggerSplash";
    const a = sessionStorage.getItem(key),
      b = localStorage.getItem(key);
    if ((a || b) && isMobile()) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
      showAndFadeSplash();
    }
  };

  /** Initialisiert Splash‑Logik (DOMContentLoaded + storage). */
  /** @returns {void} */
  const initSplash = () => {
    const onReady = () => consumeTrigger();
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", onReady) : onReady();
    window.addEventListener("storage", (e) => {
      if (e.key === "summary.triggerSplash" && (e.newValue === "1" || e.newValue === "true"))
        consumeTrigger();
    });
  };

  /** Holt Tasks, berechnet Kennzahlen und rendert. */
  /** @returns {Promise<void>} */
  const fetchAndRender = async () => {
    try {
      const raw = await firebaseGetPath(TASKS_NODE);
      const tasks = parseAndNormalizeTasks(raw);
      renderCounters(computeCounters(tasks), tasks);
      renderGreeting();
    } catch {}
  };

  /** Startet Polling & refresht bei Tab‑Rückkehr. */
  /** @returns {void} */
  const startSummaryLoop = () => {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) fetchAndRender();
    });
    const boot = () => {
      fetchAndRender();
      setInterval(fetchAndRender, POLL_MS);
    };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
  };

  // Boot
  startSummaryLoop();
  initSplash();
})();
