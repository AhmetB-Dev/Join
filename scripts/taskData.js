window.closeModalAndReload = closeModalAndReload;

let tasks = [];

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Compute initials from a full name.
 * @param {string} fullName
 * @returns {string}
 */
function getInitials(fullName) {
  const parts = fullName.trim().split(" ");
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
}

/**
 * Add visual-only assignee metadata after loading tasks.
 * Colors are derived from the contact name, so they stay stable across reloads.
 */
function enrichTasksWithUserData(tasks) {
  tasks.forEach(task => {
    if (!Array.isArray(task.users)) return;
    task.users.forEach(user => {
      if (!user || !user.name) return;
      if (!user.initials) user.initials = getInitials(user.name);
      user.color = getAvatarColor(user.name);
    });
  });
}

/**
 * Load tasks from the Django REST API and enrich with user metadata.
 * @returns {Promise<Array<object>>}
 */
async function loadTasksFromAPI() {
  try {
    const data = await JoinAPI.get('/tasks/');
    const tasksArray = (Array.isArray(data) ? data : [])
      .filter(task => task && task.id !== null && task.id !== undefined)
      .map(task => ({ ...task, id: String(task.id) }));
    enrichTasksWithUserData(tasksArray);
    return tasksArray;
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

document.addEventListener("click", function() {
  document.querySelectorAll(".move-to-dropdown.visible").forEach(function(dropdown) {
    dropdown.classList.remove("visible");
  });
});

/**
 * Filter rendered task cards by a search term, toggling visibility.
 * @param {string} searchTerm lowercase search query
 */
function filterTasks(searchTerm) {
  const tasksElements = document.querySelectorAll(".draggable-cards");
  let found = false;
  tasksElements.forEach(task => {
    const title = task.dataset.title || "";
    const description = task.dataset.description || "";
    if (title.includes(searchTerm) || description.includes(searchTerm)) {
      task.style.display = "flex";
      found = true;
    } else {
      task.style.display = "none";
    }
  });
  document.getElementById("errorTaskFound").style.display = found ? "none" : "block";
}

/**
 * Enable drag and drop handlers for cards and columns when not touch device.
 */
function enableDragAndDrop() {
  if (!isTouchDevice()) {
    attachDragListenersToCards();
    attachDragOverListenersToColumns();
  }
}

function attachDragListenersToCards() {
  const cards = document.querySelectorAll('.draggable-cards');
  cards.forEach(card => {
    card.addEventListener('dragstart', () => {
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });
}

function attachDragOverListenersToColumns() {
  const columns = document.querySelectorAll('.task-board-container');
  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard) {
        column.appendChild(draggingCard);
      }
    });
  });
}

/**
 * Initialize tasks list, render, enable DnD and bind search input.
 * @returns {Promise<void>}
 */
async function initTaskData() {
  tasks = await loadTasksFromAPI();
  generateTasks(tasks);
  if (typeof window.reinitializeDragAndDrop === 'function') {
    window.reinitializeDragAndDrop();
  }
  checkColumns();
  document.getElementById("searchInput").addEventListener("input", function () {
    filterTasks(this.value.trim().toLowerCase());
  });
}

/**
 * Close floating modal (if open), reload tasks and re-render board.
 * @returns {Promise<void>}
 */
async function closeModalAndReload() {
  const modal = document.getElementById('toggleModalFloating');
  if (modal) {
    modal.style.display = 'none';
  }
  
  try {
    document.querySelectorAll('.draggable-cards').forEach(card => card.remove());
    
    const tasks = await loadTasksFromAPI();
    generateTasks(tasks);
    if (typeof window.reinitializeDragAndDrop === 'function') {
      window.reinitializeDragAndDrop();
    }
    checkColumns();
  } catch (error) {
    console.error('Error reloading board:', error);
  }
}

/**
 * Initialize overlay close behavior and inside-click blocker.
 */
function initTaskOverlay() {
  const floatingModal = document.getElementById('toggleModalFloating');
  const modalContent = document.querySelector('.main-section-task-overlay');
  if (floatingModal && modalContent) {
    floatingModal.addEventListener('click', function(event) {
      if (event.target === floatingModal) {
        floatingModal.style.display = 'none';
        if (window.currentTaskId && typeof updateTaskCardInBackground === 'function') {
          updateTaskCardInBackground(window.currentTaskId);
        }
      }
    });
    modalContent.addEventListener('click', function(event) {
      event.stopPropagation();
    });
  }
}

