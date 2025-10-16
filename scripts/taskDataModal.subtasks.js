/**
 * Create a subtask text span element.
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
 * Create a subtask actions container with edit/delete icons.
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
 * Create an edit input for subtask inline editing.
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
 * Create a subtask checkbox with change event handler.
 * @param {{text:string,completed:boolean}} subtask
 * @param {number} index
 * @returns {HTMLElement}
 */
function createSubtaskCheckboxWithHandler(subtask, index) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "subtask-edit-checkbox";
  checkbox.checked = subtask.completed || false;
  attachCheckboxChangeHandler(checkbox, subtask, index);
  return checkbox;
}

/**
 * Attach change handler to subtask checkbox.
 * @param {HTMLElement} checkbox
 * @param {{text:string,completed:boolean}} subtask
 * @param {number} index
 * @returns {void}
 */
function attachCheckboxChangeHandler(checkbox, subtask, index) {
  checkbox.addEventListener('change', function() {
    subtask.completed = this.checked;
    if (window.currentTask && window.currentTaskId) {
      updateSubtaskStatusInFirebaseWithLocalData(window.currentTaskId, index, this.checked);
    }
  });
}

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
 * Append subtask elements to container.
 * @param {HTMLElement} subtaskItem
 * @param {HTMLElement} checkbox
 * @param {HTMLElement} span
 * @param {HTMLElement} actionsDiv
 * @returns {void}
 */
function appendSubtaskElementsToContainer(subtaskItem, checkbox, span, actionsDiv) {
  subtaskItem.appendChild(checkbox);
  subtaskItem.appendChild(span);
  subtaskItem.appendChild(actionsDiv);
}

/**
 * Set up edit action for new subtask.
 * @param {HTMLElement} actionsDiv
 * @param {HTMLElement} subtaskItem
 * @param {HTMLElement} span
 * @param {{text:string,completed:boolean}} subtask
 * @returns {void}
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
 * Set up edit input event handlers for blur and enter key.
 * @param {HTMLElement} input
 * @param {HTMLElement} subtaskItem
 * @param {HTMLElement} span
 * @param {{text:string,completed:boolean}} subtask
 * @returns {void}
 */
function setupEditInputEventHandlers(input, subtaskItem, span, subtask) {
  attachBlurHandler(input, subtaskItem, span, subtask);
  attachEnterKeyHandler(input);
}

/**
 * Attach blur handler to save subtask text.
 * @param {HTMLElement} input
 * @param {HTMLElement} subtaskItem
 * @param {HTMLElement} span
 * @param {{text:string,completed:boolean}} subtask
 * @returns {void}
 */
function attachBlurHandler(input, subtaskItem, span, subtask) {
  input.addEventListener('blur', () => {
    const newText = input.value.trim();
    if (newText) {
      subtask.text = newText;
      span.textContent = `• ${newText}`;
    }
    subtaskItem.replaceChild(span, input);
  });
}

/**
 * Attach enter key handler to trigger blur.
 * @param {HTMLElement} input
 * @returns {void}
 */
function attachEnterKeyHandler(input) {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') input.blur();
  });
}

/**
 * Set up delete action for new subtask.
 * @param {HTMLElement} actionsDiv
 * @param {HTMLElement} subtaskItem
 * @returns {void}
 */
function setupDeleteActionForNewSubtask(actionsDiv, subtaskItem) {
  const deleteIcon = actionsDiv.querySelector('.subtask-delete-edit');
  deleteIcon.addEventListener('click', () => {
    subtaskItem.remove();
    removeSubtaskFromCurrentTaskArray(subtaskItem);
  });
}

/**
 * Remove subtask from current task array by DOM index.
 * @param {HTMLElement} subtaskItem
 * @returns {void}
 */
function removeSubtaskFromCurrentTaskArray(subtaskItem) {
  if (!window.currentTask || !window.currentTask.subtasks) return;
  const itemIndex = Array.from(document.getElementById('editSubtasksList').children).indexOf(subtaskItem);
  if (itemIndex !== -1) {
    window.currentTask.subtasks.splice(itemIndex, 1);
  }
}

/**
 * Create a new subtask element and add to currentTask.
 * @param {string} text
 * @returns {HTMLElement|null}
 */
function createNewSubtaskElement(text) {
  if (!window.currentTask) return null;
  normalizeCurrentTaskSubtasks();
  const subtaskObj = { text: text, completed: false };
  const index = window.currentTask.subtasks.length;
  window.currentTask.subtasks.push(subtaskObj);
  return createSubtaskItemWithHandlers(subtaskObj, index);
}

/**
 * Normalize current task subtasks to array.
 * @returns {void}
 */
function normalizeCurrentTaskSubtasks() {
  if (!window.currentTask.subtasks) {
    window.currentTask.subtasks = [];
  } else if (!Array.isArray(window.currentTask.subtasks)) {
    window.currentTask.subtasks = Object.values(window.currentTask.subtasks);
  }
}

/**
 * Create subtask actions container with icons.
 * @returns {HTMLElement}
 */
function createSubtaskActions() {
  const actionsDiv = createActionsContainer();
  const editIcon = createActionIcon("../img/pen.png", "Edit", "subtask-edit-edit");
  const deleteIcon = createActionIcon("../img/trash.png", "Delete", "subtask-delete-edit");
  actionsDiv.appendChild(editIcon);
  actionsDiv.appendChild(deleteIcon);
  return actionsDiv;
}

/**
 * Create actions container div.
 * @returns {HTMLElement}
 */
function createActionsContainer() {
  const div = document.createElement('div');
  div.className = "subtask-actions";
  return div;
}

/**
 * Create action icon image element.
 * @param {string} src
 * @param {string} alt
 * @param {string} className
 * @returns {HTMLElement}
 */
function createActionIcon(src, alt, className) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = className;
  return img;
}

/**
 * Get clean text from span without bullet.
 * @param {HTMLElement} span
 * @returns {string}
 */
function getCleanText(span) {
  return span.innerText.replace('• ', '');
}

/**
 * Create and replace span with input element.
 * @param {HTMLElement} container
 * @param {HTMLElement} span
 * @param {string} text
 * @returns {HTMLElement}
 */
function createAndReplaceInput(container, span, text) {
  const input = createEditInput(text);
  container.replaceChild(input, span);
  input.focus();
  return input;
}

/**
 * Register blur handler for input element.
 * @param {HTMLElement} input
 * @param {HTMLElement} container
 * @param {string} originalText
 * @returns {void}
 */
function registerBlurHandler(input, container, originalText) {
  input.addEventListener('blur', async () => {
    const newText = input.value.trim();
    const finalText = newText !== '' ? newText : originalText;
    const newSpan = createSubtaskTextSpan(finalText);
    container.replaceChild(newSpan, input);
    await updateSubtaskInFirebase(container, finalText);
  });
}

/**
 * Replace span with input for editing.
 * @param {HTMLElement} container
 * @param {HTMLElement} span
 * @param {string} originalText
 * @returns {void}
 */
function replaceSpanWithInput(container, span, originalText) {
  const currentText = getCleanText(span);
  const input = createAndReplaceInput(container, span, currentText);
  registerBlurHandler(input, container, originalText);
}

/**
 * Create edit input element.
 * @param {string} text
 * @returns {HTMLElement}
 */
function createEditInput(text) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  input.classList.add('responsive-subtask-input');
  return input;
}
