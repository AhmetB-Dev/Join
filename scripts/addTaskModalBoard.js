document.addEventListener("DOMContentLoaded", initTaskForm);

function initTaskForm() {
  bindCreateButton();
  bindInputValidation();
  observeAssignedProfiles();
  bindPrioritySelection();
  bindCategorySelection();
  bindSubtaskManagement();
  validateForm();
}

function bindCreateButton() {
  const btn = getUniqueCreateButton();
  if (!btn) return;
  btn.addEventListener("click", createTaskHandler);
}

function getUniqueCreateButton() {
  const oldBtn = document.querySelector(".create-btn");
  if (!oldBtn) return null;
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  return newBtn;
}

async function createTaskHandler(e) {
  const btn = e.currentTarget;
  if (!validateForm()) return;
  btn.disabled = true;
  try {
    await addTaskToFirebase();
  } catch (error) {
    console.error("Task creation failed", error);
  } finally {
    btn.disabled = false;
  }
}

function bindInputValidation() {
  const selectors = [
    ".input",
    ".date-input",
    ".select-task",
    ".priority-container",
    ".description",
    ".subtask"
  ];
  selectors.forEach(addValidationListener);
}

function addValidationListener(selector) {
  const element = document.querySelector(selector);
  if (element) {
    const eventType = selector === ".select-task" ? "change" : "input";
    element.addEventListener(eventType, validateForm);
  }
}

function observeAssignedProfiles() {
  const container = document.querySelector(".assigned-to-profiles-container");
  if (container) {
    const observer = new MutationObserver(validateForm);
    observer.observe(container, { childList: true });
  }
}

function bindPrioritySelection() {
  const options = document.querySelectorAll(".priority-container div");
  options.forEach(option => {
    option.addEventListener("click", () => {
      removeActiveClass(options);
      option.classList.add("active");
      validateForm();
    });
  });
}

function removeActiveClass(options) {
  options.forEach(o => o.classList.remove("active"));
}

function bindCategorySelection() {
  const categoryItems = document.querySelectorAll('.category-item');
  categoryItems.forEach(item => {
    item.addEventListener('click', () => handleCategorySelection(categoryItems, item));
  });
}

function handleCategorySelection(items, item) {
  items.forEach(i => i.classList.remove('selected'));
  item.classList.add('selected');
  updateCategoryText(item);
  updateCategorySelect(item);
  validateForm();
}

function updateCategoryText(item) {
  const categoryDisplay = document.querySelector('.category-selected');
  if (categoryDisplay) categoryDisplay.textContent = item.textContent;
}

function updateCategorySelect(item) {
  const select = document.querySelector(".select-task");
  if (select) select.value = item.getAttribute("data-value");
}

function bindSubtaskManagement() {
  const subtaskInput = document.querySelector(".subtask");
  const addSubtaskBtn = document.getElementById("addSubtask");
  const subtasksContainer = document.querySelector(".subtasks-scroll-container");
  if (!addSubtaskBtn || !subtaskInput || !subtasksContainer) return;
  addSubtaskBtn.addEventListener("click", () => handleAddSubtask(subtaskInput, subtasksContainer));
  subtasksContainer.addEventListener("click", handleSubtaskDeletion);
}

function handleAddSubtask(subtaskInput, container) {
  const text = subtaskInput.value.trim();
  if (text !== "") {
    const newItem = createSubtaskItem(text);
    container.appendChild(newItem);
    subtaskInput.value = "";
    validateForm();
  }
}

function createSubtaskItem(text) {
  const newItem = document.createElement("div");
  newItem.classList.add("subtask-item", "added-subtasks");
  newItem.innerHTML = `
    <span>${text}</span>
    <img src="../img/subtask-delete.png" alt="Delete Subtask" class="subtask-icon trash-icon" />
  `;
  return newItem;
}

function handleSubtaskDeletion(e) {
  if (e.target.classList.contains("trash-icon")) {
    e.target.parentElement.remove();
    validateForm();
  }
}

function initTaskForm() {
  bindCreateButton();
  bindInputValidation();
  observeAssignedProfiles();
  bindPrioritySelection();
  bindCategorySelection();
  bindCategoryDropdown();
  bindSubtaskManagement();
  validateForm();
  setupDropdownInputHandler();
}

