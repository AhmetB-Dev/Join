/**
 * Initialize global dropdown click handling.
 */
document.addEventListener('DOMContentLoaded', () => {
  setupGlobalDropdownHandler();
});

/**
 * Register a single document click listener for dropdown interactions.
 */
function setupGlobalDropdownHandler() {
  document.addEventListener('click', onDocumentClick);
}

/**
 * Handle document clicks for assignee dropdown open/close.
 * @param {MouseEvent} e
 */
function onDocumentClick(e) {
  const target = e.target;
  if (isAssigneeTrigger(target)) {
    e.preventDefault();
    e.stopPropagation();
    toggleAssigneeDropdown();
    return;
  }
  closeAssigneeDropdownIfOutside(target);
}

/**
 * Determine if the click target is within any assignee dropdown trigger.
 * @param {Element} target
 * @returns {boolean}
 */
function isAssigneeTrigger(target) {
  return !!(
    target.closest('#assigneeDropdownSelected') ||
    target.closest('#assigneeDropdown') ||
    target.closest('.custom-assignee-dropdown')
  );
}

/**
 * Toggle the assignee dropdown list visibility.
 */
function toggleAssigneeDropdown() {
  const dropdownList = document.querySelector('#assigneeDropdownList');
  if (!dropdownList) return;
  const isHidden = dropdownList.style.display === 'none' || dropdownList.classList.contains('hidden');
  dropdownList.style.display = isHidden ? 'block' : 'none';
  dropdownList.classList.toggle('hidden', !isHidden);
}

/**
 * Close the dropdown if clicking outside of the dropdown area.
 * @param {Element} target
 */
function closeAssigneeDropdownIfOutside(target) {
  if (
    target.closest('#assigneeDropdown') ||
    target.closest('.custom-assignee-dropdown') ||
    target.closest('#assigneeDropdownList')
  ) return;
  const dropdownList = document.querySelector('#assigneeDropdownList');
  if (dropdownList && !dropdownList.classList.contains('hidden')) {
    dropdownList.style.display = 'none';
    dropdownList.classList.add('hidden');
  }
}
