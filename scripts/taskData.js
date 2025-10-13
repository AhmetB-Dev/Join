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
 * Return a random color string from a predefined set.
 * @returns {"red"|"green"|"blue"|"pink"|"orange"|"purple"}
 */
function getRandomColor() {
  const colors = ["red", "green", "blue", "pink", "orange", "purple"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function enrichTasksWithUserData(tasks) {
  tasks.forEach(task => {
    if (!task.users) return;
    task.users.forEach(user => {
      if (!user.initials) user.initials = getInitials(user.name);
      if (!user.color) user.color = getRandomColor();
    });
  });
}

/**
 * Load tasks from Firebase and enrich with user metadata.
 * @returns {Promise<Array<object>>}
 */
async function loadTasksFromFirebase() {
  const url = "https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks.json";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error loading tasks");
    let data = await response.json();
    if (!data || typeof data !== "object") return [];
    let tasksArray = Object.entries(data)
      .filter(([key]) => key !== "null" && key !== "task-3")
      .map(([key, value]) => ({ firebaseKey: key, ...value }));
    enrichTasksWithUserData(tasksArray);
    return tasksArray;
  } catch (error) {
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
  tasks = await loadTasksFromFirebase();
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
    
    const tasks = await loadTasksFromFirebase();
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

