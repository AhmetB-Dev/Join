window.currentTask = null;
window.currentTaskId = null;

/**
 * Patch subtask status for currentTask and update progress in Firebase.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 * @returns {void}
 */
function updateSubtaskStatus(taskId, subtaskIndex, newStatus) {
  if (!validateSubtaskUpdate(taskId)) return;
  applySubtaskStatusChange(subtaskIndex, newStatus);
  const newProgress = calculateSubtaskProgress();
  persistSubtaskChanges(taskId, newProgress);
}

/**
 * Validate if subtask update is allowed.
 * @param {string} taskId
 * @returns {boolean}
 */
function validateSubtaskUpdate(taskId) {
  return window.currentTask && window.currentTaskId === taskId;
}

/**
 * Apply status change to subtask in memory.
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 * @returns {void}
 */
function applySubtaskStatusChange(subtaskIndex, newStatus) {
  window.currentTask.subtasks[subtaskIndex].completed = newStatus;
}

/**
 * Calculate progress percentage from subtasks.
 * @returns {number}
 */
function calculateSubtaskProgress() {
  const total = window.currentTask.subtasks.length;
  const completed = window.currentTask.subtasks.filter(st => st.completed).length;
  return total ? (completed / total) * 100 : 0;
}

/**
 * Persist subtask changes to Firebase.
 * @param {string} taskId
 * @param {number} newProgress
 * @returns {void}
 */
function persistSubtaskChanges(taskId, newProgress) {
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
    const updatedTask = await fetchTaskFromFirebase(taskId);
    if (updatedTask) {
      refreshTaskCard(taskId, updatedTask);
    }
  } catch (error) {
    console.error('Error updating task card:', error);
  }
}

/**
 * Fetch task data from Firebase.
 * @param {string} taskId
 * @returns {Promise<object|null>}
 */
async function fetchTaskFromFirebase(taskId) {
  const response = await fetch(`https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`);
  return await response.json();
}

/**
 * Refresh task card in DOM.
 * @param {string} taskId
 * @param {object} updatedTask
 * @returns {void}
 */
function refreshTaskCard(taskId, updatedTask) {
  enrichTasksWithUserData([updatedTask]);
  const existingCard = document.getElementById(taskId);
  if (!existingCard) return;
  replaceTaskCard(existingCard, updatedTask, taskId);
  reinitializeDragIfNeeded();
  checkColumns();
}

/**
 * Replace existing card with updated one.
 * @param {HTMLElement} existingCard
 * @param {object} updatedTask
 * @param {string} taskId
 * @returns {void}
 */
function replaceTaskCard(existingCard, updatedTask, taskId) {
  const newCard = createTaskElement({ ...updatedTask, firebaseKey: taskId });
  attachTaskListeners(updatedTask, newCard);
  existingCard.parentNode.replaceChild(newCard, existingCard);
}

/**
 * Reinitialize drag and drop if function exists.
 * @returns {void}
 */
function reinitializeDragIfNeeded() {
  if (typeof window.reinitializeDragAndDrop === 'function') {
    window.reinitializeDragAndDrop();
  }
}

/**
 * Update modal header category styling and text.
 * @param {{category:string}} task
 * @param {HTMLElement} modal
 * @returns {void}
 */
function setCategoryHeader(task, modal) {
  const cat = modal.querySelector('.main-section-task-overlay > div:first-child');
  const isTechnical = task.category.toLowerCase().includes('technical');
  cat.className = `card-label-${isTechnical ? 'technical-task' : 'user-story'}-modal w445`;
  cat.querySelector('h4').textContent = task.category;
}

/**
 * Set modal text fields.
 * @param {{title:string,description:string,dueDate:string,priority:string}} task
 * @returns {void}
 */
function setModalFields(task) {
  document.getElementById('modalTitle').innerText = task.title || "No Title";
  document.getElementById('modalDescription').innerText = task.description || "No Description";
  document.getElementById('modalDueDate').innerText = task.dueDate || "No Date";
  document.getElementById('modalPriorityText').innerText = getPriorityLabel(task.priority);
  document.getElementById('modalPriorityIcon').src = task.priority || "";
}

