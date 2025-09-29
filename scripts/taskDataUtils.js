function attachMoveDropdownListener(taskEl) {
    const ddIcon = taskEl.querySelector('.drag-drop-icon');
    if (!ddIcon) return;
    ddIcon.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleMoveDropdown(taskEl, ddIcon);
    });
}
  
function toggleMoveDropdown(taskEl, ddIcon) {
    let dd = taskEl.querySelector(".move-to-dropdown");
    if (dd) {
      dd.classList.toggle("visible");
      return;
    }
    dd = createMoveDropdownMenu(ddIcon);
    taskEl.appendChild(dd);
    dd.classList.add("visible");
    attachMoveDropdownOptions(taskEl, dd);
}
  
function createMoveDropdownMenu(ddIcon) {
    const dd = document.createElement("div");
    dd.classList.add("move-to-dropdown");
    dd.innerHTML = `
      <div class="dropdown-header">Move To</div>
      <div class="dropdown-option" data-status="toDoColumn">To do</div>
      <div class="dropdown-option" data-status="inProgress">In Progress</div>
      <div class="dropdown-option" data-status="awaitFeedback">Await Feedback</div>
      <div class="dropdown-option" data-status="done">Done</div>
    `;
    const offsetTop = ddIcon.offsetTop + ddIcon.offsetHeight;
    const offsetLeft = ddIcon.offsetLeft;
    dd.style.position = "absolute";
    dd.style.top = `${offsetTop}px`;
    dd.style.left = `${offsetLeft}px`;
    dd.style.zIndex = 10;
    return dd;
}
  
function attachMoveDropdownOptions(taskEl, dd) {
    dd.querySelectorAll(".dropdown-option").forEach(option => {
      option.addEventListener("click", async function (ev) {
        ev.stopPropagation();
        const ns = option.dataset.status;
        await updateTaskColumnInFirebase(taskEl.id, ns);
        const newCol = document.getElementById(ns);
        if (newCol) newCol.appendChild(taskEl);
        dd.classList.remove("visible");
        checkColumns();
      });
    });
}
  
function generateTasks(tasksData) {
    tasksData.forEach(task => {
      if (!task || !task.title || !task.column) return;
      const taskEl = createTaskElement(task);
      const col = document.getElementById(task.column);
      if (col) col.appendChild(taskEl);
      attachTaskListeners(task, taskEl);
      attachMoveDropdownListener(taskEl);
    });
    checkColumns();
}
  
function readSubtasksFromEditModal() {
    const subtaskItems = document.querySelectorAll('#editSubtasksList .subtask-item');
    const subtasks = [];
    subtaskItems.forEach((item, index) => {
      const span = item.querySelector('span');
      if (span) {
        const text = span.innerText.replace('• ', '').trim();
        const completed = window.currentTask && window.currentTask.subtasks && window.currentTask.subtasks[index]
          ? window.currentTask.subtasks[index].completed
          : false;
        subtasks.push({ text, completed });
      }
    });
    return subtasks;
}
  
function editTaskFromOverlay(event) {
    event.stopPropagation();
    if (!currentTask) return;
    fillEditModal(currentTask);
    document.getElementById('toggleModalFloating').style.display = 'none';
    const modal = document.getElementById('editTaskModal');
    if (modal) modal.style.display = 'flex';
}
  
function createNewSubtask(text) {
    const newSubtask = document.createElement('div');
    newSubtask.className = 'subtask-item';
    newSubtask.innerHTML = `
      <span>• ${text}</span>
      <div class="subtask-actions">
        <img src="../img/pen.png" alt="Edit" class="subtask-edit-edit">
        <img src="../img/trash.png" alt="Delete" class="subtask-delete-edit">
      </div>`;
    newSubtask.dataset.index = window.currentTask.subtasks ? window.currentTask.subtasks.length : 0;
    return newSubtask;
}
  
function fillEditModal(task) {
    setTaskFields(task);
    setAssigneeBadges(task);
    setSubtasksList(task);
    loadContacts(task.users || []);
}
  
function setTaskFields(task) {
    document.getElementById('editTaskTitle').value = task.title || "";
    document.getElementById('editTaskDescription').value = task.description || "";
    document.getElementById('editDueDate').value = task.dueDate || "";
    const prio = extractPriority(task.priority);
    setEditPriority(prio);
    if (task.category === 'Technical task') {
      document.getElementById('editTaskCategory').value = 'technical';
    } else if (task.category === 'User Story') {
      document.getElementById('editTaskCategory').value = 'userstory';
    } else {
      document.getElementById('editTaskCategory').value = '';
    }
}
  
function setAssigneeBadges(task) {
  const badges = document.getElementById('assigneeBadges');
  if (badges && task.users && task.users.length > 0) {
    badges.innerHTML = generateAssigneeBadges(task.users);
  } else if (badges) {
    badges.innerHTML = "";
  }
}


function generateAssigneeBadges(users) {
  // Duplikate entfernen vor dem Rendering
  const uniqueUsers = removeDuplicateUsers(users);
  return uniqueUsers.map(user => createBadgeHTML(user)).join("");
}

