(() => {
  "use strict";
  const { initials, colorIdx, currentUserLower, fetchContacts } = window.AddTaskCore || {};

  /** Query helper */
  const q = (root, selector) => root.querySelector(selector);

  /** Mini element helper */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /** Show a field error */
  const showFieldError = (field, message = "This field is required") => {
    if (!field) return;
    field.classList.add("at-error");
    const next = field.nextElementSibling;
    if (next?.classList.contains("at-error-message")) return;
    const hint = el("div", "at-error-message", message);
    field.insertAdjacentElement("afterend", hint);
  };

  /** Clear a field error */
  const clearFieldError = (field) => {
    if (!field) return;
    field.classList.remove("at-error");
    const next = field.nextElementSibling;
    if (next?.classList.contains("at-error-message")) next.remove();
  };

  /** Ensure category select options are safe/valid */
  const ensureCategoryOptions = (container) => {
    const select = q(container, "#task-category");
    if (!select) return;
    const first = select.options[0];
    if (first && !String(first.value || "").trim())
      Object.assign(first, { disabled: true, hidden: true, selected: true });
    const onlyPH = select.options.length === 1 && !String(first?.value || "").trim();
    if (onlyPH) {
      select.add(new Option("Technical Task", "technical"));
      select.add(new Option("User Story", "user"));
    }
  };

  /** Build the "Assigned" UI */
  const buildAssignUI = (hiddenInput) => {
    const wrap = el("div", "at-assign-field"),
      input = el("input", "at-assign-input"),
      panel = el("div", "at-assign-dd"),
      preview = el("div");
    preview.id = "at-assigned-preview";
    input.type = "text";
    input.readOnly = true;
    input.placeholder = "Select contacts to assign";
    hiddenInput.insertAdjacentElement("afterend", preview);
    hiddenInput.insertAdjacentElement("afterend", panel);
    hiddenInput.insertAdjacentElement("afterend", wrap);
    wrap.append(input, panel);
    return { wrap, input, panel, preview };
  };

  /** Initialize "Assigned" */
  const initAssigned = (container) => {
    const hidden = q(container, "#task-assigned");
    if (!hidden) return null;
    hidden.style.display = "none";
    const ui = buildAssignUI(hidden);
    const state = { selectedByName: new Map(), currentUser: currentUserLower(), ...ui };
    ui.input.addEventListener("click", async () => {
      const open = ui.panel.style.display !== "block";
      if (open) await rebuildContacts(state);
      ui.panel.style.display = open ? "block" : "none";
    });
    document.addEventListener("click", (evt) => {
      if (!ui.wrap.contains(evt.target)) ui.panel.style.display = "none";
    });
    return {
      getSelectedUsers: () => [...state.selectedByName.values()].map((u) => ({ name: u.name })),
      clearSelection: () => clearAssignees(state),
      inputElement: ui.input,
      _state: state,
    };
  };

  /** Clear selection */
  const clearAssignees = (state) => {
    state.selectedByName.clear();
    renderAssigneePreview(state);
    state.panel.querySelectorAll(".at-assign-item").forEach((r) => {
      r.classList.remove("at-is-selected");
      r.querySelector(".at-assign-check")?.classList.remove("at-checked");
    });
  };

  /** Build a contact row */
  const buildContactRow = (fullName, state) => {
    const row = el("div", "at-assign-item");
    row.dataset.name = fullName;
    const av = el("div", `at-assign-avatar at-av-c${colorIdx(fullName)}`, initials(fullName));
    const you = fullName.trim().toLowerCase() === state.currentUser;
    const label = el("div", "at-assign-name", you ? `${fullName} (You)` : fullName);
    const check = el("span", "at-assign-check");
    if (state.selectedByName.has(fullName)) {
      row.classList.add("at-is-selected");
      check.classList.add("at-checked");
    }
    row.append(av, label, check);
    row.addEventListener("click", () => toggleAssignee(state, fullName));
    return row;
  };

  /** Render contacts into the dropdown */
  const rebuildContacts = async (state) => {
    state.panel.innerHTML = "";
    const contacts = await fetchContacts();
    contacts.forEach((n) => state.panel.appendChild(buildContactRow(n, state)));
  };

  /** Toggle a selected assignee */
  const toggleAssignee = (state, fullName) => {
    if (state.selectedByName.has(fullName)) state.selectedByName.delete(fullName);
    else {
      state.selectedByName.set(fullName, { name: fullName, colorIndex: colorIdx(fullName) });
      clearFieldError(state.input);
    }
    state.panel.querySelectorAll(".at-assign-item").forEach((r) => {
      if (r.dataset.name === fullName) {
        r.classList.toggle("at-is-selected");
        r.querySelector(".at-assign-check")?.classList.toggle("at-checked");
      }
    });
    renderAssigneePreview(state);
  };

  /** Build an assignee badge */
  const buildAssigneeBadge = (person, state) => {
    const b = el("div", `at-assign-badge at-badge-c${person.colorIndex}`, initials(person.name));
    b.title = `${person.name} – remove`;
    b.addEventListener("click", (evt) => {
      evt.stopPropagation();
      state.selectedByName.delete(person.name);
      markRowDeselected(state, person.name);
      renderAssigneePreview(state);
    });
    return b;
  };

  /** +N badge for overflowed assignees */
  const buildAssigneeMore = (chosen) => {
    const more = el("div", "at-assign-more", `+${chosen.length - 3}`);
    more.title = chosen
      .slice(3)
      .map((p) => p.name)
      .join(", ");
    return more;
  };

  /** Mark a panel row as deselected */
  const markRowDeselected = (state, fullName) => {
    state.panel.querySelectorAll(".at-assign-item").forEach((r) => {
      if (r.dataset.name === fullName) {
        r.classList.remove("at-is-selected");
        r.querySelector(".at-assign-check")?.classList.remove("at-checked");
      }
    });
  };

  /** Render assignee badges preview */
  const renderAssigneePreview = (state) => {
    state.preview.innerHTML = "";
    const chosen = [...state.selectedByName.values()];
    if (!chosen.length) return;
    const strip = el("div", "at-assign-strip");
    chosen.slice(0, 3).forEach((p) => strip.appendChild(buildAssigneeBadge(p, state)));
    if (chosen.length > 3) strip.appendChild(buildAssigneeMore(chosen));
    const hint = el("span", "at-assign-hint", "Click to remove");
    state.preview.append(strip, hint);
  };

  /** Ensure the subtask shell exists */
  const ensureSubtaskShell = (container) => {
    let shell = container.querySelector("#subtask-shell");
    if (!shell) {
      shell = el("div");
      shell.id = "subtask-shell";
      container.querySelector(".task-form-right")?.appendChild(shell);
    }
    let list = shell.querySelector("#subtask-list");
    if (!list) {
      list = el("ul");
      list.id = "subtask-list";
      shell.appendChild(list);
    }
    return /** @type {HTMLUListElement} */ (list);
  };

  /** Shell controls */
  const openShell = (listEl) => listEl?.parentElement?.classList.add("is-open");
  const closeShell = (listEl) => listEl?.parentElement?.classList.remove("is-open");
  const checkAutoClose = (listEl) => {
    if (listEl && !listEl.querySelector("li")) closeShell(listEl);
  };

  /** Icon button helper */
  const makeIconButton = (pathData, title) => {
    const btn = el("button", "at-subtask-action-btn");
    btn.type = "button";
    btn.title = title;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="${pathData}"/></svg>`;
    return btn;
  };

  /** Create a subtask list item */
  const createSubtaskItem = (text, list) => {
    const li = el("li", "at-subtask-item");
    li.dataset.text = text;
    const row = el("div", "at-subtask-row"),
      span = el("span", "at-subtask-text", text),
      tools = el("div", "at-subtask-actions");
    const edit = makeIconButton("M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z", "Edit");
    const del = makeIconButton(
      "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6Zm12-13h-3.5l-1-1h-3l-1 1H6",
      "Delete"
    );
    edit.addEventListener("click", () => enterEditMode(li));
    del.addEventListener("click", () => {
      li.remove();
      checkAutoClose(list);
    });
    tools.append(edit, del);
    row.append(span, tools);
    li.append(row);
    return li;
  };

  /** Append a subtask to the list */
  const appendSubtask = (list, text) => {
    if (!text) return;
    const li = createSubtaskItem(text, list);
    list.appendChild(li);
    openShell(list);
    li.parentElement?.scrollTo({ top: li.parentElement.scrollHeight, behavior: "smooth" });
  };

  /** Enter edit mode for a subtask item */
  const enterEditMode = (li) => {
    const span = li.querySelector(".at-subtask-text");
    if (!span) return;
    const old = (li.dataset.text || span.textContent).trim();
    const input = el("input", "at-subtask-edit");
    input.type = "text";
    input.value = old;
    span.replaceWith(input);
    input.focus();
    input.setSelectionRange(old.length, old.length);
    const finish = (commit) => {
      const val = commit ? input.value.trim() : old;
      const ns = el("span", "at-subtask-text", val || old);
      li.dataset.text = val || old;
      input.replaceWith(ns);
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  };

  /** Initialize subtask composer */
  const initSubtaskComposer = (container) => {
    const input = q(container, "#subtask-input"),
      add = q(container, "#add-subtask-btn"),
      list = ensureSubtaskShell(container);
    add?.addEventListener("click", () => {
      const t = input?.value.trim();
      if (t) {
        appendSubtask(list, t);
        input.value = "";
      }
    });
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const t = input.value.trim();
        if (t) {
          appendSubtask(list, t);
          input.value = "";
        }
      }
    });
    return {
      collect: () =>
        [...container.querySelectorAll("#subtask-list li")].map((li) => ({
          text: li.dataset.text || li.textContent.trim(),
          completed: false,
        })),
      clear: () => {
        list.innerHTML = "";
        closeShell(list);
      },
    };
  };

  /** Initialize priority control */
  const initPriority = (container) => {
    const urgent = q(container, ".btn-urgent"),
      medium = q(container, ".btn-medium"),
      low = q(container, ".btn-low");
    let current = "medium";
    const set = (name) => {
      current = name;
      [urgent, medium, low].forEach((b) => b?.setAttribute("aria-pressed", "false"));
      ({ urgent, medium, low })[name]?.setAttribute("aria-pressed", "true");
    };
    urgent?.addEventListener("click", () => set("urgent"));
    medium?.addEventListener("click", () => set("medium"));
    low?.addEventListener("click", () => set("low"));
    set("medium");
    return {
      getCurrentName: () => current,
      getIconPath: () => `../img/priority-img/${current}.png`,
      resetToMedium: () => set("medium"),
    };
  };

  // Back-compat aliases & export
  const $ = q,
    showErr = showFieldError,
    clearErr = clearFieldError;
  window.AddTaskWidgets = {
    q,
    $,
    showFieldError,
    showErr,
    clearFieldError,
    clearErr,
    ensureCategoryOptions,
    initAssigned,
    rebuildContacts,
    renderAssigneePreview,
    toggleAssignee,
    ensureSubtaskShell,
    openShell,
    closeShell,
    checkAutoClose,
    makeIconButton,
    appendSubtask,
    enterEditMode,
    initSubtaskComposer,
    initPriority,
  };
})();
