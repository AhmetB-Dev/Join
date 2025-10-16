(() => {
  "use strict";
  const { normCategory, persistTask } = window.AddTaskCore || {};
  const { $, showErr, clearErr, ensureCategoryOptions, initAssigned, initSubtaskComposer, initPriority } =
    window.AddTaskWidgets || {};

  /**
   * Build payload from form values.
   * @param {HTMLElement} wrap
   * @param {ReturnType<initPriority>} prio
   * @param {ReturnType<initSubtaskComposer>} subt
   * @param {{getSelectedUsers:()=>{name:string}[]}|null} assigned
   * @returns {object}
   */
  const buildPayload = (wrap, prio, subt, assigned) => {
    const title = $(wrap, "#task-title")?.value.trim() || "";
    const desc = $(wrap, "#task-desc")?.value.trim() || "No description provided";
    const due = $(wrap, "#task-due")?.value.trim() || "";
    const catSel = $(wrap, "#task-category");
    const rawCat = catSel ? catSel.value || catSel.options[catSel.selectedIndex]?.text : "";
    return {
      column: "toDoColumn",
      description: desc,
      dueDate: due,
      id: null,
      priority: prio.getIconPath(),
      progress: 0,
      title,
      users: assigned?.getSelectedUsers() || [],
      subtasks: subt.collect(),
      category: normCategory(rawCat),
    };
  };

  /**
   * Wire up validation and button handlers.
   * @param {HTMLElement} wrap
   * @param {ReturnType<initPriority>} prio
   * @param {ReturnType<initSubtaskComposer>} subt
   * @param {{getSelectedUsers:()=>{name:string}[],clearSelection:()=>void,inputElement:HTMLInputElement}|null} assigned
   * @returns {void}
   */
  const attachLifecycle = (wrap, prio, subt, assigned) => {
    const title = $(wrap, "#task-title"),
      due = $(wrap, "#task-due"),
      cat = $(wrap, "#task-category");
    const btnCreate = $(wrap, "#create-task-btn"),
      btnClear = $(wrap, "#clear-task-btn");
    [title, due, cat].forEach((el) => {
      el?.addEventListener("input", () => clearErr(el));
      el?.addEventListener("change", () => clearErr(el));
    });
    const validate = () => {
      let ok = true;
      if (!title?.value.trim()) {
        showErr(title, "Title is required");
        ok = false;
      }
      if (!due?.value.trim()) {
        showErr(due, "Due date is required");
        ok = false;
      }
      if (!cat?.value.trim()) {
        showErr(cat, "Category is required");
        ok = false;
      }
      return ok;
    };
    btnCreate?.addEventListener("click", async () => {
      if (!validate()) return;
      try {
        const key = await persistTask(buildPayload(wrap, prio, subt, assigned));
        if (key) window.location.href = "./board.html";
      } catch {}
    });
    btnClear?.addEventListener("click", () => {
      const desc = $(wrap, "#task-desc");
      if (title) title.value = "";
      if (desc) desc.value = "";
      if (due) due.value = "";
      if (cat) cat.selectedIndex = 0;
      subt.clear();
      assigned?.clearSelection();
      [title, due, cat, assigned?.inputElement, desc].forEach(clearErr);
      prio.resetToMedium();
    });
  };

  /** Init entry point for the Add Task page. */
  const init = () => {
    const root = document.getElementById("addtask-container");
    if (!root) return;
    ensureCategoryOptions(root);
    const prio = initPriority(root);
    const subt = initSubtaskComposer(root);
    const assigned = initAssigned(root);
    attachLifecycle(root, prio, subt, assigned);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
