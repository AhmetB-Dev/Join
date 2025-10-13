/**
 * Toggle the floating mini modal visibility.
 */
function toggleModalfloating() {
  const modal = document.getElementById('toggleModalFloating');
  if (!modal) return;
  modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

/**
 * Toggle the main edit task modal visibility.
 */
function toggleModalEdit() {
  const modal = document.getElementById('editTaskModal');
  if (!modal) return;
  modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

/**
 * Close the main edit task modal.
 */
function closeModalEdit() {
  const modal = document.getElementById('editTaskModal');
  if (!modal) return;
  modal.style.display = "none";
}

/**
 * Initialize the edit modal: background/content clicks and open/close buttons.
 */
function initEditModal() {
  const modal = document.getElementById("editTaskModal");
  const modalContent = document.querySelector(".edit-modal-container");
  if (!modal || !modalContent) return;

  setupModalBackgroundClick(modal);
  setupModalContentClick(modalContent);
  setupCloseButtons();
  setupOpenButtons();
}

/**
 * Close modal when clicking on the backdrop.
 * @param {HTMLElement} modal
 */
function setupModalBackgroundClick(modal) {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeModalEdit();
    }
  });
}

/**
 * Stop propagation inside modal so backdrop handler doesn't fire.
 * @param {HTMLElement} modalContent
 */
function setupModalContentClick(modalContent) {
  modalContent.addEventListener("click", event => {
    event.stopPropagation();
  });
}

/**
 * Bind close buttons inside the edit modal.
 */
function setupCloseButtons() {
  document.querySelectorAll(".edit-close-icon, .close-modal-btn").forEach(button => {
    button.addEventListener("click", closeModalEdit);
  });
}

/**
 * Bind any UI buttons that open the edit modal.
 */
function setupOpenButtons() {
  document.querySelectorAll(".open-modal-btn").forEach(button => {
    button.addEventListener("click", toggleModalEdit);
  });
}