// Hilfsfunktion zum Entfernen von Duplikaten
function removeDuplicateUsers(users) {
  if (!Array.isArray(users)) return [];
  
  const seen = new Set();
  return users.filter(user => {
    const identifier = user.name || JSON.stringify(user);
    
    if (seen.has(identifier)) {
      return false;
    }
    
    seen.add(identifier);
    return true;
  });
}


function createBadgeHTML(user) {
  let colorValue = user.color || "default";
  if (colorValue.startsWith('#')) {
    colorValue = mapHexToColorName(colorValue);
  }
  const badgeClass = getBadgeClassFromAnyColor(colorValue);
  const initials = user.initials || getInitials(user.name);
  return `
    <div class="assignee-badge ${badgeClass}"
         data-contact-color="${colorValue}"
         data-contact-name="${user.name}">
      ${initials}
    </div>`;
}

function mapHexToColorName(hexColor) {
  switch (hexColor.toUpperCase()) {
    case '#F57C00': return 'orange';
    case '#E74C3C': return 'red';
    case '#5C6BC0': return 'blue';
    case '#4CAF50': return 'green';
    case '#8E44AD': return 'purple';
    case '#EE00FF': return 'pink';
    default: return "default";
  }
}

function setSubtasksList(task) {
    const list = document.getElementById('editSubtasksList');
    list.innerHTML = "";
    if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length) {
      task.subtasks.forEach((subtask, index) => {
        const subtaskItem = createSubtaskItem(subtask);
        subtaskItem.dataset.index = index;
        list.appendChild(subtaskItem);
      });
    }
}
  

function createSubtaskContainer() {
    const container = document.createElement("div");
    container.className = "subtask-item";
    return container;
}
  

function createSubtaskCheckbox(subtask) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "subtask-edit-checkbox";
    checkbox.checked = subtask.completed;
    return checkbox;
}
  
function attachSubtaskEditListener(container, span, originalText, actionsDiv) {
    const editIcon = actionsDiv.querySelector('.subtask-edit-edit');
    editIcon.addEventListener('click', () => {
      replaceSpanWithInput(container, span, originalText);
    });
}
  
function createSubtaskItem(subtask) {
    const container = createSubtaskContainer();
    const checkbox = createSubtaskCheckbox(subtask);
    const span = createSubtaskTextSpan(subtask.text);
    const actionsDiv = createSubtaskActions();
    
    container.appendChild(checkbox);
    container.appendChild(span);
    container.appendChild(actionsDiv);
    
    attachSubtaskEditListener(container, span, subtask.text, actionsDiv);
    
    return container;
}

async function loadContacts(assignedUsers = []) {
  try {
    const response = await fetch('https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/contacts.json');
    if (!response.ok) throw new Error('no remote');
    const contacts = await response.json();
    populateAssigneeDropdown(contacts, assignedUsers);
  } catch (error) {
    const local = getContactsFromLocalStorage() || provideSampleContacts();
    populateAssigneeDropdown(local, assignedUsers);
  }
}

function getContactsFromLocalStorage() {
  try {
    const raw = localStorage.getItem('contacts');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj;
  } catch (_) { return null; }
}

function provideSampleContacts() {
  return {
    c1: { name: 'Max Mustermann', color: 'green' },
    c2: { name: 'Erika Musterfrau', color: 'blue' },
    c3: { name: 'John Doe', color: 'orange' }
  };
}

function populateAssigneeDropdown(contacts, assignedUsers) {
  const dropdownSelected = document.getElementById('assigneeDropdownSelected');
  const dropdownList = document.getElementById('assigneeDropdownList');
  const badgesContainer = document.getElementById('assigneeBadges');
  dropdownList.innerHTML = "";
  const assignedUserNames = new Set(
    (assignedUsers || []).map(u => (u.name || '').trim().toLowerCase())
  );
  const selectedContacts = new Set();
  Object.entries(contacts).forEach(([id, contact]) => {
    processContactEntry(id, contact, selectedContacts, assignedUserNames, badgesContainer, dropdownList);
  });
  setupDropdownToggle(dropdownSelected, dropdownList);
}

function processContactEntry(id, contact, selectedContacts, assignedUserNames, badgesContainer, dropdownList) {
  const item = createDropdownItem(id, contact, selectedContacts, badgesContainer);
  dropdownList.appendChild(item);
  const contactName = (contact.name || '').trim().toLowerCase();
  if (assignedUserNames.has(contactName)) {
    selectedContacts.add(id);
    item.classList.add('selected');
    const checkbox = item.querySelector('.custom-checkbox');
    checkbox.src = "../img/checkboxchecked.png";
    checkbox.style.filter = "brightness(0) invert(1)";
    createContactBadge(contact, id, badgesContainer, selectedContacts);
  }
}

function setupDropdownToggle(dropdownSelected, dropdownList) {
  dropdownSelected?.addEventListener('click', event => {
    event.stopPropagation();
    if (!dropdownList) return;
    dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', event => {
    if (!dropdownList) return;
    if (!dropdownList.contains(event.target) && !dropdownSelected?.contains(event.target)) {
      dropdownList.style.display = 'none';
    }
  });
}

