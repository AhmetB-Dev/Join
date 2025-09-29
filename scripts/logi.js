(() => {
    const REDIRECT_AFTER_AUTH = '../summary.html';

    const msgEl = document.getElementById('authMessage');
    const showMsg = (text, ok = false) => {
        if (!msgEl) return;
        msgEl.textContent = text || '';
        msgEl.style.color = ok ? '#1B5E20' : '#DC2626';
    };

    function showSignupToast(message = 'You Signed Up successfully') {
        document.querySelector('.toast-signup')?.remove();
        const t = document.createElement('div');
        t.className = 'toast-signup';
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(() => {
            t.classList.add('hide');
            t.addEventListener('transitionend', () => t.remove(), { once: true });
        }, 700);
    }

    const clearInvalid = (...els) => els.filter(Boolean).forEach(i => i.removeAttribute('aria-invalid'));
    const markInvalid = (...els) => els.filter(Boolean).forEach(i => i.setAttribute('aria-invalid', 'true'));
    const v = (el) => (el?.value || '').trim();

    const simpleHash = (s) =>
        'h:' + Array.from(new TextEncoder().encode(String(s))).reduce((a, b) => (a + b).toString(16), '');

    async function fbGetUserByEmail(lower) {
        const safe = String(lower).replace(/[.#$\[\]\/]/g, '_');
        const id = await window.firebaseGet(`/emailIndex/${safe}`).catch(() => null);
        if (id) return await window.firebaseGet(`/users/${encodeURIComponent(id)}`);
        const all = await window.firebaseGet('/users').catch(() => null);
        if (!all) return null;
        for (const u of Object.values(all)) {
            if ((u?.email || '').toLowerCase().trim() === lower) return u;
        }
        return null;
    }

    async function fbCreateUser({ name, email, password }) {
        const lower = (email || '').toLowerCase().trim();
        if (!lower) throw new Error('Bitte E-Mail angeben.');

        const exists = await fbGetUserByEmail(lower);
        if (exists) throw new Error('E-Mail ist bereits registriert.');

        const id = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        const user = { uid: id, name, email, passwordHash: simpleHash(password), createdAt: Date.now() };

        await window.firebasePut(`/users/${encodeURIComponent(id)}`, user);
        const safe = String(lower).replace(/[.#$\[\]\/]/g, '_');
        await window.firebasePut(`/emailIndex/${safe}`, id);
        return user;
    }

    async function fbVerifyLogin(email, password) {
        const lower = (email || '').toLowerCase().trim();
        const user = await fbGetUserByEmail(lower);
        if (!user || user.passwordHash !== simpleHash(password)) throw new Error('auth/wrong-credentials');
        return user;
    }

    const loginEmail = document.getElementById('loginEmail');
    const loginPass = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    const suName = document.getElementById('signupName');
    const suEmail = document.getElementById('signupEmail');
    const suPass = document.getElementById('signupPassword');
    const suPass2 = document.getElementById('signupPasswordConfirm');
    const suBtn = document.getElementById('createAccountBtn');

    function readSignup() {
        return {
            name: v(suName),
            email: v(suEmail),
            pass: v(suPass),
            pass2: v(suPass2),
            accept: !!document.getElementById('acceptPolicy')?.checked
        };
    }

    function validateSignup(d) {
        const missing = [];
        if (!d.name) missing.push(suName);
        if (!d.email) missing.push(suEmail);
        if (!d.pass) missing.push(suPass);
        if (!d.pass2) missing.push(suPass2);
        if (missing.length) return { ok: false, reason: 'Please fill out all fields.', els: missing };
        if (d.pass !== d.pass2) return { ok: false, reason: 'Passwords do not match.', els: [suPass, suPass2] };
        if (!d.accept) return { ok: false, reason: 'Please accept the Privacy Policy.', els: [] };
        return { ok: true };
    }

    function resetSignupFields() {
        suName && (suName.value = '');
        suEmail && (suEmail.value = '');
        suPass && (suPass.value = '');
        suPass2 && (suPass2.value = '');
        const ac = document.getElementById('acceptPolicy');
        ac && (ac.checked = false);
    }

    async function handleSignup(e) {
        e && e.preventDefault();
        clearInvalid(suName, suEmail, suPass, suPass2);
        showMsg('');

        const data = readSignup();
        const res = validateSignup(data);
        if (!res.ok) { markInvalid(...res.els); showMsg(res.reason); return; }

        try {
            await fbCreateUser({ name: data.name, email: data.email, password: data.pass });
            resetSignupFields();
            showSignupToast('You Signed Up successfully');
            setTimeout(() => {
                if (typeof window.mode !== 'undefined' && typeof window.renderAuthUI === 'function') {
                    window.mode = 'login'; window.renderAuthUI();
                }
                loginEmail?.focus();
            }, 900);
        } catch (err) {
            markInvalid(suEmail);
            showMsg(err?.message || 'Sign up failed.');
        }
    }

    async function handleLogin(e) {
        e && e.preventDefault();
        clearInvalid(loginEmail, loginPass);
        showMsg('');

        const email = v(loginEmail), pass = v(loginPass);
        if (!email || !pass) { markInvalid(loginEmail, loginPass); showMsg('Please enter email and password.'); return; }

        try {
            const user = await fbVerifyLogin(email, pass);
            const fullName = (user.name && String(user.name).trim())
                || [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
            localStorage.setItem('isGuest', 'false');
            localStorage.setItem('name', fullName || '');

            sessionStorage.setItem('summary.triggerSplash', '1');
            localStorage.setItem('summary.triggerSplash', '1');

            showMsg('Login successful. Redirecting …', true);
            window.location.href = REDIRECT_AFTER_AUTH;
        } catch {
            markInvalid(loginEmail, loginPass);
            showMsg('Check your email and password. Please try again.');
        }
    }

    suBtn && suBtn.addEventListener('click', handleSignup);
    loginBtn && loginBtn.addEventListener('click', handleLogin);

    window.AuthLocal = { handleSignup, handleLogin };
})();
