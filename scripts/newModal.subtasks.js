/**
 * Build and render the subtasks list in the edit modal.
 * @param {{subtasks?:any}} task
 */
function setSubtasksList(task) {
  const list = document.getElementById('editSubtasksList');
  if (!list) return;
  list.innerHTML = '';
  const subtasks = normalizeSubtasks(task.subtasks);
  subtasks.forEach((subtask, index) => {
    const item = createEditModalSubtaskItem(subtask, index);
    list.appendChild(item);
  });
}

/**
 * Normalize possible subtasks shapes into array.
 * @param {any} subtasks
 * @returns {Array<{text:string,completed?:boolean}>}
 */
function normalizeSubtasks(subtasks) {
  if (!subtasks) return [];
  const arr = Array.isArray(subtasks)
    ? subtasks
    : (typeof subtasks === 'object' ? Object.values(subtasks) : []);
  return arr.map(st => ({
    text: extractSubtaskText(st),
    completed: !!(st && st.completed)
  }));
}

/**
 * Try to extract a plain string from various subtask shapes, including nested {text:{text:...}}.
 */
function extractSubtaskText(value) {
  // Direct string
  if (typeof value === 'string') return value;
  let t = value;
  // Follow nested .text up to a few levels
  for (let i = 0; i < 3 && t && typeof t === 'object'; i++) {
    if (typeof t.text !== 'undefined') {
      t = t.text;
      continue;
    }
    if (typeof t.innerText === 'string') return t.innerText;
    break;
  }
  if (typeof t === 'string') return t;
  // Last resort: avoid [object Object]
  return '';
}

/**
 * Create a DOM element for a single subtask row.
 * @param {{text:string,completed?:boolean}} subtask
 * @param {number} index
 */
function createEditModalSubtaskItem(subtask, index) {
  const item = createEditModalSubtaskContainer();
  const checkbox = createSubtaskCheckbox(subtask, index);
  const span = createSubtaskSpan(subtask);
  const actions = createSubtaskActions(subtask, item, span);
  item.appendChild(checkbox);
  item.appendChild(span);
  item.appendChild(actions);
  item.dataset.index = String(index);
  return item;
}

/**
 * Container for a subtask line.
 * @returns {HTMLDivElement}
 */
function createEditModalSubtaskContainer() {
  const el = document.createElement('div');
  el.className = 'subtask-item';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.gap = '8px';
  return el;
}

/**
 * Create checkbox for a subtask with change handler saving to Firebase.
 */
function createSubtaskCheckbox(subtask, index) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'subtask-edit-checkbox';
  checkbox.checked = !!subtask.completed;
  checkbox.addEventListener('change', function () {
    subtask.completed = this.checked;
    if (window.currentTask && window.currentTaskId) {
      updateSubtaskStatusInFirebase(window.currentTaskId, index, this.checked);
    }
  });
  return checkbox;
}

/**
 * Create span for subtask text.
 */
function createSubtaskSpan(subtask) {
  const span = document.createElement('span');
  const txt = extractSubtaskText(subtask);
  span.textContent = `• ${txt}`;
  span.style.flex = '1';
  return span;
}

/**
 * Create actions (edit/delete) for a subtask.
 */
function createSubtaskActions(subtask, item, span) {
  const div = document.createElement('div');
  div.className = 'subtask-actions';
  div.innerHTML = `
    <img src="../img/pen.png" alt="Edit" class="subtask-edit-edit">
    <img src="../img/trash.png" alt="Delete" class="subtask-delete-edit">`;
  setupSubtaskEditAction(div, subtask, item, span);
  setupSubtaskDeleteAction(div, item);
  return div;
}

/**
 * Wire up edit click to inline input.
 */
function setupSubtaskEditAction(div, subtask, item, span) {
  const editIcon = div.querySelector('.subtask-edit-edit');
  editIcon.addEventListener('click', () => {
    const input = createEditInput(extractSubtaskText(subtask));
    item.replaceChild(input, span);
    input.focus();
    setupEditInputHandlers(input, subtask, span, item);
  });
}

/**
 * Basic text input for subtask inline edit.
 */
function createEditInput(text) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  input.className = 'subtask-edit-input';
  input.style.flex = '1';
  return input;
}

/**
 * Handlers for blur/enter to finish edit.
 */
function setupEditInputHandlers(input, subtask, span, item) {
  input.addEventListener('blur', () => {
    const newText = input.value.trim();
    if (newText) {
      subtask.text = newText;
      span.textContent = `• ${newText}`;
    }
    item.replaceChild(span, input);
  });
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') input.blur(); });
}

/**
 * Wire delete action and update currentTask subtasks accordingly.
 */
function setupSubtaskDeleteAction(div, item) {
  const deleteIcon = div.querySelector('.subtask-delete-edit');
  deleteIcon.addEventListener('click', () => {
    item.remove();
    removeSubtaskFromCurrentTask(item);
  });
}

