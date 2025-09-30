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

function attachDesktopDragEvents(task) {
  task.addEventListener("dragstart", handleTaskDragStart);
  task.addEventListener("dragend", handleTaskDragEnd);
}

function updateDragPlaceholderForColumns(touch, columns) {
  columns.forEach(column => {
    if (isTouchInsideElement(touch, column)) {
      const afterEl = getDragAfterElement(column, touch.clientY);
      updateColumnWithPlaceholder(column, afterEl);
    }
  });
}

function isTouchInsideElement(touch, element) {
  const rect = element.getBoundingClientRect();
  return (
    touch.clientX >= rect.left &&
    touch.clientX <= rect.right &&
    touch.clientY >= rect.top &&
    touch.clientY <= rect.bottom
  );
}

function updateColumnWithPlaceholder(column, afterEl) {
  if (!afterEl) {
    if (!column.contains(dragPlaceholder)) {
      column.appendChild(dragPlaceholder);
    }
  } else {
    if (afterEl.parentElement === column) {
      column.insertBefore(dragPlaceholder, afterEl);
    } else {
      column.appendChild(dragPlaceholder);
    }
  }
}

function startTouchDragging(task, touch) {
  selectedTask = task;
  task.classList.add("dragging");
  task.style.transform = "rotate(5deg) scale(1.05)";
  task.style.position = "fixed";
  task.style.zIndex = "1000";
  const rect = task.getBoundingClientRect();
  task.dataset.offsetX = (touch.clientX - rect.left).toString();
  task.dataset.offsetY = (touch.clientY - rect.top).toString();
}

function updateTaskPosition(task, touch) {
  const offsetX = parseFloat(task.dataset.offsetX) || 0;
  const offsetY = parseFloat(task.dataset.offsetY) || 0;
  task.style.left = `${touch.clientX - offsetX}px`;
  task.style.top = `${touch.clientY - offsetY}px`;
}

function resetTask(task) {
  task.classList.remove("dragging");
  task.style.transform = "rotate(0deg) scale(1)";
  task.style.position = task.style.zIndex = "";
}

function getDropTargetFromTouch(touch) {
  let dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
  while (dropTarget && !dropTarget.classList.contains("task-board-container")) {
    dropTarget = dropTarget.parentElement;
  }
  return dropTarget;
}

function handleTouchStart(e) {
  const task = e.currentTarget;
  const state = task._touchDragState;
  const touch = e.touches[0];
  state.initialTouchX = touch.clientX;
  state.initialTouchY = touch.clientY;
  state.hasMoved = false;
  state.longPressTimeout = setTimeout(() => {
    if (!state.isTouchDragging) {
      state.isTouchDragging = true;
      startTouchDragging(task, touch);
    }
  }, 500);
}

function handleTouchMove(e) {
  const task = e.currentTarget;
  const state = task._touchDragState;
  const touch = e.touches[0];
  if (!state.isTouchDragging) {
    const dx = Math.abs(touch.clientX - state.initialTouchX);
    const dy = Math.abs(touch.clientY - state.initialTouchY);
    if (dx > state.moveThreshold || dy > state.moveThreshold) {
      state.hasMoved = true;
      clearTimeout(state.longPressTimeout);
      state.longPressTimeout = null;
      return;
    }
  }
  if (!state.isTouchDragging) return;
  e.preventDefault();
  e.stopPropagation();
  updateTaskPosition(task, touch);
  updateDragPlaceholderForColumns(touch, state.columns);
}

function handleTouchEnd(e) {
  const task = e.currentTarget, state = task._touchDragState; 
  clearTimeout(state.longPressTimeout);
  state.longPressTimeout = null;
  
  if (state.isTouchDragging && selectedTask === task) {
    const touch = e.changedTouches[0], dropTarget = getDropTargetFromTouch(touch);
    
    if (dropTarget) {
      let insertPosition = null;
      if (dropTarget.contains(dragPlaceholder)) {
        insertPosition = dragPlaceholder.nextSibling;
      }
      removePlaceholder();
      if (insertPosition) {
        dropTarget.insertBefore(task, insertPosition);
      } else {
        dropTarget.appendChild(task);
      }
      
      updateTaskColumnInFirebase(task.id, dropTarget.id);
    } else {
      task.style.position = "";
      removePlaceholder();
    }
    
    resetTask(task);
    selectedTask = null; 
    state.isTouchDragging = false; 
    checkColumns();
  }
  
  // Verhindere Click-Event wenn ein Drag stattgefunden hat
  if (state.hasMoved || state.isTouchDragging) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Reset state
  state.hasMoved = false;
}

