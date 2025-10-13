/**
 * Persist the new task to Firebase and refresh the board UI.
 * @returns {Promise<void>}
 */
async function addTaskToFirebase() {
  const firebaseURL = 'https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks.json';
  const taskData = getTaskData();
  try {
    const response = await fetch(firebaseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const resData = await response.json();
    const firebaseId = resData.name;
    if (!firebaseId) return;
    await updateFirebaseTaskId(firebaseURL, firebaseId);
    clearForm();
    closeModal();
    if (typeof closeModalAndReload === 'function') {
      await closeModalAndReload();
    }
  } catch (error) {
    console.error('Error while saving task to Firebase', error);
  }
}

/**
 * Update the generated Firebase id back onto the task object.
 * @param {string} url Base tasks endpoint URL
 * @param {string} firebaseId Firebase id for the newly created task
 * @returns {Promise<void>}
 */
async function updateFirebaseTaskId(url, firebaseId) {
  const updateURL = url.replace('.json', `/${firebaseId}/id.json`);
  await fetch(updateURL, {
    method: 'PUT',
    body: JSON.stringify(firebaseId)
  });
}