function getSimpleColor(colorValue) {
  if (!colorValue) return 'default';
  if (colorValue.startsWith && colorValue.startsWith('#')) {
    switch (colorValue.toUpperCase()) {
      case '#F57C00': return 'orange';
      case '#E74C3C': return 'red';
      case '#5C6BC0': return 'blue';
      case '#4CAF50': return 'green';
      case '#8E44AD': return 'purple';
      case '#EE00FF': return 'pink';
      default: return 'default';
    }
  }
  return colorValue;
}

function createDropdownItem(id, contact, selectedContacts, badgesContainer) {
  const item = createDropdownItemContainer();
  item.innerHTML = generateDropdownItemHTML(contact);
  attachDropdownClickEvent(item, id, contact, selectedContacts, badgesContainer);
  return item;
}

function createDropdownItemContainer() {
  const item = document.createElement("div");
  item.classList.add("dropdown-item");
  return item;
}

function generateDropdownItemHTML(contact) {
  const initials = getInitials(contact.name || '');
  const colorValue = contact.color || "default";
  return `
    <div class="contact-info">
      <span class="initials-circle" style="background-color: ${colorValue};">
        ${initials}
      </span>
      <span class="contact-name">${contact.name || ''}</span>
    </div>
    <img src="../img/chekbox.png" alt="checkbox" class="custom-checkbox">`;
}

function attachDropdownClickEvent(item, id, contact, selectedContacts, badgesContainer) {
  item.addEventListener("click", event => {
    event.stopPropagation();
    handleDropdownSelection(item, id, contact, selectedContacts, badgesContainer);
  });
}

function handleDropdownSelection(item, id, contact, selectedContacts, badgesContainer) {
  const checkbox = item.querySelector('.custom-checkbox');
  if (!selectedContacts.has(id)) {
    addDropdownSelection(item, id, contact, selectedContacts, badgesContainer, checkbox);
  } else {
    removeDropdownSelection(item, id, selectedContacts, badgesContainer, checkbox);
  }
}

function addDropdownSelection(item, id, contact, selectedContacts, badgesContainer, checkbox) {
  selectedContacts.add(id);
  item.classList.add('selected');
  checkbox.src = "../img/checkboxchecked.png";
  checkbox.style.filter = "brightness(0) invert(1)";
  createContactBadge(contact, id, badgesContainer, selectedContacts);
}

function removeDropdownSelection(item, id, selectedContacts, badgesContainer, checkbox) {
  selectedContacts.delete(id);
  item.classList.remove('selected');
  checkbox.src = "../img/chekbox.png";
  checkbox.style.filter = "";
  const badge = badgesContainer.querySelector(`[data-contact-id="${id}"]`);
  if (badge) {
    badge.remove();
  }
}

function buildBadgeElement(badgeClass) {
  const badge = document.createElement('div');
  badge.className = `assignee-badge ${badgeClass}`;
  return badge;
}

function setBadgeData(badge, contact, id) {
  badge.dataset.contactId = id;
  badge.dataset.contactName = contact.name || '';
  badge.dataset.contactColor = getSimpleColor(contact.color || "default");
  badge.textContent = getInitials(contact.name || '');
}

function attachBadgeClickListener(badge, selectedContacts, id) {
  badge.addEventListener('click', () => {
    badge.remove();
    selectedContacts.delete(id);
  });
}

function createContactBadge(contact, id, container, selectedContacts) {
  const simpleColor = getSimpleColor(contact.color || "default");
  const badgeClass = getBadgeClassFromAnyColor(simpleColor);
  if (container.querySelector(`[data-contact-id="${id}"]`)) return;
  const badge = buildBadgeElement(badgeClass);
  setBadgeData(badge, contact, id);
  attachBadgeClickListener(badge, selectedContacts, id);
  container.appendChild(badge);
}

function readAssigneesFromBadges() {
  const badges = document.querySelectorAll('#assigneeBadges .assignee-badge');
  const users = [];
  const seen = new Set();
  
  badges.forEach(badge => {
    const userName = badge.dataset.contactName || badge.textContent.trim();
    
    // Duplikate vermeiden basierend auf Namen
    if (!seen.has(userName) && userName) {
      seen.add(userName);
      users.push({
        name: userName,
      });
    }
  });
  return users;
}

function getSelectedPriority() {
  if (document.querySelector('.edit-priority-urgent.active')) return 'urgent';
  if (document.querySelector('.edit-priority-medium.active')) return 'medium';
  if (document.querySelector('.edit-priority-low.active')) return 'low';
  return 'medium';
}

function getPriorityPath(priority) {
  switch (priority) {
    case 'urgent': return '../img/priority-img/urgent.png';
    case 'medium': return '../img/priority-img/medium.png';
    case 'low':    return '../img/priority-img/low.png';
    default:       return '../img/priority-img/medium.png';
  }
}