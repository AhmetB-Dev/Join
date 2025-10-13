window.currentTask = null;
window.currentTaskId = null;

/**
 * Detect if current device supports touch.
 * @returns {boolean}
 */
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Normalize users array and compute total count including placeholder.
 * @param {Array<{name:string,initials?:string,color?:string}>} users
 * @returns {{realUsers:Array<object>, totalCount:number}}
 */
function getRealUserArrayAndCount(users) {
  if (!isValidUserArray(users)) {
    return { realUsers: [], totalCount: 0 };
  }
  const { updatedUsers, placeholderCount } = extractPlaceholder(users);
  return {
    realUsers: updatedUsers,
    totalCount: updatedUsers.length + placeholderCount
  };
}

/**
 * Validate if the input is an array for users list.
 * @param {any} users
 * @returns {boolean}
 */
function isValidUserArray(users) {
  return Array.isArray(users);
}

/**
 * Extract trailing "+N" placeholder from users and return count and trimmed list.
 * @param {Array<any>} users
 * @returns {{updatedUsers:Array<any>, placeholderCount:number}}
 */
function extractPlaceholder(users) {
  let placeholderCount = 0;
  let updatedUsers = users;
  const lastUser = users[users.length - 1];
  if (lastUser && typeof lastUser.name === 'string' && lastUser.name.trim().startsWith('+')) {
    const parsedCount = parseInt(lastUser.name.trim().replace('+', ''));
    if (!isNaN(parsedCount)) {
      placeholderCount = parsedCount;
      updatedUsers = users.slice(0, users.length - 1);
    }
  }
  return { updatedUsers, placeholderCount };
}


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

function renderUserBadges(users, maxToShow = 3) {
  if (!users || !Array.isArray(users) || users.length === 0) {
    return '';
  }
  const { realUsers, totalCount } = getRealUserArrayAndCount(users);
  const uniqueUsers = removeDuplicateUsers(realUsers); 
  if (uniqueUsers.length === 0) {
    return '';
  }
  let badges = '';
  uniqueUsers.slice(0, maxToShow).forEach(u => {
    const initials = u.initials || '?';
    const colorClass = u.color || 'default';
    badges += `<div class="profile-badge-floating-${colorClass}">${initials}</div>`;
  });
  const uniqueCount = uniqueUsers.length;
  if (uniqueCount > maxToShow) {
    badges += `<div class="profile-badge-floating-gray">+${uniqueCount - maxToShow}</div>`;
  }
  return badges;
}

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
 * Patch subtask status for currentTask and update progress in Firebase.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 */
function updateSubtaskStatus(taskId, subtaskIndex, newStatus) {
  if (!window.currentTask || window.currentTaskId !== taskId) return;
  window.currentTask.subtasks[subtaskIndex].completed = newStatus;
  const total = window.currentTask.subtasks.length;
  const completed = window.currentTask.subtasks.filter(st => st.completed).length;
  const newProgress = total ? (completed / total) * 100 : 0;
  const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
  fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks: window.currentTask.subtasks, progress: newProgress })
  }).then(r => {
    if (!r.ok) throw new Error("Error updating subtask status.");
    updateTaskCardInBackground(taskId);
  }).catch(() => {});
}

/**
 * Fetch latest task data and re-render its card in place.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
async function updateTaskCardInBackground(taskId) {
  try {
    const response = await fetch(`https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`);
    const updatedTask = await response.json();
    if (updatedTask) {
      enrichTasksWithUserData([updatedTask]);
      const existingCard = document.getElementById(taskId);
      if (existingCard) {
        const newCard = createTaskElement({ ...updatedTask, firebaseKey: taskId });
        attachTaskListeners(updatedTask, newCard);
        existingCard.parentNode.replaceChild(newCard, existingCard);
        if (typeof window.reinitializeDragAndDrop === 'function') {
          window.reinitializeDragAndDrop();
        }
        checkColumns();
      }
    }
  } catch (error) {
    console.error('Error updating task card:', error);
  }
}

function getPriorityLabel(iconPath) {
  if (!iconPath) return "Unknown";
  if (iconPath.includes("urgent")) return "Urgent";
  if (iconPath.includes("medium")) return "Medium";
  if (iconPath.includes("low")) return "Low";
  return "Unknown";
}

function extractPriority(iconPath) {
  if (!iconPath) return 'medium';
  const lower = iconPath.toLowerCase();
  if (lower.includes('urgent')) return 'urgent';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('low')) return 'low';
  return 'medium';
}
window.extractPriority = extractPriority;

/**
 * Update modal header category styling and text.
 * @param {{category:string}} task
 * @param {HTMLElement} modal
 */
