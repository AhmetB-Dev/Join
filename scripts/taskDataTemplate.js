window.currentTask = null;

window.currentTaskId = null;

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function getRealUserArrayAndCount(users) {
  if (!isValidUserArray(users)) {
    return { realUsers: [], totalCount: 0 };
  }
  
  const { updatedUsers, placeholderCount } = extractPlaceholder(users);
  
  return {
    realUsers: updatedUsers,
    totalCount: updatedUsers.length + placeholderCount
  };
}

function isValidUserArray(users) {
  return Array.isArray(users);
}

function extractPlaceholder(users) {
  let placeholderCount = 0;
  let updatedUsers = users;
  const lastUser = users[users.length - 1];
  
  if (lastUser && typeof lastUser.name === 'string' && lastUser.name.trim().startsWith('+')) {
    const parsedCount = parseInt(lastUser.name.trim().replace('+', ''));
    if (!isNaN(parsedCount)) {
      placeholderCount = parsedCount;
      updatedUsers = users.slice(0, users.length - 1);
    }
  }
  
  return { updatedUsers, placeholderCount };
}

// Funktion zum Entfernen von Duplikaten basierend auf User-Namen
function removeDuplicateUsers(users) {
  if (!Array.isArray(users)) return [];
  
  const seen = new Set();
  return users.filter(user => {
    // Verwende Name als eindeutigen Identifikator (falls vorhanden)
    const identifier = user.name || JSON.stringify(user);
    
    if (seen.has(identifier)) {
      return false; // Duplikat gefunden, nicht hinzufügen
    }
    
    seen.add(identifier);
    return true; // Ersten Eintrag behalten
  });
}

function renderUserBadges(users, maxToShow = 3) {
  const { realUsers, totalCount } = getRealUserArrayAndCount(users);
  
  // Duplikate entfernen basierend auf User-Namen
  const uniqueUsers = removeDuplicateUsers(realUsers);
  
  let badges = '';
  uniqueUsers.slice(0, maxToShow).forEach(u => {
    const initials = u.initials || '?';
    // Verwende die richtige Farbe oder 'default' als Fallback
    const colorClass = u.color || 'default';
    badges += `<div class="profile-badge-floating-${colorClass}">${initials}</div>`;
  });
  
  // Korrigiere die Anzahl für das +X Badge basierend auf einzigartigen Usern
  const uniqueCount = uniqueUsers.length;
  if (uniqueCount > maxToShow) {
    badges += `<div class="profile-badge-floating-gray">+${uniqueCount - maxToShow}</div>`;
  }
  return badges;
}

// Funktion zum Entfernen von Duplikaten basierend auf User-Namen
function removeDuplicateUsers(users) {
  if (!Array.isArray(users)) return [];
  
  const seen = new Set();
  return users.filter(user => {
    // Verwende Name als eindeutigen Identifikator (falls vorhanden)
    const identifier = user.name || JSON.stringify(user);
    
    if (seen.has(identifier)) {
      return false; // Duplikat gefunden, nicht hinzufügen
    }
    
    seen.add(identifier);
    return true; // Ersten Eintrag behalten
  });
}

function updateSubtaskStatus(taskId, subtaskIndex, newStatus) {
  if (!window.currentTask || window.currentTaskId !== taskId) return;
  window.currentTask.subtasks[subtaskIndex].completed = newStatus;
  const total = window.currentTask.subtasks.length;
  const completed = window.currentTask.subtasks.filter(st => st.completed).length;
  const newProgress = total ? (completed / total) * 100 : 0;
  const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
  fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks: window.currentTask.subtasks, progress: newProgress })
  }).then(r => {
    if (!r.ok) throw new Error("Error updating subtask status.");
    location.reload();
  }).catch(() => {});
}

function getPriorityLabel(iconPath) {
  if (!iconPath) return "Unknown";
  if (iconPath.includes("urgent")) return "Urgent";
  if (iconPath.includes("medium")) return "Medium";
  if (iconPath.includes("low")) return "Low";
  return "Unknown";
}

