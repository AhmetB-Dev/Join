function createSubtaskTextSpan(text) {
  const span = document.createElement('span');
  span.innerText = `• ${text}`;
  return span;
}

function createSubtaskActions() {
  const actionsDiv = createActionsContainer();
  const editIcon = createActionIcon("../img/pen.png", "Edit", "subtask-edit-edit");
  const deleteIcon = createActionIcon("../img/trash.png", "Delete", "subtask-delete-edit");
  
  actionsDiv.appendChild(editIcon);
  actionsDiv.appendChild(deleteIcon);
  return actionsDiv;
}

function createActionsContainer() {
  const div = document.createElement('div');
  div.className = "subtask-actions";
  return div;
}

function createActionIcon(src, alt, className) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = className;
  return img;
}

function getCleanText(span) {
  return span.innerText.replace('• ', '');
}

function createAndReplaceInput(container, span, text) {
  const input = createEditInput(text);
  container.replaceChild(input, span);
  input.focus();
  return input;
}

function registerBlurHandler(input, container, originalText) {
  input.addEventListener('blur', async () => {
    const newText = input.value.trim();
    const finalText = newText !== '' ? newText : originalText;
    const newSpan = createSubtaskTextSpan(finalText);
    container.replaceChild(newSpan, input);
    
    await updateSubtaskInFirebase(container, finalText);
  });
}

function updateSubtaskInFirebase(container, finalText) {
  const index = container.dataset.index;
  if (window.currentTask && window.currentTask.subtasks && index !== undefined) {
    window.currentTask.subtasks[index].text = finalText;
    return updateTaskInFirebase(window.currentTask);
  }
}

function replaceSpanWithInput(container, span, originalText) {
  const currentText = getCleanText(span);
  const input = createAndReplaceInput(container, span, currentText);
  registerBlurHandler(input, container, originalText);
}

function createEditInput(text) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  input.classList.add('responsive-subtask-input');
  return input;
}

function getSelectedPriority() {
  if (document.querySelector('.edit-priority-urgent.active')) return 'urgent';
  if (document.querySelector('.edit-priority-medium.active')) return 'medium';
  if (document.querySelector('.edit-priority-low.active')) return 'low';
  return 'medium';
}

function getPriorityPath(priority) {
  switch (priority) {
    case 'urgent': return '../img/priority-img/urgent.png';
    case 'medium': return '../img/priority-img/medium.png';
    case 'low':    return '../img/priority-img/low.png';
    default:       return '../img/priority-img/medium.png';
  }
}

/**
 * Persist the currently edited task to Firebase and refresh UI.
 * @returns {Promise<void>}
 */
async function saveEditedTaskToFirebase() {
  if (!currentTask) return;
  updateTaskFromInputs();
  await updateTaskInFirebase(currentTask);
  closeEditModal();
  if (typeof closeModalAndReload === 'function') {
    await closeModalAndReload();
  }
}

/**
 * Read values from edit modal inputs and update the current task object.
 */
function updateTaskFromInputs() {
  currentTask.title = document.getElementById('editTaskTitle').value.trim() || currentTask.title;
  currentTask.description = document.getElementById('editTaskDescription').value.trim() || currentTask.description;
  currentTask.dueDate = document.getElementById('editDueDate').value.trim() || currentTask.dueDate;
  const prio = getSelectedPriority();
  currentTask.priority = getPriorityPath(prio);
  const cat = document.getElementById('editTaskCategory').value;
  currentTask.category = (cat === 'technical') ? 'Technical task' : 'User Story';
  const newSubs = readSubtasksFromEditModal();
  currentTask.subtasks = newSubs;
  const newAssignees = readAssigneesFromBadges();
  currentTask.users = newAssignees.length ? newAssignees : [];
}

/**
 * PUT the given task object to Firebase by its firebaseKey.
 * @param {{firebaseKey:string}} task
 * @returns {Promise<void>}
 */
