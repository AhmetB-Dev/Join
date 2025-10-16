/**
 * Initializes dropdown functionality for the account menu.
 * Sets up event listeners for opening/closing the dropdown menu.
 */
document.addEventListener('DOMContentLoaded', function () {
  const accountButton = document.querySelector('.account');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  if (!accountButton || !dropdownMenu) return;

  /**
   * Toggles the dropdown menu visibility when account button is clicked.
   * @param {Event} event - The click event
   */
  accountButton.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });

  /**
   * Closes the dropdown menu when clicking outside of it.
   */
  document.addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
  });
});

/**
 * Logs out the current user by clearing authentication data.
 * Removes user data from localStorage and sessionStorage.
 */
window.logout = function logout() {
  try {
    localStorage.setItem('isGuest', 'false');
    localStorage.removeItem('name');
    sessionStorage.clear();
  } catch (e) {
  }
};