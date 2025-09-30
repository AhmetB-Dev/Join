window.closeModalAndReload = closeModalAndReload;

let tasks = [];

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function getInitials(fullName) {
  const parts = fullName.trim().split(" ");
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
}

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

function enableDragAndDrop() {
  // Nur für Desktop-Geräte aktivieren
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

document.addEventListener("DOMContentLoaded", async () => {
  tasks = await loadTasksFromFirebase();
  generateTasks(tasks);
  enableDragAndDrop();
  checkColumns();
  document.getElementById("searchInput").addEventListener("input", function () {
    filterTasks(this.value.trim().toLowerCase());
  });
});

function closeModalAndReload() {
  const modal = document.getElementById('toggleModalFloating');
  if (modal) {
    modal.style.display = 'none';
  }
  location.reload();
}

document.addEventListener("DOMContentLoaded", function() {
  const floatingModal = document.getElementById('toggleModalFloating');
  const modalContent = document.querySelector('.main-section-task-overlay');
  if (floatingModal && modalContent) {
    floatingModal.addEventListener('click', function(event) {
      if (event.target === floatingModal) {
        floatingModal.style.display = 'none';
        location.reload();
      }
    });
    modalContent.addEventListener('click', function(event) {
      event.stopPropagation();
    });
  }
});

function reloadPage() {
  location.reload();
}
