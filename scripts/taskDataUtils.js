/**
 * Attach click listener to task move dropdown icon.
 * @param {HTMLElement} taskEl
 */
function attachMoveDropdownListener(taskEl) {
  const ddIcon = taskEl.querySelector('.drag-drop-icon');
  if (!ddIcon) return;
  ddIcon.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMoveDropdown(taskEl, ddIcon);
  });
}

/**
 * Toggle move dropdown visibility or create if not exists.
 * @param {HTMLElement} taskEl
 * @param {HTMLElement} ddIcon
 */
function toggleMoveDropdown(taskEl, ddIcon) {
  let dd = taskEl.querySelector(".move-to-dropdown");
  if (dd) {
    dd.classList.toggle("visible");
    return;
  }
  dd = createMoveDropdownMenu(ddIcon);
  taskEl.appendChild(dd);
  dd.classList.add("visible");
  attachMoveDropdownOptions(taskEl, dd);
}

/**
 * Create move dropdown menu element.
 * @param {HTMLElement} ddIcon
 * @returns {HTMLElement}
 */
function createMoveDropdownMenu(ddIcon) {
  const dd = buildMoveDropdownElement();
  preventHeaderClickBubble(dd);
  positionDropdownNearIcon(dd, ddIcon);
  return dd;
}

/**
 * Build dropdown HTML structure.
 * @returns {HTMLElement}
 */
function buildMoveDropdownElement() {
  const dd = document.createElement("div");
  dd.classList.add("move-to-dropdown");
  dd.innerHTML = `
      <div class="dropdown-header">Move To</div>
      <div class="dropdown-option" data-status="toDoColumn">To do</div>
      <div class="dropdown-option" data-status="inProgress">In Progress</div>
      <div class="dropdown-option" data-status="awaitFeedback">Await Feedback</div>
      <div class="dropdown-option" data-status="done">Done</div>
    `;
  return dd;
}

/**
 * Prevent dropdown header click from bubbling.
 * @param {HTMLElement} dd
 */
function preventHeaderClickBubble(dd) {
  const header = dd.querySelector('.dropdown-header');
  header.addEventListener('click', (e) => e.stopPropagation());
}

/**
 * Position dropdown below icon.
 * @param {HTMLElement} dd
 * @param {HTMLElement} ddIcon
 */
function positionDropdownNearIcon(dd, ddIcon) {
  dd.style.position = "absolute";
  dd.style.top = `${ddIcon.offsetTop + ddIcon.offsetHeight}px`;
  dd.style.left = `${ddIcon.offsetLeft}px`;
  dd.style.zIndex = 10;
}

/**
 * Attach click handlers to move dropdown options.
 * @param {HTMLElement} taskEl
 * @param {HTMLElement} dd
 */
function attachMoveDropdownOptions(taskEl, dd) {
  dd.querySelectorAll(".dropdown-option").forEach(option => {
    option.addEventListener("click", async function (ev) {
      ev.stopPropagation();
      const ns = option.dataset.status;
      await updateTaskColumnInFirebase(taskEl.id, ns);
      const newCol = document.getElementById(ns);
      if (newCol) newCol.appendChild(taskEl);
      dd.classList.remove("visible");
      checkColumns();
    });
  });
}

/**
 * Generate and append task cards to columns.
 * @param {Array} tasksData
 */
function generateTasks(tasksData) {
  tasksData.forEach(task => {
    if (!task || !task.title || !task.column) return;
    const taskEl = createTaskElement(task);
    const col = document.getElementById(task.column);
    if (col) col.appendChild(taskEl);
    attachTaskListeners(task, taskEl);
    attachMoveDropdownListener(taskEl);
  });
  checkColumns();
}

/**
 * Read subtasks from edit modal list.
 * @returns {Array<{text:string,completed:boolean}>}
 */
function readSubtasksFromEditModal() {
  const subtaskItems = document.querySelectorAll('#editSubtasksList .subtask-item');
  const subtasks = [];
  subtaskItems.forEach((item, index) => {
    const span = item.querySelector('span');
    const checkbox = item.querySelector('.subtask-edit-checkbox');
    if (span) {
      const text = span.innerText.replace(/^(•|â€¢)\s*/, '').trim();
      const completed = checkbox ? checkbox.checked : false;
      subtasks.push({ text, completed });
    }
  });
  return subtasks;
}

/**
 * Normalize currentTask.subtasks to array.
 * @returns {Array|null}
 */
function normalizeCurrentSubtasks() {
  let subs = window.currentTask?.subtasks;
  if (subs && !Array.isArray(subs) && typeof subs === 'object') {
    return Object.values(subs);
  }
  return subs;
}

/**
 * Get selected priority from edit modal.
 * @returns {string}
 */
function getSelectedPriority() {
  if (document.querySelector('.edit-priority-urgent.active')) return 'urgent';
  if (document.querySelector('.edit-priority-medium.active')) return 'medium';
  if (document.querySelector('.edit-priority-low.active')) return 'low';
  return 'medium';
}

/**
 * Get priority image path.
 * @param {string} priority
 * @returns {string}
 */
function getPriorityPath(priority) {
  switch (priority) {
    case 'urgent': return '../img/priority-img/urgent.png';
    case 'medium': return '../img/priority-img/medium.png';
    case 'low': return '../img/priority-img/low.png';
    default: return '../img/priority-img/medium.png';
  }
}

/**
 * Remove duplicate users from array based on name.
 * @param {Array} users
 * @returns {Array}
 */
function removeDuplicateUsers(users) {
  if (!Array.isArray(users)) return [];
  const seen = new Set();
  return users.filter(user => {
    const identifier = user.name || JSON.stringify(user);
    if (seen.has(identifier)) return false;
    seen.add(identifier);
    return true;
  });
}

/**
 * Detect if current device supports touch.
 * @returns {boolean}
 */
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get priority label from icon path.
 * @param {string} iconPath
 * @returns {string}
 */
function getPriorityLabel(iconPath) {
  if (!iconPath) return "Unknown";
  if (iconPath.includes("urgent")) return "Urgent";
  if (iconPath.includes("medium")) return "Medium";
  if (iconPath.includes("low")) return "Low";
  return "Unknown";
}

/**
 * Extract priority from icon path.
 * @param {string} iconPath
 * @returns {string}
 */
function extractPriority(iconPath) {
  if (!iconPath) return 'medium';
  const lower = iconPath.toLowerCase();
  if (lower.includes('urgent')) return 'urgent';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('low')) return 'low';
  return 'medium';
}
