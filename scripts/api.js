(() => {
  "use strict";

  const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api";
  const TOKEN_KEY = "join.authToken";

  const apiBaseUrl = () =>
    String(window.JOIN_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");

  const normalizePath = (path) => {
    const value = String(path || "").trim();
    if (!value) return "/";
    return value.startsWith("/") ? value : `/${value}`;
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

  const extractErrorMessage = (payload, fallback) => {
    if (!payload) return fallback;
    if (typeof payload === "string") return payload;
    if (Array.isArray(payload)) return payload.map((item) => extractErrorMessage(item, "")).filter(Boolean).join(" ") || fallback;
    if (typeof payload === "object") {
      if (payload.detail) return extractErrorMessage(payload.detail, fallback);
      const messages = Object.values(payload)
        .map((value) => extractErrorMessage(value, ""))
        .filter(Boolean);
      if (messages.length) return messages.join(" ");
    }
    return fallback;
  };

  async function request(path, options = {}) {
    const {
      method = "GET",
      body,
      auth = true,
      headers = {},
      keepalive = false,
    } = options;

    const requestHeaders = { ...headers };
    const token = getToken();
    if (auth && token) requestHeaders.Authorization = `Token ${token}`;

    const init = { method, headers: requestHeaders, keepalive };
    if (body !== undefined) {
      if (body instanceof FormData) {
        init.body = body;
      } else {
        requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
        init.body = JSON.stringify(body);
      }
    }

    const response = await fetch(`${apiBaseUrl()}${normalizePath(path)}`, init);
    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    if (!response.ok) {
      const message = extractErrorMessage(payload, `API request failed (${response.status})`);
      const error = new Error(message);
      error.status = response.status;
      error.data = payload;
      throw error;
    }
    return payload;
  }

  const setAuthSession = (payload, isGuest = false) => {
    const token = String(payload?.token || "");
    const user = payload?.user || {};
    if (!token) throw new Error("Backend returned no authentication token.");
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem("isGuest", isGuest ? "true" : "false");
    if (isGuest) localStorage.removeItem("name");
    else localStorage.setItem("name", String(user.name || "").trim());
    return user;
  };

  const clearAuthSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem("isGuest", "false");
    localStorage.removeItem("name");
  };

  const register = (data) => request("/auth/register/", { method: "POST", body: data, auth: false });

  const login = async (data) => {
    const payload = await request("/auth/login/", { method: "POST", body: data, auth: false });
    const user = setAuthSession(payload, false);
    return { ...payload, user };
  };

  const guestLogin = async () => {
    const payload = await request("/auth/guest/", { method: "POST", body: {}, auth: false });
    const user = setAuthSession(payload, true);
    return { ...payload, user };
  };

  const logout = () => {
    const token = getToken();
    clearAuthSession();
    sessionStorage.clear();
    if (!token) return Promise.resolve();
    return fetch(`${apiBaseUrl()}/auth/logout/`, {
      method: "POST",
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
      body: "{}",
      keepalive: true,
    }).catch(() => null);
  };


  const taskPayload = (task) => {
    const users = (Array.isArray(task?.users) ? task.users : [])
      .map(user => ({ name: String(user?.name || '').trim() }))
      .filter(user => user.name);
    const subtasks = (Array.isArray(task?.subtasks) ? task.subtasks : [])
      .map(subtask => ({ text: String(subtask?.text || '').trim(), completed: !!subtask?.completed }))
      .filter(subtask => subtask.text);
    const calculatedProgress = subtasks.length
      ? Math.round((subtasks.filter(subtask => subtask.completed).length / subtasks.length) * 100)
      : 0;

    return {
      title: String(task?.title || '').trim(),
      description: String(task?.description || 'No description provided').trim() || 'No description provided',
      dueDate: String(task?.dueDate || '').trim(),
      category: String(task?.category || 'Technical task').trim() || 'Technical task',
      column: String(task?.column || 'toDoColumn').trim() || 'toDoColumn',
      priority: String(task?.priority || 'low'),
      progress: calculatedProgress,
      users,
      subtasks,
    };
  };

  const toObjectById = (rows) =>
    Object.fromEntries((Array.isArray(rows) ? rows : []).map((row) => [String(row.id), { ...row, id: String(row.id) }]));

  window.JoinAPI = {
    baseUrl: apiBaseUrl,
    request,
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body }),
    put: (path, body) => request(path, { method: "PUT", body }),
    patch: (path, body) => request(path, { method: "PATCH", body }),
    delete: (path) => request(path, { method: "DELETE" }),
    register,
    login,
    guestLogin,
    logout,
    getToken,
    clearAuthSession,
    toObjectById,
    taskPayload,
  };
})();
