/**
 * Bind the create button click handler with a fresh listener instance.
 * @returns {void}
 */
function bindCreateButton() {
  const btn = getUniqueCreateButton();
  if (!btn) return;
  btn.addEventListener("click", createTaskHandler);
}

/**
 * Replace existing create button with a cloned node to prevent duplicate listeners.
 * @returns {HTMLButtonElement|null}
 */
function getUniqueCreateButton() {
  const oldBtn = document.querySelector(".create-btn");
  if (!oldBtn) return null;
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  return newBtn;
}

/**
 * Handle the create button click: validate, disable, persist and re-enable.
 * @param {MouseEvent} e
 * @returns {Promise<void>}
 */
async function createTaskHandler(e) {
  const btn = e.currentTarget;
  if (!validateForm()) return;
  btn.disabled = true;
  try {
    await addTaskToFirebase();
  } catch (error) {
    console.error("Task creation failed", error);
  } finally {
    btn.disabled = false;
  }
}

/**
 * Bind input/change listeners to relevant form fields for validation.
 * @returns {void}
 */
function bindInputValidation() {
  const selectors = [".input", ".date-input", ".select-task", ".priority-container", ".description", ".subtask"];
  selectors.forEach(addValidationListener);
}

/**
 * Add a validation listener to a specific element by selector.
 * @param {string} selector
 * @returns {void}
 */
function addValidationListener(selector) {
  const element = document.querySelector(selector);
  if (element) {
    const eventType = selector === ".select-task" ? "change" : "input";
    element.addEventListener(eventType, validateForm);
  }
}

/**
 * Observe changes to assigned profiles to trigger validation.
 * @returns {void}
 */
function observeAssignedProfiles() {
  const container = document.querySelector(".assigned-to-profiles-container");
  if (container) {
    const observer = new MutationObserver(validateForm);
    observer.observe(container, { childList: true });
  }
}

/**
 * Bind priority selection click events and keep validation updated.
 * @returns {void}
 */
function bindPrioritySelection() {
  const options = document.querySelectorAll("#taskModal .priority-container div");
  options.forEach(option => {
    option.addEventListener("click", () => {
      removeActiveClass(options);
      option.classList.add("active");
      option.dataset.priority = getPriorityValueFromOption(option);
      validateForm();
    });
  });
}

/**
 * Remove the active class from all provided priority options.
 * @param {NodeListOf<Element>|Element[]} options
 * @returns {void}
 */
function removeActiveClass(options) {
  options.forEach(o => o.classList.remove("active"));
}

/**
 * Set default priority to medium if available.
 * @returns {void}
 */
function setDefaultPriorityMedium() {
  const options = document.querySelectorAll('#taskModal .priority-container div');
  if (!options || options.length === 0) return;
  removeActiveClass(options);
  const medium = document.querySelector('#taskModal .priority-container [data-priority="medium"]')
    || document.querySelector('#taskModal .priority-button-medium');
  if (medium) {
    medium.classList.add('active');
    medium.dataset.priority = 'medium';
  }
}

/**
 * Setup the assignee dropdown input to toggle the dropdown when clicked.
 * @returns {void}
 */
function setupDropdownInputHandler() {
  const dropdownInput = document.querySelector('.dropdown-search');
  if (dropdownInput) {
    const oldInput = dropdownInput;
    const newInput = oldInput.cloneNode(true);
    oldInput.parentNode.replaceChild(newInput, oldInput);
    newInput.addEventListener('click', toggleDropdown);
  }
}

/**
 * Toggle the assignee dropdown visibility and icons.
 * Loads contacts when opening.
 * @returns {void}
 */
function toggleDropdown() {
  const dropdownList = document.querySelector('.dropdown-list');
  const searchIcon = document.querySelector('.search-icon');
  const searchIconActive = document.querySelector('.search-icon-active');
  if (!dropdownList || !searchIcon || !searchIconActive) return;
  if (dropdownList.style.display === 'block') {
    dropdownList.style.display = 'none';
    searchIcon.style.display = 'block';
    searchIconActive.style.display = 'none';
  } else {
    dropdownList.style.display = 'block';
    searchIcon.style.display = 'none';
    searchIconActive.style.display = 'block';
    loadContactsForAssignment();
  }
}

/**
 * Initialisiert das Datumsfeld im Add-Task-Modal: readonly + Flatpickr.
 * @returns {void}
 */
function initAddTaskDateInput() {
  const inp = document.querySelector('.date-input');
  if (!inp) return;
  inp.setAttribute('readonly', 'readonly');
  inp.setAttribute('inputmode', 'none');
  try {
    if (window.flatpickr) {
      if (inp._flatpickr) {
        inp._flatpickr.set(getDefaultDatePickerConfig());
      } else {
        flatpickr(inp, getDefaultDatePickerConfig());
      }
    }
  } catch {}
  inp.addEventListener('keydown', (e) => e.preventDefault());
  inp.addEventListener('beforeinput', (e) => e.preventDefault());
}

/**
 * Reset texts and selections in Add Task modal.
 * @returns {void}
 */
function resetAddTaskModal() {
  resetCategorySelection();
  resetAssignedProfiles();
  resetDropdownState();
  initAddTaskDateInput();
}

/**
 * Reset category selection.
 * @returns {void}
 */
function resetCategorySelection() {
  const categorySelected = document.querySelector('.category-selected');
  if (categorySelected) categorySelected.textContent = 'Select task category';
  document.querySelectorAll('.category-item.selected').forEach(i => i.classList.remove('selected'));
  const selectEl = document.querySelector('.select-task');
  if (selectEl) selectEl.value = '';
}

/**
 * Reset assigned profiles container.
 * @returns {void}
 */
function resetAssignedProfiles() {
  const profiles = document.querySelector('.assigned-to-profiles-container');
  if (profiles) {
    profiles.querySelectorAll('.assigned-more-badge').forEach(n => n.remove());
    profiles.querySelectorAll('[data-contact-name]').forEach(b => (b.style.display = ''));
  }
}

/**
 * Reset dropdown and search icons state.
 * @returns {void}
 */
function resetDropdownState() {
  const ddList = document.querySelector('.dropdown-list');
  const s1 = document.querySelector('.search-icon');
  const s2 = document.querySelector('.search-icon-active');
  if (ddList) ddList.style.display = 'none';
  if (s1) s1.style.display = 'block';
  if (s2) s2.style.display = 'none';
}

/**
 * Clear the task creation form inputs and dynamic lists.
 * @returns {void}
 */
function clearForm() {
  [".input", ".description", ".date-input", ".select-task", ".subtask"].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  });
  document.querySelectorAll(".assigned-to-profiles-container div").forEach(div => div.remove());
  const subtasksContainer = document.querySelector(".subtasks-scroll-container");
  if (subtasksContainer) subtasksContainer.innerHTML = "";
}

/**
 * Close the task modal if it is open.
 * @returns {void}
 */
function closeModal() {
  const modal = document.getElementById("taskModal");
  if (modal) modal.style.display = "none";
}

/**
 * Initialize modal form bindings and defaults.
 * @returns {void}
 */
function initTaskForm() {
  bindCreateButton();
  bindInputValidation();
  observeAssignedProfiles();
  bindPrioritySelection();
  bindCategoryDropdown();
  bindSubtaskManagement();
  setDefaultPriorityMedium();
  validateForm();
  setupDropdownInputHandler();
  initAddTaskDateInput();
}
