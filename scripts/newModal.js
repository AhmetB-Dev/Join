/**
 * Fills the Edit-Modal with task data and binds required UIs.
 * @param {{title?:string,description?:string,dueDate?:string,priority?:string,category?:string,users?:Array,subtasks?:any}} task
 */
function fillEditModal(task) {
  setTaskFields(task);
  setAssigneeBadges(task);
  setupSubtasksListDebugObserver();
  try {
    setSubtasksList(task);
  } catch (e) {
    console.error('[EditModal] setSubtasksList error:', e);
  }
  setTimeout(sanitizeSubtasksList, 100);
  if (typeof initTaskDataModal === 'function') {
    initTaskDataModal();
  }
  loadContacts(task.users || []);
  if (typeof ensureAssigneeDropdownBinding === 'function') {
    ensureAssigneeDropdownBinding(task.users || []);
  }
}

/**
 * Debug-only: logs any DOM mutations inside #editSubtasksList to find conflicting renderers.
 * @returns {void}
 */
function setupSubtasksListDebugObserver() {
  const list = document.getElementById('editSubtasksList');
  if (!list || list.__observerAttached) return;
  try {
    const obs = createSubtasksListObserver();
    obs.observe(list, { childList: true, subtree: true, characterData: true });
    list.__observerAttached = true;
  } catch (e) {
    console.error('[EditModal][Observer] attach error:', e);
  }
}

/**
 * Create MutationObserver for subtasks list.
 * @returns {MutationObserver}
 */
function createSubtasksListObserver() {
  return new MutationObserver(muts => {
    muts.forEach(m => {
      if (m.type === 'childList') {
        processAddedNodes(m.addedNodes);
      }
    });
  });
}

/**
 * Process added nodes in mutation.
 * @param {NodeList} addedNodes
 * @returns {void}
 */
function processAddedNodes(addedNodes) {
  addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.classList && n.classList.contains('added-subtasks')) {
      handleAddedSubtaskNode(n);
    }
  });
}

/**
 * Handle added subtask node validation.
 * @param {HTMLElement} node
 * @returns {void}
 */
function handleAddedSubtaskNode(node) {
  const hasCheckbox = node.querySelector('.subtask-edit-checkbox');
  if (!hasCheckbox) {
    node.remove();
  } else {
    node.classList.remove('added-subtasks');
  }
}
/**
 * Re-sanitize the subtasks list in the edit modal.
 * @returns {void}
 */
function sanitizeSubtasksList() {
  try {
    const list = document.getElementById('editSubtasksList');
    if (!list) return;
    removeLegacySubtaskNodes(list);
    const validItems = list.querySelectorAll('.subtask-item:not(.added-subtasks)');
    if (shouldRebuildSubtasksList(validItems)) {
      rebuildSubtasksList(list);
    }
  } catch (e) {
    console.error('[EditModal][Sanitize] error:', e);
  }
}

/**
 * Remove legacy subtask nodes.
 * @param {HTMLElement} list
 * @returns {void}
 */
function removeLegacySubtaskNodes(list) {
  list.querySelectorAll('.added-subtasks').forEach(node => node.remove());
}

/**
 * Check if subtasks list should be rebuilt.
 * @param {NodeList} validItems
 * @returns {boolean}
 */
function shouldRebuildSubtasksList(validItems) {
  if (validItems.length === 0) return true;
  return Array.from(validItems).some(item => {
    const span = item.querySelector('span');
    return span && (span.textContent || '').includes('[object Object]');
  });
}

/**
 * Rebuild subtasks list from currentTask.
 * @param {HTMLElement} list
 * @returns {void}
 */
function rebuildSubtasksList(list) {
  if (!window.currentTask || !window.currentTask.subtasks) return;
  const task = normalizeTaskSubtasks();
  list.innerHTML = '';
  try {
    setSubtasksList(task);
  } catch (e) {
    console.error('[EditModal][Sanitize] setSubtasksList failed:', e);
  }
}