/**
 * Set assigned users in modal.
 * @param {{users:Array}} task
 * @returns {void}
 */
function setAssignedUsers(task) {
  const assign = document.getElementById('modalAssignedTo');
  if (task.users && Array.isArray(task.users)) {
    const uniqueUsers = removeDuplicateUsers(task.users);
    assign.innerHTML = buildUserListHTML(uniqueUsers);
  } else {
    assign.innerHTML = "";
  }
}

/**
 * Build HTML for user list.
 * @param {Array} uniqueUsers
 * @returns {string}
 */
function buildUserListHTML(uniqueUsers) {
  return uniqueUsers.map(u =>
    `<div class="flexrow profile-names">
        <div class="profile-badge-floating-${u.color || 'default'}">${u.initials || '?'}</div>
       <span class="account-name">${u.name || 'Unknown'}</span>
     </div>`
  ).join("");
}

/**
 * Fill modal header and main fields for a task.
 * @param {any} task
 * @param {HTMLElement} modal
 * @returns {void}
 */
function renderModalHeader(task, modal) {
  setCategoryHeader(task, modal);
  setModalFields(task);
  setAssignedUsers(task);
}

/**
 * Clear subtasks container.
 * @returns {HTMLElement}
 */
function clearSubtasksContainer() {
  const ms = document.getElementById("modalSubtasks");
  ms.innerHTML = "";
  return ms;
}

/**
 * Normalize subtask text from various formats.
 * @param {any} st
 * @returns {string}
 */
function normalizeSubtaskText(st) {
  if (typeof st === 'string') return st;
  const raw = (st && typeof st.text !== 'undefined') ? st.text : st;
  return typeof raw === 'string' ? raw : String(raw ?? '');
}

/**
 * Create subtask DOM element.
 * @param {any} st
 * @param {number} index
 * @returns {HTMLElement}
 */
function createSubtaskElement(st, index) {
  const text = normalizeSubtaskText(st);
  const completed = !!(st && st.completed);
  const div = document.createElement("div");
  div.classList.add("subtask-container-div-item");
  div.innerHTML = buildSubtaskHTML(text, index, completed);
  return div;
}

/**
 * Build subtask HTML string.
 * @param {string} text
 * @param {number} index
 * @param {boolean} completed
 * @returns {string}
 */
function buildSubtaskHTML(text, index, completed) {
  return `<div class="flexrow">
            <input type="checkbox" class="subtask-checkbox" data-index="${index}" ${completed ? "checked" : ""}>
            <span>${text}</span>
          </div>`;
}

/**
 * Add change listeners to subtask checkboxes.
 * @param {HTMLElement} container
 * @returns {void}
 */
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
 * @returns {void}
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
 * @returns {void}
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
  el.innerHTML = assembleTaskHTML(task, total, completed, progress);
  return el;
}

/**
 * Assemble full task card HTML.
 * @param {object} task
 * @param {number} total
 * @param {number} completed
 * @param {number} progress
 * @returns {string}
 */
function assembleTaskHTML(task, total, completed, progress) {
  return `
    ${createHeader(task)}
    ${createBody(task)}
    ${createProgressSection(total, completed, progress)}
    ${createFooter(task)}
  `;
}

/**
 * Bind click and drag-end events to a task element.
 * @param {any} task
 * @param {HTMLElement} taskEl
 * @returns {void}
 */
function attachTaskListeners(task, taskEl) {
  taskEl.addEventListener("click", () => openTaskModal(task));
  if (!isTouchDevice()) {
    attachDragEndListener(taskEl);
  }
}

/**
 * Attach drag end listener to task element.
 * @param {HTMLElement} taskEl
 * @returns {void}
 */
function attachDragEndListener(taskEl) {
  taskEl.addEventListener("dragend", async function () {
    const newCol = taskEl.closest(".task-board-container")?.id;
    if (newCol) await updateTaskColumnInFirebase(taskEl.id, newCol);
  });
}

window.extractPriority = extractPriority;
