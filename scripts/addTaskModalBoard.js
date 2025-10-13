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
  const selectors = [
    ".input",
    ".date-input",
    ".select-task",
    ".priority-container",
    ".description",
    ".subtask"
  ];
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
 * Bind subtask add and delete interactions.
 * @returns {void}
 */
function bindSubtaskManagement() {
  const subtaskInput = document.querySelector(".subtask");
  const addSubtaskBtn = document.getElementById("addSubtask");
  const subtasksContainer = document.querySelector(".subtasks-scroll-container");
  if (!addSubtaskBtn || !subtaskInput || !subtasksContainer) return;
  addSubtaskBtn.addEventListener("click", () => handleAddSubtask(subtaskInput, subtasksContainer));
  subtasksContainer.addEventListener("click", handleSubtaskDeletion);
}

/**
 * Handle adding a new subtask from input to the container.
 * @param {HTMLInputElement} subtaskInput
 * @param {HTMLElement} container
 * @returns {void}
 */
function handleAddSubtask(subtaskInput, container) {
  const text = subtaskInput.value.trim();
  if (text !== "") {
    const newItem = createAddTaskSubtaskItem(text);
    container.appendChild(newItem);
    subtaskInput.value = "";
    validateForm();
  }
}

/**
 * Create a subtask list item element for the Add Task modal.
 * @param {string} text
 * @returns {HTMLDivElement}
 */
function createAddTaskSubtaskItem(text) {
  const newItem = document.createElement("div");
  newItem.classList.add("subtask-item", "added-subtasks");
  newItem.innerHTML = `
    <span>${text}</span>
    <img src="../img/subtask-delete.png" alt="Delete Subtask" class="subtask-icon trash-icon" />
  `;
  return newItem;
}

/**
 * Handle click events within the subtask container for deletion.
 * @param {MouseEvent} e
 * @returns {void}
 */
function handleSubtaskDeletion(e) {
  if (e.target.classList.contains("trash-icon")) {
    e.target.parentElement.remove();
    validateForm();
  }
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
  if (!dropdownList || !searchIcon || !searchIconActive) {
    return;
  }
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
 * Bind category dropdown interactions (toggle, select, outside click).
 * @returns {void}
 */
function bindCategoryDropdown() {
  const elements = getCategoryElements();
  if (!elements) return;

  setupCategoryDropdownToggle(elements);
  setupCategoryItemSelection(elements);
  setupCategoryOutsideClick(elements);
}

/**
 * Collect and validate required DOM elements for the category dropdown.
 * @returns {{categoryDropdown:HTMLElement,categorySelected:HTMLElement,categoryOptions:HTMLElement,categoryItems:NodeListOf<Element>}|null}
 */
function getCategoryElements() {
  const categoryDropdown = document.querySelector('.category-dropdown');
  const categorySelected = document.querySelector('.category-selected');
  const categoryOptions = document.querySelector('.category-options');
  const categoryItems = document.querySelectorAll('.category-item');

  if (!categoryDropdown || !categorySelected || !categoryOptions) return null;
  
  return { categoryDropdown, categorySelected, categoryOptions, categoryItems };
}

/**
 * Setup toggle behavior for clicking the category dropdown.
 * @param {{categoryOptions:HTMLElement,categoryDropdown:HTMLElement}} elements
 * @returns {void}
 */
function setupCategoryDropdownToggle(elements) {
  elements.categoryDropdown.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleCategoryOptions(elements.categoryOptions);
  });
}

/**
 * Toggle the category options list visibility.
 * @param {HTMLElement} categoryOptions
 * @returns {void}
 */
function toggleCategoryOptions(categoryOptions) {
  if (categoryOptions.style.display === 'block') {
    categoryOptions.style.display = 'none';
  } else {
    categoryOptions.style.display = 'block';
  }
}

/**
 * Bind click handlers for each category item.
 * @param {{categoryItems:NodeListOf<Element>}} elements
 * @returns {void}
 */
function setupCategoryItemSelection(elements) {
  elements.categoryItems.forEach(item => {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
      handleCategorySelection(elements, this);
    });
  });
}

/**
 * Handle selecting a category item and update view/state.
 * @param {{categoryItems:NodeListOf<Element>,categorySelected:HTMLElement,categoryOptions:HTMLElement}} elements
 * @param {Element} selectedItem
 * @returns {void}
 */
function handleCategorySelection(elements, selectedItem) {
  selectCategoryItem(elements.categoryItems, selectedItem);
  updateCategoryDisplay(elements.categorySelected, selectedItem);
  updateCategorySelect(selectedItem);
  closeCategoryOptions(elements.categoryOptions);
  validateForm();
}

/**
 * Apply selected class to chosen category item.
 * @param {NodeListOf<Element>} categoryItems
 * @param {Element} selectedItem
 * @returns {void}
 */
