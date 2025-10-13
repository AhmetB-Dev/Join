const dragPlaceholder = document.createElement("div");
dragPlaceholder.classList.add("placeholder-drag");

let selectedTask = null;

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function removePlaceholder() {
  if (dragPlaceholder && dragPlaceholder.parentNode) {
    dragPlaceholder.parentNode.removeChild(dragPlaceholder);
  }
}

function cleanupPlaceholders() {
  const allPlaceholders = document.querySelectorAll('.placeholder-drag');
  allPlaceholders.forEach(placeholder => {
    if (placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
  });
}

function ensureEmptyStateImages() {
  document.querySelectorAll(".task-board-container").forEach(column => {
    const hasTasks = column.querySelectorAll(".draggable-cards").length > 0;
    if (!hasTasks && !column.querySelector(".empty-state-img")) {
      const img = document.createElement("img");
      img.src = "../img/no-tasks-to-do.png";
      img.alt = "no tasks to do";
      img.classList.add("empty-state-img");
      column.appendChild(img);
    }
  });
  checkColumns();
}

function checkColumns() {
  document.querySelectorAll(".task-board-container").forEach(column => {
    const imgElement = column.querySelector(".empty-state-img");
    const hasTasks = column.querySelectorAll(".draggable-cards").length > 0;
    if (imgElement) imgElement.style.display = hasTasks ? "none" : "block";
  });
}

function getDragAfterElement(container, y) {
  const draggable = [...container.querySelectorAll(".draggable-cards:not(.dragging)")];
  return draggable.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
    },
    { offset: -Infinity }
  ).element;
}

function handleTaskDragStart(e) {
  selectedTask = e.target;
  setTimeout(() => {
    selectedTask.classList.add("dragging");
    selectedTask.style.transform = "rotate(5deg) scale(1.05)";
  }, 0);
}

function handleTaskDragEnd() {
  if (selectedTask) {
    selectedTask.classList.remove("dragging");
    selectedTask.style.transform = "rotate(0deg) scale(1)";
    selectedTask = null;
  }
  removePlaceholder();
  checkColumns();
}

/**
 * Insert task at placeholder position if present, otherwise append to container.
 * @param {HTMLElement} container
 * @param {HTMLElement} task
 */
function insertTaskAtPlaceholderOrEnd(container, task) {
  let insertPosition = null;
  if (container.contains(dragPlaceholder)) {
    insertPosition = dragPlaceholder.nextSibling;
  }
  removePlaceholder();
  if (insertPosition) {
    container.insertBefore(task, insertPosition);
  } else {
    container.appendChild(task);
  }
}

/**
 * Initialize drag events on tasks collection.
 * @param {NodeListOf<HTMLElement>} tasks
 * @param {NodeListOf<HTMLElement>} columns
 */
function initializeTasks(tasks, columns) {
  tasks.forEach(task => {
    // Skip if already initialized
    if (task.dataset.dragInitialized === 'true') return;
    
    prepareTaskForDrag(task);
    setupTaskDragEvents(task, Array.from(columns));
    
    task.dataset.dragInitialized = 'true';
  });
}

/**
 * Prepare a task element for drag behavior depending on device.
 * @param {HTMLElement} task
 * @returns {void}
 */
function prepareTaskForDrag(task) {
  if (isTouchDevice()) {
    task.setAttribute('draggable', 'false');
  }
  if (!isTouchDevice()) {
    attachDesktopDragEvents(task);
  }
}

/**
 * Attach both touch and (if applicable) desktop events for a task.
 * @param {HTMLElement} task
 * @param {Array<HTMLElement>} columns
 * @returns {void}
 */
function setupTaskDragEvents(task, columns) {
  attachTouchDragEvents(task, columns);
}

/**
 * Initialize column events for desktop DnD.
 * @param {NodeListOf<HTMLElement>} columns
 */
function initializeColumns(columns) {
  columns.forEach(column => {
    if (!isTouchDevice()) {
      attachColumnDragOverEvent(column);
      attachColumnDropEvent(column);
    }
  });
}

function attachDesktopDragEvents(task) {
  task.addEventListener("dragstart", handleTaskDragStart);
  task.addEventListener("dragend", handleTaskDragEnd);
}

