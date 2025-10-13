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
 * Öffnet das Add-Contact-Modal.
 */
function openAddContactModal() {
  const modal = document.getElementById('addContactModal');
  if (modal) modal.style.display = 'block';
}

/**
 * Schließt Add-/Edit-Contact-Modal.
 */
function closeContactModal() {
  const add = document.getElementById('addContactModal');
  const edit = document.getElementById('contactModal');
  if (add) add.style.display = 'none';
  if (edit) edit.style.display = 'none';
}

/**
 * Bricht das Hinzufügen ab und schließt das Modal.
 */
function cancelAddContact() {
  const modal = document.getElementById('addContactModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Öffnet das Edit-Modal und füllt es mit Daten des Kontakts.
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
 * Löscht einen Kontakt und aktualisiert die Ansicht.
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
 * Löscht den aktuell ausgewählten Kontakt (aus Edit-Modal heraus).
 */
async function editDeleteContact() {
  if (!selectedContact) return;
  await deleteContact(selectedContact.id);
}

/**
 * Speichert Änderungen am Kontakt aus dem Edit-Modal.
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
 * Aktualisiert den selektierten Kontakt im Speicher.
 */
function updateSelectedContactData(name, email, phone) {
  if (!selectedContact) return;
  selectedContact.name = name;
  selectedContact.email = email;
  selectedContact.phone = phone;
}

/**
 * Aktualisiert Liste und Detailansicht nach Änderungen.
 */
function refreshContactDisplay() {
  loadContacts();
  if (typeof displayContactDetails === 'function') displayContactDetails();
  if (typeof setMobileActionMenu === 'function' && isMobile()) setMobileActionMenu();
}


/**
 * Erstellt einen neuen Kontakt aus dem Add-Modal.
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
 * Aktualisiert die Ansicht nach dem Hinzufügen.
 */
function refreshContactsAfterAdd() {
  loadContacts();
  closeContactModal();
}

/**
 * Leert die Eingabefelder im Add-Modal.
 */
function clearAddContactForm() {
  const n = document.getElementById('addInputName');
  const e = document.getElementById('addInputEmail');
  const p = document.getElementById('addInputPhone');
  if (n) n.value = '';
  if (e) e.value = '';
  if (p) p.value = '';
}



