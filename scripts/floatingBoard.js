/**
 * Toggle priority state for the floating edit modal.
 * @param {"urgent"|"medium"|"low"} priority
 */
function setPriorityFloatingEdit(priority) {
  const allButtons = document.querySelectorAll(
    '.priority-button-urgentFloating, .priority-button-mediumFloating, .priority-button-lowFloating'
  );
  const selectedButtons = document.querySelectorAll(`.priority-button-${priority}`);
  if (selectedButtons.length === 0) {
    return;
  }
  const selectedButton = selectedButtons[0];
  if (selectedButton.classList.contains('active')) {
    selectedButton.classList.remove('active');
  } else {
    allButtons.forEach(button => button.classList.remove('active'));
    selectedButton.classList.add('active');
  }
}

/**
 * Delete the currently opened task through the Django API and refresh the board.
 * @returns {Promise<void>}
 */
async function deleteTaskFromAPI() {
  if (!currentTaskId) {
    return;
  }
  try {
    await JoinAPI.delete(`/tasks/${currentTaskId}/`);
    document.getElementById("toggleModalFloating").style.display = "none";
    if (typeof closeModalAndReload === 'function') {
      await closeModalAndReload();
    }
  } catch (error) {
    console.error(error);
  }
}

