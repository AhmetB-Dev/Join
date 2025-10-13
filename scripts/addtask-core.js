(() => {
  "use strict";
  /** Firebase Endpunkte. */
  const FIREBASE_BASE_URL = "https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app";
  const FIREBASE_TASKS_URL = `${FIREBASE_BASE_URL}/tasks.json`;
  const FIREBASE_CONTACTS_URL = `${FIREBASE_BASE_URL}/contacts.json`;

  /**
   * Initialen aus Namen.
   * @param {string} fullName
   * @returns {string}
   */
  const initials = (fullName) => {
    const p = String(fullName || "")
      .trim()
      .split(/\s+/);
    if (!p[0]) return "??";
    return (p[0][0] + (p[1] ? p[p.length - 1][0] : p[0][1] || "")).toUpperCase();
  };

  /** Farbindex 1..7 aus Name. */
  const colorIdx = (name) =>
    (Array.from(String(name || "")).reduce((a, c) => a + c.charCodeAt(0), 0) % 7) + 1;

  /** Aktueller Benutzer (lowercase) aus Storage. */
  const currentUserLower = () =>
    (
      localStorage.getItem("name") ||
      localStorage.getItem("userName") ||
      localStorage.getItem("displayName") ||
      ""
    )
      .trim()
      .toLowerCase();

  /** Kategorie-Label normalisieren → Anzeige-Labels. */
  const normCategory = (raw) => {
    const v = String(raw || "")
      .trim()
      .toLowerCase();
    if (v.includes("technical")) return "Technical task";
    if (v.includes("user")) return "User Story";
    return "Technical task";
  };

  /** Kontakte holen (Firebase) mit Fallback-Namen. */
  const fetchContacts = async () => {
    try {
      const resp = await fetch(FIREBASE_CONTACTS_URL);
      const payload = await resp.json();
      const list =
        payload && typeof payload === "object"
          ? Object.values(payload)
              .map((c) => c?.name)
              .filter(Boolean)
          : [];
      return list.length
        ? list
        : ["Sofia Müller", "Anton Mayer", "Anja Schulz", "Benedikt Ziegler", "David Eisenberg"];
    } catch {
      return ["Sofia Müller", "Anton Mayer", "Anja Schulz", "Benedikt Ziegler", "David Eisenberg"];
    }
  };

  /** Task speichern und Key auch unter /tasks/<key>/id schreiben. */
  const persistTask = async (task) => {
    const resp = await fetch(FIREBASE_TASKS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    const created = await resp.json();
    const key = created && created.name;
    if (!key) return null;
    await fetch(`${FIREBASE_BASE_URL}/tasks/${key}/id.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(key),
    });
    return key;
  };

  // Public API
  window.AddTaskCore = {
    FIREBASE_BASE_URL,
    FIREBASE_TASKS_URL,
    FIREBASE_CONTACTS_URL,
    initials,
    colorIdx,
    currentUserLower,
    normCategory,
    fetchContacts,
    persistTask,
  };
})();
