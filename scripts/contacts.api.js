/**
 * Fetch and load contacts, then render the list.
 * @returns {Promise<void>}
 */
async function loadContacts() {
  const fetchedContacts = await firebaseGet('/contacts');
  if (fetchedContacts) {
    contacts = Object.entries(fetchedContacts).map(([id, data]) => ({ id, ...data }));
  } else {
    contacts = [];
  }
  displayContacts();
}

/**
 * Delete a contact by id, update UI accordingly.
 * @param {string} contactId
 * @returns {Promise<void>}
 */
async function deleteContact(contactId) {
  await firebaseDelete(`/contacts/${contactId}`);
  selectedContact = null;
  document.getElementById('contactDetailsContent').innerHTML = '';
  if (isMobile()) {
    showMobileListView();
  }
  loadContacts();
  closeContactModal();
}

/**
 * From edit modal, delete the currently selected contact.
 * @returns {Promise<void>}
 */
async function editDeleteContact() {
  await deleteContact(selectedContact.id);
  loadContacts();
  closeContactModal();
}

/**
 * Save edited contact data to Firebase.
 * @returns {Promise<void>}
 */
async function saveContact() {
  const name = document.getElementById('editContactName').value.trim();
  const email = document.getElementById('editContactEmail').value.trim();
  const phone = document.getElementById('editContactPhone').value.trim();
  if (!validateEditContactFields(name, email, phone)) return;
  const updatedContact = { name, email, phone };
  await firebasePut(`/contacts/${selectedContact.id}`, updatedContact);
  updateSelectedContactData(name, email, phone);
  refreshContactDisplay();
  closeContactModal();
}

/**
 * Update local selectedContact fields after save.
 */
function updateSelectedContactData(name, email, phone) {
  selectedContact.name = name;
  selectedContact.email = email;
  selectedContact.phone = phone;
}

/**
 * Re-render list and detail views if applicable.
 */
function refreshContactDisplay() {
  loadContacts();
  displayContactDetails();
  if (isMobile()) setMobileActionMenu();
}

/**
 * Create a new contact from the Add Contact modal.
 * @returns {Promise<void>}
 */
async function createAddContact() {
  const name = document.getElementById('addInputName').value.trim();
  const email = document.getElementById('addInputEmail').value.trim();
  const phone = document.getElementById('addInputPhone').value.trim();
  if (!validateAllFields()) return;
  const contact = { name, email, phone };
  await firebasePost('/contacts', contact);
  refreshContactsAfterAdd();
  clearAddContactForm();
}

/**
 * Refresh list after adding and close modal.
 */
function refreshContactsAfterAdd() {
  loadContacts();
  closeContactModal();
}

/**
 * Clear Add Contact modal inputs.
 */
function clearAddContactForm() {
  document.getElementById('addInputName').value = '';
  document.getElementById('addInputEmail').value = '';
  document.getElementById('addInputPhone').value = '';
}

/**
 * Open Add Contact modal.
 */
function openAddContactModal() {
  document.getElementById('addContactModal').style.display = 'block';
}

/**
 * Close any contact modal.
 */
function closeContactModal() {
  document.getElementById('addContactModal').style.display = 'none';
  document.getElementById('contactModal').style.display = 'none';
}

/**
 * Cancel Add Contact flow (close modal only).
 */
function cancelAddContact() {
  document.getElementById('addContactModal').style.display = 'none';
}

/**
 * Open edit contact modal and prefill fields.
 * @param {string} contactId
 */
function editContact(contactId) {
  selectedContact = contacts.find(c => c.id === contactId);
  document.getElementById('contactModal').style.display = 'block';
  document.getElementById('editContactName').value = selectedContact.name;
  document.getElementById('editContactEmail').value = selectedContact.email;
  document.getElementById('editContactPhone').value = selectedContact.phone;
  const modalAvatar = document.getElementById('ModalAvatar');
  const initials = getInitials(selectedContact.name);
  const avatarClass = getAvatarClass(selectedContact.name);
  modalAvatar.innerHTML = `<div class="avatar-circle ${avatarClass}">${initials}</div>`;
}
