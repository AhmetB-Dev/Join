/**
 * Persist the currently edited task to Firebase and refresh UI.
 * @returns {Promise<void>}
 */
async function saveEditedTaskToFirebase() {
  if (!currentTask) return;
  updateTaskFromInputs();
  await updateTaskInFirebase(currentTask);
  closeEditModal();
  await triggerModalReload();
}

/**
 * Trigger modal reload if function exists.
 * @returns {Promise<void>}
 */
async function triggerModalReload() {
  if (typeof closeModalAndReload === 'function') {
    await closeModalAndReload();
  }
}

/**
 * Read values from edit modal inputs and update the current task object.
 * @returns {void}
 */
function updateTaskFromInputs() {
  updateTaskBasicFields();
  updateTaskPriority();
  updateTaskCategory();
  updateTaskSubtasks();
  updateTaskAssignees();
}

/**
 * Update basic task fields from inputs.
 * @returns {void}
 */
function updateTaskBasicFields() {
  currentTask.title = document.getElementById('editTaskTitle').value.trim() || currentTask.title;
  currentTask.description = document.getElementById('editTaskDescription').value.trim() || currentTask.description;
  currentTask.dueDate = document.getElementById('editDueDate').value.trim() || currentTask.dueDate;
}

/**
 * Update task priority from selection.
 * @returns {void}
 */
function updateTaskPriority() {
  const prio = getSelectedPriority();
  currentTask.priority = getPriorityPath(prio);
}

/**
 * Update task category from dropdown.
 * @returns {void}
 */
function updateTaskCategory() {
  const cat = document.getElementById('editTaskCategory').value;
  currentTask.category = (cat === 'technical') ? 'Technical task' : 'User Story';
}

/**
 * Update task subtasks from modal.
 * @returns {void}
 */
function updateTaskSubtasks() {
  const newSubs = readSubtasksFromEditModal();
  currentTask.subtasks = newSubs;
}

/**
 * Update task assignees from badges.
 * @returns {void}
 */
function updateTaskAssignees() {
  const newAssignees = readAssigneesFromBadges();
  currentTask.users = newAssignees.length ? newAssignees : [];
}

/**
 * Close the edit task modal.
 * @param {Event} [event]
 * @returns {void}
 */