function selectCategoryItem(categoryItems, selectedItem) {
  categoryItems.forEach(item => item.classList.remove('selected'));
  selectedItem.classList.add('selected');
}

/**
 * Update selected category label text.
 * @param {HTMLElement} categorySelected
 * @param {Element} selectedItem
 * @returns {void}
 */
function updateCategoryDisplay(categorySelected, selectedItem) {
  categorySelected.textContent = selectedItem.textContent;
}

/**
 * Reflect the chosen category in the hidden select element.
 * @param {Element} selectedItem
 * @returns {void}
 */
function updateCategorySelect(selectedItem) {
  const select = document.querySelector('.select-task');
  if (select) {
    select.value = selectedItem.getAttribute('data-value');
  }
}

/**
 * Hide the category options list.
 * @param {HTMLElement} categoryOptions
 * @returns {void}
 */
function closeCategoryOptions(categoryOptions) {
  categoryOptions.style.display = 'none';
}

/**
 * Close category options when clicking outside the dropdown.
 * @param {{categoryOptions:HTMLElement}} elements
 * @returns {void}
 */
function setupCategoryOutsideClick(elements) {
  document.addEventListener('click', function () {
    closeCategoryOptions(elements.categoryOptions);
  });
}

/**
 * Collect current task form values into a data object.
 * @returns {{column:string,description:string,dueDate:string,id:string|null,priority:string,progress:number,title:string,users:Array<{name:string}>,subtasks:Array<{completed:boolean,text:string}>,category:string}}
 */
function getTaskData() {
  return {
    column: "toDoColumn",
    description: getInputValue(".description", "No description provided"),
    dueDate: getInputValue(".date-input"),
    id: null,
    priority: `../img/priority-img/${getAddModalSelectedPriority()}.png`,
    progress: 0,
    title: getInputValue(".input"),
    users: getSelectedUsers(),
    subtasks: getSubtasks(),
    category: getSelectedCategory()
  };
}

/**
 * Get the value of an input by selector, with optional fallback.
 * @param {string} selector
 * @param {string} [fallback]
 * @returns {string}
 */
function getInputValue(selector, fallback = "") {
  return document.querySelector(selector)?.value.trim() || fallback;
}

/**
 * Get the currently selected priority in Add Task modal or fallback to "low".
 * @returns {string}
 */
function getAddModalSelectedPriority() {
  const active = document.querySelector("#taskModal .priority-container .active");
  if (!active) return "low";
  return getPriorityValueFromOption(active);
}

/**
 * Determine priority value from element dataset or class names.
 * @param {Element} el
 * @returns {"urgent"|"medium"|"low"}
 */
function getPriorityValueFromOption(el) {
  const val = el.dataset?.priority;
  if (val === 'urgent' || val === 'medium' || val === 'low') return val;
  if (el.classList.contains('priority-button-urgent')) return 'urgent';
  if (el.classList.contains('priority-button-medium')) return 'medium';
  if (el.classList.contains('priority-button-low')) return 'low';
  return 'low';
}

/**
 * Collect unique selected users from assigned profile badges.
 * @returns {Array<{name:string}>}
 */
function getSelectedUsers() {
  const profiles = document.querySelectorAll('.assigned-to-profiles-container [data-contact-name]');
  const users = Array.from(profiles)
    .map(el => {
      const name = el.getAttribute('data-contact-name')?.trim() || '';
      return name ? { name } : null;
    })
    .filter(Boolean);
  const seen = new Set();
  const unique = [];
  for (const u of users) {
    if (!seen.has(u.name)) {
      seen.add(u.name);
      unique.push(u);
    }
  }
  return unique;
}

/**
 * Collect current subtasks from the DOM.
 * @returns {Array<{completed:boolean,text:string}>}
 */
function getSubtasks() {
  return [...document.querySelectorAll(".subtasks-scroll-container .subtask-item span")].map(span => ({
    completed: false,
    text: span.innerText.trim()
  }));
}

/**
 * Get the selected category value or a default.
 * @returns {string}
 */
function getSelectedCategory() {
  const activeItem = document.querySelector(".category-item.selected");
  return activeItem ? activeItem.dataset.value : "Technical task";
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
 * Check if required form fields are filled.
 * @returns {boolean}
 */
function isTaskFormValid() {
  const title = getInputValue(".input");
  const dueDate = getInputValue(".date-input");
  const category = document.querySelector(".category-item.selected")?.dataset.value;
  return title && dueDate && category;
}

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
 * Validate the form and update the create button state.
 * @returns {boolean} Whether the form is valid.
 */
function validateForm() {
  const isValid = isTaskFormValid();
  updateCreateButtonState(isValid);
  return isValid;
}