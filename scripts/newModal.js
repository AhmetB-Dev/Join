/**
 * Befüllt das Edit-Modal mit Task-Daten und bindet benötigte UIs.
 * @param {{title?:string,description?:string,dueDate?:string,priority?:string,category?:string,users?:Array,subtasks?:any}} task
 */
function fillEditModal(task) {
  if (task.subtasks && !Array.isArray(task.subtasks) && typeof task.subtasks === 'object') {
  }

/** Debug-only: logs any DOM mutations inside #editSubtasksList to find conflicting renderers */
function setupSubtasksListDebugObserver() {
  const list = document.getElementById('editSubtasksList');
  if (!list || list.__observerAttached) return;
  try {
    const obs = new MutationObserver(muts => {
      muts.forEach(m => {
        if (m.type === 'childList') {
          m.addedNodes.forEach(n => {
            if (n.nodeType === 1) {
              if (n.classList && n.classList.contains('added-subtasks')) {
                const hasCheckbox = n.querySelector('.subtask-edit-checkbox');
                if (!hasCheckbox) {
                  n.remove();
                } else {
                  n.classList.remove('added-subtasks');
                }
              }
            }
          });
        }
      });
    });
    obs.observe(list, { childList: true, subtree: true, characterData: true });
    list.__observerAttached = true;
  } catch (e) {
    console.error('[EditModal][Observer] attach error:', e);
  }
}
/**
 * Re-sanitize the subtasks list in the edit modal. If any span text is "[object Object]"
 * or legacy nodes like '.added-subtasks' are present, rebuild the list from currentTask.subtasks.
 */
function sanitizeSubtasksList() {
  try {
    const list = document.getElementById('editSubtasksList');
    if (!list) return;
    list.querySelectorAll('.added-subtasks').forEach(node => node.remove());
    const validItems = list.querySelectorAll('.subtask-item:not(.added-subtasks)');
    const hasBadSpan = Array.from(validItems).some(item => {
      const span = item.querySelector('span');
      return span && (span.textContent || '').includes('[object Object]');
    });
    if (validItems.length === 0 || hasBadSpan) {
      if (window.currentTask && window.currentTask.subtasks) {
        const task = { ...window.currentTask };
        if (!Array.isArray(task.subtasks) && typeof task.subtasks === 'object') {
          task.subtasks = Object.values(task.subtasks);
        }
        list.innerHTML = '';
        try { 
          setSubtasksList(task);
        } catch (e) { 
          console.error('[EditModal][Sanitize] setSubtasksList failed:', e); 
        }
      }
    }
  } catch (e) {
    console.error('[EditModal][Sanitize] error:', e);
  }
}
  
  setTaskFields(task);
  setAssigneeBadges(task);
  setupSubtasksListDebugObserver();
  
  try {
    setSubtasksList(task);
  } catch (e) {
    console.error('[EditModal] setSubtasksList error:', e);
  }
   setTimeout(sanitizeSubtasksList, 100);
  loadContacts(task.users || []);
  if (typeof ensureAssigneeDropdownBinding === 'function') {
    ensureAssigneeDropdownBinding(task.users || []);
  }
}


/**
 * Setzt Formularfelder des Edit-Modals aus Taskdaten.
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
 * Erzeugt HTML für einen Assignee-Badge.
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
 * Rendert Assignee-Badges in der Edit-Ansicht.
 * @param {{users?:Array<{name:string}>}} task
 */
function setAssigneeBadges(task) {
  const badges = document.getElementById('assigneeBadges');
  if (badges && task.users && task.users.length > 0) {
    const uniqueUsers = removeDuplicateUsers(task.users);
    badges.innerHTML = uniqueUsers.map(createBadgeHTML).join("");
  } else {
    badges.innerHTML = "";
  }
}

/**
 * Entfernt doppelte Nutzer anhand des Namens.
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

/** Subtask-Logik und -Helfer sind in newModal.subtasks.js ausgelagert */
/** Dropdown-Handler ist in newModal.dropdown.js ausgelagert */

/**
 * Extrahiert die Priorität (urgent|medium|low) aus einem Pfad/String.
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
 * Aktiviert visuell die ausgewählte Priorität im Edit-Modal.
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
 * Speichert den aktuell bearbeiteten Task in Firebase und schließt das Modal.
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
 * Übernimmt die Eingaben aus dem Edit-Formular in currentTask.
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
 * Aktualisiert einen Task in Firebase via PUT.
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
 * Schließt das Edit-Modal (optional Event-bubbling stoppen).
 */
function closeEditModal(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('editTaskModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Schließt das Task-Overlay und aktualisiert ggf. die Task-Karte.
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
 * Mappt beliebige Farbwerte auf Badge-Classes.
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
 * Öffnet das Edit-Modal aus dem Overlay heraus und lädt ggf. frische Daten.
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
}

/** Subtask-Initialisierung sowie New-Subtask-Helfer sind in newModal.subtasks.js ausgelagert */


function initEditModal() {
  document.getElementById('confirmEditBtn')?.addEventListener('click', saveEditedTaskToFirebase);
  initSubtaskCreation();
}