function setupDropdownInputHandler() {
  const dropdownInput = document.querySelector('.dropdown-search');
  if (dropdownInput) {
    dropdownInput.addEventListener('click', toggleDropdown);
    dropdownInput.addEventListener('focus', toggleDropdown);
  }
}

function toggleDropdown() {
  const dropdownList = document.querySelector('.dropdown-list');
  const searchIcon = document.querySelector('.search-icon');
  const searchIconActive = document.querySelector('.search-icon-active');
  if (!dropdownList || !searchIcon || !searchIconActive) {
    console.error('Dropdown-Elemente nicht gefunden!');
    return;
  }
  if (dropdownList.style.display === 'block') {
    dropdownList.style.display = 'none';
    searchIcon.style.display = 'block';
    searchIconActive.style.display = 'none';
  } else {
    dropdownList.style.display = 'block';
    searchIcon.style.display = 'none';
    searchIconActive.style.display = 'block';
    loadContactsForAssignment();
  }
}

async function addTaskToFirebase() {
  const firebaseURL = "https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks.json";
  const taskData = getTaskData();
  try {
    const response = await fetch(firebaseURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    });
    const resData = await response.json();
    const firebaseId = resData.name;
    if (!firebaseId) return;
    await updateFirebaseTaskId(firebaseURL, firebaseId);
    clearForm();
    closeModal();
    location.reload();
  } catch (error) {
    console.error("Error while saving task to Firebase", error);
  }
}

async function loadContactsForAssignment() {
  try {
    const response = await fetch('https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/contacts.json');
    const contacts = await response.json();
    populateContactDropdown(contacts);
  } catch (error) {
    console.error("Error loading contacts:", error);
  }
}

function populateContactDropdown(contacts) {
  const dropdownList = document.querySelector('.dropdown-list');
  dropdownList.innerHTML = '';

  if (!contacts) return;

  Object.entries(contacts).forEach(([id, contact]) => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    const initials = getInitials(contact.name);
    const avatarClass = getAvatarClass(contact.name);

    item.innerHTML = `
          <div class="contact-info">
              <div class="avatar-contact-circle ${avatarClass}">${initials}</div>
              <span class="contact-name">${contact.name}</span>
          </div>
          <input class="custom-checkbox " type="checkbox" data-contact-id="${id}" data-contact-name="${contact.name}" data-contact-initials="${initials}">
      `;

    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        addContactToAssigned(contact.name, initials, avatarClass);
      } else {
        removeContactFromAssigned(contact.name);
      }
      updateDropdownStates();
    });

    dropdownList.appendChild(item);
  });
}

function addContactToAssigned(contactName, initials, avatarClass) {
  const container = document.querySelector('.assigned-to-profiles-container');
  const existing = container.querySelector(`[data-contact-name="${contactName}"]`);
  if (existing) return;
  const profile = document.createElement('div');
  profile.className = 'assigned-profile';
  profile.setAttribute('data-contact-name', contactName);
  profile.innerHTML = `
      <div class="avatar-contact-circle ${avatarClass}">${initials}</div>
  `;
  profile.addEventListener('click', function () {
    this.remove();
    updateDropdownStates();
    validateForm();
  });
  container.appendChild(profile);
  validateForm();
}

function updateDropdownStates() {
  const assignedProfiles = document.querySelectorAll('.assigned-to-profiles-container [data-contact-name]');
  const assignedNames = Array.from(assignedProfiles).map(profile => profile.getAttribute('data-contact-name'));
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const contactName = checkbox.getAttribute('data-contact-name');
    if (assignedNames.includes(contactName)) {
      checkbox.checked = true;
      item.style.opacity = '0.5';
      item.style.pointerEvents = 'none';
    } else {
      checkbox.checked = false;
      item.style.opacity = '1';
      item.style.pointerEvents = 'auto';
    }
  });
}

function removeContactFromAssigned(contactName) {
  const profiles = document.querySelectorAll('.assigned-to-profiles-container div');
  profiles.forEach(profile => {
    if (profile.textContent.trim() === contactName) {
      profile.remove();
    }
  });
  validateForm();
}

