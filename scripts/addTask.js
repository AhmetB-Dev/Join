(() => {
  const FIREBASE_BASE_URL = 'https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app';
  const FIREBASE_TASKS_URL = `${FIREBASE_BASE_URL}/tasks.json`;
  const FIREBASE_CONTACTS_URL = `${FIREBASE_BASE_URL}/contacts.json`;

  function query(container, selector) {
    return container.querySelector(selector);
  }

  function getInitialsFromFullName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/);
    if (!parts[0]) return '??';
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }

  function computeStableColorIndex(fullName) {
    const sum = Array.from(String(fullName || '')).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return (sum % 7) + 1;
  }

  function getLoggedInUserLowercase() {
    return (
      localStorage.getItem('name') ||
      localStorage.getItem('userName') ||
      localStorage.getItem('displayName') ||
      ''
    ).trim().toLowerCase();
  }

  function showFieldValidationError(inputElement, message = 'This field is required') {
    if (!inputElement) return;
    inputElement.classList.add('at-error');
    const nextSibling = inputElement.nextElementSibling;
    const hasMessage = nextSibling && nextSibling.classList.contains('at-error-message');
    if (!hasMessage) {
      const hint = document.createElement('div');
      hint.className = 'at-error-message';
      hint.textContent = message;
      inputElement.insertAdjacentElement('afterend', hint);
    }
  }

  function clearFieldValidationError(inputElement) {
    if (!inputElement) return;
    inputElement.classList.remove('at-error');
    const nextSibling = inputElement.nextElementSibling;
    const isError = nextSibling && nextSibling.classList.contains('at-error-message');
    if (isError) nextSibling.remove();
  }

  function ensureCategorySelectHasRealOptions(addTaskContainer) {
    const categorySelect = query(addTaskContainer, '#task-category');
    if (!categorySelect) return;

    const optionValues = Array.from(categorySelect.options)
      .map(o => (o.value || o.text).toLowerCase());

    const hasTechnical = optionValues.some(v => v.includes('technical'));
    const hasUserStory = optionValues.some(v => v.includes('user'));

    const onlyPlaceholder =
      categorySelect.options.length === 1 &&
      String(categorySelect.options[0].value || '').trim() === '';

    if (!hasTechnical && !hasUserStory && onlyPlaceholder) {
      categorySelect.add(new Option('Technical Task', 'technical'));
      categorySelect.add(new Option('User Story', 'user'));
    }
  }

  function normalizeCategoryForBoard(rawValueOrText) {
    const value = String(rawValueOrText || '').trim().toLowerCase();
    if (value.includes('technical')) return 'Technical task';
    if (value.includes('user')) return 'User Story';
    return 'Technical task';
  }

  function initializeAssignedToDropdown(addTaskContainer) {
    const hiddenSelect = query(addTaskContainer, '#task-assigned');
    if (!hiddenSelect) return null;

    hiddenSelect.style.display = 'none';

    const wrapper = document.createElement('div');
    const inputField = document.createElement('input');
    const dropdownPanel = document.createElement('div');
    const previewStrip = document.createElement('div');

    wrapper.className = 'at-assign-field';
    inputField.className = 'at-assign-input';
    dropdownPanel.className = 'at-assign-dd';
    previewStrip.id = 'at-assigned-preview';

    inputField.type = 'text';
    inputField.readOnly = true;
    inputField.placeholder = 'Select contacts to assign';

    hiddenSelect.insertAdjacentElement('afterend', previewStrip);
    hiddenSelect.insertAdjacentElement('afterend', dropdownPanel);
    hiddenSelect.insertAdjacentElement('afterend', wrapper);
    wrapper.append(inputField, dropdownPanel);

    const state = {
      selectedByName: new Map(),
      currentUserLower: getLoggedInUserLowercase(),
      inputField,
      dropdownPanel,
      previewStrip
    };

    attachAssignedDropdownEvents(state);
    return {
      getSelectedUsers: () => Array.from(state.selectedByName.values()).map(u => ({ name: u.name })),
      clearSelection: () => clearAssignedSelectionAndUi(state),
      inputElement: inputField
    };
  }

  function attachAssignedDropdownEvents(dropdownState) {
    const { inputField, dropdownPanel } = dropdownState;

    inputField.addEventListener('click', async () => {
      const isClosed = dropdownPanel.style.display !== 'block';
      if (isClosed) await rebuildContactsListInDropdown(dropdownState);
      dropdownPanel.style.display = isClosed ? 'block' : 'none';
    });

    document.addEventListener('click', (event) => {
      const inside = inputField.parentElement.contains(event.target);
      if (!inside) dropdownPanel.style.display = 'none';
    });
  }

  async function rebuildContactsListInDropdown(dropdownState) {
    const { dropdownPanel, selectedByName, currentUserLower } = dropdownState;
    dropdownPanel.innerHTML = '';

    let contacts = [];
    try {
      const response = await fetch(FIREBASE_CONTACTS_URL);
      const payload = await response.json();
      contacts = (payload && typeof payload === 'object')
        ? Object.values(payload).map(c => c?.name).filter(Boolean)
        : [];
    } catch {}

    if (contacts.length === 0) {
      contacts = ['Sofia Müller', 'Anton Mayer', 'Anja Schulz', 'Benedikt Ziegler', 'David Eisenberg'];
    }

    contacts.forEach((name) => {
      const row = createContactsDropdownRow(name, currentUserLower, selectedByName);
      row.addEventListener('click', () => toggleAssigneeSelection(dropdownState, name));
      dropdownPanel.appendChild(row);
    });

    for (const { name } of selectedByName.values()) {
      reflectRowSelection(dropdownPanel, name, true);
    }
  }

  function createContactsDropdownRow(name, currentUserLower, selectedByName) {
    const row = document.createElement('div');
    const avatar = document.createElement('div');
    const label = document.createElement('div');
    const check = document.createElement('span');

    row.className = 'at-assign-item';
    row.dataset.name = name;

    avatar.className = `at-assign-avatar at-av-c${computeStableColorIndex(name)}`;
    avatar.textContent = getInitialsFromFullName(name);

    label.className = 'at-assign-name';
    label.textContent = (name.trim().toLowerCase() === currentUserLower) ? `${name} (You)` : name;

    check.className = 'at-assign-check';

    if (selectedByName.has(name)) {
      row.classList.add('at-is-selected');
      check.classList.add('at-checked');
    }

    row.append(avatar, label, check);
    return row;
  }

  function toggleAssigneeSelection(dropdownState, name) {
    const { selectedByName, dropdownPanel, inputField, previewStrip } = dropdownState;

    if (selectedByName.has(name)) {
      selectedByName.delete(name);
      reflectRowSelection(dropdownPanel, name, false);
    } else {
      selectedByName.set(name, { name, colorIndex: computeStableColorIndex(name) });
      reflectRowSelection(dropdownPanel, name, true);
      clearFieldValidationError(inputField);
    }

    renderAssigneeBadges(previewStrip, dropdownPanel, selectedByName, inputField);
  }

  function reflectRowSelection(dropdownPanel, name, isSelected) {
    dropdownPanel.querySelectorAll('.at-assign-item').forEach((row) => {
      if (row.dataset.name === name) {
        row.classList.toggle('at-is-selected', isSelected);
        row.querySelector('.at-assign-check')?.classList.toggle('at-checked', isSelected);
      }
    });
  }

  function renderAssigneeBadges(previewStrip, dropdownPanel, selectedByName, inputField) {
    previewStrip.innerHTML = '';
    if (selectedByName.size === 0) return;

    const badgesRow = document.createElement('div');
    badgesRow.className = 'at-assign-strip';

    for (const person of selectedByName.values()) {
      const badge = document.createElement('div');
      badge.className = `at-assign-badge at-badge-c${person.colorIndex}`;
      badge.textContent = getInitialsFromFullName(person.name);
      badge.title = `${person.name} – remove`;
      badge.addEventListener('click', () => {
        selectedByName.delete(person.name);
        reflectRowSelection(dropdownPanel, person.name, false);
        renderAssigneeBadges(previewStrip, dropdownPanel, selectedByName, inputField);
        clearFieldValidationError(inputField);
      });
      badgesRow.appendChild(badge);
    }

    const hint = document.createElement('span');
    hint.className = 'at-assign-hint';
    hint.textContent = 'Click to remove';

    previewStrip.append(badgesRow, hint);
  }

  function clearAssignedSelectionAndUi(dropdownState) {
    const { selectedByName, dropdownPanel, previewStrip } = dropdownState;
    selectedByName.clear();
    previewStrip.innerHTML = '';
    dropdownPanel.querySelectorAll('.at-assign-item').forEach((row) => {
      row.classList.remove('at-is-selected');
      row.querySelector('.at-assign-check')?.classList.remove('at-checked');
    });
  }

  function initializePrioritySelector(addTaskContainer) {
    const urgentButton = query(addTaskContainer, '.btn-urgent');
    const mediumButton = query(addTaskContainer, '.btn-medium');
    const lowButton = query(addTaskContainer, '.btn-low');

    let currentPriorityName = 'medium';

    function updatePriorityButtons(nextPriorityName) {
      currentPriorityName = nextPriorityName;
      [urgentButton, mediumButton, lowButton].forEach((btn) => btn?.setAttribute('aria-pressed', 'false'));
      const map = { urgent: urgentButton, medium: mediumButton, low: lowButton };
      map[nextPriorityName]?.setAttribute('aria-pressed', 'true');
    }

    urgentButton?.addEventListener('click', () => updatePriorityButtons('urgent'));
    mediumButton?.addEventListener('click', () => updatePriorityButtons('medium'));
    lowButton?.addEventListener('click', () => updatePriorityButtons('low'));
    updatePriorityButtons('medium');

    return {
      getCurrentName: () => currentPriorityName,
      getIconPath: () => `../img/priority-img/${currentPriorityName}.png`,
      resetToMedium: () => updatePriorityButtons('medium')
    };
  }

  function initializeSubtaskComposer(addTaskContainer) {
    const subtaskInput = query(addTaskContainer, '#subtask-input');
    const addSubtaskButton = query(addTaskContainer, '#add-subtask-btn');
    const subtaskList = query(addTaskContainer, '#subtask-list');

    function appendSubtaskItem(text) {
      if (!text) return;
      const listItem = document.createElement('li');
      listItem.className = 'at-subtask-item';
      listItem.dataset.text = text;
      listItem.title = 'Click to remove';
      listItem.textContent = text;
      listItem.addEventListener('click', () => listItem.remove());
      subtaskList?.appendChild(listItem);
    }

    addSubtaskButton?.addEventListener('click', () => {
      const value = subtaskInput?.value.trim();
      if (value) { appendSubtaskItem(value); subtaskInput.value = ''; }
    });

    subtaskInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = subtaskInput.value.trim();
        if (value) { appendSubtaskItem(value); subtaskInput.value = ''; }
      }
    });

    return {
      collect: () => Array.from(addTaskContainer.querySelectorAll('#subtask-list li'))
        .map(li => ({ text: li.dataset.text || li.textContent.trim(), completed: false })),
      clear: () => { if (subtaskList) subtaskList.innerHTML = ''; }
    };
  }

  function buildTaskPayload(addTaskContainer, prioritySelector, subtaskComposer, assignedDropdown) {
    const titleValue = query(addTaskContainer, '#task-title')?.value.trim() || '';
    const descriptionValue = query(addTaskContainer, '#task-desc')?.value.trim() || 'No description provided';
    const dueDateValue = query(addTaskContainer, '#task-due')?.value.trim() || '';

    const categorySelect = query(addTaskContainer, '#task-category');
    const rawCategory = categorySelect
      ? (categorySelect.value || categorySelect.options[categorySelect.selectedIndex]?.text)
      : '';

    const normalizedCategory = normalizeCategoryForBoard(rawCategory);

    return {
      column: 'toDoColumn',
      description: descriptionValue,
      dueDate: dueDateValue,
      id: null,
      priority: prioritySelector.getIconPath(),
      progress: 0,
      title: titleValue,
      users: assignedDropdown?.getSelectedUsers() || [],
      subtasks: subtaskComposer.collect(),
      category: normalizedCategory
    };
  }

  async function persistTaskToFirebase(taskPayload) {
    const createResponse = await fetch(FIREBASE_TASKS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskPayload)
    });

    const created = await createResponse.json();
    const firebaseKey = created && created.name;
    if (!firebaseKey) return null;

    await fetch(`${FIREBASE_BASE_URL}/tasks/${firebaseKey}/id.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firebaseKey)
    });

    return firebaseKey;
  }

  function attachFormLifecycle(addTaskContainer, prioritySelector, subtaskComposer, assignedDropdown) {
    const titleInput = query(addTaskContainer, '#task-title');
    const dueDateInput = query(addTaskContainer, '#task-due');
    const categorySelect = query(addTaskContainer, '#task-category');
    const createButton = query(addTaskContainer, '#create-task-btn');
    const clearButton = query(addTaskContainer, '#clear-task-btn');

    [titleInput, dueDateInput, categorySelect].forEach((el) => {
      el?.addEventListener('input', () => clearFieldValidationError(el));
      el?.addEventListener('change', () => clearFieldValidationError(el));
    });

    function validateRequiredFields() {
      let ok = true;
      if (!titleInput?.value.trim()) { showFieldValidationError(titleInput, 'Title is required'); ok = false; }
      if (!dueDateInput?.value.trim()) { showFieldValidationError(dueDateInput, 'Due date is required'); ok = false; }
      if (!categorySelect?.value.trim()) { showFieldValidationError(categorySelect, 'Category is required'); ok = false; }
      return ok;
    }

    createButton?.addEventListener('click', async () => {
      if (!validateRequiredFields()) return;
      const payload = buildTaskPayload(addTaskContainer, prioritySelector, subtaskComposer, assignedDropdown);
      try {
        const key = await persistTaskToFirebase(payload);
        if (key) window.location.href = './board.html';
      } catch (error) {
        console.error('Error saving task:', error);
      }
    });

    clearButton?.addEventListener('click', () => {
      const descriptionInput = query(addTaskContainer, '#task-desc');
      if (titleInput) titleInput.value = '';
      if (descriptionInput) descriptionInput.value = '';
      if (dueDateInput) dueDateInput.value = '';
      if (categorySelect) categorySelect.value = '';
      subtaskComposer.clear();
      assignedDropdown?.clearSelection();
      [titleInput, dueDateInput, categorySelect, assignedDropdown?.inputElement, descriptionInput]
        .forEach(clearFieldValidationError);
      prioritySelector.resetToMedium();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const addTaskContainer = document.getElementById('addtask-container');
    if (!addTaskContainer) return;

    ensureCategorySelectHasRealOptions(addTaskContainer);

    const prioritySelector = initializePrioritySelector(addTaskContainer);
    const subtaskComposer = initializeSubtaskComposer(addTaskContainer);
    const assignedDropdown = initializeAssignedToDropdown(addTaskContainer);

    attachFormLifecycle(addTaskContainer, prioritySelector, subtaskComposer, assignedDropdown);
  });
})();

