/**
 * Bind a button to open a modal by id.
 * @param {string} addButtonId DOM id of the trigger button
 * @param {string} modalId DOM id of the modal element
 */
function setupModalButton(addButtonId, modalId) {
  const addButton = document.getElementById(addButtonId);
  const modal = document.getElementById(modalId);
  if (!addButton || !modal) return;
  addButton.addEventListener('click', () => {
    if (window.innerWidth < 480) {
      window.location.href = './add_task.html';
      return;
    }
    if (typeof resetAddTaskModal === 'function') {
      resetAddTaskModal();
    }
    modal.style.display = 'block';
    if (typeof initAssignDropdownCreate === 'function') {
      initAssignDropdownCreate();
    }
  });
}

/**
 * Close a modal when clicking outside its content.
 * @param {string} modalId DOM id of the modal element
 */
function setupModalClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Toggle visibility of the main task modal.
 */
function toggleModal() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
  }
}

/**
 * Setup account profile dropdown open/close handlers.
 */
function setupAccountDropdown() {
  const accountButton = document.querySelector('.account');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  if (!accountButton || !dropdownMenu) return;
  accountButton.addEventListener('click', (event) => {
    event.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });
  document.addEventListener('click', (event) => {
    if (!dropdownMenu.contains(event.target) && dropdownMenu.classList.contains('show')) {
      dropdownMenu.classList.remove('show');
    }
  });
}

/**
 * Initialize board page scripts and wire up UI.
 * @returns {Promise<void>}
 */
async function init() {
  setupAllModalButtons();
  setupModalClose('taskModal');
  setupAccountDropdown();
  window.toggleModal = toggleModal;
  setupAddTaskButtonHandler();
  await initializeModules();
}

/**
 * Setup all modal trigger buttons.
 * @returns {void}
 */
function setupAllModalButtons() {
  setupModalButton('addTaskButtonTodo', 'taskModal');
  setupModalButton('addTaskButtonInProgress', 'taskModal');
  setupModalButton('addTaskButtonAwaitFeedback', 'taskModal');
  setupModalButton('addTaskButton', 'taskModal');
}

/**
 * Setup add task button handler.
 * @returns {void}
 */
function setupAddTaskButtonHandler() {
  const addTaskBtn = document.getElementById('addTaskButton');
  const taskModal = document.getElementById('taskModal');
  if (addTaskBtn && taskModal) {
    addTaskBtn.addEventListener('click', () => handleAddTaskClick(taskModal));
  }
}

/**
 * Handle add task button click.
 * @param {HTMLElement} taskModal
 * @returns {void}
 */
function handleAddTaskClick(taskModal) {
  if (window.innerWidth < 480) {
    window.location.href = './add_task.html';
    return;
  }
  if (typeof resetAddTaskModal === 'function') {
    resetAddTaskModal();
  }
  taskModal.style.display = 'block';
}

/**
 * Initialize all modules.
 * @returns {Promise<void>}
 */
async function initializeModules() {
  if (typeof initTaskData === 'function') {
    await initTaskData();
  }
  if (typeof initTaskOverlay === 'function') {
    initTaskOverlay();
  }
  if (typeof initTaskForm === 'function') {
    initTaskForm();
  }
  if (typeof initEditModal === 'function') {
    initEditModal();
  }
  if (typeof initTaskDataModal === 'function') {
    initTaskDataModal();
  }
}

window.init = init;

