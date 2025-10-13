
/**
 * Load contacts and populate the assignee dropdown, preselecting assigned users.
 * @param {Array<{name:string}>} [assignedUsers=[]]
 * @returns {Promise<void>}
 */
async function loadContacts(assignedUsers = []) {
  try {
    const response = await fetch('https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/contacts.json');
    const contacts = await response.json();
    populateAssigneeDropdown(contacts, assignedUsers);
  } catch (error) {
    console.error(error);
  }
}



function createAssignedUserNamesSet(assignedUsers) {
  return new Set(assignedUsers.map(u => u.name.trim().toLowerCase()));
}

/**
 * Iterate all contacts to build list items and preselect assigned.
 * @param {Record<string, {name:string,color?:string}>} contacts
 * @param {Set<string>} selectedContacts
 * @param {Set<string>} assignedUserNames lowercased user names
 * @param {{badgesContainer:HTMLElement, dropdownList:HTMLElement}} elements
 */
function processAllContacts(contacts, selectedContacts, assignedUserNames, elements) {
  Object.entries(contacts).forEach(([id, contact]) => {
    processContactEntry(id, contact, selectedContacts, assignedUserNames, elements.badgesContainer, elements.dropdownList);
  });
}

/**
 * Create a dropdown item for a contact and preselect if assigned.
 * @param {string} id
 * @param {{name:string,color?:string}} contact
 * @param {Set<string>} selectedContacts
 * @param {Set<string>} assignedUserNames
 * @param {HTMLElement} badgesContainer
 * @param {HTMLElement} dropdownList
 */
function processContactEntry(id, contact, selectedContacts, assignedUserNames, badgesContainer, dropdownList) {
  const item = createDropdownItem(id, contact, selectedContacts, badgesContainer);
  dropdownList.appendChild(item);
  
  if (isContactAssigned(contact, assignedUserNames)) {
    selectContactEntry(id, item, contact, selectedContacts, badgesContainer);
  }
}

function isContactAssigned(contact, assignedUserNames) {
  const contactName = contact.name.trim().toLowerCase();
  return assignedUserNames.has(contactName);
}

function selectContactEntry(id, item, contact, selectedContacts, badgesContainer) {
  selectedContacts.add(id);
  item.classList.add('selected');
  
  const checkbox = item.querySelector('.custom-checkbox');
  setCheckboxSelected(checkbox);
  createContactBadge(contact, id, badgesContainer, selectedContacts);
}

function setCheckboxSelected(checkbox) {
  checkbox.src = "../img/checkboxchecked.png";
  checkbox.style.filter = "brightness(0) invert(1)";
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

/**
 * Build a dropdown item element for a contact.
 * @param {string} id
 * @param {{name:string,color?:string}} contact
 * @param {Set<string>} selectedContacts
 * @param {HTMLElement} badgesContainer
 * @returns {HTMLElement}
 */
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
  const avatarClass = getAvatarClass(contact.name);
  return `
    <div class="contact-info">
      <div class="avatar-contact-circle ${avatarClass}">
        ${initials}
      </div>
      <span class="contact-name-edit">${contact.name}</span>
    </div>
    <img src="../img/chekbox.png" alt="checkbox" class="custom-checkbox">`;
}

/**
 * Attach selection toggle behavior for a dropdown item.
 * @param {HTMLElement} item
 * @param {string} id
 * @param {{name:string,color?:string}} contact
 * @param {Set<string>} selectedContacts
 * @param {HTMLElement} badgesContainer
 */
function attachDropdownClickEvent(item, id, contact, selectedContacts, badgesContainer) {
  item.addEventListener("click", event => {
    event.stopPropagation();
    handleDropdownSelection(item, id, contact, selectedContacts, badgesContainer);
  });
}

/**
 * Handle selection toggle for a contact list item.
 * @param {HTMLElement} item
 * @param {string} id
 * @param {{name:string,color?:string}} contact
 * @param {Set<string>} selectedContacts
 * @param {HTMLElement} badgesContainer
 */
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
    const dropdownList = document.getElementById('assigneeDropdownList');
    if (dropdownList) {
      const item = dropdownList.querySelector(`.dropdown-item [data-contact-id="${id}"]`)
        ? dropdownList.querySelector(`.dropdown-item [data-contact-id="${id}"]`).closest('.dropdown-item')
        : null;
      if (item) {
        item.classList.remove('selected');
        const checkboxImg = item.querySelector('.custom-checkbox');
        if (checkboxImg) {
          checkboxImg.src = "../img/chekbox.png";
          checkboxImg.style.filter = "";
        }
      }
    }
  });
}

/**
 * Create and append a contact badge if not a duplicate.
 * @param {{name:string,color?:string}} contact
 * @param {string} id
 * @param {HTMLElement} container
 * @param {Set<string>} selectedContacts
 */
function createContactBadge(contact, id, container, selectedContacts) {
  if (isDuplicateBadge(container, id, contact.name)) return;
  
  const badgeClass = getBadgeClassFromColor(contact.color);
  const badge = buildBadgeElement(badgeClass);
  
  setupBadgeData(badge, contact, id);
  attachBadgeClickListener(badge, selectedContacts, id);
  container.appendChild(badge);
}

function isDuplicateBadge(container, id, contactName) {
  return container.querySelector(`[data-contact-id="${id}"]`) ||
         container.querySelector(`[data-contact-name="${contactName}"]`);
}

function getBadgeClassFromColor(color) {
  const simpleColor = getSimpleColor(color || "default");
  return getBadgeClassFromAnyColor(simpleColor);
}

function setupBadgeData(badge, contact, id) {
  setBadgeData(badge, contact, id);
}

/**
 * Read selected assignees from badges in the edit modal.
 * @returns {Array<{name:string,color:string}>}
 */
function readAssigneesFromBadges() {
  const badges = document.querySelectorAll('#assigneeBadges .assignee-badge');
  const users = [];
  const seen = new Set();
  
  badges.forEach(badge => {
    const user = extractUserFromBadge(badge);
    if (user && !seen.has(user.name)) {
      seen.add(user.name);
      users.push(user);
    }
  });
  
  return users;
}

/**
 * Convert a badge element back into a user object.
 * @param {HTMLElement} badge
 * @returns {{name:string,color:string}|null}
 */
function extractUserFromBadge(badge) {
  const userName = badge.dataset.contactName || badge.textContent.trim();
  if (!userName) return null;
  
  return {
    name: userName,
    color: badge.dataset.contactColor || "default"
  };
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

/**
 * Read subtasks from the edit modal list.
 * @returns {Array<{text:string,completed:boolean}>}
 */
function readSubtasksFromEditModal() {
  const subtaskItems = document.querySelectorAll('#editSubtasksList .subtask-item');
  const subtasks = [];
  
  subtaskItems.forEach(item => {
    const subtask = extractSubtaskFromItem(item);
    if (subtask) {
      subtasks.push(subtask);
    }
  });
  
  return subtasks;
}

/**
 * Extract a subtask object from a list item element.
 * @param {HTMLElement} item
 * @returns {{text:string,completed:boolean}|null}
 */
function extractSubtaskFromItem(item) {
  const checkbox = item.querySelector('.subtask-edit-checkbox');
  const span = item.querySelector('span');
  
  if (!span) return null;
  
  return {
    text: span.innerText.replace('• ', '').trim(),
    completed: checkbox ? checkbox.checked : false
  };
}
