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

/**
 * Render user badges with optional overflow indicator.
 * @param {Array} users
 * @param {number} maxToShow
 * @returns {string}
 */
function renderUserBadges(users, maxToShow = 3) {
  if (!users || !Array.isArray(users) || users.length === 0) {
    return '';
  }
  const { realUsers } = getRealUserArrayAndCount(users);
  const uniqueUsers = removeDuplicateUsers(realUsers);
  if (uniqueUsers.length === 0) return '';
  const badges = buildBadgesHTML(uniqueUsers, maxToShow);
  const overflow = calculateOverflow(uniqueUsers.length, maxToShow);
  return badges + overflow;
}

/**
 * Build HTML for visible badges.
 * @param {Array} uniqueUsers
 * @param {number} maxToShow
 * @returns {string}
 */
function buildBadgesHTML(uniqueUsers, maxToShow) {
  let html = '';
  uniqueUsers.slice(0, maxToShow).forEach(u => {
    const initials = u.initials || '?';
    const colorClass = u.color || 'default';
    html += `<div class="profile-badge-floating-${colorClass}">${initials}</div>`;
  });
  return html;
}

/**
 * Calculate and render overflow badge if needed.
 * @param {number} totalCount
 * @param {number} maxToShow
 * @returns {string}
 */
function calculateOverflow(totalCount, maxToShow) {
  if (totalCount > maxToShow) {
    return `<div class="profile-badge-floating-gray">+${totalCount - maxToShow}</div>`;
  }
  return '';
}

/**
 * Create task card header HTML.
 * @param {{category:string}} task
 * @returns {string}
 */
function createHeader(task) {
  const labelType = task.category === "Technical task" ? "technical-task" : "user-story";
  const headerTitle = task.category === "Technical task" ? "Technical Task" : "User Story";
  return `
    <div class="card-label-${labelType} padding-left">
      <h4>${headerTitle}</h4>
      <img src="../img/drag-drop-icon.png" alt="drag-and-drop-icon" class="drag-drop-icon">
    </div>`;
}

/**
 * Create task card body HTML.
 * @param {{title:string,description:string}} task
 * @returns {string}
 */
function createBody(task) {
  return `
    <div><h5 class="card-label-user-story-h5 padding-left">${task.title}</h5></div>
    <div><h6 class="card-label-user-story-h6 padding-left">${task.description}</h6></div>`;
}

/**
 * Create progress section HTML if subtasks exist.
 * @param {number} total
 * @param {number} completed
 * @param {number} progress
 * @returns {string}
 */
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

/**
 * Create task card footer HTML with badges and priority.
 * @param {{users:Array,priority:string}} task
 * @returns {string}
 */
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
