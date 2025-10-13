/**
 * Load contacts from Firebase and populate the assignment dropdown.
 * @returns {Promise<void>}
 */
async function loadContactsForAssignment() {
  try {
    const response = await fetch('https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/contacts.json');
    const contacts = await response.json();
    populateContactDropdown(contacts);
  } catch (error) {
    console.error('Error loading contacts:', error);
  }
}

/**
 * Populate the contacts dropdown with items for selection.
 * @param {Record<string, {name: string}>} contacts
 * @returns {void}
 */
function populateContactDropdown(contacts) {
  const dropdownList = document.querySelector('.dropdown-list');
  if (!dropdownList) return;
  dropdownList.innerHTML = '';
  if (!contacts) return;

  buildAndAppendDropdownItems(contacts, dropdownList);

  updateDropdownStates();
  setupTaskModalOutsideClick();
}

/**
 * Setup outside-click handler to close the contact dropdown list.
 * @returns {void}
 */
function setupTaskModalOutsideClick() {
  const taskModal = document.querySelector('#taskModal');
  if (!taskModal) return;
  taskModal.addEventListener('click', (event) => {
    const customDropdown = document.querySelector('.custom-dropdown');
    if (customDropdown && !customDropdown.contains(event.target)) {
      const dropdownList = document.querySelector('.dropdown-list');
      if (dropdownList) dropdownList.style.display = 'none';
    }
  });
}

/**
 * Add a selected contact as an assigned profile badge.
 * @param {string} contactName
 * @param {string} initials
 * @param {string} avatarClass
 * @returns {void}
 */
function addContactToAssigned(contactName, initials, avatarClass) {
  const container = document.querySelector('.assigned-to-profiles-container');
  if (!container) return;
  const existing = container.querySelector(`[data-contact-name="${contactName}"]`);
  if (existing) return;
  const profile = createAssignedProfileElement(contactName, initials, avatarClass);
  attachAssignedProfileClick(profile);
  container.appendChild(profile);
  validateForm();
}

/**
 * Synchronize checkboxes in the dropdown with the assigned profiles state.
 * @returns {void}
 */
function updateDropdownStates() {
  const assignedProfiles = document.querySelectorAll('.assigned-to-profiles-container [data-contact-name]');
  const assignedNames = Array.from(assignedProfiles).map(profile => profile.getAttribute('data-contact-name'));
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    const contactName = checkbox.getAttribute('data-contact-name');
    checkbox.checked = assignedNames.includes(contactName);
  });
}

/**
 * Remove contact from assigned list by name.
 * @param {string} contactName
 * @returns {void}
 */
function removeContactFromAssigned(contactName) {
  const container = document.querySelector('.assigned-to-profiles-container');
  if (!container) return;
  const profile = container.querySelector(`[data-contact-name="${contactName}"]`);
  if (profile) profile.remove();
  validateForm();
}

/**
 * Get contact visuals like initials and avatar class.
 * @param {string} name
 * @returns {{initials: string, avatarClass: string}}
 */
function getContactVisuals(name) {
  return { initials: getInitials(name), avatarClass: getAvatarClass(name) };
}

/**
 * Build and append all dropdown items for provided contacts to a list element.
 * @param {Record<string, {name: string}>} contacts
 * @param {HTMLElement} dropdownList
 * @returns {void}
 */
function buildAndAppendDropdownItems(contacts, dropdownList) {
  Object.entries(contacts).forEach(([id, contact]) => {
    const { initials, avatarClass } = getContactVisuals(contact.name);
    const item = createDropdownItemElement(id, contact.name, initials, avatarClass);
    attachDropdownItemEvents(item, contact.name, initials, avatarClass);
    dropdownList.appendChild(item);
  });
}

/**
 * Create a dropdown item element for a contact.
 * @param {string} id
 * @param {string} contactName
 * @param {string} initials
 * @param {string} avatarClass
 * @returns {HTMLDivElement}
 */
function createDropdownItemElement(id, contactName, initials, avatarClass) {
  const item = document.createElement('div');
  item.className = 'dropdown-item';
  item.innerHTML = `
      <div class="contact-info">
        <div class="avatar-contact-circle ${avatarClass}">${initials}</div>
        <span class="contact-name-edit">${contactName}</span>
      </div>
      <input class="custom-checkbox" type="checkbox" data-contact-id="${id}" data-contact-name="${contactName}" data-contact-initials="${initials}">
    `;
  return item;
}

/**
 * Attach all dropdown item event handlers.
 * @param {HTMLDivElement} item
 * @param {string} contactName
 * @param {string} initials
 * @param {string} avatarClass
 * @returns {void}
 */
function attachDropdownItemEvents(item, contactName, initials, avatarClass) {
  const checkbox = item.querySelector('input[type="checkbox"]');
  if (!checkbox) return;
  attachCheckboxChangeHandler(checkbox, contactName, initials, avatarClass);
  attachItemClickToggle(item, checkbox);
}

/**
 * Attach change handler to a checkbox to add/remove contacts.
 * @param {HTMLInputElement} checkbox
 * @param {string} contactName
 * @param {string} initials
 * @param {string} avatarClass
 * @returns {void}
 */
function attachCheckboxChangeHandler(checkbox, contactName, initials, avatarClass) {
  checkbox.addEventListener('change', function () {
    if (this.checked) {
      addContactToAssigned(contactName, initials, avatarClass);
    } else {
      removeContactFromAssigned(contactName);
    }
    updateDropdownStates();
  });
}

/**
 * Attach click toggle on an item to mirror checkbox behavior.
 * @param {HTMLDivElement} item
 * @param {HTMLInputElement} checkbox
 * @returns {void}
 */
function attachItemClickToggle(item, checkbox) {
  item.addEventListener('click', function (e) {
    if (e.target.tagName.toLowerCase() === 'input') return;
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

/**
 * Create the assigned profile element for a selected contact.
 * @param {string} contactName
 * @param {string} initials
 * @param {string} avatarClass
 * @returns {HTMLDivElement}
 */
function createAssignedProfileElement(contactName, initials, avatarClass) {
  const profile = document.createElement('div');
  profile.className = 'assigned-profile';
  profile.setAttribute('data-contact-name', contactName);
  profile.innerHTML = `
    <div class="avatar-contact-circle ${avatarClass}">${initials}</div>
  `;
  return profile;
}

/**
 * Attach click handler to assigned profile to allow removal.
 * @param {HTMLDivElement} profile
 * @returns {void}
 */
function attachAssignedProfileClick(profile) {
  profile.addEventListener('click', function () {
    this.remove();
    updateDropdownStates();
    validateForm();
  });
}
