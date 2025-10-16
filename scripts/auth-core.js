(() => {
  "use strict";
  /** Email validation regex. */
  const EMAIL_REGEX = /^[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

  /** Validate email syntax. @param {string} email @returns {boolean} */
  const isValidEmail = (email) => EMAIL_REGEX.test(String(email || "").trim());

  /** Firebase-safe key from email. @param {string} lowerEmail @returns {string} */
  const toIndexKey = (lowerEmail) => String(lowerEmail).replace(/[.#$\[\]\/]/g, "_");

  /** Tiny demo hash (NOT secure). @param {string} rawPassword @returns {string} */
  const generateSimpleHash = (rawPassword) => {
    const b = new TextEncoder().encode(String(rawPassword));
    const s = b.reduce((a, n) => a + n, 0);
    return "h:" + s.toString(16);
  };

  /** Load user by email index. @param {string} lowerEmail @returns {Promise<any|null>} */
  const fetchByIndex = async (lowerEmail) => {
    try {
      const id = await window.firebaseGet(`/emailIndex/${toIndexKey(lowerEmail)}`);
      return id ? window.firebaseGet(`/users/${encodeURIComponent(id)}`) : null;
    } catch {
      return null;
    }
  };

  /** Fallback: scan all users. @param {string} lowerEmail @returns {Promise<any|null>} */
  const fetchByScan = async (lowerEmail) => {
    try {
      const all = await window.firebaseGet("/users");
      return (
        Object.values(all || {}).find((u) => (u?.email || "").toLowerCase().trim() === lowerEmail) || null
      );
    } catch {
      return null;
    }
  };

  /** Find user by email (index, then scan). @param {string} lowerEmail */
  const fetchUserByEmail = async (lowerEmail) =>
    (await fetchByIndex(lowerEmail)) || (await fetchByScan(lowerEmail));

  /** Create a new user id. @returns {string} */
  const createUserId = () => `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  /** Build a user record. @param {string} uid @param {string} fullName @param {string} lowerEmail @param {string} rawPassword */
  const buildUserRecord = (uid, fullName, lowerEmail, rawPassword) => ({
    uid,
    name: fullName,
    email: lowerEmail,
    passwordHash: generateSimpleHash(rawPassword),
    createdAt: Date.now(),
  });

  /** Save user in DB. @param {string} uid @param {object} rec @returns {Promise<any>} */
  const saveUserRecord = (uid, rec) => window.firebasePut(`/users/${encodeURIComponent(uid)}`, rec);

  /** Write email->uid index. @param {string} lowerEmail @param {string} uid @returns {Promise<any>} */
  const saveEmailIndex = (lowerEmail, uid) =>
    window.firebasePut(`/emailIndex/${toIndexKey(lowerEmail)}`, uid);

  /** Create user if email is free. @param {{fullName:string,emailAddress:string,password:string}} p @returns {Promise<object>} */
  const createUser = async (p) => {
    const lower = String(p.emailAddress || "")
      .toLowerCase()
      .trim();
    if (!lower) throw new Error("Please provide an email.");
    if (await fetchUserByEmail(lower)) throw new Error("Email is already registered.");
    const uid = createUserId(),
      rec = buildUserRecord(uid, p.fullName, lower, p.password);
    await saveUserRecord(uid, rec);
    await saveEmailIndex(lower, uid);
    return rec;
  };

  /** Verify login credentials. @param {string} email @param {string} rawPassword @returns {Promise<object>} */
  const verifyLogin = async (email, rawPassword) => {
    const lower = String(email || "")
      .toLowerCase()
      .trim();
    const user = await fetchUserByEmail(lower);
    if (!user || user.passwordHash !== generateSimpleHash(rawPassword))
      throw new Error("auth/wrong-credentials");
    return user;
  };

  // Public API
  window.AuthCore = { isValidEmail, createUser, verifyLogin };
})();