function bindCategoryDropdown() {
  const categoryDropdown = document.querySelector('.category-dropdown');
  const categorySelected = document.querySelector('.category-selected');
  const categoryOptions = document.querySelector('.category-options');
  const categoryItems = document.querySelectorAll('.category-item');

  if (!categoryDropdown || !categorySelected || !categoryOptions) return;

  categoryDropdown.addEventListener('click', function (e) {
    e.stopPropagation();

    if (categoryOptions.style.display === 'block') {
      categoryOptions.style.display = 'none';
    } else {
      categoryOptions.style.display = 'block';
    }
  });

  categoryItems.forEach(item => {
    item.addEventListener('click', function (e) {
      e.stopPropagation();

      categoryItems.forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      categorySelected.textContent = this.textContent;

      const select = document.querySelector('.select-task');
      if (select) {
        select.value = this.getAttribute('data-value');
      }
      categoryOptions.style.display = 'none';
      validateForm();
    });
  });

  document.addEventListener('click', function () {
    categoryOptions.style.display = 'none';
  });
}

function getTaskData() {
  return {
    column: "toDoColumn",
    description: getInputValue(".description", "No description provided"),
    dueDate: getInputValue(".date-input"),
    id: null,
    priority: `../img/priority-img/${getSelectedPriority()}.png`,
    progress: 0,
    title: getInputValue(".input"),
    users: getSelectedUsers(),
    subtasks: getSubtasks(),
    category: getSelectedCategory()
  };
}

async function updateFirebaseTaskId(url, firebaseId) {
  const updateURL = url.replace(".json", `/${firebaseId}/id.json`);
  await fetch(updateURL, {
    method: "PUT",
    body: JSON.stringify(firebaseId)
  });
}

function getInputValue(selector, fallback = "") {
  return document.querySelector(selector)?.value.trim() || fallback;
}

function getSelectedPriority() {
  return document.querySelector(".priority-container .active")?.dataset.priority || "low";
}

function getSelectedUsers() {
  const users = [...document.querySelectorAll(".assigned-to-profiles-container div")]
    .map(user => ({ name: user.innerText.trim() }));

  // Duplikate entfernen basierend auf Namen
  const uniqueUsers = [];
  const seen = new Set();

  for (const user of users) {
    if (!seen.has(user.name) && user.name) {
      seen.add(user.name);
      uniqueUsers.push(user);
    }
  }

  return uniqueUsers.length > 0 ? uniqueUsers : [{ name: "Unassigned" }];
}

function getSubtasks() {
  return [...document.querySelectorAll(".subtasks-scroll-container .subtask-item span")].map(span => ({
    completed: false,
    text: span.innerText.trim()
  }));
}

function getSelectedCategory() {
  const activeItem = document.querySelector(".category-item.selected");
  return activeItem ? activeItem.dataset.value : "Technical task";
}

function clearForm() {
  [".input", ".description", ".date-input", ".select-task", ".subtask"].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  });
  document.querySelectorAll(".assigned-to-profiles-container div").forEach(div => div.remove());
  const subtasksContainer = document.querySelector(".subtasks-scroll-container");
  if (subtasksContainer) subtasksContainer.innerHTML = "";
}

function closeModal() {
  const modal = document.getElementById("taskModal");
  if (modal) modal.style.display = "none";
}

function isTaskFormValid() {
  const title = getInputValue(".input");
  const dueDate = getInputValue(".date-input");
  const category = document.querySelector(".category-item.selected")?.dataset.value;
  return title && dueDate && category;
}

function updateCreateButtonState(isValid) {
  const createBtn = document.querySelector(".create-btn");
  if (!createBtn) return;
  if (isValid) {
    createBtn.classList.remove("disabled");
    createBtn.style.pointerEvents = "auto";
    createBtn.style.opacity = "1";
  } else {
    createBtn.classList.add("disabled");
    createBtn.style.pointerEvents = "none";
    createBtn.style.opacity = "0.5";
  }
}

function validateForm() {
  const isValid = isTaskFormValid();
  updateCreateButtonState(isValid);
  return isValid;
}