function setCategoryHeader(task, modal) {
  const cat = modal.querySelector('.main-section-task-overlay > div:first-child');
  const isTechnical = task.category.toLowerCase().includes('technical');
  cat.className = `card-label-${isTechnical ? 'technical-task' : 'user-story'}-modal w445`;
  cat.querySelector('h4').textContent = task.category;
}

function setModalFields(task) {
  document.getElementById('modalTitle').innerText = task.title || "No Title";
  document.getElementById('modalDescription').innerText = task.description || "No Description";
  document.getElementById('modalDueDate').innerText = task.dueDate || "No Date";
  document.getElementById('modalPriorityText').innerText = getPriorityLabel(task.priority);
  document.getElementById('modalPriorityIcon').src = task.priority || "";
}

function setAssignedUsers(task) {
  const assign = document.getElementById('modalAssignedTo');
  if (task.users && Array.isArray(task.users)) {
    const uniqueUsers = removeDuplicateUsers(task.users);
    assign.innerHTML = uniqueUsers.map(u =>
      `<div class="flexrow profile-names">
          <div class="profile-badge-floating-${u.color || 'default'}">${u.initials || '?'}</div>
         <span class="account-name">${u.name || 'Unknown'}</span>
       </div>`
    ).join("");
  } else {
    assign.innerHTML = "";
  }
}

/**
 * Fill modal header and main fields for a task.
 * @param {any} task
 * @param {HTMLElement} modal
 */
function renderModalHeader(task, modal) {
  setCategoryHeader(task, modal);
  setModalFields(task);
  setAssignedUsers(task);
}

function clearSubtasksContainer() {
  const ms = document.getElementById("modalSubtasks");
  ms.innerHTML = "";
  return ms;
}

function normalizeSubtaskText(st) {
  if (typeof st === 'string') return st;
  const raw = (st && typeof st.text !== 'undefined') ? st.text : st;
  return typeof raw === 'string' ? raw : String(raw ?? '');
}

function createSubtaskElement(st, index) {
  const text = normalizeSubtaskText(st);
  const completed = !!(st && st.completed);
  const div = document.createElement("div");
  div.classList.add("subtask-container-div-item");
  div.innerHTML = `<div class="flexrow">
                     <input type="checkbox" class="subtask-checkbox" data-index="${index}" ${completed ? "checked" : ""}>
                     <span>${text}</span>
                   </div>`;
  return div;
}

function addSubtaskListeners(container) {
  container.querySelectorAll(".subtask-checkbox").forEach(cb => {
    cb.addEventListener("change", function () {
      updateSubtaskStatus(window.currentTaskId, parseInt(this.getAttribute("data-index"), 10), this.checked);
    });
  });
}

/**
 * Render subtasks list inside the task modal.
 * @param {{subtasks?:Array<{text:string,completed:boolean}>}} task
 */
function renderSubtasks(task) {
  const ms = clearSubtasksContainer();
  if (task.subtasks && Array.isArray(task.subtasks)) {
    task.subtasks.forEach((st, i) => {
      ms.appendChild(createSubtaskElement(st, i));
    });
    addSubtaskListeners(ms);
  }
}

/**
 * Open the floating task overlay for the given task object.
 * @param {{firebaseKey?:string,id?:string}} task
 */
function openTaskModal(task) {
  window.currentTask = task;
  window.currentTaskId = task.firebaseKey || task.id;
  const modal = document.getElementById('toggleModalFloating');
  modal.dataset.taskId = window.currentTaskId;
  renderModalHeader(task, modal);
  renderSubtasks(task);
  modal.style.display = 'flex';
}

/**
 * Persist a column change for a task and move its DOM card.
 * @param {string} taskId
 * @param {string} newColumn
 * @returns {Promise<void>}
 */
async function updateTaskColumnInFirebase(taskId, newColumn) {
  try {
    const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
    const r = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: newColumn })
    });
    if (!r.ok) throw new Error(`Error updating task column: ${r.statusText}`);   
    updateTaskDOMPosition(taskId, newColumn);
  } catch (e) {
    console.error('Error updating task column:', e);
  }
}

/**
 * Move a task card element to a new column in the DOM.
 * @param {string} taskId
 * @param {string} newColumn
 */
function updateTaskDOMPosition(taskId, newColumn) {
  const taskElement = document.getElementById(taskId);
  const targetColumn = document.getElementById(newColumn); 
  if (taskElement && targetColumn) {
    if (taskElement.parentNode && taskElement.parentNode !== targetColumn) {
      taskElement.parentNode.removeChild(taskElement);
    }
    if (!targetColumn.contains(taskElement)) {
      targetColumn.appendChild(taskElement);
    }
    checkColumns();
  }
}

