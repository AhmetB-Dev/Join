/** Patch subtask status using local task state and update its board card. */
async function updateSubtaskStatusInAPIWithLocalData(taskId, subtaskIndex, newStatus) {
  try {
    if (!validateLocalSubtaskUpdate(subtaskIndex)) return;
    applyLocalSubtaskStatusChange(subtaskIndex, newStatus);
    const newProgress = calculateLocalSubtaskProgress();
    window.currentTask.progress = newProgress;
    await patchSubtaskToAPI(taskId, window.currentTask.subtasks, newProgress);
    triggerCardUpdate(taskId);
  } catch (error) {
    console.error('Error updating subtask status through API:', error);
  }
}

function validateLocalSubtaskUpdate(subtaskIndex) {
  if (!window.currentTask || !Array.isArray(window.currentTask.subtasks)) return false;
  if (subtaskIndex < 0 || subtaskIndex >= window.currentTask.subtasks.length) return false;
  return !!window.currentTask.subtasks[subtaskIndex];
}

function applyLocalSubtaskStatusChange(subtaskIndex, newStatus) {
  window.currentTask.subtasks[subtaskIndex].completed = newStatus;
}

function calculateLocalSubtaskProgress() {
  const total = window.currentTask.subtasks.length;
  const completed = window.currentTask.subtasks.filter(st => st.completed).length;
  return total ? Math.round((completed / total) * 100) : 0;
}

/** Fetch current task, change one subtask and persist it. */
async function updateSubtaskStatusInAPI(taskId, subtaskIndex, newStatus) {
  try {
    const taskData = await fetchTaskDataFromAPI(taskId);
    if (!validateRemoteSubtaskUpdate(taskData, subtaskIndex)) return;
    applyRemoteSubtaskStatusChange(taskData, subtaskIndex, newStatus);
    const newProgress = calculateRemoteSubtaskProgress(taskData);
    await patchSubtaskToAPI(taskId, taskData.subtasks, newProgress);
    triggerCardUpdate(taskId);
  } catch (error) {
    console.error('Error updating subtask status through API:', error);
  }
}

async function fetchTaskDataFromAPI(taskId) {
  const task = await JoinAPI.get(`/tasks/${taskId}/`);
  return task ? { ...task, id: String(task.id) } : null;
}

function validateRemoteSubtaskUpdate(taskData, subtaskIndex) {
  if (!taskData || !Array.isArray(taskData.subtasks)) return false;
  if (subtaskIndex < 0 || subtaskIndex >= taskData.subtasks.length) return false;
  return !!taskData.subtasks[subtaskIndex];
}

function applyRemoteSubtaskStatusChange(taskData, subtaskIndex, newStatus) {
  taskData.subtasks[subtaskIndex].completed = newStatus;
}

function calculateRemoteSubtaskProgress(taskData) {
  const total = taskData.subtasks.length;
  const completed = taskData.subtasks.filter(st => st.completed).length;
  return total ? Math.round((completed / total) * 100) : 0;
}

async function patchSubtaskToAPI(taskId, subtasks, progress) {
  await JoinAPI.patch(`/tasks/${taskId}/`, {
    subtasks,
    progress: Math.round(progress),
  });
}

function triggerCardUpdate(taskId) {
  if (typeof updateTaskCardInBackground === 'function') updateTaskCardInBackground(taskId);
}

/** Replace the complete editable task state through the Django REST API. */
async function updateTaskInAPI(task) {
  const taskId = task?.id ?? window.currentTaskId;
  if (taskId === null || taskId === undefined || taskId === '') return null;
  const updated = await JoinAPI.put(`/tasks/${taskId}/`, JoinAPI.taskPayload(task));
  if (updated) {
    updated.id = String(updated.id);
    if (window.currentTask && String(window.currentTaskId) === String(taskId)) window.currentTask = updated;
  }
  return updated;
}

/** Update a subtask text from an edit container and persist the complete task. */
function updateSubtaskInAPI(container, finalText) {
  const index = Number(container.dataset.index);
  if (window.currentTask && Array.isArray(window.currentTask.subtasks) && Number.isInteger(index)) {
    if (!window.currentTask.subtasks[index]) return;
    window.currentTask.subtasks[index].text = finalText;
    return updateTaskInAPI(window.currentTask);
  }
}
