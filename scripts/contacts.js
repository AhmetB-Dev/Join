let contacts = [];
let selectedContact = null;


async function loadContacts() {
    const fetchedContacts = await firebaseGet('/contacts');
    if (fetchedContacts) {
        contacts = Object.entries(fetchedContacts).map(([id, data]) => ({
            id,
            ...data
        }));
    } else {
        contacts = [];
    }
    displayContacts();
};

/**
 * Opens the Add-Contact-Modal.
 */
function openAddContactModal() {
  const modal = document.getElementById('addContactModal');
  if (modal) modal.style.display = 'block';
}

/**
 * Closes Add-/Edit-Contact-Modal.
 */
function closeContactModal() {
  const add = document.getElementById('addContactModal');
  const edit = document.getElementById('contactModal');
  if (add) add.style.display = 'none';
  if (edit) edit.style.display = 'none';
}

/**
 * Cancels adding and closes the modal.
 */
function cancelAddContact() {
  const modal = document.getElementById('addContactModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Opens the Edit-Modal and fills it with contact data.
 * @param {string} contactId
 */
function editContact(contactId) {
  selectedContact = contacts.find(c => c.id === contactId) || null;
  const modal = document.getElementById('contactModal');
  if (!selectedContact || !modal) return;
  modal.style.display = 'block';
  setEditFormValues(selectedContact);
  setEditAvatar(selectedContact);
}

function setEditFormValues(c) {
  const n = document.getElementById('editContactName');
  const e = document.getElementById('editContactEmail');
  const p = document.getElementById('editContactPhone');
  if (n) n.value = c.name;
  if (e) e.value = c.email;
  if (p) p.value = c.phone;
}

function setEditAvatar(c) {
  const modalAvatar = document.getElementById('ModalAvatar');
  if (!modalAvatar) return;
  const initials = getInitials(c.name);
  const avatarClass = getAvatarClass(c.name);
  modalAvatar.innerHTML = `<div class="avatar-circle ${avatarClass}">${initials}</div>`;
}


/**
 * Deletes a contact and updates the view.
 * @param {string} contactId
 */
async function deleteContact(contactId) {
  await firebaseDelete(`/contacts/${contactId}`);
  selectedContact = null;
  const details = document.getElementById('contactDetailsContent');
  if (details) details.innerHTML = '';
  if (typeof showMobileListView === 'function' && isMobile()) showMobileListView();
  loadContacts();
  closeContactModal();
}

/**
 * Deletes the currently selected contact (from Edit-Modal).
 */
async function editDeleteContact() {
  if (!selectedContact) return;
  await deleteContact(selectedContact.id);
}

/**
 * Saves changes to the contact from the Edit-Modal.
 */
async function saveContact() {
  const { name, email, phone } = readEditForm();
  if (!validateEditContactFields(name, email, phone)) return;
  await firebasePut(`/contacts/${selectedContact.id}`, { name, email, phone });
  updateSelectedContactData(name, email, phone);
  refreshContactDisplay();
  closeContactModal();
}

function readEditForm() {
  return {
    name: document.getElementById('editContactName').value.trim(),
    email: document.getElementById('editContactEmail').value.trim(),
    phone: document.getElementById('editContactPhone').value.trim()
  };
}

/**
 * Updates the selected contact in memory.
 */
function updateSelectedContactData(name, email, phone) {
  if (!selectedContact) return;
  selectedContact.name = name;
  selectedContact.email = email;
  selectedContact.phone = phone;
}

/**
 * Updates list and detail view after changes.
 */
function refreshContactDisplay() {
  loadContacts();
  if (typeof displayContactDetails === 'function') displayContactDetails();
  if (typeof setMobileActionMenu === 'function' && isMobile()) setMobileActionMenu();
}


/**
 * Creates a new contact from the Add-Modal.
 */
async function createAddContact() {
  const name = document.getElementById('addInputName').value.trim();
  const email = document.getElementById('addInputEmail').value.trim();
  const phone = document.getElementById('addInputPhone').value.trim();
  if (!validateAllFields()) return;
  await firebasePost('/contacts', { name, email, phone });
  refreshContactsAfterAdd();
  clearAddContactForm();
}

/**
 * Updates the view after adding.
 */
function refreshContactsAfterAdd() {
  loadContacts();
  closeContactModal();
}

/**
 * Clears the input fields in the Add-Modal.
 */
function clearAddContactForm() {
  const n = document.getElementById('addInputName');
  const e = document.getElementById('addInputEmail');
  const p = document.getElementById('addInputPhone');
  if (n) n.value = '';
  if (e) e.value = '';
  if (p) p.value = '';
}