function extractPriority(iconPath) {
  if (!iconPath) return 'medium';
  const lower = iconPath.toLowerCase();
  if (lower.includes('urgent')) return 'urgent';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('low')) return 'low';
  return 'medium';
}
window.extractPriority = extractPriority;

function setCategoryHeader(task, modal) {
  const cat = modal.querySelector('.main-section-task-overlay > div:first-child');
  const isTechnical = task.category.toLowerCase().includes('technical');
  cat.className = `card-label-${isTechnical ? 'technical-task' : 'user-story'}-modal w445`;
  cat.querySelector('h4').textContent = task.category;
}

function setModalFields(task) {
  document.getElementById('modalTitle').innerText = task.title || "No Title";
  document.getElementById('modalDescription').innerText = task.description || "No Description";
  document.getElementById('modalDueDate').innerText = task.dueDate || "No Date";
  document.getElementById('modalPriorityText').innerText = getPriorityLabel(task.priority);
  document.getElementById('modalPriorityIcon').src = task.priority || "";
}

function setAssignedUsers(task) {
  const assign = document.getElementById('modalAssignedTo');
  if (task.users && Array.isArray(task.users)) {
    // Duplikate entfernen auch in der Modal-Ansicht
    const uniqueUsers = removeDuplicateUsers(task.users);
    assign.innerHTML = uniqueUsers.map(u =>
      `<div class="flexrow profile-names">
          <div class="profile-badge-floating-${u.color || 'default'}">${u.initials || '?'}</div>
         <span class="account-name">${u.name || 'Unknown'}</span>
       </div>`
    ).join("");
  } else {
    assign.innerHTML = "";
  }
}

function renderModalHeader(task, modal) {
  setCategoryHeader(task, modal);
  setModalFields(task);
  setAssignedUsers(task);
}

function clearSubtasksContainer() {
  const ms = document.getElementById("modalSubtasks");
  ms.innerHTML = "";
  return ms;
}

function createSubtaskElement(st, index) {
  const div = document.createElement("div");
  div.classList.add("subtask-container-div-item");
  div.innerHTML = `<div class="flexrow">
                     <input type="checkbox" class="subtask-checkbox" data-index="${index}" ${st.completed ? "checked" : ""}>
                     <span>${st.text}</span>
                   </div>`;
  return div;
}

function addSubtaskListeners(container) {
  container.querySelectorAll(".subtask-checkbox").forEach(cb => {
    cb.addEventListener("change", function () {
      updateSubtaskStatus(window.currentTaskId, parseInt(this.getAttribute("data-index"), 10), this.checked);
    });
  });
}

function renderSubtasks(task) {
  const ms = clearSubtasksContainer();
  if (task.subtasks && Array.isArray(task.subtasks)) {
    task.subtasks.forEach((st, i) => {
      ms.appendChild(createSubtaskElement(st, i));
    });
    addSubtaskListeners(ms);
  }
}

function openTaskModal(task) {
  window.currentTask = task;
  window.currentTaskId = task.firebaseKey || task.id;
  const modal = document.getElementById('toggleModalFloating');
  modal.dataset.taskId = window.currentTaskId;
  renderModalHeader(task, modal);
  renderSubtasks(task);
  modal.style.display = 'flex';
}

async function updateTaskColumnInFirebase(taskId, newColumn) {
  try {
    const url = `https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}.json`;
    const r = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: newColumn })
    });
    if (!r.ok) throw new Error(`Error updating task column: ${r.statusText}`);
    
    updateTaskDOMPosition(taskId, newColumn);
  } catch (e) {
    console.error('Error updating task column:', e);
  }
}

function updateTaskDOMPosition(taskId, newColumn) {
  const taskElement = document.getElementById(taskId);
  const targetColumn = document.getElementById(newColumn);
  
  if (taskElement && targetColumn) {
    if (taskElement.parentNode && taskElement.parentNode !== targetColumn) {
      taskElement.parentNode.removeChild(taskElement);
    }
    if (!targetColumn.contains(taskElement)) {
      targetColumn.appendChild(taskElement);
    }
    checkColumns();
  }
}

