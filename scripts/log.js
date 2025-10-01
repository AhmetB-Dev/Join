/* =========================================================================
   Splash → Header Logo (FLIP) + Auth-UI Umschalten + Password Toggle
   ========================================================================= */

const splash = document.getElementById('splash');
const logo = document.getElementById('joinLogo');

/** Wie lange der Splash beim (Neu-)Start sichtbar gehalten wird,
 *  bevor die Header-Animation beginnt (in Millisekunden). */
const SPLASH_HOLD_MS = 800;

/** Zeigt den Main-Content an (entschärft Blur). */
function revealMain() {
    document.body.classList.add('show-login');
}

/** FLIP-Animation: animiert das aktuelle Logo exakt zum Header-Ziel-Slot. */
function animateLogoIntoHeader() {
    const brand = document.getElementById('brandSlot') || document.querySelector('header .brand');
    if (!logo || !brand) {
        // Fallback: Kein Ziel gefunden → Splash entfernen
        splash?.remove();
        return;
    }

    const prefersReduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // FIRST: Start-Rect im Splash messen
    const first = logo.getBoundingClientRect();

    // Reparent: Logo in den Header einsortieren + Endklasse setzen
    brand.appendChild(logo);
    logo.classList.remove('splash-logo');
    logo.classList.add('header-logo');

    const last = logo.getBoundingClientRect();

    if (prefersReduced) {
        splash?.remove();
        return;
    }

    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / Math.max(last.width, 1);
    const sy = first.height / Math.max(last.height, 1);

    logo.style.transformOrigin = 'top left';
    logo.style.willChange = 'transform, opacity';
    logo.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

    void logo.getBoundingClientRect();

    logo.style.transition = 'transform 1400ms cubic-bezier(.2,.8,.2,1), opacity 1400ms ease';
    logo.style.transform = 'none';

    splash && splash.classList.add('is-fading');

    const cleanup = () => {
        logo.style.transition = '';
        logo.style.transform = '';
        logo.style.willChange = '';
        splash?.remove();
        logo.removeEventListener('transitionend', cleanup);
    };
    logo.addEventListener('transitionend', cleanup);
}

function handleGuestLogin() {
    try {
        localStorage.setItem('isGuest', 'true');
        localStorage.removeItem('name');
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        sessionStorage.setItem('summary.triggerSplash', '1');
        localStorage.setItem('summary.triggerSplash', '1');
    } catch { }
    window.location.href = '../summary.html';
}

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

document.getElementById('btn-guest-log-in')?.addEventListener('click', handleGuestLogin);

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

function boot() {
    revealMain();
    setTimeout(() => {
        try {
            animateLogoIntoHeader();
        } catch {
            const brand = document.getElementById('brandSlot') || document.querySelector('header .brand');
            if (logo && brand) {
                brand.appendChild(logo);
                logo.classList.remove('splash-logo');
                logo.classList.add('header-logo');
            }
            splash?.remove();
        }
    }, SPLASH_HOLD_MS + 60);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.renderAuthUI();
        boot();
    });
} else {
    window.renderAuthUI();
    boot();
}
