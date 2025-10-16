/**
 * Bind subtask add and delete interactions.
 * @returns {void}
 */
function bindSubtaskManagement() {
  const subtaskInput = document.querySelector(".subtask");
  const addSubtaskBtn = document.getElementById("addSubtask");
  const subtasksContainer = document.querySelector(".subtasks-scroll-container");
  if (!addSubtaskBtn || !subtaskInput || !subtasksContainer) return;
  addSubtaskBtn.addEventListener("click", () => handleAddSubtask(subtaskInput, subtasksContainer));
  subtasksContainer.addEventListener("click", handleSubtaskDeletion);
}

/**
 * Handle adding a new subtask from input to the container.
 * @param {HTMLInputElement} subtaskInput
 * @param {HTMLElement} container
 * @returns {void}
 */
function handleAddSubtask(subtaskInput, container) {
  const text = subtaskInput.value.trim();
  if (text !== "") {
    const newItem = createAddTaskSubtaskItem(text);
    container.appendChild(newItem);
    subtaskInput.value = "";
    validateForm();
  }
}

/**
 * Create a subtask list item element for the Add Task modal.
 * @param {string} text
 * @returns {HTMLDivElement}
 */
function createAddTaskSubtaskItem(text) {
  const newItem = document.createElement("div");
  newItem.classList.add("subtask-item", "added-subtasks");
  newItem.innerHTML = `
    <span>${text}</span>
    <img src="../img/subtask-delete.png" alt="Delete Subtask" class="subtask-icon trash-icon" />
  `;
  return newItem;
}

/**
 * Handle click events within the subtask container for deletion.
 * @param {MouseEvent} e
 * @returns {void}
 */
function handleSubtaskDeletion(e) {
  if (e.target.classList.contains("trash-icon")) {
    e.target.parentElement.remove();
    validateForm();
  }
}
