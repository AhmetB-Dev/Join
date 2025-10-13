/**
 * Initialize contacts page on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof loadContacts === 'function') {
    loadContacts();
  }
  if (isMobile()) {
    showMobileListView();
  }
});

/**
 * Handle responsive switches between list and detail.
 */
window.addEventListener('resize', function () {
  const listPanel = document.querySelector('.contacts-list-panel');
  const detailPanel = document.querySelector('.contact-details-panel');
  if (!isMobile()) {
    if (listPanel) listPanel.classList.remove('hide-mobile');
    if (detailPanel) detailPanel.classList.remove('show-mobile');
    const contactsHeader = document.querySelector('.contacts-header');
    if (contactsHeader) {
      contactsHeader.innerHTML = `
        <h1>Contacts</h1>
        <hr>
        <span class="contact-subtitle">Better with a team</span>
      `;
    }
  } else if (window.selectedContact) {
    showMobileDetailView();
    setMobileHeaderWithBackButton();
  } else {
    showMobileListView();
  }
});
