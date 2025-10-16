/**
 * Attach touch events.
 * @param {HTMLElement} task
 * @param {Array<HTMLElement>} columns
 */
function attachTouchDragEvents(task, columns) {
  const state = {
    touchStartY: 0,
    touchStartX: 0,
    isDragging: false,
    currentColumn: null,
    clone: null,
    dragTimeout: null,
    task,
    columns
  };
  task.addEventListener('touchstart', (e) => onTouchStart(e, state), { passive: true });
  task.addEventListener('touchmove', (e) => onTouchMove(e, state));
  task.addEventListener('touchend', (e) => onTouchEnd(e, state), { passive: true });
  task.addEventListener('touchcancel', () => onTouchCancel(state), { passive: true });
}

/**
 * Handle touchstart.
 * @param {TouchEvent} e
 * @param {any} state
 */
function onTouchStart(e, state) {
  const touch = e.touches[0];
  state.touchStartY = touch.clientY;
  state.touchStartX = touch.clientX;
  state.isDragging = false;
  state.dragTimeout = setTimeout(() => beginTouchDrag(state, touch.clientX, touch.clientY), 200);
}

/**
 * Begin touch drag.
 * @param {any} state
 * @param {number} clientX
 * @param {number} clientY
 */
function beginTouchDrag(state, clientX, clientY) {
  state.isDragging = true;
  selectedTask = state.task;
  state.task.classList.add('dragging');
  state.task.style.opacity = '0.5';
  lockScrollForDrag();
  state.clone = createTaskClone(state.task);
  document.body.appendChild(state.clone);
  updateClonePosition(state, clientX, clientY);
}

/**
 * Handle touchmove.
 * @param {TouchEvent} e
 * @param {any} state
 */
function onTouchMove(e, state) {
  if (!state.isDragging || !state.clone) return;
  const touch = e.touches[0];
  updateClonePosition(state, touch.clientX, touch.clientY);
  const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  const columnBelow = elemBelow?.closest('.task-board-container');
  if (columnBelow && columnBelow !== state.currentColumn) {
    updatePlaceholderInColumn(state, columnBelow, touch.clientY);
  }
}

/**
 * Update placeholder.
 * @param {any} state
 * @param {HTMLElement} columnBelow
 * @param {number} clientY
 */
function updatePlaceholderInColumn(state, columnBelow, clientY) {
  state.currentColumn = columnBelow;
  if (!columnBelow.contains(dragPlaceholder)) {
    const afterEl = getDragAfterElement(columnBelow, clientY);
    if (!afterEl) columnBelow.appendChild(dragPlaceholder);
    else columnBelow.insertBefore(dragPlaceholder, afterEl);
  }
}

/**
 * Handle touchend.
 * @param {TouchEvent} e
 * @param {any} state
 */
function onTouchEnd(e, state) {
  clearTimeout(state.dragTimeout);
  unlockScrollFromDrag();
  if (!state.isDragging) return;
  resetTaskDragState(state);
  if (state.currentColumn && selectedTask) {
    dropTaskInColumn(state.currentColumn, selectedTask);
  }
  cleanupDragState(state);
}

/**
 * Reset task state.
 * @param {any} state
 */
function resetTaskDragState(state) {
  state.isDragging = false;
  state.task.classList.remove('dragging');
  state.task.style.opacity = '1';
  if (state.clone) {
    state.clone.remove();
    state.clone = null;
  }
}

/**
 * Drop task.
 * @param {HTMLElement} column
 * @param {HTMLElement} task
 */
function dropTaskInColumn(column, task) {
  insertTaskAtPlaceholderOrEnd(column, task);
  updateTaskColumnInFirebase(task.id, column.id);
}

/**
 * Cleanup state.
 * @param {any} state
 */
function cleanupDragState(state) {
  selectedTask = null;
  state.currentColumn = null;
  removePlaceholder();
  checkColumns();
}

/**
 * Handle touchcancel.
 * @param {any} state
 */
function onTouchCancel(state) {
  clearTimeout(state.dragTimeout);
  unlockScrollFromDrag();
  if (state.clone) {
    state.clone.remove();
    state.clone = null;
  }
  revertTaskState();
  resetDragState(state);
}

/**
 * Revert task state.
 */
function revertTaskState() {
  if (selectedTask) {
    selectedTask.classList.remove('dragging');
    selectedTask.style.opacity = '1';
  }
}

/**
 * Reset state.
 * @param {any} state
 */
function resetDragState(state) {
  state.isDragging = false;
  selectedTask = null;
  state.currentColumn = null;
  removePlaceholder();
}

/**
 * Create task clone.
 * @param {HTMLElement} task
 * @returns {HTMLElement}
 */
function createTaskClone(task) {
  const clone = task.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.pointerEvents = 'none';
  clone.style.opacity = '0.8';
  clone.style.zIndex = '10000';
  clone.style.width = task.offsetWidth + 'px';
  clone.style.transform = 'rotate(2deg)';
  return clone;
}

/**
 * Update clone position.
 * @param {any} state
 * @param {number} x
 * @param {number} y
 */
function updateClonePosition(state, x, y) {
  if (state.clone) {
    state.clone.style.left = (x - state.clone.offsetWidth / 2) + 'px';
    state.clone.style.top = (y - 40) + 'px';
  }
}

/**
 * Lock scroll for drag.
 */
function lockScrollForDrag() {
  const scrollY = window.scrollY;
  document.body.dataset.scrollY = String(scrollY);
  document.body.classList.add('no-scroll-drag');
  document.body.style.top = `-${scrollY}px`;
}

/**
 * Unlock scroll after drag.
 */
function unlockScrollFromDrag() {
  const scrollY = document.body.dataset.scrollY;
  document.body.classList.remove('no-scroll-drag');
  document.body.style.top = '';
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY));
    delete document.body.dataset.scrollY;
  }
}