function checkColumns() {
  document.querySelectorAll('.task-board-container').forEach(col => {
    const img = col.querySelector('img');
    if (!img) return;
    const hasTasks = col.querySelectorAll('.draggable-cards').length > 0;
    img.style.display = hasTasks ? 'none' : 'block';
  });
}

function enableDragAndDrop() {
  // Nur für Desktop-Geräte aktivieren
  if (!isTouchDevice()) {
    document.querySelectorAll('.draggable-cards').forEach(card => {
      card.addEventListener('dragstart', () => card.classList.add('dragging'));
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });
    document.querySelectorAll('.task-board-container').forEach(col => {
      col.addEventListener('dragover', e => {
        e.preventDefault();
        const dragCard = document.querySelector('.dragging');
        if (dragCard) col.appendChild(dragCard);
      });
    });
  }
}

function calculateProgress(task) {
  const total = task.subtasks ? task.subtasks.length : 0;
  const completed = task.subtasks ? task.subtasks.filter(st => st.completed).length : 0;
  const progress = total ? (completed / total) * 100 : 0;
  return { total, completed, progress };
}

function getPriorityImage(task) {
  const mapping = {
    urgent: "../img/icon-urgent.png",
    medium: "../img/priority-img/medium.png",
    low: "../img/icon-low.png"
  };
  let prio = extractPriority(task.priority);
  if (!mapping[prio]) prio = "medium";
  return mapping[prio];
}

function createHeader(task) {
  const labelType = task.category === "Technical task" ? "technical-task" : "user-story";
  const headerTitle = task.category === "Technical task" ? "Technical Task" : "User Story";
  return `
    <div class="card-label-${labelType} padding-left">
      <h4>${headerTitle}</h4>
      <img src="../img/drag-drop-icon.png" alt="drag-and-drop-icon" class="drag-drop-icon">
    </div>`;
}

function createBody(task) {
  return `
    <div><h5 class="card-label-user-story-h5 padding-left">${task.title}</h5></div>
    <div><h6 class="card-label-user-story-h6 padding-left">${task.description}</h6></div>`;
}

function createProgressSection(total, completed, progress) {
  const progressStyle = total > 0 ? "" : "display: none;";
  return `
    <div class="task-progress" style="${progressStyle}">
      <div class="progress-main-container">
        <div class="progress-container">
          <div class="progress-bar" style="width: ${progress}%;"></div>
        </div>
      </div>
      <span class="progress-text">${completed} / ${total} tasks</span>
    </div>`;
}

function createFooter(task) {
  const userBadges = renderUserBadges(task.users, 3);
  const taskPriority = getPriorityImage(task);
  return `
    <div class="card-footer">
      <div class="padding-left profile-badge-container">
        ${userBadges}
      </div>
      <div class="priority-container-img">
        <img src="${taskPriority}" alt="Priority" 
             onerror="this.src='../img/priority-img/medium.png'" 
             class="priority-container-img">
      </div>
    </div>`;
}

function createTaskElement(task) {
  const { total, completed, progress } = calculateProgress(task);
  const el = document.createElement("div");
  el.classList.add("draggable-cards");
  el.id = task.firebaseKey || task.id;
  // Draggable nur für Desktop-Geräte aktivieren
  el.setAttribute("draggable", isTouchDevice() ? "false" : "true");
  el.dataset.title = task.title.toLowerCase();
  el.dataset.description = task.description.toLowerCase();
  el.innerHTML = `
    ${createHeader(task)}
    ${createBody(task)}
    ${createProgressSection(total, completed, progress)}
    ${createFooter(task)}
  `;
  return el;
}

function attachTaskListeners(task, taskEl) {
  taskEl.addEventListener("click", () => openTaskModal(task));
  // Dragend-Event nur für Desktop-Geräte
  if (!isTouchDevice()) {
    taskEl.addEventListener("dragend", async function () {
      const newCol = taskEl.closest(".task-board-container")?.id;
      if (newCol) await updateTaskColumnInFirebase(taskEl.id, newCol);
    });
  }
}