/**
 * Normalize task subtasks to array.
 * @returns {Object}
 */
function normalizeTaskSubtasks() {
  const task = { ...window.currentTask };
  if (!Array.isArray(task.subtasks) && typeof task.subtasks === 'object') {
    task.subtasks = Object.values(task.subtasks);
  }
  return task;
}

/**
 * Sets form fields of the Edit-Modal from task data.
 * @param {any} task
 */
function setTaskFields(task) {
  document.getElementById('editTaskTitle').value = task.title || "";
  document.getElementById('editTaskDescription').value = task.description || "";
  document.getElementById('editDueDate').value = task.dueDate || "";
  const prio = extractPriority(task.priority);
  setEditPriority(prio);
  if (task.category === 'Technical task') {
    document.getElementById('editTaskCategory').value = 'technical';
  } else if (task.category === 'User Story') {
    document.getElementById('editTaskCategory').value = 'userstory';
  } else {
    document.getElementById('editTaskCategory').value = '';
  }
}

/**
 * Creates HTML for an Assignee-Badge.
 * @param {{name:string,initials?:string}} user
 * @returns {string}
 */
function createBadgeHTML(user) {
  const avatarClass = getAvatarClass(user.name);
  const initials = user.initials || getInitials(user.name);
  
  return `
    <div class="assignee-badge avatar-contact-circle ${avatarClass}" data-contact-name="${user.name}">
      ${initials}
    </div>`;
}

/**
 * Renders Assignee-Badges in the Edit view.
 * @param {{users?:Array<{name:string}>}} task
 */
function setAssigneeBadges(task) {
  const badges = document.getElementById('assigneeBadges');
  if (badges && task.users && task.users.length > 0) {
    const uniqueUsers = removeDuplicateUsers(task.users);
    const maxVisible = 5;
    if (uniqueUsers.length <= maxVisible) {
      badges.innerHTML = uniqueUsers.map(createBadgeHTML).join("");
    } else {
      const shown = uniqueUsers.slice(0, maxVisible);
      const hiddenCount = uniqueUsers.length - maxVisible;
      let html = shown.map(createBadgeHTML).join("");
      html += `<div class="assignee-badge avatar-contact-circle profile-badge-floating-default assigned-more-badge">+${hiddenCount}</div>`;
      badges.innerHTML = html;
    }
  } else {
    badges.innerHTML = "";
  }
}

/**
 * Removes duplicate users by name.
 * @param {Array<any>} users
 * @returns {Array<any>}
 */
function removeDuplicateUsers(users) {
  if (!Array.isArray(users)) return [];
  
  const seen = new Set();
  return users.filter(user => {
    const identifier = user.name || JSON.stringify(user);
    
    if (seen.has(identifier)) {
      return false;
    }
    
    seen.add(identifier);
    return true;
  });
}

/**
 * Extracts the priority (urgent|medium|low) from a path/string.
 * @param {string} priorityPath
 * @returns {('urgent'|'medium'|'low')}
 */
function extractPriority(priorityPath) {
  if (!priorityPath) return 'medium';
  const lowerPath = priorityPath.toLowerCase();
  if (lowerPath.includes('urgent')) return 'urgent';
  if (lowerPath.includes('low')) return 'low';
  return 'medium';
}

/**
 * Visually activates the selected priority in the Edit-Modal.
 * @param {('urgent'|'medium'|'low')} priority
 */
function setEditPriority(priority) {
  const urgentBtn = document.querySelector('.edit-priority-urgent');
  const mediumBtn = document.querySelector('.edit-priority-medium');
  const lowBtn = document.querySelector('.edit-priority-low');
  urgentBtn.classList.remove('active');
  mediumBtn.classList.remove('active');
  lowBtn.classList.remove('active');
  switch (priority) {
    case 'urgent':
      urgentBtn.classList.add('active');
      break;
    case 'low':
      lowBtn.classList.add('active');
      break;
    default:
      mediumBtn.classList.add('active');
      break;
  }
}

/**
 * Saves the currently edited task to Firebase and closes the modal.
 */
