/** Persist a new task through the Django REST API and refresh the board UI. */
async function addTaskToAPI() {
  const taskData = getTaskData();
  try {
    const createdTask = await JoinAPI.post('/tasks/', JoinAPI.taskPayload(taskData));
    if (!createdTask?.id) return;
    clearForm();
    closeModal();
    if (typeof closeModalAndReload === 'function') await closeModalAndReload();
  } catch (error) {
    console.error('Error while saving task to API:', error);
  }
}
