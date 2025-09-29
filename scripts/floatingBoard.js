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

async function deleteTaskFromFirebase() {
  if (!currentTaskId) {
    return;
  }
  try {
    const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${currentTaskId}.json`;
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Error deleting task: ${response.statusText}`);
    }
    document.getElementById("toggleModalFloating").style.display = "none";
    location.reload();
  } catch (error) {
    console.error(error);
  }
}

