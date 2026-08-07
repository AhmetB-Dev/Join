(() => {
  "use strict";

  const EMAIL_REGEX = /^[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

  const isValidEmail = (email) => EMAIL_REGEX.test(String(email || "").trim());

  const requireApi = () => {
    if (!window.JoinAPI) throw new Error("JOIN API is not loaded.");
    return window.JoinAPI;
  };

  const createUser = async ({ fullName, emailAddress, password }) => {
    const payload = await requireApi().register({
      name: String(fullName || "").trim(),
      email: String(emailAddress || "").trim().toLowerCase(),
      password: String(password || ""),
    });
    return payload.user;
  };

  const verifyLogin = async (email, password) => {
    const payload = await requireApi().login({
      email: String(email || "").trim().toLowerCase(),
      password: String(password || ""),
    });
    return payload.user;
  };

  const guestLogin = async () => {
    const payload = await requireApi().guestLogin();
    return payload.user;
  };

  window.AuthCore = { isValidEmail, createUser, verifyLogin, guestLogin };
})();
