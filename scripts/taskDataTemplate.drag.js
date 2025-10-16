/**
 * Enable drag-and-drop for task cards on non-touch devices.
 * @returns {void}
 */
function enableDragAndDrop() {
  if (isTouchDevice()) return;
  attachDragListenersToCards();
  attachDropListenersToColumns();
}

/**
 * Attach drag start/end listeners to all draggable cards.
 * @returns {void}
 */
function attachDragListenersToCards() {
  document.querySelectorAll('.draggable-cards').forEach(card => {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
}

/**
 * Attach dragover listeners to all task board columns.
 * @returns {void}
 */
function attachDropListenersToColumns() {
  document.querySelectorAll('.task-board-container').forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      const dragCard = document.querySelector('.dragging');
      if (dragCard) col.appendChild(dragCard);
    });
  });
}

/**
 * Persist a column change for a task and move its DOM card.
 * @param {string} taskId
 * @param {string} newColumn
 * @returns {Promise<void>}
 */
async function updateTaskColumnInFirebase(taskId, newColumn) {
  try {
    await patchTaskColumn(taskId, newColumn);
    updateTaskDOMPosition(taskId, newColumn);
  } catch (e) {
    console.error('Error updating task column:', e);
  }
}

/**
 * Send PATCH request to update task column in Firebase.
 * @param {string} taskId
 * @param {string} newColumn
 * @returns {Promise<void>}
 */
async function patchTaskColumn(taskId, newColumn) {
  const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column: newColumn })
  });
  if (!r.ok) throw new Error(`Error updating task column: ${r.statusText}`);
}

/**
 * Move a task card element to a new column in the DOM.
 * @param {string} taskId
 * @param {string} newColumn
 * @returns {void}
 */
function updateTaskDOMPosition(taskId, newColumn) {
  const taskElement = document.getElementById(taskId);
  const targetColumn = document.getElementById(newColumn);
  if (!taskElement || !targetColumn) return;
  removeFromOldParent(taskElement, targetColumn);
  appendToNewColumn(taskElement, targetColumn);
  checkColumns();
}

/**
 * Remove task element from its old parent if different.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} targetColumn
 * @returns {void}
 */
function removeFromOldParent(taskElement, targetColumn) {
  if (taskElement.parentNode && taskElement.parentNode !== targetColumn) {
    taskElement.parentNode.removeChild(taskElement);
  }
}

/**
 * Append task element to new column if not already there.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} targetColumn
 * @returns {void}
 */
function appendToNewColumn(taskElement, targetColumn) {
  if (!targetColumn.contains(taskElement)) {
    targetColumn.appendChild(taskElement);
  }
}

/**
 * Check all columns and toggle empty state images.
 * @returns {void}
 */
function checkColumns() {
  document.querySelectorAll('.task-board-container').forEach(col => {
    const img = col.querySelector('img');
    if (!img) return;
    const hasTasks = col.querySelectorAll('.draggable-cards').length > 0;
    img.style.display = hasTasks ? 'none' : 'block';
  });
}
