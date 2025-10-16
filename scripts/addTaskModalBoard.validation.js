/**
 * Enable/disable the create button and adjust style based on validity.
 * @param {boolean} isValid
 * @returns {void}
 */
function updateCreateButtonState(isValid) {
  const createBtn = document.querySelector(".create-btn");
  if (!createBtn) return;
  if (isValid) {
    createBtn.classList.remove("disabled");
    createBtn.style.pointerEvents = "auto";
    createBtn.style.opacity = "1";
  } else {
    createBtn.classList.add("disabled");
    createBtn.style.pointerEvents = "none";
    createBtn.style.opacity = "0.5";
  }
}

/**
 * Check if required form fields are filled.
 * @returns {boolean}
 */
function isTaskFormValid() {
  const title = getInputValue(".input");
  const dueDate = getInputValue(".date-input");
  const category = document.querySelector(".category-item.selected")?.dataset.value;
  return Boolean(title) && isValidDueDate(dueDate) && Boolean(category);
}

/**
 * Validates date in dd/mm/yyyy format, real calendar date, not in the past.
 * @param {string} s
 * @returns {boolean}
 */
function isValidDueDate(s) {
  if (!s) return false;
  const m = /^([0-3]\d)\/([0-1]\d)\/(\d{4})$/.exec(s);
  if (!m) return false;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  if (mo < 1 || mo > 12) return false;
  const mdays = [31, (isLeap(y) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (d < 1 || d > mdays[mo - 1]) return false;
  const sel = new Date(y, mo - 1, d);
  sel.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return sel >= today;
}

/**
 * Checks leap year.
 * @param {number} y
 * @returns {boolean}
 */
function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * Validate the form and update the create button state.
 * @returns {boolean}
 */
function validateForm() {
  const isValid = isTaskFormValid();
  updateCreateButtonState(isValid);
  return isValid;
}