/**
 * Attach touch events for drag and drop on mobile/tablet.
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
 * Handle touchstart event to schedule drag and prepare UI.
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
 * Start the visual drag for touch interactions.
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
 * Handle touchmove to update clone and placeholder location.
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
    state.currentColumn = columnBelow;
    if (!columnBelow.contains(dragPlaceholder)) {
      const afterEl = getDragAfterElement(columnBelow, touch.clientY);
      if (!afterEl) columnBelow.appendChild(dragPlaceholder);
      else columnBelow.insertBefore(dragPlaceholder, afterEl);
    }
  }
}

/**
 * Handle touchend to drop card and cleanup.
 * @param {TouchEvent} e
 * @param {any} state
 */
function onTouchEnd(e, state) {
  clearTimeout(state.dragTimeout);
  unlockScrollFromDrag();
  if (!state.isDragging) return;
  state.isDragging = false;
  state.task.classList.remove('dragging');
  state.task.style.opacity = '1';
  if (state.clone) {
    state.clone.remove();
    state.clone = null;
  }
  if (state.currentColumn && selectedTask) {
    insertTaskAtPlaceholderOrEnd(state.currentColumn, selectedTask);
    updateTaskColumnInFirebase(selectedTask.id, state.currentColumn.id);
  }
  selectedTask = null;
  state.currentColumn = null;
  removePlaceholder();
  checkColumns();
}

/**
 * Handle touchcancel to revert UI and state.
 * @param {any} state
 */
function onTouchCancel(state) {
  clearTimeout(state.dragTimeout);
  unlockScrollFromDrag();
  if (state.clone) {
    state.clone.remove();
    state.clone = null;
  }
  if (selectedTask) {
    selectedTask.classList.remove('dragging');
    selectedTask.style.opacity = '1';
  }
  state.isDragging = false;
  selectedTask = null;
  state.currentColumn = null;
  removePlaceholder();
}

/**
 * Create a visual clone of the dragged task.
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
 * Update the position of the visual clone during touch drag.
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
 * Lock body scroll for drag gesture and store scroll position.
 * @returns {void}
 */
function lockScrollForDrag() {
  const scrollY = window.scrollY;
  document.body.dataset.scrollY = String(scrollY);
  document.body.classList.add('no-scroll-drag');
  document.body.style.top = `-${scrollY}px`;
}

/**
 * Restore body scroll after drag gesture.
 * @returns {void}
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

/**
 * Attach dragover handler to show placeholder at correct position within a column.
 * @param {HTMLElement} column
 */
function attachColumnDragOverEvent(column) {
  column.addEventListener("dragover", e => handleColumnDragOver(e, column));
}

/**
 * Handle dragover for a column to place the placeholder at correct position.
 * @param {DragEvent} e
 * @param {HTMLElement} column
 * @returns {void}
 */
function handleColumnDragOver(e, column) {
  e.preventDefault();
  const afterEl = getDragAfterElement(column, e.clientY);
  if (!afterEl) {
    if (!column.contains(dragPlaceholder)) column.appendChild(dragPlaceholder);
  } else {
    if (afterEl.parentElement === column) {
      column.insertBefore(dragPlaceholder, afterEl);
    } else {
      column.appendChild(dragPlaceholder);
    }
  }
}

function attachColumnDropEvent(column) {
  column.addEventListener("drop", e => {
    e.preventDefault();
    if (selectedTask) {
      insertTaskAtPlaceholderOrEnd(column, selectedTask);
      selectedTask.style.transform = "rotate(0deg) scale(1)";
      updateTaskColumnInFirebase(selectedTask.id, column.id);
    } else {
      removePlaceholder();
    }
    checkColumns();
  });
}

/**
 * Re-initialize drag and drop for all current tasks.
 * Call this after dynamically adding new tasks.
 */
function reinitializeDragAndDrop() {
  const tasks = document.querySelectorAll(".draggable-cards");
  const columns = document.querySelectorAll(".task-board-container");
  initializeTasks(tasks, columns);
  initializeColumns(columns);
}

// Make function globally accessible
window.reinitializeDragAndDrop = reinitializeDragAndDrop;

document.addEventListener("DOMContentLoaded", () => {
  ensureEmptyStateImages();
  const tasks = document.querySelectorAll(".draggable-cards");
  const columns = document.querySelectorAll(".task-board-container");
  initializeTasks(tasks, columns);
  initializeColumns(columns);
  document.addEventListener('mouseup', cleanupPlaceholders);
  document.addEventListener('touchend', cleanupPlaceholders);
  document.addEventListener('dragend', cleanupPlaceholders);
});