function closeEditModal(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('editTaskModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Close the task detail overlay.
 * @param {Event} [event]
 * @returns {void}
 */
function closeTaskOverlay(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('toggleModalFloating');
  if (modal) {
    modal.style.display = 'none';
    triggerBackgroundCardUpdate();
  }
}

/**
 * Trigger background card update if conditions met.
 * @returns {void}
 */
function triggerBackgroundCardUpdate() {
  if (window.currentTaskId && typeof updateTaskCardInBackground === 'function') {
    updateTaskCardInBackground(window.currentTaskId);
  }
}

/**
 * Bind the confirm button to save edited task to Firebase.
 * @returns {void}
 */
function bindConfirmEditButton() {
  document.getElementById('confirmEditBtn')?.addEventListener('click', saveEditedTaskToFirebase);
}

/**
 * Initialize adding new subtasks in the edit modal.
 * @returns {void}
 */
function initSubtaskAddition() {
  const subtaskInput = document.querySelector('.subtask-input');
  const subtaskCheck = document.querySelector('.subtask-edit-check');
  const subtasksList = document.getElementById('editSubtasksList');
  attachSubtaskAddListener(subtaskCheck, subtaskInput, subtasksList);
}

/**
 * Attach listener to add new subtask.
 * @param {HTMLElement} subtaskCheck
 * @param {HTMLElement} subtaskInput
 * @param {HTMLElement} subtasksList
 * @returns {void}
 */
function attachSubtaskAddListener(subtaskCheck, subtaskInput, subtasksList) {
  subtaskCheck?.addEventListener('click', () => {
    const text = subtaskInput.value.trim();
    if (text !== '') {
      addNewSubtaskToList(text, subtasksList, subtaskInput);
    }
  });
}

/**
 * Add new subtask to list and clear input.
 * @param {string} text
 * @param {HTMLElement} subtasksList
 * @param {HTMLElement} subtaskInput
 * @returns {void}
 */
function addNewSubtaskToList(text, subtasksList, subtaskInput) {
  const newSubtask = createNewSubtaskElement(text);
  if (newSubtask) {
    subtasksList.appendChild(newSubtask);
  }
  subtaskInput.value = '';
}

/**
 * Initialize handlers inside the edit modal (confirm, add subtasks).
 * @returns {void}
 */
function initTaskDataModal() {
  bindConfirmEditButton();
  initSubtaskAddition();
  setupEditDeleteDelegationForTaskData();
}

/**
 * Delegate clicks on edit/delete icons within subtask list.
 * @returns {void}
 */
function setupEditDeleteDelegationForTaskData() {
  const list = document.getElementById('editSubtasksList');
  if (!list || list.__delegated) return;
  attachDelegatedClickHandler(list);
  list.__delegated = true;
}

/**
 * Attach delegated click handler to list.
 * @param {HTMLElement} list
 * @returns {void}
 */
function attachDelegatedClickHandler(list) {
  list.addEventListener('click', (e) => {
    const editIcon = e.target.closest && e.target.closest('.subtask-edit-edit');
    const deleteIcon = e.target.closest && e.target.closest('.subtask-delete-edit');
    if (!editIcon && !deleteIcon) return;
    const item = e.target.closest('.subtask-item');
    if (!item) return;
    if (deleteIcon) {
      handleDeleteClick(item);
    } else if (editIcon) {
      handleEditClick(item);
    }
  });
}

/**
 * Handle delete icon click.
 * @param {HTMLElement} item
 * @returns {void}
 */
function handleDeleteClick(item) {
  item.remove();
  removeSubtaskFromCurrentTaskArray(item);
}

/**
 * Handle edit icon click.
 * @param {HTMLElement} item
 * @returns {void}
 */
function handleEditClick(item) {
  const span = item.querySelector('span');
  const actionsDiv = item.querySelector('.subtask-actions');
  const current = (span?.textContent || '').replace(/^•\s*/, '');
  const input = createEditInputForSubtask(current);
  insertInputIntoItem(item, input, span, actionsDiv);
  input.focus();
  attachEditInputHandlers(input, item, span, actionsDiv, current);
}

/**
 * Insert input into item at correct position.
 * @param {HTMLElement} item
 * @param {HTMLElement} input
 * @param {HTMLElement} span
 * @param {HTMLElement} actionsDiv
 * @returns {void}
 */
function insertInputIntoItem(item, input, span, actionsDiv) {
  if (span && span.parentNode === item) {
    item.replaceChild(input, span);
  } else if (actionsDiv && actionsDiv.parentNode === item) {
    item.insertBefore(input, actionsDiv);
  } else {
    item.appendChild(input);
  }
}

/**
 * Attach blur and keypress handlers to edit input.
 * @param {HTMLElement} input
 * @param {HTMLElement} item
 * @param {HTMLElement} span
 * @param {HTMLElement} actionsDiv
 * @param {string} current
 * @returns {void}
 */
function attachEditInputHandlers(input, item, span, actionsDiv, current) {
  attachEditBlurHandler(input, item, span, actionsDiv, current);
  attachEditKeyHandler(input);
}

/**
 * Attach blur handler to save edited text.
 * @param {HTMLElement} input
 * @param {HTMLElement} item
 * @param {HTMLElement} span
 * @param {HTMLElement} actionsDiv
 * @param {string} current
 * @returns {void}
 */
function attachEditBlurHandler(input, item, span, actionsDiv, current) {
  input.addEventListener('blur', async () => {
    const newText = input.value.trim() || current;
    const newSpan = createSubtaskTextSpan(newText);
    replaceInputWithSpan(input, item, newSpan, actionsDiv);
    await updateSubtaskInFirebase(item, newText);
  });
}

/**
 * Replace input with span at correct position.
 * @param {HTMLElement} input
 * @param {HTMLElement} item
 * @param {HTMLElement} newSpan
 * @param {HTMLElement} actionsDiv
 * @returns {void}
 */
function replaceInputWithSpan(input, item, newSpan, actionsDiv) {
  if (input.parentNode === item) {
    if (actionsDiv && actionsDiv.parentNode === item) {
      item.insertBefore(newSpan, actionsDiv);
      input.remove();
    } else {
      item.replaceChild(newSpan, input);
    }
  }
}

/**
 * Attach keypress handler to trigger blur on Enter.
 * @param {HTMLElement} input
 * @returns {void}
 */
function attachEditKeyHandler(input) {
  input.addEventListener('keypress', (ev) => {
    if (ev.key === 'Enter') input.blur();
  });
}
