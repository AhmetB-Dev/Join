/**
 * Contact management utilities for assignee dropdown in edit modal.
 * Handles loading, displaying, and selecting contacts/assignees.
 */

/**
 * Load contacts from Firebase or fallback to local/sample.
 * @param {Array} assignedUsers
 */
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

/**
 * Get contacts from localStorage.
 * @returns {Object|null}
 */
function getContactsFromLocalStorage() {
  try {
    const raw = localStorage.getItem('contacts');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) { return null; }
}

/**
 * Provide sample contacts fallback.
 * @returns {Object}
 */
function provideSampleContacts() {
  return {
    c1: { name: 'Max Mustermann', color: 'green' },
    c2: { name: 'Erika Musterfrau', color: 'blue' },
    c3: { name: 'John Doe', color: 'orange' }
  };
}

/**
 * Populate assignee dropdown with contacts.
 * @param {Object} contacts
 * @param {Array} assignedUsers
 */
function populateAssigneeDropdown(contacts, assignedUsers) {
  const elements = getAssigneeDropdownElements();
  clearAssigneeContainers(elements);
  const assignedUserNames = createAssignedUserNamesSet(assignedUsers);
  const selectedContacts = new Set();
  populateContactEntries(contacts, selectedContacts, assignedUserNames, elements);
  setupDropdownToggleHandler(elements);
  setupOutsideClickHandler(elements);
}

/**
 * Get assignee dropdown DOM elements.
 * @returns {Object}
 */
function getAssigneeDropdownElements() {
  return {
    dropdownSelected: document.getElementById('assigneeDropdownSelected'),
    dropdownList: document.getElementById('assigneeDropdownList'),
    badgesContainer: document.getElementById('assigneeBadges'),
    assigneeDropdown: document.getElementById('assigneeDropdown')
  };
}

/**
 * Clear dropdown and badges containers.
 * @param {Object} elements
 */
function clearAssigneeContainers(elements) {
  elements.dropdownList.innerHTML = "";
  elements.badgesContainer.innerHTML = "";
}

/**
 * Create set of assigned user names (lowercased).
 * @param {Array} assignedUsers
 * @returns {Set}
 */
function createAssignedUserNamesSet(assignedUsers) {
  return new Set(
    (assignedUsers || []).map(u => (u.name || '').trim().toLowerCase())
  );
}

/**
 * Populate all contact entries.
 * @param {Object} contacts
 * @param {Set} selectedContacts
 * @param {Set} assignedUserNames
 * @param {Object} elements
 */
function populateContactEntries(contacts, selectedContacts, assignedUserNames, elements) {
  Object.entries(contacts).forEach(([id, contact]) => {
    processContactEntry(id, contact, selectedContacts, assignedUserNames, elements.badgesContainer, elements.dropdownList);
  });
}

/**
 * Setup dropdown toggle click handler.
 * @param {Object} elements
 */
function setupDropdownToggleHandler(elements) {
  elements.dropdownSelected.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.dropdownList.classList.toggle("hidden");
  });
}

/**
 * Setup outside click to close dropdown.
 * @param {Object} elements
 */
function setupOutsideClickHandler(elements) {
  const editModalContent = document.querySelector('.edit-modal-container');
  if (editModalContent) {
    editModalContent.addEventListener("click", (event) => {
      if (!elements.assigneeDropdown.contains(event.target)) {
        elements.dropdownList.classList.add("hidden");
      }
    });
  }
}

/**
 * Process and add contact entry to dropdown.
 * @param {string} id
 * @param {Object} contact
 * @param {Set} selectedContacts
 * @param {Set} assignedUserNames
 * @param {HTMLElement} badgesContainer
 * @param {HTMLElement} dropdownList
 */
function processContactEntry(id, contact, selectedContacts, assignedUserNames, badgesContainer, dropdownList) {
  const item = createDropdownItem(id, contact, selectedContacts, badgesContainer);
  dropdownList.appendChild(item);
  const contactName = (contact.name || '').trim().toLowerCase();
  if (assignedUserNames.has(contactName)) {
    selectContactItem(item, id, contact, selectedContacts, badgesContainer);
  }
}

/**
 * Mark contact as selected and create badge.
 * @param {HTMLElement} item
 * @param {string} id
 * @param {Object} contact
 * @param {Set} selectedContacts
 * @param {HTMLElement} badgesContainer
 */
function selectContactItem(item, id, contact, selectedContacts, badgesContainer) {
  selectedContacts.add(id);
  item.classList.add('selected');
  const checkbox = item.querySelector('.custom-checkbox');
  checkbox.src = "../img/checkboxchecked.png";
  checkbox.style.filter = "brightness(0) invert(1)";
  createContactBadge(contact, id, badgesContainer, selectedContacts);
}



/**
 * Create dropdown item for a contact.
 * @param {string} id
 * @param {Object} contact
 * @param {Set} selectedContacts
 * @param {HTMLElement} badgesContainer
 * @returns {HTMLElement}
 */
function createDropdownItem(id, contact, selectedContacts, badgesContainer) {
  const item = createDropdownItemContainer();
  item.innerHTML = generateDropdownItemHTML(contact);
  attachDropdownClickEvent(item, id, contact, selectedContacts, badgesContainer);
  return item;
}

/**
 * Create dropdown item container.
 * @returns {HTMLElement}
 */
function createDropdownItemContainer() {
  const item = document.createElement("div");
  item.classList.add("dropdown-item");
  return item;
}

/**
 * Generate HTML for dropdown item.
 * @param {Object} contact
 * @returns {string}
 */