/**
 * Remove subtask from currentTask by DOM index.
 */
function removeSubtaskFromCurrentTask(item) {
  if (!window.currentTask || !window.currentTask.subtasks) return;
  const list = document.getElementById('editSubtasksList');
  if (!list) return;
  const idx = Array.from(list.children).indexOf(item);
  if (idx !== -1) window.currentTask.subtasks.splice(idx, 1);
}

/**
 * Persist subtask completion and progress to Firebase.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 */
async function updateSubtaskStatusInFirebase(taskId, subtaskIndex, newStatus) {
  try {
    const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
    const taskData = await (await fetch(url)).json();
    if (!taskData || !Array.isArray(taskData.subtasks)) return;
    if (subtaskIndex < 0 || subtaskIndex >= taskData.subtasks.length) return;
    taskData.subtasks[subtaskIndex].completed = newStatus;
    const total = taskData.subtasks.length;
    const completed = taskData.subtasks.filter(st => st.completed).length;
    const progress = total ? (completed / total) * 100 : 0;
    await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subtasks: taskData.subtasks, progress }) });
    if (typeof updateTaskCardInBackground === 'function') updateTaskCardInBackground(taskId);
  } catch (err) {
    console.error('Error updating subtask status in Firebase:', err);
  }
}

/**
 * Initialize button(s) to add new subtasks in edit modal.
 */
function initSubtaskCreation() {
  const input = document.querySelector('.subtask-input');
  const check = document.querySelector('.subtask-edit-check');
  const list = document.getElementById('editSubtasksList');
  check?.addEventListener('click', () => {
    const text = (input?.value || '').trim();
    if (!text || !list) return;
    addNewSubtask(text, list);
    input.value = '';
  });
}

/**
 * Add a new subtask object and DOM element.
 */
function addNewSubtask(text, list) {
  if (!window.currentTask) return;
  normalizeCurrentTaskSubtasks();
  const subtaskObj = { text, completed: false };
  window.currentTask.subtasks.push(subtaskObj);
  list.appendChild(createNewSubtaskElement(text, subtaskObj, list));
}

/**
 * Ensure currentTask.subtasks is an array.
 */
function normalizeCurrentTaskSubtasks() {
  if (!window.currentTask.subtasks) window.currentTask.subtasks = [];
  else if (!Array.isArray(window.currentTask.subtasks)) window.currentTask.subtasks = Object.values(window.currentTask.subtasks);
}

/**
 * Create DOM for newly added subtask row.
 */
function createNewSubtaskElement(text, subtaskObj, list) {
  const el = createEditModalSubtaskContainer();
  const checkbox = createNewSubtaskCheckbox();
  const span = createSubtaskSpan({ text });
  const actions = createNewSubtaskActions(subtaskObj, el, span, list);
  el.appendChild(checkbox);
  el.appendChild(span);
  el.appendChild(actions);
  el.dataset.index = String(window.currentTask.subtasks.length - 1);
  return el;
}

/**
 * Checkbox for new subtask row (unchecked by default).
 */
function createNewSubtaskCheckbox() {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'subtask-edit-checkbox';
  return checkbox;
}

/**
 * Actions for newly added subtask row.
 */
function createNewSubtaskActions(subtaskObj, el, span, list) {
  const div = document.createElement('div');
  div.className = 'subtask-actions';
  div.innerHTML = `
    <img src="../img/pen.png" alt="Edit" class="subtask-edit-edit">
    <img src="../img/trash.png" alt="Delete" class="subtask-delete-edit">`;
  setupNewSubtaskEditAction(div, subtaskObj, el, span);
  setupNewSubtaskDeleteAction(div, el, list);
  return div;
}

/**
 * Edit handler for newly added subtask row.
 */
function setupNewSubtaskEditAction(div, subtaskObj, el, span) {
  const editIcon = div.querySelector('.subtask-edit-edit');
  editIcon.addEventListener('click', () => {
    const input = createEditInput(subtaskObj.text);
    el.replaceChild(input, span);
    input.focus();
    setupEditInputHandlers(input, subtaskObj, span, el);
  });
}

/**
 * Delete handler for newly added subtask row.
 */
function setupNewSubtaskDeleteAction(div, el, list) {
  const deleteIcon = div.querySelector('.subtask-delete-edit');
  deleteIcon.addEventListener('click', () => {
    el.remove();
    removeNewSubtaskFromCurrentTask(el, list);
  });
}

/**
 * Remove newly added subtask from currentTask based on DOM index.
 */
function removeNewSubtaskFromCurrentTask(el, list) {
  if (!window.currentTask || !window.currentTask.subtasks) return;
  const idx = Array.from(list.children).indexOf(el);
  if (idx !== -1) window.currentTask.subtasks.splice(idx, 1);
}
