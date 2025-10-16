(function () {
  "use strict";

  /**
   * Build initials from a full name.
   * @param {string} fullName
   * @returns {string}
   */
  function getInitials(fullName) {
    if (!fullName) return "G";
    const parts = String(fullName).trim().split(/\s+/);
    const first = (parts[0] || "")[0] || "";
    const last = (parts.length > 1 ? parts[parts.length - 1][0] : "") || "";
    return (first + last || "G").toUpperCase();
  }

  /**
   * Read name/guest state.
   * @returns {{name:string,isGuest:boolean,initials:string}}
   */
  function readState() {
    const name = (localStorage.getItem("name") || "").trim();
    const rawGuest = (localStorage.getItem("isGuest") || "false") === "true";
    const isGuest = name ? false : rawGuest;
    return { name, isGuest, initials: name && !isGuest ? getInitials(name) : "G" };
  }

  /** Write initials into the header badge. */
  function setAccountBadge() {
    const accountInner = document.querySelector(".account div");
    if (!accountInner) return;
    accountInner.textContent = readState().initials;
  }

  /** Initialize badge updates incl. storage event. */
  function init() {
    setAccountBadge();
    window.addEventListener("storage", (e) => {
      if (e.key === "name" || e.key === "isGuest") setAccountBadge();
    });
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();

  window.updateAccountBadge = setAccountBadge;
})();