function generateDropdownItemHTML(contact) {
  const initials = getInitials(contact.name || '');
  const avatarClass = getAvatarClass(contact.name || '');
  return `
    <div class="contact-info">
      <div class="avatar-contact-circle ${avatarClass}">
        ${initials}
      </div>
      <span class="contact-name-edit">${contact.name || ''}</span>
    </div>
    <img src="../img/chekbox.png" alt="checkbox" class="custom-checkbox">`;
}

/**
 * Attach click event to dropdown item.
 * @param {HTMLElement} item
 * @param {string} id
 * @param {Object} contact
 * @param {Set} selectedContacts
 * @param {HTMLElement} badgesContainer
 */
function attachDropdownClickEvent(item, id, contact, selectedContacts, badgesContainer) {
  item.addEventListener("click", event => {
    event.stopPropagation();
    handleDropdownSelection(item, id, contact, selectedContacts, badgesContainer);
  });
}

/**
 * Handle dropdown selection toggle.
 * @param {HTMLElement} item
 * @param {string} id
 * @param {Object} contact
 * @param {Set} selectedContacts
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

/**
 * Add contact selection.
 * @param {HTMLElement} item
 * @param {string} id
 * @param {Object} contact
 * @param {Set} selectedContacts
 * @param {HTMLElement} badgesContainer
 * @param {HTMLElement} checkbox
 */
function addDropdownSelection(item, id, contact, selectedContacts, badgesContainer, checkbox) {
  selectedContacts.add(id);
  item.classList.add('selected');
  checkbox.src = "../img/checkboxchecked.png";
  checkbox.style.filter = "brightness(0) invert(1)";
  createContactBadge(contact, id, badgesContainer, selectedContacts);
}

/**
 * Remove contact selection.
 * @param {HTMLElement} item
 * @param {string} id
 * @param {Set} selectedContacts
 * @param {HTMLElement} badgesContainer
 * @param {HTMLElement} checkbox
 */
function removeDropdownSelection(item, id, selectedContacts, badgesContainer, checkbox) {
  selectedContacts.delete(id);
  item.classList.remove('selected');
  checkbox.src = "../img/chekbox.png";
  checkbox.style.filter = "";
  const badge = badgesContainer.querySelector(`[data-contact-id="${id}"]`);
  if (badge) badge.remove();
}


/**
 * Create contact badge with click handler.
 * @param {Object} contact
 * @param {string} id
 * @param {HTMLElement} container
 * @param {Set} selectedContacts
 */
function createContactBadge(contact, id, container, selectedContacts) {
  if (container.querySelector(`[data-contact-id="${id}"]`)) return;
  if (container.querySelector(`[data-contact-name="${contact.name}"]`)) return;
  const badge = buildContactBadgeElement(contact, id);
  attachBadgeClickHandler(badge, contact, id, selectedContacts);
  container.appendChild(badge);
}

/**
 * Build badge element with data.
 * @param {Object} contact
 * @param {string} id
 * @returns {HTMLElement}
 */
function buildContactBadgeElement(contact, id) {
  const avatarClass = getAvatarClass(contact.name || '');
  const initials = getInitials(contact.name || '');
  const badge = document.createElement('div');
  badge.className = `assignee-badge avatar-contact-circle ${avatarClass}`;
  badge.dataset.contactId = id;
  badge.dataset.contactName = contact.name || '';
  badge.textContent = initials;
  return badge;
}

/**
 * Attach click handler to remove badge.
 * @param {HTMLElement} badge
 * @param {Object} contact
 * @param {string} id
 * @param {Set} selectedContacts
 */
function attachBadgeClickHandler(badge, contact, id, selectedContacts) {
  badge.addEventListener('click', () => {
    badge.remove();
    selectedContacts.delete(id);
    deselectDropdownItem(contact);
  });
}

/**
 * Deselect corresponding dropdown item.
 * @param {Object} contact
 */
function deselectDropdownItem(contact) {
  const dropdownList = document.getElementById('assigneeDropdownList');
  if (!dropdownList) return;
  const dropdownItem = findDropdownItemByName(dropdownList, contact.name);
  if (dropdownItem) {
    dropdownItem.classList.remove('selected');
    updateDropdownCheckbox(dropdownItem, false);
  }
}

/**
 * Find dropdown item by contact name.
 * @param {HTMLElement} dropdownList
 * @param {string} contactName
 * @returns {HTMLElement|undefined}
 */
function findDropdownItemByName(dropdownList, contactName) {
  return Array.from(dropdownList.querySelectorAll('.dropdown-item')).find(item => {
    return item.querySelector('.custom-checkbox')?.closest('.dropdown-item')?.querySelector('.contact-name')?.textContent === contactName;
  });
}

/**
 * Update dropdown checkbox state.
 * @param {HTMLElement} item
 * @param {boolean} checked
 */
function updateDropdownCheckbox(item, checked) {
  const checkbox = item.querySelector('.custom-checkbox');
  if (checkbox) {
    checkbox.src = checked ? "../img/checkboxchecked.png" : "../img/chekbox.png";
    checkbox.style.filter = checked ? "brightness(0) invert(1)" : "";
  }
}

/**
 * Read assignees from badges.
 * @returns {Array<{name:string}>}
 */
function readAssigneesFromBadges() {
  const badges = document.querySelectorAll('#assigneeBadges .assignee-badge');
  const users = [];
  const seen = new Set();
  badges.forEach(badge => {
    const userName = badge.dataset.contactName || badge.textContent.trim();
    if (!seen.has(userName) && userName) {
      seen.add(userName);
      users.push({ name: userName });
    }
  });
  return users;
}
