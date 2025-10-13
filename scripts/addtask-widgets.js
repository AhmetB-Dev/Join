(() => {
  "use strict";
  const { initials, colorIdx, currentUserLower, fetchContacts } = window.AddTaskCore || {};

  /** Query-Helfer */
  /** @param {ParentNode} root @param {string} selector */
  const q = (root, selector) => root.querySelector(selector);

  /** Feldfehler zeigen */
  /** @param {HTMLElement} field @param {string=} message */
  const showFieldError = (field, message = "This field is required") => {
    if (!field) return;
    field.classList.add("at-error");
    const next = field.nextElementSibling;
    if (next?.classList.contains("at-error-message")) return;
    const hint = document.createElement("div");
    hint.className = "at-error-message";
    hint.textContent = message;
    field.insertAdjacentElement("afterend", hint);
  };

  /** Feldfehler entfernen */
  /** @param {HTMLElement} field */
  const clearFieldError = (field) => {
    if (!field) return;
    field.classList.remove("at-error");
    const next = field.nextElementSibling;
    if (next?.classList.contains("at-error-message")) next.remove();
  };

  /** Kategorie-Select absichern */
  /** @param {HTMLElement} container */
  const ensureCategoryOptions = (container) => {
    const select = q(container, "#task-category");
    if (!select) return;
    const first = select.options[0];
    if (first && !String(first.value || "").trim()) {
      first.disabled = true;
      first.hidden = true;
      first.selected = true;
    }
    const onlyPlaceholder = select.options.length === 1 && !String(first?.value || "").trim();
    if (onlyPlaceholder) {
      select.add(new Option("Technical Task", "technical"));
      select.add(new Option("User Story", "user"));
    }
  };

  /** Assigned-UI aufbauen */
  /** @param {HTMLElement} hiddenInput */
  const buildAssignUI = (hiddenInput) => {
    const wrap = document.createElement("div"),
      input = document.createElement("input");
    const panel = document.createElement("div"),
      preview = document.createElement("div");
    wrap.className = "at-assign-field";
    input.className = "at-assign-input";
    panel.className = "at-assign-dd";
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

  /** Assigned initialisieren */
  /** @param {HTMLElement} container */
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

  /** Auswahl leeren */
  /** @param {{selectedByName:Map,panel:HTMLElement,preview:HTMLElement}} state */
  const clearAssignees = (state) => {
    state.selectedByName.clear();
    renderAssigneePreview(state);
    state.panel.querySelectorAll(".at-assign-item").forEach((r) => {
      r.classList.remove("at-is-selected");
      r.querySelector(".at-assign-check")?.classList.remove("at-checked");
    });
  };

  /** Kontaktzeile bauen */
  /** @param {string} fullName @param {*} state */
  const buildContactRow = (fullName, state) => {
    const row = document.createElement("div");
    row.className = "at-assign-item";
    row.dataset.name = fullName;
    const av = document.createElement("div");
    av.className = `at-assign-avatar at-av-c${colorIdx(fullName)}`;
    av.textContent = initials(fullName);
    const label = document.createElement("div");
    label.className = "at-assign-name";
    label.textContent = fullName.trim().toLowerCase() === state.currentUser ? `${fullName} (You)` : fullName;
    const check = document.createElement("span");
    check.className = "at-assign-check";
    if (state.selectedByName.has(fullName)) {
      row.classList.add("at-is-selected");
      check.classList.add("at-checked");
    }
    row.append(av, label, check);
    row.addEventListener("click", () => toggleAssignee(state, fullName));
    return row;
  };

  /** Kontakte rendern */
  /** @param {*} state */
  const rebuildContacts = async (state) => {
    state.panel.innerHTML = "";
    const contacts = await fetchContacts();
    contacts.forEach((n) => state.panel.appendChild(buildContactRow(n, state)));
  };

  /** Auswahl toggeln */
  /** @param {*} state @param {string} fullName */
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

  /** Badge bauen */
  /** @param {{name:string,colorIndex:number}} person @param {*} state */
  const buildAssigneeBadge = (person, state) => {
    const b = document.createElement("div");
    b.className = `at-assign-badge at-badge-c${person.colorIndex}`;
    b.textContent = initials(person.name);
    b.title = `${person.name} – remove`;
    b.addEventListener("click", (evt) => {
      evt.stopPropagation();
      state.selectedByName.delete(person.name);
      markRowDeselected(state, person.name);
      renderAssigneePreview(state);
    });
    return b;
  };

  /** +N Badge */
  /** @param {{name:string}[]} chosen */
  const buildAssigneeMore = (chosen) => {
    const more = document.createElement("div");
    more.className = "at-assign-more";
    more.textContent = `+${chosen.length - 3}`;
    more.title = chosen
      .slice(3)
      .map((p) => p.name)
      .join(", ");
    return more;
  };

  /** Panelzeile deselektieren */
  /** @param {*} state @param {string} fullName */
  const markRowDeselected = (state, fullName) => {
    state.panel.querySelectorAll(".at-assign-item").forEach((r) => {
      if (r.dataset.name === fullName) {
        r.classList.remove("at-is-selected");
        r.querySelector(".at-assign-check")?.classList.remove("at-checked");
      }
    });
  };

  /** Badges rendern */
  /** @param {*} state */
  const renderAssigneePreview = (state) => {
    state.preview.innerHTML = "";
    const chosen = [...state.selectedByName.values()];
    if (!chosen.length) return;
    const strip = document.createElement("div");
    strip.className = "at-assign-strip";
    chosen.slice(0, 3).forEach((p) => strip.appendChild(buildAssigneeBadge(p, state)));
    if (chosen.length > 3) strip.appendChild(buildAssigneeMore(chosen));
    const hint = document.createElement("span");
    hint.className = "at-assign-hint";
    hint.textContent = "Click to remove";
    state.preview.append(strip, hint);
  };

  /** Subtask-Shell holen */
  /** @param {HTMLElement} container @returns {HTMLUListElement} */
  const ensureSubtaskShell = (container) => {
    let shell = container.querySelector("#subtask-shell");
    if (!shell) {
      shell = document.createElement("div");
      shell.id = "subtask-shell";
      container.querySelector(".task-form-right")?.appendChild(shell);
    }
    let list = shell.querySelector("#subtask-list");
    if (!list) {
      list = document.createElement("ul");
      list.id = "subtask-list";
      shell.appendChild(list);
    }
    return list;
  };

  /** Shell steuern */
  /** @param {HTMLElement} listEl */ const openShell = (listEl) =>
    listEl?.parentElement?.classList.add("is-open");
  /** @param {HTMLElement} listEl */ const closeShell = (listEl) =>
    listEl?.parentElement?.classList.remove("is-open");
  /** @param {HTMLElement} listEl */ const checkAutoClose = (listEl) => {
    if (listEl && !listEl.querySelector("li")) closeShell(listEl);
  };

  /** Icon-Button bauen */
  /** @param {string} pathData @param {string} title */
  const makeIconButton = (pathData, title) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "at-subtask-action-btn";
    btn.title = title;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="${pathData}"/></svg>`;
    return btn;
  };

  /** Subtask-Zeile anhängen */
  /** @param {HTMLUListElement} list @param {string} text */
  const appendSubtask = (list, text) => {
    const li = document.createElement("li");
    li.className = "at-subtask-item";
    li.dataset.text = text;
    const row = document.createElement("div"),
      span = document.createElement("span"),
      tools = document.createElement("div");
    row.className = "at-subtask-row";
    span.className = "at-subtask-text";
    tools.className = "at-subtask-actions";
    span.textContent = text;
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
    list.appendChild(li);
    openShell(list);
    li.parentElement?.scrollTo({ top: li.parentElement.scrollHeight, behavior: "smooth" });
  };

  /** Editiermodus aktivieren */
  /** @param {HTMLLIElement} li */
  const enterEditMode = (li) => {
    const span = li.querySelector(".at-subtask-text");
    if (!span) return;
    const old = (li.dataset.text || span.textContent).trim();
    const input = document.createElement("input");
    input.type = "text";
    input.value = old;
    input.className = "at-subtask-edit";
    span.replaceWith(input);
    input.focus();
    input.setSelectionRange(old.length, old.length);
    const finish = (commit) => {
      const val = commit ? input.value.trim() : old;
      const ns = document.createElement("span");
      ns.className = "at-subtask-text";
      ns.textContent = val || old;
      li.dataset.text = val || old;
      input.replaceWith(ns);
    };
    input.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") finish(true);
      if (evt.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  };

  /** Subtask-Composer init */
  /** @param {HTMLElement} container */
  const initSubtaskComposer = (container) => {
    const input = q(container, "#subtask-input"),
      add = q(container, "#add-subtask-btn"),
      list = ensureSubtaskShell(container);
    add?.addEventListener("click", () => {
      const text = input?.value.trim();
      if (text) {
        appendSubtask(list, text);
        input.value = "";
      }
    });
    input?.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        const text = input.value.trim();
        if (text) {
          appendSubtask(list, text);
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

  /** Priority init */
  /** @param {HTMLElement} container */
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

  // Back-compat Aliases & Export (API bleibt gleich)
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
