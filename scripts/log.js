const logo = document.getElementById('joinLogo');
const splash = document.getElementById('splash');

function startSplash() {
    document.body.classList.add('show-login');
}

function finishSplash() {
    document.body.appendChild(logo);
    logo.classList.add('logo-stick');
    splash && splash.remove();
}

logo?.addEventListener('animationstart', startSplash, { once: true });
logo?.addEventListener('animationend', finishSplash, { once: true });

function getInitialsFromName(name) {
    if (!name) return '';
    const p = String(name).trim().split(/\s+/);
    const a = (p[0] || '')[0] || '';
    const b = (p[p.length - 1] || '')[0] || '';
    return (a + b).toUpperCase();
}

function readAuthState() {
    const isGuest = (localStorage.getItem('isGuest') || 'false') === 'true';
    const name = (localStorage.getItem('name') || '').trim();
    return { isGuest, name };
}

function applyHeaderHidden(badge, greeting) {
    if (!badge || !greeting) return;
    badge.setAttribute('hidden', '');
    badge.textContent = '';
    greeting.textContent = '';
}

function applyHeaderGuest(badge, greeting) {
    if (!badge || !greeting) return;
    badge.removeAttribute('hidden');
    badge.textContent = 'G';
    greeting.textContent = 'Good morning';
}

function applyHeaderUser(badge, greeting, name) {
    if (!badge || !greeting) return;
    badge.removeAttribute('hidden');
    badge.textContent = getInitialsFromName(name);
    greeting.textContent = 'Good morning';
}

function updateAccountUI() {
    const badge = document.getElementById('userBadge');
    const greeting = document.getElementById('greeting');
    const onLogin = window.location.pathname.includes('log.html');
    if (onLogin) return applyHeaderHidden(badge, greeting);

    const { isGuest, name } = readAuthState();
    if (isGuest) return applyHeaderGuest(badge, greeting);
    if (name) return applyHeaderUser(badge, greeting, name);
    applyHeaderHidden(badge, greeting);
}

function handleGuestLogin() {
    try {
        localStorage.setItem('isGuest', 'true');
        localStorage.removeItem('name');
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');

        // ➜ Trigger für Summary-Splash (einmalig, auch wenn in neuem Tab geöffnet)
        sessionStorage.setItem('summary.triggerSplash', '1');
        localStorage.setItem('summary.triggerSplash', '1');
    } catch { }
    window.location.href = '../summary.html';
}
document.getElementById('btn-guest-log-in')?.addEventListener('click', handleGuestLogin);

const loginPanel = document.getElementById('loginPanel');
const signupPanel = document.getElementById('signupPanel');
const signContainer = document.querySelector('.sign-container');
const headerRight =
    document.querySelector('.header-right-side') ||
    document.querySelector('.header-right') ||
    document.getElementById('headerRight') ||
    document.querySelector('header .header-right') ||
    document.querySelector('header .header-right-side');

function setPanels(isSignup) {
    loginPanel && loginPanel.classList.toggle('show', !isSignup);
    signupPanel && signupPanel.classList.toggle('show', isSignup);
}

function setHeaderRight(isSignup) {
    if (!headerRight) return;
    headerRight.classList.toggle('hidden', isSignup);
}

function setSignContainer(isSignup) {
    if (!signContainer) return;
    signContainer.classList.toggle('hidden', isSignup);
}

window.mode = new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'login';
window.renderAuthUI = function renderAuthUI() {
    const isSignup = window.mode === 'signup';
    setPanels(isSignup);
    setHeaderRight(isSignup);
    setSignContainer(isSignup);
    updateAccountUI();
};

const openSignupBtns = [
    document.getElementById('switchAuthBtn'),
    document.getElementById('switchAuthBtnBottom'),
    document.getElementById('openSignupBtn')
].filter(Boolean);

openSignupBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.mode = 'signup';
        window.renderAuthUI();
    });
});

document.getElementById('backToLoginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.mode = 'login';
    window.renderAuthUI();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.renderAuthUI);
} else {
    window.renderAuthUI();
}
window.updateAccountUI = updateAccountUI;

function isRightHitbox(ev, el, px = 36) {
    const r = el.getBoundingClientRect();
    return (r.right - ev.clientX) <= px;
}

function togglePassword(el) {
    const pass = el.type === 'password';
    el.type = pass ? 'text' : 'password';
    el.classList.toggle('passwort-icon', !pass);
    el.classList.toggle('visibile-icon', pass);
}

(function setupPasswordToggle() {
    const ids = ['loginPassword', 'signupPassword', 'signupPasswordConfirm'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.type = 'password';
        el.classList.add('passwort-icon');
        el.addEventListener('pointerdown', (ev) => {
            if (isRightHitbox(ev, el)) { ev.preventDefault(); togglePassword(el); }
        });
    });
})();