(function ensureAssigneeDropdownOverrides() {
  /**
   * Populate and bind the Assignee dropdown in the edit modal.
   * Splits logic into helpers to keep functions short and readable.
   * @param {Object<string, {name:string}>} contacts
   * @param {Array<{name:string}>} assignedUsers
   */
  function populateAssigneeDropdownOverride(contacts, assignedUsers) {
    const ctx = collectAssigneeContext();
    if (!ctx) return;
    resetAssigneeDropdownState(ctx);
    buildAssigneeItems(contacts, assignedUsers, ctx);
    rebindSelectedToggle(ctx);
    bindAssigneeInternalStops(ctx);
    bindOutsideClose(ctx);
  }

  /**
   * Collect required DOM elements for the assignee dropdown.
   * @returns {{dropdownSelected:HTMLElement, dropdownList:HTMLElement, badgesContainer:HTMLElement, assigneeDropdown:HTMLElement}|null}
   */
  function collectAssigneeContext() {
    const dropdownSelected = document.getElementById('assigneeDropdownSelected');
    const dropdownList = document.getElementById('assigneeDropdownList');
    const badgesContainer = document.getElementById('assigneeBadges');
    const assigneeDropdown = document.getElementById('assigneeDropdown');
    if (!dropdownSelected || !dropdownList || !badgesContainer || !assigneeDropdown) return null;
    return { dropdownSelected, dropdownList, badgesContainer, assigneeDropdown };
  }

  /**
   * Reset list and badges container, set dropdown hidden state.
   */
  function resetAssigneeDropdownState(ctx) {
    ctx.dropdownList.innerHTML = '';
    ctx.badgesContainer.innerHTML = '';
    ctx.dropdownList.classList.add('hidden');
    ctx.dropdownList.style.display = 'none';
  }

  /**
   * Build dropdown items via existing builder or simple fallback.
   */
  function buildAssigneeItems(contacts, assignedUsers, ctx) {
    const names = new Set((assignedUsers || []).map(u => (u.name || '').trim().toLowerCase()));
    const selected = new Set();
    if (typeof processContactEntry === 'function') {
      buildAssigneeItemsUsingProcess(contacts, selected, names, ctx);
    } else {
      buildAssigneeFallbackItems(contacts, ctx);
    }
  }

  function buildAssigneeItemsUsingProcess(contacts, selected, names, ctx) {
    Object.entries(contacts || {}).forEach(([id, contact]) => {
      processContactEntry(id, contact, selected, names, ctx.badgesContainer, ctx.dropdownList);
    });
  }

  function buildAssigneeFallbackItems(contacts, ctx) {
    Object.entries(contacts || {}).forEach(([_id, contact]) => {
      const item = createFallbackAssigneeItem(contact);
      ctx.dropdownList.appendChild(item);
    });
  }

  function createFallbackAssigneeItem(contact) {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    const initials = (contact?.name || '').split(' ').map(s=>s[0]||'').join('').slice(0,2).toUpperCase();
    item.innerHTML = `
      <div class="contact-info">
        <div class="avatar-contact-circle">${initials}</div>
        <span class="contact-name-edit">${contact?.name || ''}</span>
      </div>
      <img src="../img/chekbox.png" alt="checkbox" class="custom-checkbox">`;
    item.addEventListener('click', (e)=>{ e.stopPropagation(); item.classList.toggle('selected'); });
    return item;
  }

  /**
   * Replace the selected header node to drop old listeners and bind new toggle.
   */
  function rebindSelectedToggle(ctx) {
    const oldSel = ctx.dropdownSelected;
    const newSel = oldSel.cloneNode(true);
    oldSel.parentNode.replaceChild(newSel, oldSel);
    addSelectedToggleListener(newSel, ctx);
  }

  function addSelectedToggleListener(node, ctx) {
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = ctx.dropdownList.classList.contains('hidden');
      ctx.dropdownList.classList.toggle('hidden', !willOpen);
      ctx.dropdownList.style.display = willOpen ? 'block' : 'none';
      if (willOpen) enableDropdownListInteraction(ctx);
    });
  }

  function enableDropdownListInteraction(ctx) {
    ctx.dropdownList.style.opacity = '1';
    ctx.dropdownList.style.pointerEvents = 'auto';
    ctx.dropdownList.style.zIndex = '9999';
  }

  /**
   * Prevent unwanted bubbling inside the dropdown area.
   */
  function bindAssigneeInternalStops(ctx) {
    ctx.dropdownList.addEventListener('click', (e)=> e.stopPropagation());
    ctx.assigneeDropdown.addEventListener('click', (e)=> e.stopPropagation());
  }

  /**
   * Close dropdown on outside click within the edit modal container.
   */
  function bindOutsideClose(ctx) {
    const editModalContent = document.querySelector('.edit-modal-container');
    if (!editModalContent) return;
    if (window.__assigneeOutsideHandler_override) {
      editModalContent.removeEventListener('click', window.__assigneeOutsideHandler_override);
    }
    window.__assigneeOutsideHandler_override = (ev) => {
      if (!ctx.assigneeDropdown.contains(ev.target)) {
        ctx.dropdownList.style.display = 'none';
        ctx.dropdownList.classList.add('hidden');
      }
    };
    editModalContent.addEventListener('click', window.__assigneeOutsideHandler_override);
  }

  /**
   * Load contacts for the assignee dropdown with fallback.
   * @param {Array<{name:string}>} assignedUsers
   */
  async function loadContactsOverride(assignedUsers = []) {
    try {
      const contacts = await fetchContactsForAssignee();
      populateAssigneeDropdownOverride(contacts, assignedUsers);
    } catch (_e) {
      populateAssigneeDropdownOverride(loadLocalContactsFallback(), assignedUsers);
    }
  }

  /**
   * Fetch contacts JSON from Firebase.
   * @returns {Promise<object>}
   */
  async function fetchContactsForAssignee() {
    const url = 'https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/contacts.json';
    const response = await fetch(url);
    return await response.json();
  }

  /**
   * Local fallback contacts if remote fetch fails or is unavailable.
   */
  function loadLocalContactsFallback() {
    return (typeof getContactsFromLocalStorage === 'function' && getContactsFromLocalStorage()) || {
      c1: { name: 'Max Mustermann', color: 'green' },
      c2: { name: 'Erika Musterfrau', color: 'blue' },
      c3: { name: 'John Doe', color: 'orange' }
    };
  }

  window.populateAssigneeDropdown = populateAssigneeDropdownOverride;
  window.loadContacts = loadContactsOverride;
})();
