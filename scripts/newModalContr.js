
async function loadContacts(assignedUsers = []) {
  try {
    const response = await fetch('https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/contacts.json');
    const contacts = await response.json();
    populateAssigneeDropdown(contacts, assignedUsers);
  } catch (error) {
    console.error(error);
  }
}

function populateAssigneeDropdown(contacts, assignedUsers) {
  const dropdownSelected = document.getElementById('assigneeDropdownSelected');
  const dropdownList = document.getElementById('assigneeDropdownList');
  const badgesContainer = document.getElementById('assigneeBadges');
  dropdownList.innerHTML = "";
  const assignedUserNames = new Set(
    assignedUsers.map(u => u.name.trim().toLowerCase())
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
  const contactName = contact.name.trim().toLowerCase();
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
  dropdownSelected.addEventListener('click', event => {
    event.stopPropagation();
    dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', event => {
    if (!dropdownList.contains(event.target) && !dropdownSelected.contains(event.target)) {
      dropdownList.style.display = 'none';
    }
  });
}

function getSimpleColor(colorValue) {
  if (colorValue.startsWith('#')) {
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
  const initials = getInitials(contact.name);
  const colorValue = contact.color || "default";
  return `
    <div class="contact-info">
      <span class="initials-circle" style="background-color: ${colorValue};">
        ${initials}
      </span>
      <span class="contact-name">${contact.name}</span>
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
  badge.dataset.contactName = contact.name;
  badge.dataset.contactColor = getSimpleColor(contact.color || "default");
  badge.textContent = getInitials(contact.name);
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
        color: badge.dataset.contactColor || "default"
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

function readSubtasksFromEditModal() {
  const subtaskItems = document.querySelectorAll('#editSubtasksList .subtask-item');
  const subtasks = [];
  subtaskItems.forEach(item => {
    const checkbox = item.querySelector('.subtask-edit-checkbox');
    const span = item.querySelector('span');
    if (span) {
      subtasks.push({
        text: span.innerText.replace('• ', '').trim(),
        completed: checkbox ? checkbox.checked : false
      });
    }
  });
  return subtasks;
}
