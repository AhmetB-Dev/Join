let placeholder = document.createElement("div");

/**
 * Show or hide the empty-state image in `#toDoColumn`.
 */
function checkToDoColumn() {
  const toDo = document.getElementById("toDoColumn");
  const img = toDo.querySelector("img");
  if (!img) return;
  const hasTasks = toDo.querySelectorAll(".draggable-cards").length > 0;
  img.style.display = hasTasks ? "none" : "block";
}

function checkColumns() {
  checkToDoColumn();
}

/**
 * Enable drag and drop for tasks and columns.
 */
function enableDragAndDrop() {
  addTaskEventListeners();
  addColumnEventListeners();
}

function addTaskEventListeners() {
  const tasks = document.querySelectorAll(".draggable-cards");
  tasks.forEach(task => {
    addDragStartEvent(task);
    addDragEndEvent(task);
  });
}

function addDragStartEvent(task) {
  task.addEventListener("dragstart", e => {
    setTimeout(() => task.classList.add("dragging"), 0);
  });
}

function addDragEndEvent(task) {
  task.addEventListener("dragend", () => {
    task.classList.remove("dragging");
    if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    checkToDoColumn();
  });
}

function addColumnEventListeners() {
  const cols = document.querySelectorAll(".task-board-container");
  cols.forEach(col => {
    col.addEventListener("dragover", handleDragOver);
    col.addEventListener("drop", handleDrop);
  });
}

/**
 * Handle dragover on column and place visual placeholder.
 * @param {DragEvent} e
 */
function handleDragOver(e) {
  e.preventDefault();
  const col = e.currentTarget;
  const after = getDragAfterElement(col, e.clientY);
  if (!after && !col.contains(placeholder)) {
    col.appendChild(placeholder);
  } else if (after && col.contains(after)) {
    col.insertBefore(placeholder, after);
  }
}

/**
 * Handle drop into a column and insert dragged element.
 * @param {DragEvent} e
 */
function handleDrop(e) {
  e.preventDefault();
  const col = e.currentTarget;
  if (col.contains(placeholder)) {
    col.insertBefore(placeholder.firstChild, placeholder);
    if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    checkToDoColumn();
  }
}

/**
 * Find the task element after which the placeholder should be inserted.
 * @param {HTMLElement} container
 * @param {number} y Mouse Y position
 * @returns {HTMLElement|undefined}
 */
function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll(".draggable-cards:not(.dragging)")];
  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

document.addEventListener("DOMContentLoaded", () => {
  enableDragAndDrop();
  setTimeout(checkToDoColumn, 100);
});
