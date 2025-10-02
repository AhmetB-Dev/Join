(() => {
    const REDIRECT_AFTER_AUTH = '../summary.html';

    const EMAIL_REGEX = /^[^\s@]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2}$/;

    function getMessageElement() {
        const mode = (typeof window !== 'undefined' && window.mode) ||
            (document.getElementById('signupPanel')?.classList.contains('show') ? 'signup' : 'login');

        let el = null;
        if (mode === 'signup') {
            el = document.getElementById('authMessageSignup');
        } else {
            el = document.getElementById('authMessageLogin');
        }
        if (!el) el = document.getElementById('authMessage');
        return el;
    }

    function showGlobalMessage(text, isOk = false) {
        const el = getMessageElement();
        if (!el) return;
        el.textContent = text || '';
        el.style.color = isOk ? '#1B5E20' : '#DC2626';
        el.classList.toggle('is-hidden', !text);
    }

    function displaySignupToast(message = 'You Signed Up successfully') {
        document.querySelector('.toast-signup')?.remove();
        const toast = document.createElement('div');
        toast.className = 'toast-signup';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 700);
    }

    function clearInvalidState(...elements) {
        elements.filter(Boolean).forEach((node) => node.removeAttribute('aria-invalid'));
    }

    function applyInvalidState(...elements) {
        elements.filter(Boolean).forEach((node) => node.setAttribute('aria-invalid', 'true'));
    }

    const getTrimmedValue = (el) => (el?.value || '').trim();
    const isValidEmailAddress = (email) => EMAIL_REGEX.test((email || '').trim());

    function generateSimpleHash(raw) {
        const bytes = new TextEncoder().encode(String(raw));
        const sum = Array.from(bytes).reduce((acc, n) => acc + n, 0);
        return 'h:' + sum.toString(16);
    }

    // ---------- Data layer (mocked Firebase helpers) ----------
    async function fetchUserByEmail(lowerEmail) {
        const safeKey = String(lowerEmail).replace(/[.#$\[\]\/]/g, '_');
        try {
            const indexedId = await window.firebaseGet(`/emailIndex/${safeKey}`);
            if (indexedId) return await window.firebaseGet(`/users/${encodeURIComponent(indexedId)}`);
        } catch { }
        try {
            const allUsers = await window.firebaseGet('/users');
            for (const user of Object.values(allUsers || {})) {
                if ((user?.email || '').toLowerCase().trim() === lowerEmail) return user;
            }
        } catch { }
        return null;
    }

    async function createNewUser({ fullName, emailAddress, rawPassword }) {
        const lower = (emailAddress || '').toLowerCase().trim();
        if (!lower) throw new Error('Bitte E-Mail angeben.');
        const exists = await fetchUserByEmail(lower);
        if (exists) throw new Error('E-Mail ist bereits registriert.');

        const newId = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        const userRecord = {
            uid: newId,
            name: fullName,
            email: lower,
            passwordHash: generateSimpleHash(rawPassword),
            createdAt: Date.now()
        };

        await window.firebasePut(`/users/${encodeURIComponent(newId)}`, userRecord);
        const safeKey = String(lower).replace(/[.#$\[\]\/]/g, '_');
        await window.firebasePut(`/emailIndex/${safeKey}`, newId);
        return userRecord;
    }

    async function verifyLoginCredentials(emailAddress, rawPassword) {
        const lower = (emailAddress || '').toLowerCase().trim();
        const user = await fetchUserByEmail(lower);
        if (!user || user.passwordHash !== generateSimpleHash(rawPassword)) {
            throw new Error('auth/wrong-credentials');
        }
        return user;
    }

    // ---------- DOM bindings ----------
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginSubmitButton = document.getElementById('loginBtn');

    const signupNameInput = document.getElementById('signupName');
    const signupEmailInput = document.getElementById('signupEmail');
    const signupPasswordInput = document.getElementById('signupPassword');
    const signupPasswordConfirmInput = document.getElementById('signupPasswordConfirm');
    const signupAcceptCheckbox = document.getElementById('acceptPolicy'); // → jetzt Pflicht!
    const signupSubmitButton = document.getElementById('createAccountBtn');

    // ---------- Signup helpers ----------
    function collectSignupData() {
        return {
            name: getTrimmedValue(signupNameInput),
            email: getTrimmedValue(signupEmailInput),
            password: getTrimmedValue(signupPasswordInput),
            passwordConfirm: getTrimmedValue(signupPasswordConfirmInput),
            acceptedPolicy: !!signupAcceptCheckbox?.checked
        };
    }

    function validateSignupPayload(payload) {
        const missing = [];
        if (!payload.name) missing.push(signupNameInput);
        if (!payload.email) missing.push(signupEmailInput);
        if (!payload.password) missing.push(signupPasswordInput);
        if (!payload.passwordConfirm) missing.push(signupPasswordConfirmInput);

        if (!payload.acceptedPolicy) missing.push(signupAcceptCheckbox);

        if (missing.length) {
            return { ok: false, reason: 'Please fill out all fields.', fields: missing };
        }

        if (!isValidEmailAddress(payload.email)) {
            return { ok: false, reason: 'Please enter a valid email address.', fields: [signupEmailInput] };
        }
        if (payload.password !== payload.passwordConfirm) {
            return { ok: false, reason: 'Passwords do not match.', fields: [signupPasswordInput, signupPasswordConfirmInput] };
        }
        return { ok: true };
    }

    function resetSignupForm() {
        if (signupNameInput) signupNameInput.value = '';
        if (signupEmailInput) signupEmailInput.value = '';
        if (signupPasswordInput) signupPasswordInput.value = '';
        if (signupPasswordConfirmInput) signupPasswordConfirmInput.value = '';
        if (signupAcceptCheckbox) signupAcceptCheckbox.checked = false;
        clearInvalidState(
            signupNameInput,
            signupEmailInput,
            signupPasswordInput,
            signupPasswordConfirmInput,
            signupAcceptCheckbox
        );
    }

    // ---------- Event handlers ----------
    async function handleSignupSubmit(evt) {
        evt && evt.preventDefault();
        clearInvalidState(
            signupNameInput,
            signupEmailInput,
            signupPasswordInput,
            signupPasswordConfirmInput,
            signupAcceptCheckbox
        );
        showGlobalMessage('');

        const data = collectSignupData();
        const check = validateSignupPayload(data);
        if (!check.ok) {
            applyInvalidState(...check.fields);
            showGlobalMessage(check.reason);
            return;
        }

        try {
            await createNewUser({ fullName: data.name, emailAddress: data.email, rawPassword: data.password });
            resetSignupForm();
            displaySignupToast('You Signed Up successfully');
            setTimeout(() => {
                if (typeof window.mode !== 'undefined' && typeof window.renderAuthUI === 'function') {
                    window.mode = 'login';
                    window.renderAuthUI();
                }
                loginEmailInput?.focus();
            }, 900);
        } catch (error) {
            applyInvalidState(signupEmailInput);
            showGlobalMessage(error?.message || 'Sign up failed.');
        }
    }

    async function handleLoginSubmit(evt) {
        evt && evt.preventDefault();
        clearInvalidState(loginEmailInput, loginPasswordInput);
        showGlobalMessage('');

        const email = getTrimmedValue(loginEmailInput);
        const password = getTrimmedValue(loginPasswordInput);

        if (!EMAIL_REGEX.test((email || '').trim())) {
            applyInvalidState(loginEmailInput);
            showGlobalMessage('Please enter a valid email address.');
            return;
        }
        if (!email || !password) {
            applyInvalidState(loginEmailInput, loginPasswordInput);
            showGlobalMessage('Please enter email and password.');
            return;
        }

        try {
            const user = await verifyLoginCredentials(email, password);
            const displayName =
                (user.name && String(user.name).trim()) ||
                [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

            localStorage.setItem('isGuest', 'false');
            localStorage.setItem('name', displayName || '');
            sessionStorage.setItem('summary.triggerSplash', '1');
            localStorage.setItem('summary.triggerSplash', '1');

            showGlobalMessage('Login successful. Redirecting …', true);
            window.location.href = REDIRECT_AFTER_AUTH;
        } catch {
            applyInvalidState(loginEmailInput, loginPasswordInput);
            showGlobalMessage('Check your email and password.');
        }
    }

    function initAuthHandlers() {
        signupSubmitButton && signupSubmitButton.addEventListener('click', handleSignupSubmit);
        loginSubmitButton && loginSubmitButton.addEventListener('click', handleLoginSubmit);
        window.AuthLocal = { handleSignupSubmit, handleLoginSubmit };
    }

    function attachCheckboxFixup() {
        if (!signupAcceptCheckbox) return;
        signupAcceptCheckbox.addEventListener('change', () => {
            if (signupAcceptCheckbox.checked) {
                clearInvalidState(signupAcceptCheckbox);
                showGlobalMessage('');
            }
        });
    }

    // ---------- boot ----------
    initAuthHandlers();
    attachCheckboxFixup();
})();
