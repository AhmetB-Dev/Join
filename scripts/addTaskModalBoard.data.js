/**
 * Collect current task form values into a data object.
 * @returns {{column:string,description:string,dueDate:string,id:string|null,priority:string,progress:number,title:string,users:Array<{name:string}>,subtasks:Array<{completed:boolean,text:string}>,category:string}}
 */
function getTaskData() {
  return {
    column: "toDoColumn",
    description: getInputValue(".description", "No description provided"),
    dueDate: getInputValue(".date-input"),
    id: null,
    priority: `../img/priority-img/${getAddModalSelectedPriority()}.png`,
    progress: 0,
    title: getInputValue(".input"),
    users: getSelectedUsers(),
    subtasks: getSubtasks(),
    category: getSelectedCategory()
  };
}

/**
 * Get the value of an input by selector, with optional fallback.
 * @param {string} selector
 * @param {string} [fallback]
 * @returns {string}
 */
function getInputValue(selector, fallback = "") {
  return document.querySelector(selector)?.value.trim() || fallback;
}

/**
 * Get the currently selected priority in Add Task modal or fallback to "low".
 * @returns {string}
 */
function getAddModalSelectedPriority() {
  const active = document.querySelector("#taskModal .priority-container .active");
  if (!active) return "low";
  return getPriorityValueFromOption(active);
}

/**
 * Determine priority value from element dataset or class names.
 * @param {Element} el
 * @returns {"urgent"|"medium"|"low"}
 */
function getPriorityValueFromOption(el) {
  const val = el.dataset?.priority;
  if (val === 'urgent' || val === 'medium' || val === 'low') return val;
  if (el.classList.contains('priority-button-urgent')) return 'urgent';
  if (el.classList.contains('priority-button-medium')) return 'medium';
  if (el.classList.contains('priority-button-low')) return 'low';
  return 'low';
}

/**
 * Collect unique selected users from assigned profile badges.
 * @returns {Array<{name:string}>}
 */
function getSelectedUsers() {
  const profiles = document.querySelectorAll('.assigned-to-profiles-container [data-contact-name]');
  const users = Array.from(profiles)
    .map(el => {
      const name = el.getAttribute('data-contact-name')?.trim() || '';
      return name ? { name } : null;
    })
    .filter(Boolean);
  const seen = new Set();
  const unique = [];
  for (const u of users) {
    if (!seen.has(u.name)) {
      seen.add(u.name);
      unique.push(u);
    }
  }
  return unique;
}

/**
 * Collect current subtasks from the DOM.
 * @returns {Array<{completed:boolean,text:string}>}
 */
function getSubtasks() {
  return [...document.querySelectorAll(".subtasks-scroll-container .subtask-item span")].map(span => ({
    completed: false,
    text: span.innerText.trim()
  }));
}

/**
 * Get the selected category value or a default.
 * @returns {string}
 */
function getSelectedCategory() {
  const activeItem = document.querySelector(".category-item.selected");
  return activeItem ? activeItem.dataset.value : "Technical task";
}