async function updateTaskInFirebase(task) {
  if (!task || !task.firebaseKey) return;
  const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${task.firebaseKey}.json`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!response.ok) throw new Error(`Update failed: ${response.statusText}`);
  } catch (error) {}
}

/**
 * Close the edit task modal.
 * @param {Event} [event]
 */
function closeEditModal(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('editTaskModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Close the task detail overlay.
 * @param {Event} [event]
 */
function closeTaskOverlay(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('toggleModalFloating');
  if (modal) {
    modal.style.display = 'none';
    if (window.currentTaskId && typeof updateTaskCardInBackground === 'function') {
      updateTaskCardInBackground(window.currentTaskId);
    }
  }
}

/**
 * Bind the confirm button to save edited task to Firebase.
 */
function bindConfirmEditButton() {
  document.getElementById('confirmEditBtn')?.addEventListener('click', saveEditedTaskToFirebase);
}

/**
 * Initialize adding new subtasks in the edit modal.
 */
function initSubtaskAddition() {
  const subtaskInput = document.querySelector('.subtask-input');
  const subtaskCheck = document.querySelector('.subtask-edit-check');
  const subtasksList = document.getElementById('editSubtasksList');
  subtaskCheck?.addEventListener('click', () => {
    const text = subtaskInput.value.trim();
    if (text !== '') {
      const newSubtask = createNewSubtaskElement(text);
      if (newSubtask) {
        subtasksList.appendChild(newSubtask);
      }
      subtaskInput.value = '';
    }
  });
}

/**
 * Create and append a new subtask element and update local currentTask.
 * @param {string} text
 * @returns {HTMLElement|null}
 */
/**
 * Create a new subtask element and append it to the subtasks list.
 * @param {string} text
 * @returns {HTMLElement|null}
 */
function createNewSubtaskElement(text) {
  const subtasksList = document.getElementById('editSubtasksList');
  
  if (!window.currentTask) return null;
  
  normalizeCurrentTaskSubtasks();
  const subtaskObj = { text: text, completed: false };
  
  const index = window.currentTask.subtasks.length;
  window.currentTask.subtasks.push(subtaskObj);
  
  const newSubtask = createSubtaskItemWithHandlers(subtaskObj, index);
  
  return newSubtask;
}

/**
 * Build a subtask list item with checkbox and edit/delete actions.
 * @param {{text:string,completed:boolean}} subtask
 * @param {number} index
 * @returns {HTMLElement}
 */
/**
 * Create a subtask list item with checkbox and edit/delete actions.
 * @param {{text:string,completed:boolean}} subtask
 * @param {number} index
 * @returns {HTMLElement}
 */
function createSubtaskItemWithHandlers(subtask, index) {
  const subtaskItem = createSubtaskItemContainer();
  const checkbox = createSubtaskCheckboxWithHandler(subtask, index);
  const span = createSubtaskTextSpan(subtask.text);
  const actionsDiv = createSubtaskActionsContainer();
  
  setupEditActionForNewSubtask(actionsDiv, subtaskItem, span, subtask);
  setupDeleteActionForNewSubtask(actionsDiv, subtaskItem);
  
  appendSubtaskElementsToContainer(subtaskItem, checkbox, span, actionsDiv);
  subtaskItem.dataset.index = index;
  
  return subtaskItem;
}

/**
 * Create a subtask list item container.
 * @returns {HTMLElement}
 */
function createSubtaskItemContainer() {
  const subtaskItem = document.createElement("div");
  subtaskItem.className = "subtask-item";
  subtaskItem.style.display = "flex";
  subtaskItem.style.alignItems = "center";
  subtaskItem.style.gap = "8px";
  return subtaskItem;
}

/**
 * Create a subtask checkbox with event handler.
 * @param {{text:string,completed:boolean}} subtask
 * @param {number} index
 * @returns {HTMLElement}
 */
function createSubtaskCheckboxWithHandler(subtask, index) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "subtask-edit-checkbox";
  checkbox.checked = subtask.completed || false;
  checkbox.addEventListener('change', function() {
    subtask.completed = this.checked;
    if (window.currentTask && window.currentTaskId) {
      updateSubtaskStatusInFirebaseWithLocalData(window.currentTaskId, index, this.checked);
    }
  });
  return checkbox;
}

/**
 * Create a subtask text span.
 * @param {string} text
 * @returns {HTMLElement}
 */
function createSubtaskTextSpan(text) {
  const span = document.createElement("span");
  span.textContent = `• ${text}`;
  span.style.flex = "1";
  return span;
}

/**
 * Create a subtask actions container.
 * @returns {HTMLElement}
 */
function createSubtaskActionsContainer() {
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "subtask-actions";
  actionsDiv.innerHTML = `
    <img src="../img/pen.png" alt="Edit" class="subtask-edit-edit">
    <img src="../img/trash.png" alt="Delete" class="subtask-delete-edit">`;
  return actionsDiv;
}

/**
 * Set up edit action for new subtask.
 * @param {HTMLElement} actionsDiv
 * @param {HTMLElement} subtaskItem
 * @param {HTMLElement} span
 * @param {{text:string,completed:boolean}} subtask
 */
function setupEditActionForNewSubtask(actionsDiv, subtaskItem, span, subtask) {
  const editIcon = actionsDiv.querySelector('.subtask-edit-edit');
  editIcon.addEventListener('click', () => {
    const input = createEditInputForSubtask(subtask.text);
    subtaskItem.replaceChild(input, span);
    input.focus();
    setupEditInputEventHandlers(input, subtaskItem, span, subtask);
  });
}

/**
 * Create an edit input for subtask.
 * @param {string} text
 * @returns {HTMLElement}
 */
function createEditInputForSubtask(text) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  input.className = 'subtask-edit-input';
  input.style.flex = "1";
  return input;
}

/**
 * Set up edit input event handlers.
 * @param {HTMLElement} input
 * @param {HTMLElement} subtaskItem
 * @param {HTMLElement} span
 * @param {{text:string,completed:boolean}} subtask
 */
function setupEditInputEventHandlers(input, subtaskItem, span, subtask) {
  input.addEventListener('blur', () => {
    const newText = input.value.trim();
    if (newText) {
      subtask.text = newText;
      span.textContent = `• ${newText}`;
    }
    subtaskItem.replaceChild(span, input);
  });
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      input.blur();
    }
  });
}

/**
 * Set up delete action for new subtask.
 * @param {HTMLElement} actionsDiv
 * @param {HTMLElement} subtaskItem
 */
function setupDeleteActionForNewSubtask(actionsDiv, subtaskItem) {
  const deleteIcon = actionsDiv.querySelector('.subtask-delete-edit');
  deleteIcon.addEventListener('click', () => {
    subtaskItem.remove();
    removeSubtaskFromCurrentTaskArray(subtaskItem);
  });
}

/**
 * Remove subtask from current task array.
 * @param {HTMLElement} subtaskItem
 */
function removeSubtaskFromCurrentTaskArray(subtaskItem) {
  if (window.currentTask && window.currentTask.subtasks) {
    const itemIndex = Array.from(document.getElementById('editSubtasksList').children).indexOf(subtaskItem);
    if (itemIndex !== -1) {
      window.currentTask.subtasks.splice(itemIndex, 1);
    }
  }
}

/**
 * Append subtask elements to container.
 * @param {HTMLElement} subtaskItem
 * @param {HTMLElement} checkbox
 * @param {HTMLElement} span
 * @param {HTMLElement} actionsDiv
 */
function appendSubtaskElementsToContainer(subtaskItem, checkbox, span, actionsDiv) {
  subtaskItem.appendChild(checkbox);
  subtaskItem.appendChild(span);
  subtaskItem.appendChild(actionsDiv);
}

/**
 * Normalize current task subtasks.
 */
function normalizeCurrentTaskSubtasks() {
  if (!window.currentTask.subtasks) {
    window.currentTask.subtasks = [];
  } else if (!Array.isArray(window.currentTask.subtasks)) {
    window.currentTask.subtasks = Object.values(window.currentTask.subtasks);
  }
}

/**
 * Patch subtask status using local currentTask state and update card.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 * @returns {Promise<void>}
 */
async function updateSubtaskStatusInFirebaseWithLocalData(taskId, subtaskIndex, newStatus) {
  try {
    if (window.currentTask && window.currentTask.subtasks && Array.isArray(window.currentTask.subtasks)) {
      if (subtaskIndex >= 0 && subtaskIndex < window.currentTask.subtasks.length && window.currentTask.subtasks[subtaskIndex]) {
        window.currentTask.subtasks[subtaskIndex].completed = newStatus;
        const total = window.currentTask.subtasks.length;
        const completed = window.currentTask.subtasks.filter(st => st.completed).length;
        const newProgress = total ? (completed / total) * 100 : 0;
        const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            subtasks: window.currentTask.subtasks, 
            progress: newProgress 
          })
        });
        if (typeof updateTaskCardInBackground === 'function') {
          updateTaskCardInBackground(taskId);
        }
      } else {
        console.error('Invalid subtask index:', subtaskIndex, 'for local subtasks length:', window.currentTask.subtasks.length);
      }
    }
  } catch (error) {
    console.error('Error updating subtask status in Firebase:', error);
  }
}

/**
 * Fetch current task, patch a subtask status and update card.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 * @returns {Promise<void>}
 */
async function updateSubtaskStatusInFirebase(taskId, subtaskIndex, newStatus) {
  try {
    const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
    const response = await fetch(url);
    const taskData = await response.json();
    if (taskData && taskData.subtasks && Array.isArray(taskData.subtasks)) {
      if (subtaskIndex >= 0 && subtaskIndex < taskData.subtasks.length && taskData.subtasks[subtaskIndex]) {
        taskData.subtasks[subtaskIndex].completed = newStatus;
        const total = taskData.subtasks.length;
        const completed = taskData.subtasks.filter(st => st.completed).length;
        const newProgress = total ? (completed / total) * 100 : 0;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            subtasks: taskData.subtasks, 
            progress: newProgress 
          })
        });
        if (typeof updateTaskCardInBackground === 'function') {
          updateTaskCardInBackground(taskId);
        }
      } else {
        console.error('Invalid subtask index:', subtaskIndex, 'for subtasks length:', taskData.subtasks.length);
      }
    }
  } catch (error) {
    console.error('Error updating subtask status in Firebase:', error);
  }
}

/**
 * Initialize handlers inside the edit modal (confirm, add subtasks).
 */
function initTaskDataModal() {
  bindConfirmEditButton();
  initSubtaskAddition();
}