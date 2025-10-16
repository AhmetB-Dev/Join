const dragPlaceholder = document.createElement("div");
dragPlaceholder.classList.add("placeholder-drag");
let selectedTask = null;

/**
 * Check if device supports touch.
 * @returns {boolean}
 */
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Remove drag placeholder from DOM.
 * @returns {void}
 */
function removePlaceholder() {
  if (dragPlaceholder && dragPlaceholder.parentNode) {
    dragPlaceholder.parentNode.removeChild(dragPlaceholder);
  }
}

/**
 * Cleanup all placeholder elements.
 * @returns {void}
 */
function cleanupPlaceholders() {
  const allPlaceholders = document.querySelectorAll('.placeholder-drag');
  allPlaceholders.forEach(placeholder => {
    if (placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
  });
}

/**
 * Ensure empty state images in columns.
 * @returns {void}
 */
function ensureEmptyStateImages() {
  document.querySelectorAll(".task-board-container").forEach(column => {
    const hasTasks = column.querySelectorAll(".draggable-cards").length > 0;
    if (!hasTasks && !column.querySelector(".empty-state-img")) {
      addEmptyStateImage(column);
    }
  });
  checkColumns();
}

/**
 * Add empty state image to column.
 * @param {HTMLElement} column
 * @returns {void}
 */
function addEmptyStateImage(column) {
  const img = document.createElement("img");
  img.src = "../img/no-tasks-to-do.png";
  img.alt = "no tasks to do";
  img.classList.add("empty-state-img");
  column.appendChild(img);
}

/**
 * Check columns and toggle empty state.
 * @returns {void}
 */
function checkColumns() {
  document.querySelectorAll(".task-board-container").forEach(column => {
    const imgElement = column.querySelector(".empty-state-img");
    const hasTasks = column.querySelectorAll(".draggable-cards").length > 0;
    if (imgElement) imgElement.style.display = hasTasks ? "none" : "block";
  });
}

/**
 * Get element after drag position.
 * @param {HTMLElement} container
 * @param {number} y
 * @returns {HTMLElement|undefined}
 */
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

/**
 * Handle drag start event.
 * @param {DragEvent} e
 * @returns {void}
 */
function handleTaskDragStart(e) {
  selectedTask = e.target;
  setTimeout(() => {
    selectedTask.classList.add("dragging");
    selectedTask.style.transform = "rotate(5deg) scale(1.05)";
  }, 0);
}

/**
 * Handle drag end event.
 * @returns {void}
 */
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
 * Insert task at placeholder.
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
 * Initialize tasks.
 * @param {NodeListOf<HTMLElement>} tasks
 * @param {NodeListOf<HTMLElement>} columns
 */
function initializeTasks(tasks, columns) {
  tasks.forEach(task => {
    if (task.dataset.dragInitialized === 'true') return;
    prepareTaskForDrag(task);
    setupTaskDragEvents(task, Array.from(columns));
    task.dataset.dragInitialized = 'true';
  });
}

/**
 * Prepare task for drag.
 * @param {HTMLElement} task
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
 * Setup task drag events.
 * @param {HTMLElement} task
 * @param {Array<HTMLElement>} columns
 */
function setupTaskDragEvents(task, columns) {
  attachTouchDragEvents(task, columns);
}

/**
 * Initialize columns.
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

/**
 * Attach desktop events.
 * @param {HTMLElement} task
 */
function attachDesktopDragEvents(task) {
  task.addEventListener("dragstart", handleTaskDragStart);
  task.addEventListener("dragend", handleTaskDragEnd);
}


/**
 * Attach dragover handler.
 * @param {HTMLElement} column
 */
function attachColumnDragOverEvent(column) {
  column.addEventListener("dragover", e => handleColumnDragOver(e, column));
}

/**
 * Handle dragover.
 * @param {DragEvent} e
 * @param {HTMLElement} column
 */
function handleColumnDragOver(e, column) {
  e.preventDefault();
  const afterEl = getDragAfterElement(column, e.clientY);
  if (!afterEl) {
    if (!column.contains(dragPlaceholder)) column.appendChild(dragPlaceholder);
  } else {
    insertPlaceholderBeforeElement(column, afterEl);
  }
}

/**
 * Insert placeholder.
 * @param {HTMLElement} column
 * @param {HTMLElement} afterEl
 */
function insertPlaceholderBeforeElement(column, afterEl) {
  if (afterEl.parentElement === column) {
    column.insertBefore(dragPlaceholder, afterEl);
  } else {
    column.appendChild(dragPlaceholder);
  }
}

/**
 * Attach drop event.
 * @param {HTMLElement} column
 */
function attachColumnDropEvent(column) {
  column.addEventListener("drop", e => {
    e.preventDefault();
    if (selectedTask) {
      handleTaskDrop(column, selectedTask);
    } else {
      removePlaceholder();
    }
    checkColumns();
  });
}

/**
 * Handle task drop.
 * @param {HTMLElement} column
 * @param {HTMLElement} task
 */
function handleTaskDrop(column, task) {
  insertTaskAtPlaceholderOrEnd(column, task);
  task.style.transform = "rotate(0deg) scale(1)";
  updateTaskColumnInFirebase(task.id, column.id);
}

/**
 * Re-initialize drag and drop.
 */
function reinitializeDragAndDrop() {
  const tasks = document.querySelectorAll(".draggable-cards");
  const columns = document.querySelectorAll(".task-board-container");
  initializeTasks(tasks, columns);
  initializeColumns(columns);
}

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