(() => {
  'use strict';

  const BASE_URL = (window.FIREBASE_URL && String(window.FIREBASE_URL)) || 'https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/';
  const TASKS_NODE = 'tasks';
  const POLL_MS = 1500;
  const DATE_LOCALE = 'en-US';
  const LABELS = { 'to do': 'todo', 'to-do': 'todo', 'done': 'done', 'tasks in board': 'total', 'tasks in progress': 'inProgress', 'awaiting feedback': 'awaitFeedback' };

  function firebaseGetPath(path) {
    const helper = typeof window.firebaseGet === 'function';
    if (helper) return window.firebaseGet(path);
    return fetch(`${BASE_URL}${path}.json`).then(r => r.json()).catch(() => null);
  }

  function parseAndNormalizeTasks(data) {
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    const rows = isObj(data) ? Object.values(data) : (Array.isArray(data) ? data : []);
    const normCol = v => {
      if (v === 'toDoColumn' || v === 'inProgress' || v === 'awaitFeedback' || v === 'done') return v;
      const s = String(v || '').toLowerCase().replace(/\s|_/g, '');
      if (s.includes('todo')) return 'toDoColumn';
      if (s.includes('inprogress') || s === 'progress') return 'inProgress';
      if (s.includes('await') || s.includes('feedback') || s.includes('review')) return 'awaitFeedback';
      if (s.includes('done') || s.includes('complete') || s.includes('finished')) return 'done';
      return '';
    };
    const normPrio = v => {
      const s = String(v || '').toLowerCase();
      if (s.includes('urgent') || s === 'high') return 'urgent';
      if (s.includes('low')) return 'low';
      return (s.includes('medium') || s === 'mid' || s === 'normal') ? 'medium' : 'medium';
    };
    const parseDate = v => {
      if (!v) return null;
      const s = String(v).trim();
      let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
      m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
      m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
      const d = new Date(s); return isNaN(d) ? null : d;
    };
    return rows.filter(isObj).map((row, i) => ({
      id: row.firebaseKey || row.id || String(i),
      column: normCol(row.column ?? row.status ?? row.state ?? row.list ?? ''),
      priority: normPrio(row.priority ?? row.prio ?? ''),
      dueDate: parseDate(row.dueDate ?? row.deadline ?? row.date ?? '')
    }));
  }

  function computeCounters(tasks) {
    const out = { total: 0, todo: 0, inProgress: 0, awaitFeedback: 0, done: 0, urgent: 0 };
    for (const task of tasks) {
      out.total++;
      if (task.column === 'toDoColumn') out.todo++;
      else if (task.column === 'inProgress') out.inProgress++;
      else if (task.column === 'awaitFeedback') out.awaitFeedback++;
      else if (task.column === 'done') out.done++;
      if (task.priority === 'urgent') out.urgent++;
    }
    return out;
  }

  function formatNextDeadline(tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = tasks.map(t => t.dueDate).filter(d => d && d >= today).sort((a, b) => a - b);
    const val = dates[0] || null;
    return val ? val.toLocaleDateString(DATE_LOCALE, { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  }

  function renderCounters(counters, tasks) {
    const normalize = s => String(s || '').replace(/<br\s*\/?>/gi, ' ').toLowerCase().replace(/[^\w ]+/g, ' ').replace(/\s+/g, ' ').trim();
    document.querySelectorAll('.js-count-container').forEach(box => {
      const labelNode = box.querySelector('.counter-text-design');
      const valueNode = box.querySelector('.value');
      if (!labelNode || !valueNode) return;
      const key = LABELS[normalize(labelNode.innerHTML || labelNode.textContent)];
      if (key) valueNode.textContent = counters[key];
    });
    const urgentNode = document.querySelector('.js-urgent-container .value');
    if (urgentNode) urgentNode.textContent = counters.urgent;
    const deadlineNode = document.querySelector('.js-deadline-date');
    if (deadlineNode) deadlineNode.textContent = formatNextDeadline(tasks);
  }

  function renderGreeting() {
    const greetingNode = document.querySelector('.js-greeting');
    const nameNode = document.querySelector('.js-user-name');
    const badgeNode = document.querySelector('.header-right-side .account div');
    const name = (localStorage.getItem('name') || '').trim();
    const isGuest = (localStorage.getItem('isGuest') || 'false') === 'true';
    if (greetingNode) greetingNode.textContent = 'Good morning!';
    if (nameNode) {
      if (!isGuest && name) { nameNode.textContent = name; nameNode.style.display = ''; }
      else { nameNode.textContent = ''; nameNode.style.display = 'none'; }
    }
    if (badgeNode) {
      const parts = name.split(/\s+/), a = (parts[0] || '')[0] || '', b = (parts[parts.length - 1] || '')[0] || '';
      badgeNode.textContent = (!isGuest && name) ? (a + b).toUpperCase() : 'G';
    }
  }

  async function fetchAndRender() {
    try {
      const data = await firebaseGetPath(TASKS_NODE);
      const tasks = parseAndNormalizeTasks(data);
      const counters = computeCounters(tasks);
      renderCounters(counters, tasks);
      renderGreeting();
    } catch { }
  }

  function startSummaryLoop() {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) fetchAndRender(); });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { fetchAndRender(); setInterval(fetchAndRender, POLL_MS); });
    } else {
      fetchAndRender();
      setInterval(fetchAndRender, POLL_MS);
    }
  }

  startSummaryLoop();
})();

(() => {
  const MAX_WIDTH = 925;
  const SHOW_MS = 900;
  const SPLASH_ID = 'greetSplash';
  const TRIGGER_KEY = 'summary.triggerSplash';

  function shouldShowSplash() {
    return window.innerWidth <= MAX_WIDTH;
  }

  function buildSplash() {
    let splash = document.getElementById(SPLASH_ID);
    if (!splash) {
      splash = document.createElement('div');
      splash.id = SPLASH_ID;
      splash.className = 'greet-splash';
      splash.innerHTML = `<div class="greet-box"><p class="greet-line">Good morning!</p><h2 class="greet-name"></h2></div>`;
      document.body.appendChild(splash);
    }
    const name = (localStorage.getItem('name') || '').trim();
    const isGuest = (localStorage.getItem('isGuest') || 'false') === 'true';
    splash.querySelector('.greet-name').textContent = (!isGuest && name) ? name : '';
    return splash;
  }

  function showAndFadeSplash() {
    if (!shouldShowSplash()) return;
    const splash = buildSplash();
    splash.classList.remove('fade-out');
    setTimeout(() => {
      splash.classList.add('fade-out');
      splash.addEventListener('transitionend', () => splash.remove(), { once: true });
      setTimeout(() => splash.remove(), 600);
    }, SHOW_MS);
  }

  function consumeTrigger() {
    const hasSession = sessionStorage.getItem(TRIGGER_KEY);
    const hasLocal = localStorage.getItem(TRIGGER_KEY);
    const active = (hasSession || hasLocal) && shouldShowSplash();
    if (active) {
      sessionStorage.removeItem(TRIGGER_KEY);
      localStorage.removeItem(TRIGGER_KEY);
      showAndFadeSplash();
    }
  }

  function initSplash() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', consumeTrigger);
    } else {
      consumeTrigger();
    }
    window.addEventListener('storage', e => {
      if (e.key === TRIGGER_KEY && (e.newValue === '1' || e.newValue === 'true')) consumeTrigger();
    });
  }

  initSplash();
})();
