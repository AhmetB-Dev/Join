(() => {
  "use strict";

  /** Initials from a full name. */
  const initials = (fullName) => {
    const p = String(fullName || "").trim().split(/\s+/);
    if (!p[0]) return "??";
    return (p[0][0] + (p[1] ? p[p.length - 1][0] : p[0][1] || "")).toUpperCase();
  };

  /** Color index 1..7 derived from a name. */
  const colorIdx = (name) =>
    (Array.from(String(name || "")).reduce((a, c) => a + c.charCodeAt(0), 0) % 7) + 1;

  /** Current user (lowercased) read from storage. */
  const currentUserLower = () =>
    (localStorage.getItem("name") || localStorage.getItem("userName") || localStorage.getItem("displayName") || "")
      .trim()
      .toLowerCase();

  /** Normalize category label → display labels. */
  const normCategory = (raw) => {
    const v = String(raw || "").trim().toLowerCase();
    if (v.includes("technical")) return "Technical task";
    if (v.includes("user")) return "User Story";
    return "Technical task";
  };

  /** Fetch contact names from the Django API with demo fallbacks. */
  const fetchContacts = async () => {
    try {
      const payload = await JoinAPI.get('/contacts/');
      const list = (Array.isArray(payload) ? payload : []).map(c => c?.name).filter(Boolean);
      return list.length
        ? list
        : ["Sofia Müller", "Anton Mayer", "Anja Schulz", "Benedikt Ziegler", "David Eisenberg"];
    } catch {
      return ["Sofia Müller", "Anton Mayer", "Anja Schulz", "Benedikt Ziegler", "David Eisenberg"];
    }
  };

  /** Persist a task through the Django REST API and return its id. */
  const persistTask = async (task) => {
    const created = await JoinAPI.post('/tasks/', JoinAPI.taskPayload(task));
    return created?.id ?? null;
  };

  window.AddTaskCore = {
    initials,
    colorIdx,
    currentUserLower,
    normCategory,
    fetchContacts,
    persistTask,
  };
})();