function handleTouchCancel(e) {
  const task = e.currentTarget, state = task._touchDragState;
  clearTimeout(state.longPressTimeout);
  state.longPressTimeout = null;
  const wasDragging = state.isTouchDragging;
  state.isTouchDragging = false;
  state.hasMoved = false;
  if (wasDragging) {
    removePlaceholder();
    resetTask(task);
    selectedTask = null;
  }
}

function attachTouchDragEvents(task, columns) {
  task._touchDragState = {
    longPressTimeout: null,
    isTouchDragging: false,
    initialTouchX: 0,
    initialTouchY: 0,
    moveThreshold: 10,
    hasMoved: false,
    columns: columns
  };
  task.addEventListener("touchstart", handleTouchStart, { passive: true });
  task.addEventListener("touchmove", handleTouchMove, { passive: false });
  task.addEventListener("touchend", handleTouchEnd, { passive: false });
  task.addEventListener("touchcancel", handleTouchCancel, { passive: true });
  
  // Verhindere Click-Event wenn ein Drag stattgefunden hat
  task.addEventListener("click", function(e) {
    if (task._touchDragState && (task._touchDragState.hasMoved || task._touchDragState.isTouchDragging)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
}

function attachColumnDragOverEvent(column) {
  column.addEventListener("dragover", e => {
    e.preventDefault();
    const afterEl = getDragAfterElement(column, e.clientY);
    if (!afterEl) {
      if (!column.contains(dragPlaceholder)) column.appendChild(dragPlaceholder);
    } else {
      afterEl.parentElement === column
        ? column.insertBefore(dragPlaceholder, afterEl)
        : column.appendChild(dragPlaceholder);
    }
  });
}

function attachColumnDropEvent(column) {
  column.addEventListener("drop", e => {
    e.preventDefault();
    if (selectedTask) {
      let insertPosition = null;
      if (column.contains(dragPlaceholder)) {
        insertPosition = dragPlaceholder.nextSibling;
      }
      removePlaceholder();
      if (insertPosition) {
        column.insertBefore(selectedTask, insertPosition);
      } else {
        column.appendChild(selectedTask);
      }      
      selectedTask.classList.remove("dragging");
      selectedTask.style.transform = "rotate(0deg) scale(1)";
      updateTaskColumnInFirebase(selectedTask.id, column.id);
    } else {
      removePlaceholder();
    }
    checkColumns();
  });
}

function initializeTasks(tasks, columns) {
  tasks.forEach(task => {
    // Draggable-Attribut für Touch-Geräte deaktivieren
    if (isTouchDevice()) {
      task.setAttribute('draggable', 'false');
    }
    
    // Nur Desktop-Drag-Events für Desktop-Geräte
    if (!isTouchDevice()) {
      attachDesktopDragEvents(task);
    }
    // Touch-Events für alle Geräte (funktioniert auch auf Desktop)
    attachTouchDragEvents(task, Array.from(columns));
  });
}

function initializeColumns(columns) {
  columns.forEach(column => {
    // Nur Desktop-Drag-Events für Desktop-Geräte
    if (!isTouchDevice()) {
      attachColumnDragOverEvent(column);
      attachColumnDropEvent(column);
    }
  });
}

function initializeDragAndDrop() {
  const tasks = document.querySelectorAll(".draggable-cards");
  const columns = document.querySelectorAll(".task-board-container");
  initializeTasks(tasks, columns);
  initializeColumns(columns);
}

document.addEventListener("DOMContentLoaded", () => {
  ensureEmptyStateImages();
  initializeDragAndDrop();
  
  document.addEventListener('mouseup', cleanupPlaceholders);
  document.addEventListener('touchend', cleanupPlaceholders);
  document.addEventListener('dragend', cleanupPlaceholders);
});