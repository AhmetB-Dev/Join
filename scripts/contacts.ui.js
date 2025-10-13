/**
 * Render the contacts list grouped by first letter.
 * @returns {void}
 */
function displayContacts() {
  const sortedContacts = contacts.slice().sort((a, b) => a.name.localeCompare(b.name));
  const groupedContacts = groupContactsByLetter(sortedContacts);
  const contactsList = document.getElementById('contactsList');
  if (!contactsList) return;
  contactsList.innerHTML = generateContactsHTML(groupedContacts);
}

/**
 * Group contacts by first letter of the name.
 * @param {Array<{name:string}>} sortedContacts
 * @returns {Record<string, any[]>}
 */
function groupContactsByLetter(sortedContacts) {
  const groupedContacts = {};
  sortedContacts.forEach(contact => {
    const firstLetter = (contact.name || '').charAt(0).toUpperCase();
    if (!groupedContacts[firstLetter]) groupedContacts[firstLetter] = [];
    groupedContacts[firstLetter].push(contact);
  });
  return groupedContacts;
}

/**
 * Build full HTML for grouped contacts.
 * @param {Record<string, any[]>} groupedContacts
 * @returns {string}
 */
function generateContactsHTML(groupedContacts) {
  let html = '';
  Object.keys(groupedContacts).forEach(letter => {
    html += generateContactGroupHTML(letter, groupedContacts[letter]);
  });
  return html;
}

/**
 * Build HTML for a single letter group.
 * @param {string} letter
 * @param {Array<any>} contactsForLetter
 * @returns {string}
 */
function generateContactGroupHTML(letter, contactsForLetter) {
  let html = '<div class="contact-group">';
  html += `<div class="group-letter">${letter}</div>`;
  contactsForLetter.forEach(contact => {
    html += generateContactItemHTML(contact);
  });
  html += '</div>';
  return html;
}

/**
 * Build HTML for a single contact row.
 * @param {{id:string,name:string,email:string}} contact
 * @returns {string}
 */
function generateContactItemHTML(contact) {
  const initials = getInitials(contact.name);
  const avatarClass = getAvatarClass(contact.name);
  return `
    <div class="contact-item" onclick="selectContact('${contact.id}')">
      <div class="avatar-contact-circle ${avatarClass}">${initials}</div>
      <div class="contact-info">
        <div class="contact-name">${contact.name}</div>
        <div class="contact-email">${contact.email}</div>
      </div>
    </div>`;
}

/**
 * Handle selecting a contact in the list and open details.
 * @param {string} id
 */
function selectContact(id) {
  const allItems = document.querySelectorAll('.contact-item');
  allItems.forEach(item => item.classList.remove('selected'));
  const clickedItem = event.target.closest('.contact-item');
  if (clickedItem) clickedItem.classList.add('selected');
  selectedContact = contacts.find(contact => contact.id === id) || null;
  displayContactDetails();
  if (isMobile()) showMobileDetailView();
}

/**
 * Check if viewport is mobile size.
 * @returns {boolean}
 */
function isMobile() {
  return window.innerWidth <= 600;
}

/**
 * Switch to detail view on mobile.
 */
function showMobileDetailView() {
  const listPanel = document.querySelector('.contacts-list-panel');
  const detailPanel = document.querySelector('.contact-details-panel');
  if (listPanel) listPanel.classList.add('hide-mobile');
  if (detailPanel) detailPanel.classList.add('show-mobile');
  if (selectedContact) {
    setMobileHeaderWithBackButton();
    setMobileActionMenu();
  }
}

/**
 * Switch back to list view on mobile.
 */
function showMobileListView() {
  const listPanel = document.querySelector('.contacts-list-panel');
  const detailPanel = document.querySelector('.contact-details-panel');
  if (listPanel) listPanel.classList.remove('hide-mobile');
  if (detailPanel) detailPanel.classList.remove('show-mobile');
  const contactsHeader = document.querySelector('.contacts-header');
  if (isMobile() && contactsHeader) {
    contactsHeader.innerHTML = `
      <h1>Contacts</h1>
      <hr>
      <span class="contact-subtitle">Better with a team</span>
    `;
  }
}

/**
 * Set mobile header including back button.
 */
