function setupModalButton(addButtonId, modalId) {
  const addButton = document.getElementById(addButtonId);
  const modal = document.getElementById(modalId);
  if (!addButton || !modal) return;
  addButton.addEventListener('click', () => {
    modal.style.display = 'block';
    if (typeof initAssignDropdownCreate === 'function') {
      initAssignDropdownCreate();
    }
  });
}

function setupModalClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

function toggleModal() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
  }
}

function setupAccountDropdown() {
  const accountButton = document.querySelector('.account');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  if (!accountButton || !dropdownMenu) return;
  accountButton.addEventListener('click', (event) => {
    event.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });
  document.addEventListener('click', (event) => {
    if (!dropdownMenu.contains(event.target) && dropdownMenu.classList.contains('show')) {
      dropdownMenu.classList.remove('show');
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupModalButton('addTaskButtonTodo', 'taskModal');
  setupModalButton('addTaskButtonInProgress', 'taskModal');
  setupModalButton('addTaskButtonAwaitFeedback', 'taskModal');
  setupModalButton('addTaskButton', 'taskModal');
  setupModalClose('taskModal');
  setupAccountDropdown();
  window.toggleModal = toggleModal;
});

document.addEventListener('DOMContentLoaded', function () {
  const addTaskBtn = document.getElementById('addTaskButton');
  const taskModal = document.getElementById('taskModal');

  addTaskBtn.addEventListener('click', function (){
taskModal.style.display = 'block';
  });
});

