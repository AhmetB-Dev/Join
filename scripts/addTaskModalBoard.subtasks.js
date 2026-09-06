/**
 * Bind subtask add, edit and delete interactions in the Board Add Task modal.
 * @returns {void}
 */
function bindSubtaskManagement() {
  const subtaskInput = document.querySelector(".subtask");
  const addSubtaskBtn = document.getElementById("addSubtask");
  const subtasksContainer = document.querySelector(".subtasks-scroll-container");
  if (!addSubtaskBtn || !subtaskInput || !subtasksContainer) return;
  addSubtaskBtn.addEventListener("click", () => handleAddSubtask(subtaskInput, subtasksContainer));
  subtasksContainer.addEventListener("click", handleSubtaskAction);
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
 * Create a subtask list item for the Board Add Task modal.
 * The markup matches the existing Board design and provides edit/delete actions.
 * @param {string} text
 * @returns {HTMLDivElement}
 */
function createAddTaskSubtaskItem(text) {
  const newItem = document.createElement("div");
  newItem.classList.add("subtask-item", "added-subtasks");
  newItem.dataset.text = text;
  newItem.innerHTML = `
    <div class="flexrow">
      <span>${text}</span>
    </div>
    <div class="added-subtask-icons">
      <div class="subtask-edit-trigger"><img src="../assets/img/board/pen.png" alt="Edit subtask"></div>
      <hr class="subtask-hr">
      <div class="trash-icon"><img src="../assets/img/board/trash.png" alt="Delete subtask"></div>
    </div>
  `;
  return newItem;
}

/**
 * Delegate edit/delete clicks for Board Add Task subtasks.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleSubtaskAction(event) {
  const item = event.target.closest(".subtask-item");
  if (!item) return;

  if (event.target.closest(".trash-icon")) {
    item.remove();
    validateForm();
    return;
  }

  if (event.target.closest(".subtask-edit-trigger")) {
    enterBoardSubtaskEditMode(item);
  }
}

/**
 * Use the same inline-edit behavior as the Add Task page:
 * Enter saves, Escape cancels, blur saves.
 * @param {HTMLElement} item
 * @returns {void}
 */
function enterBoardSubtaskEditMode(item) {
  const span = item.querySelector(".flexrow span");
  if (!span || item.querySelector(".board-subtask-edit")) return;

  const oldText = (item.dataset.text || span.textContent || "").trim();
  const input = document.createElement("input");
  input.type = "text";
  input.className = "board-subtask-edit";
  input.value = oldText;
  span.replaceWith(input);
  input.focus();
  input.setSelectionRange(oldText.length, oldText.length);

  let finished = false;
  const finish = (commit) => {
    if (finished) return;
    finished = true;
    const value = commit ? input.value.trim() : oldText;
    const finalText = value || oldText;
    const newSpan = document.createElement("span");
    newSpan.textContent = finalText;
    item.dataset.text = finalText;
    input.replaceWith(newSpan);
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  });
  input.addEventListener("blur", () => finish(true));
}