function setMobileHeaderWithBackButton() {
  const contactsHeader = document.querySelector('.contacts-header');
  if (isMobile() && contactsHeader) {
    contactsHeader.innerHTML = `
      <h1>Contacts</h1>
      <hr>
      <span class="contact-subtitle">Better with a team</span>
      <button class="mobile-back-button" onclick="showMobileListView()">
        <img src="../img/icon/return-icon.png" alt="return button" class="return-button-contacts">
      </button>
    `;
  }
}

/**
 * Render selected contact details panel.
 */
function displayContactDetails() {
  if (!selectedContact) return;
  const contactDetailsContent = document.getElementById('contactDetailsContent');
  if (!contactDetailsContent) return;
  const initials = getInitials(selectedContact.name);
  const avatarClass = getAvatarClass(selectedContact.name);
  contactDetailsContent.innerHTML = '';
  setMobileHeaderWithBackButton();
  contactDetailsContent.innerHTML = generateContactDetailsHTML(initials, avatarClass);
}

/**
 * Build contact details HTML.
 * @param {string} initials
 * @param {string} avatarClass
 * @returns {string}
 */
function generateContactDetailsHTML(initials, avatarClass) {
  let html = '<div class="contact-details-content">';
  html += generateContactDetailsHeader(initials, avatarClass);
  html += generateContactInformationSection();
  html += '</div>';
  return html;
}

/**
 * Build contact details header HTML.
 * @param {string} initials
 * @param {string} avatarClass
 * @returns {string}
 */
function generateContactDetailsHeader(initials, avatarClass) {
  let html = '<div class="contact-details-content-header">';
  html += '<div class="contact-avatar-large">';
  html += `<div class="avatar-circle-contact-details ${avatarClass}">${initials}</div>`;
  html += '</div>';
  html += '<div class="contact-info-section">';
  html += `<h2 class="contact-name-large">${selectedContact.name}</h2>`;
  html += generateContactActionsHTML();
  html += '</div>';
  html += '</div>';
  return html;
}

/**
 * Build action menu HTML for edit/delete.
 * @returns {string}
 */
function generateContactActionsHTML() {
  return `
    <div class="contact-actions">
      <button class="edit-contact-btn" onclick="editContact('${selectedContact.id}')">
        <img src="../img/edit-contacts.png" alt="edit" class="edit-icon">
      </button>
      <button class="delete-contact-btn" onclick="deleteContact('${selectedContact.id}')">
        <img src="../img/delete-contacts.png" alt="edit" class="delete-icon">
      </button>
    </div>`;
}

/**
 * Build contact info section HTML.
 * @returns {string}
 */
function generateContactInformationSection() {
  let html = '<div class="contact-information-text">';
  html += '<h3>Contact Information</h3>';
  html += '</div>';
  html += '<div class="contact-information-details">';
  html += `<div class="contact-detail-email"><h4>Email</h4><span>${selectedContact.email}</span></div>`;
  html += `<div class="contact-detail-phone"><h4>Phone</h4><span>${selectedContact.phone}</span></div>`;
  html += '</div>';
  return html;
}

/**
 * Ensure mobile action menu exists in details view.
 */
function setMobileActionMenu() {
  const detailsContent = document.getElementById('contactDetailsContent');
  if (isMobile() && detailsContent) {
    if (!detailsContent.querySelector('.mobile-action-menu-container')) {
      detailsContent.innerHTML += `
        <div class="mobile-action-menu-container">
          <button class="mobile-action-button" onclick="toggleMobileActionMenu()">
            <span class="three-dots">⋮</span>
          </button>
          <div class="mobile-action-menu" id="mobileActionMenu" style="display: none;">
            <div class="action-menu-item" onclick="editContact('${selectedContact.id}')">
              <img src="../img/edit-contacts.png" alt="edit">
            </div>
            <div class="action-menu-item" onclick="deleteContact('${selectedContact.id}')">
              <img src="../img/delete-contacts.png" alt="delete">
            </div>
          </div>
        </div>`;
    }
  }
}

/**
 * Toggle the three-dots mobile action menu.
 */
function toggleMobileActionMenu() {
  const menu = document.getElementById('mobileActionMenu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

/**
 * Close mobile action menu when clicking outside.
 */
document.addEventListener('click', function(event) {
  const menu = document.getElementById('mobileActionMenu');
  const button = document.querySelector('.mobile-action-button');
  if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
    menu.style.display = 'none';
  }
});
