(function () {
  /** Initialen berechnen */
  function getInitials(fullName) {
    if (!fullName) return "";
    const parts = String(fullName).trim().split(/\s+/);
    const first = (parts[0] || "")[0] || "";
    const last  = (parts.length > 1 ? parts[parts.length - 1][0] : "") || "";
    return (first + last).toUpperCase();
  }

  /** State aus localStorage lesen */
  function pickState() {
    const name = (localStorage.getItem("name") || "").trim();
    const rawGuest = (localStorage.getItem("isGuest") || "false") === "true";
    const isGuest = name ? false : rawGuest;
    return { name, isGuest, initials: name ? getInitials(name) : "G" };
  }

  /** Badge-Text setzen */
  function setAccountBadge() {
    const accountInner = document.querySelector(".account div");
    if (!accountInner) return;

    const { initials } = pickState();
    accountInner.textContent = initials;
  }

  /** Start */
  function init() {
    setAccountBadge();

    // Auch bei Änderungen am Storage sofort updaten
    window.addEventListener("storage", (e) => {
      if (e.key === "name" || e.key === "isGuest") {
        setAccountBadge();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // optional global export
  window.updateAccountBadge = setAccountBadge;
})();
