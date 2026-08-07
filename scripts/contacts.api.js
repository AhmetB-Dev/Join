/**
 * Fetch and load contacts from the Django REST API, then render the list.
 * @returns {Promise<void>}
 */
async function loadContacts() {
  try {
    const fetchedContacts = await JoinAPI.get('/contacts/');
    contacts = (Array.isArray(fetchedContacts) ? fetchedContacts : []).map(contact => ({
      ...contact,
      id: String(contact.id)
    }));
  } catch (error) {
    console.error('Error loading contacts:', error);
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
  await JoinAPI.delete(`/contacts/${contactId}/`);
  selectedContact = null;
  document.getElementById('contactDetailsContent').innerHTML = '';
  if (isMobile()) showMobileListView();
  await loadContacts();
  closeContactModal();
}

/** Delete the currently selected contact from the edit modal. */
async function editDeleteContact() {
  if (!selectedContact) return;
  await deleteContact(selectedContact.id);
}

/** Save edited contact data through the Django REST API. */
async function saveContact() {
  const name = document.getElementById('editContactName').value.trim();
  const email = document.getElementById('editContactEmail').value.trim();
  const phone = document.getElementById('editContactPhone').value.trim();
  if (!validateEditContactFields(name, email, phone) || !selectedContact) return;

  const updatedContact = await JoinAPI.put(`/contacts/${selectedContact.id}/`, { name, email, phone });
  selectedContact = { ...updatedContact, id: String(updatedContact.id) };
  await refreshContactDisplay();
  closeContactModal();
}

/** Re-render list and detail views if applicable. */
async function refreshContactDisplay() {
  await loadContacts();
  if (selectedContact) {
    selectedContact = contacts.find(contact => String(contact.id) === String(selectedContact.id)) || selectedContact;
    displayContactDetails();
  }
  if (isMobile()) setMobileActionMenu();
}

/** Create a new contact from the Add Contact modal. */
async function createAddContact() {
  const name = document.getElementById('addInputName').value.trim();
  const email = document.getElementById('addInputEmail').value.trim();
  const phone = document.getElementById('addInputPhone').value.trim();
  if (!validateAllFields()) return;
  await JoinAPI.post('/contacts/', { name, email, phone });
  await refreshContactsAfterAdd();
  clearAddContactForm();
}

/** Refresh list after adding and close modal. */
async function refreshContactsAfterAdd() {
  await loadContacts();
  closeContactModal();
}

/** Clear Add Contact modal inputs. */
function clearAddContactForm() {
  document.getElementById('addInputName').value = '';
  document.getElementById('addInputEmail').value = '';
  document.getElementById('addInputPhone').value = '';
}

/** Open Add Contact modal. */
function openAddContactModal() {
  document.getElementById('addContactModal').style.display = 'block';
}

/** Close any contact modal. */
function closeContactModal() {
  document.getElementById('addContactModal').style.display = 'none';
  document.getElementById('contactModal').style.display = 'none';
}

/** Cancel Add Contact flow. */
function cancelAddContact() {
  document.getElementById('addContactModal').style.display = 'none';
}

/** Open edit contact modal and prefill fields. */
function editContact(contactId) {
  selectedContact = contacts.find(c => String(c.id) === String(contactId));
  if (!selectedContact) return;
  document.getElementById('contactModal').style.display = 'block';
  document.getElementById('editContactName').value = selectedContact.name;
  document.getElementById('editContactEmail').value = selectedContact.email;
  document.getElementById('editContactPhone').value = selectedContact.phone;
  const modalAvatar = document.getElementById('ModalAvatar');
  const initials = getInitials(selectedContact.name);
  const avatarClass = getAvatarClass(selectedContact.name);
  modalAvatar.innerHTML = `<div class="avatar-circle ${avatarClass}">${initials}</div>`;
}
