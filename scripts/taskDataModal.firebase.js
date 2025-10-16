/**
 * Patch subtask status using local currentTask state and update card.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 * @returns {Promise<void>}
 */
async function updateSubtaskStatusInFirebaseWithLocalData(taskId, subtaskIndex, newStatus) {
  try {
    if (!validateLocalSubtaskUpdate(subtaskIndex)) return;
    applyLocalSubtaskStatusChange(subtaskIndex, newStatus);
    const newProgress = calculateLocalSubtaskProgress();
    await patchSubtaskToFirebase(taskId, window.currentTask.subtasks, newProgress);
    triggerCardUpdate(taskId);
  } catch (error) {
    console.error('Error updating subtask status in Firebase:', error);
  }
}

/**
 * Validate local subtask update preconditions.
 * @param {number} subtaskIndex
 * @returns {boolean}
 */
function validateLocalSubtaskUpdate(subtaskIndex) {
  if (!window.currentTask || !window.currentTask.subtasks || !Array.isArray(window.currentTask.subtasks)) {
    return false;
  }
  if (subtaskIndex < 0 || subtaskIndex >= window.currentTask.subtasks.length) {
    console.error('Invalid subtask index:', subtaskIndex, 'for local subtasks length:', window.currentTask.subtasks.length);
    return false;
  }
  return !!window.currentTask.subtasks[subtaskIndex];
}

/**
 * Apply status change to local subtask.
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 * @returns {void}
 */
function applyLocalSubtaskStatusChange(subtaskIndex, newStatus) {
  window.currentTask.subtasks[subtaskIndex].completed = newStatus;
}

/**
 * Calculate progress from local subtasks.
 * @returns {number}
 */
function calculateLocalSubtaskProgress() {
  const total = window.currentTask.subtasks.length;
  const completed = window.currentTask.subtasks.filter(st => st.completed).length;
  return total ? (completed / total) * 100 : 0;
}

/**
 * Fetch current task, patch a subtask status and update card.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 * @returns {Promise<void>}
 */
async function updateSubtaskStatusInFirebase(taskId, subtaskIndex, newStatus) {
  try {
    const taskData = await fetchTaskDataFromFirebase(taskId);
    if (!validateRemoteSubtaskUpdate(taskData, subtaskIndex)) return;
    applyRemoteSubtaskStatusChange(taskData, subtaskIndex, newStatus);
    const newProgress = calculateRemoteSubtaskProgress(taskData);
    await patchSubtaskToFirebase(taskId, taskData.subtasks, newProgress);
    triggerCardUpdate(taskId);
  } catch (error) {
    console.error('Error updating subtask status in Firebase:', error);
  }
}

/**
 * Fetch task data from Firebase.
 * @param {string} taskId
 * @returns {Promise<object>}
 */
async function fetchTaskDataFromFirebase(taskId) {
  const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
  const response = await fetch(url);
  return await response.json();
}

/**
 * Validate remote subtask update preconditions.
 * @param {object} taskData
 * @param {number} subtaskIndex
 * @returns {boolean}
 */
function validateRemoteSubtaskUpdate(taskData, subtaskIndex) {
  if (!taskData || !taskData.subtasks || !Array.isArray(taskData.subtasks)) {
    return false;
  }
  if (subtaskIndex < 0 || subtaskIndex >= taskData.subtasks.length) {
    console.error('Invalid subtask index:', subtaskIndex, 'for subtasks length:', taskData.subtasks.length);
    return false;
  }
  return !!taskData.subtasks[subtaskIndex];
}

/**
 * Apply status change to remote task data.
 * @param {object} taskData
 * @param {number} subtaskIndex
 * @param {boolean} newStatus
 * @returns {void}
 */
function applyRemoteSubtaskStatusChange(taskData, subtaskIndex, newStatus) {
  taskData.subtasks[subtaskIndex].completed = newStatus;
}

/**
 * Calculate progress from remote task data.
 * @param {object} taskData
 * @returns {number}
 */
function calculateRemoteSubtaskProgress(taskData) {
  const total = taskData.subtasks.length;
  const completed = taskData.subtasks.filter(st => st.completed).length;
  return total ? (completed / total) * 100 : 0;
}

/**
 * PATCH subtasks and progress to Firebase.
 * @param {string} taskId
 * @param {Array} subtasks
 * @param {number} progress
 * @returns {Promise<void>}
 */
async function patchSubtaskToFirebase(taskId, subtasks, progress) {
  const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
  await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks, progress })
  });
}

/**
 * Trigger background card update if function exists.
 * @param {string} taskId
 * @returns {void}
 */
function triggerCardUpdate(taskId) {
  if (typeof updateTaskCardInBackground === 'function') {
    updateTaskCardInBackground(taskId);
  }
}

/**
 * PUT the given task object to Firebase by its firebaseKey.
 * @param {{firebaseKey:string}} task
 * @returns {Promise<void>}
 */
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

/**
 * Update subtask in Firebase from container element.
 * @param {HTMLElement} container
 * @param {string} finalText
 * @returns {Promise<void>|undefined}
 */
function updateSubtaskInFirebase(container, finalText) {
  const index = container.dataset.index;
  if (window.currentTask && window.currentTask.subtasks && index !== undefined) {
    window.currentTask.subtasks[index].text = finalText;
    return updateTaskInFirebase(window.currentTask);
  }
}
