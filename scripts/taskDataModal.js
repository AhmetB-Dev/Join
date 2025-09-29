function createSubtaskTextSpan(text) {
  const span = document.createElement('span');
  span.innerText = `• ${text}`;
  return span;
}

function createSubtaskActions() {
const actionsDiv = createActionsContainer();
const editIcon = createActionIcon("../img/pen.png", "Edit", "subtask-edit-edit");
const deleteIcon = createActionIcon("../img/trash.png", "Delete", "subtask-delete-edit");
actionsDiv.appendChild(editIcon);
actionsDiv.appendChild(deleteIcon);
return actionsDiv;
}

function createActionsContainer() {
const div = document.createElement('div');
div.className = "subtask-actions";
return div;
}

function createActionIcon(src, alt, className) {
const img = document.createElement('img');
img.src = src;
img.alt = alt;
img.className = className;
return img;
}

function getCleanText(span) {
  return span.innerText.replace('• ', '');
}

function createAndReplaceInput(container, span, text) {
  const input = createEditInput(text);
  container.replaceChild(input, span);
  input.focus();
  return input;
}

function registerBlurHandler(input, container, originalText) {
  input.addEventListener('blur', async () => {
    const newText = input.value.trim();
    const finalText = newText !== '' ? newText : originalText;
    const newSpan = createSubtaskTextSpan(finalText);
    container.replaceChild(newSpan, input);
    const index = container.dataset.index;
    if (window.currentTask && window.currentTask.subtasks && index !== undefined) {
      window.currentTask.subtasks[index].text = finalText;
      await updateTaskInFirebase(window.currentTask);
      location.reload(); 
    }
});
}

function replaceSpanWithInput(container, span, originalText) {
  const currentText = getCleanText(span);
  const input = createAndReplaceInput(container, span, currentText);
  registerBlurHandler(input, container, originalText);
}

function createEditInput(text) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  input.classList.add('responsive-subtask-input');
  return input;
}

function getSelectedPriority() {
  if (document.querySelector('.edit-priority-urgent.active')) return 'urgent';
  if (document.querySelector('.edit-priority-medium.active')) return 'medium';
  if (document.querySelector('.edit-priority-low.active')) return 'low';
  return 'medium';
}

function getPriorityPath(priority) {
  switch (priority) {
    case 'urgent': return '../img/priority-img/urgent.png';
    case 'medium': return '../img/priority-img/medium.png';
    case 'low':    return '../img/priority-img/low.png';
    default:       return '../img/priority-img/medium.png';
  }
}

async function saveEditedTaskToFirebase() {
  if (!currentTask) return;
  updateTaskFromInputs();
  await updateTaskInFirebase(currentTask);
  closeEditModal();
  location.reload(); 
}

function updateTaskFromInputs() {
  currentTask.title = document.getElementById('editTaskTitle').value.trim() || currentTask.title;
  currentTask.description = document.getElementById('editTaskDescription').value.trim() || currentTask.description;
  currentTask.dueDate = document.getElementById('editDueDate').value.trim() || currentTask.dueDate;
  const prio = getSelectedPriority();
  currentTask.priority = getPriorityPath(prio);
  const cat = document.getElementById('editTaskCategory').value;
  currentTask.category = (cat === 'technical') ? 'Technical task' : 'User Story';
  const newSubs = readSubtasksFromEditModal();
  if (newSubs.length) currentTask.subtasks = newSubs;
  const newAssignees = readAssigneesFromBadges();
  if (newAssignees.length) {
    currentTask.users = newAssignees;
  }
}

async function updateTaskInFirebase(task) {
  if (!task || !task.firebaseKey) return;
  const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${task.firebaseKey}.json`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!response.ok) throw new Error(`Update failed: ${response.statusText}`);
  } catch (error) {}
}

function closeEditModal(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('editTaskModal');
  if (modal) modal.style.display = 'none';
}

function bindConfirmEditButton() {
  document.getElementById('confirmEditBtn')?.addEventListener('click', saveEditedTaskToFirebase);
}

function initSubtaskAddition() {
  const subtaskInput = document.querySelector('.subtask-input');
  const subtaskCheck = document.querySelector('.subtask-edit-check');
  const subtasksList = document.getElementById('editSubtasksList');
  subtaskCheck?.addEventListener('click', () => {
    const text = subtaskInput.value.trim();
    if (text !== '') {
      const newSubtask = createNewSubtaskElement(text);
      subtasksList.appendChild(newSubtask);
      subtaskInput.value = '';
    }
  });
}

function createNewSubtaskElement(text) {
  const newSubtask = document.createElement('div');
  newSubtask.className = 'subtask-item';
  newSubtask.innerHTML = `
    <span>• ${text}</span>
    <div class="subtask-actions">
      <img src="../img/pen.png" alt="Edit" class="subtask-edit-edit">
      <img src="../img/trash.png" alt="Delete" class="subtask-delete-edit">
    </div>`;
  newSubtask.dataset.index = window.currentTask.subtasks ? window.currentTask.subtasks.length : 0;
  return newSubtask;
}

function initSubtaskDeletion() {
  const subtasksList = document.getElementById('editSubtasksList');
  subtasksList?.addEventListener('click', e => {
    if (e.target?.matches('img[alt="Delete"]')) {
      e.target.closest('.subtask-item')?.remove();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindConfirmEditButton();
  initSubtaskAddition();
  initSubtaskDeletion();
});