async function saveEditedTaskToFirebase() {
  if (!currentTask) return;
  updateTaskFromInputs();
  await updateTaskInFirebase(currentTask);
  closeEditModal();
  
  if (typeof closeModalAndReload === 'function') {
    await closeModalAndReload();
  }
}

/**
 * Takes the inputs from the Edit form into currentTask.
 */
function updateTaskFromInputs() {
  currentTask.title = document.getElementById('editTaskTitle').value.trim() || currentTask.title;
  currentTask.description = document.getElementById('editTaskDescription').value.trim() || currentTask.description;
  currentTask.dueDate = document.getElementById('editDueDate').value.trim() || currentTask.dueDate;
  const prio = getSelectedPriority();
  currentTask.priority = getPriorityPath(prio);
  const cat = document.getElementById('editTaskCategory').value;
  currentTask.category = (cat === 'technical') ? 'Technical task' : 'User Story';
  const newSubs = readSubtasksFromEditModal();
  currentTask.subtasks = newSubs;
  const newAssignees = readAssigneesFromBadges();
  currentTask.users = newAssignees;
}

/**
 * Updates a task in Firebase via PUT.
 * @param {{firebaseKey?:string}} task
 */
async function updateTaskInFirebase(task) {
  if (!task || !task.firebaseKey) return;
  const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${task.firebaseKey}.json`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!response.ok) throw new Error(`Update failed: ${response.statusText}`);
  } catch (error) {
  }
}

/**
 * Closes the Edit-Modal (optionally stop event bubbling).
 */
function closeEditModal(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('editTaskModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Closes the Task-Overlay and updates the task card if necessary.
 */
function closeTaskOverlay(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('toggleModalFloating');
  if (modal) {
    modal.style.display = 'none';
    if (window.currentTaskId && typeof updateTaskCardInBackground === 'function') {
      updateTaskCardInBackground(window.currentTaskId);
    }
  }
}

/**
 * Maps arbitrary color values to Badge-Classes.
 * @param {string} colorValue
 * @returns {string}
 */
function getBadgeClassFromAnyColor(colorValue) {
  if (!colorValue) {
    colorValue = "default";
  }
  if (colorValue.startsWith('profile-badge-')) {
    return colorValue;
  }
  const lowerValue = colorValue.trim().toLowerCase();
  switch (lowerValue) {
    case 'red':    return 'profile-badge-floating-red';
    case 'orange': return 'profile-badge-floating-orange';
    case 'blue':   return 'profile-badge-floating-blue';
    case 'purple': return 'profile-badge-floating-purple';
    case 'green':  return 'profile-badge-floating-green';
    case 'pink':   return 'profile-badge-floating-pink';
    default:       return 'profile-badge-floating-default';
  }
}

/**
 * Opens the Edit-Modal from the overlay and loads fresh data if necessary.
 */
async function editTaskFromOverlay(event) {
  event.stopPropagation();
  if (!currentTask) return;
  
  if (currentTask.firebaseKey) {
    try {
      const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${currentTask.firebaseKey}.json`;
      const response = await fetch(url);
      if (response.ok) {
        const freshTask = await response.json();
        window.currentTask = { ...freshTask, firebaseKey: currentTask.firebaseKey };
        fillEditModal(window.currentTask);
      } else {
        fillEditModal(currentTask);
      }
    } catch (error) {
      fillEditModal(currentTask);
    }
  } else {
    fillEditModal(currentTask);
  }
  
  document.getElementById('toggleModalFloating').style.display = 'none';
  const modal = document.getElementById('editTaskModal');
  if (modal) modal.style.display = 'flex';
  if (typeof initTaskDataModal === 'function') {
    initTaskDataModal();
  }
}

/** Subtask initialization and New-Subtask helpers are outsourced to newModal.subtasks.js */
function initEditModal() {
  document.getElementById('confirmEditBtn')?.addEventListener('click', saveEditedTaskToFirebase);
  initSubtaskCreation();
}