function checkColumns() {
  document.querySelectorAll('.task-board-container').forEach(col => {
    const img = col.querySelector('img');
    if (!img) return;
    const hasTasks = col.querySelectorAll('.draggable-cards').length > 0;
    img.style.display = hasTasks ? 'none' : 'block';
  });
}

function enableDragAndDrop() {
  if (!isTouchDevice()) {
    document.querySelectorAll('.draggable-cards').forEach(card => {
      card.addEventListener('dragstart', () => card.classList.add('dragging'));
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });
    document.querySelectorAll('.task-board-container').forEach(col => {
      col.addEventListener('dragover', e => {
        e.preventDefault();
        const dragCard = document.querySelector('.dragging');
        if (dragCard) col.appendChild(dragCard);
      });
    });
  }
}

/**
 * Calculate progress metrics for a task's subtasks.
 * @param {{subtasks?:Array<{completed:boolean}>}} task
 * @returns {{total:number,completed:number,progress:number}}
 */
function calculateProgress(task) {
  const total = task.subtasks ? task.subtasks.length : 0;
  const completed = task.subtasks ? task.subtasks.filter(st => st.completed).length : 0;
  const progress = total ? (completed / total) * 100 : 0;
  return { total, completed, progress };
}

/**
 * Map a task priority to an icon path with fallback.
 * @param {any} task
 * @returns {string}
 */
function getPriorityImage(task) {
  const mapping = {
    urgent: "../img/icon-urgent.png",
    medium: "../img/priority-img/medium.png",
    low: "../img/icon-low.png"
  };
  let prio = extractPriority(task.priority);
  if (!mapping[prio]) prio = "medium";
  return mapping[prio];
}

function createHeader(task) {
  const labelType = task.category === "Technical task" ? "technical-task" : "user-story";
  const headerTitle = task.category === "Technical task" ? "Technical Task" : "User Story";
  return `
    <div class="card-label-${labelType} padding-left">
      <h4>${headerTitle}</h4>
      <img src="../img/drag-drop-icon.png" alt="drag-and-drop-icon" class="drag-drop-icon">
    </div>`;
}

function createBody(task) {
  return `
    <div><h5 class="card-label-user-story-h5 padding-left">${task.title}</h5></div>
    <div><h6 class="card-label-user-story-h6 padding-left">${task.description}</h6></div>`;
}

function createProgressSection(total, completed, progress) {
  if (total === 0 || completed === 0) {
    return "";
  }
  return `
    <div class="task-progress">
      <div class="progress-main-container">
        <div class="progress-container">
          <div class="progress-bar" style="width: ${progress}%;"></div>
        </div>
      </div>
      <span class="progress-text">${completed} / ${total} tasks</span>
    </div>`;
}

function createFooter(task) {
  const userBadges = renderUserBadges(task.users, 3);
  const taskPriority = getPriorityImage(task);
  return `
    <div class="card-footer">
      <div class="padding-left profile-badge-container">
        ${userBadges}
      </div>
      <div class="priority-container-img">
        <img src="${taskPriority}" alt="Priority" 
             onerror="this.src='../img/priority-img/medium.png'" 
             class="priority-container-img">
      </div>
    </div>`;
}

/**
 * Create a draggable card element for a task.
 * @param {{firebaseKey?:string,id?:string,title:string,description:string,priority?:string,users?:Array}} task
 * @returns {HTMLElement}
 */
function createTaskElement(task) {
  const { total, completed, progress } = calculateProgress(task);
  const el = document.createElement("div");
  el.classList.add("draggable-cards");
  el.id = task.firebaseKey || task.id;
  el.setAttribute("draggable", isTouchDevice() ? "false" : "true");
  el.dataset.title = task.title.toLowerCase();
  el.dataset.description = task.description.toLowerCase();
  el.innerHTML = `
    ${createHeader(task)}
    ${createBody(task)}
    ${createProgressSection(total, completed, progress)}
    ${createFooter(task)}
  `;
  return el;
}

/**
 * Bind click and drag-end events to a task element.
 * @param {any} task
 * @param {HTMLElement} taskEl
 */
function attachTaskListeners(task, taskEl) {
  taskEl.addEventListener("click", () => openTaskModal(task));
  if (!isTouchDevice()) {
    taskEl.addEventListener("dragend", async function () {
      const newCol = taskEl.closest(".task-board-container")?.id;
      if (newCol) await updateTaskColumnInFirebase(taskEl.id, newCol);
    });
  }
}









