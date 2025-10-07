(() => {
  const FIREBASE_BASE_URL =
    "https://join-360-fb6db-default-rtdb.europe-west1.firebasedatabase.app";
  const FIREBASE_TASKS_URL = `${FIREBASE_BASE_URL}/tasks.json`;
  const FIREBASE_CONTACTS_URL = `${FIREBASE_BASE_URL}/contacts.json`;

  const $ = (root, sel) => root.querySelector(sel);

  const initials = (fullName) => {
    const parts = String(fullName || "")
      .trim()
      .split(/\s+/);
    if (!parts[0]) return "??";
    return (
      parts[0][0] + (parts[1] ? parts[parts.length - 1][0] : parts[0][1] || "")
    ).toUpperCase();
  };

  const colorIdx = (name) =>
    (Array.from(String(name || "")).reduce((a, c) => a + c.charCodeAt(0), 0) %
      7) +
    1;

  const currentUserLower = () =>
    (
      localStorage.getItem("name") ||
      localStorage.getItem("userName") ||
      localStorage.getItem("displayName") ||
      ""
    )
      .trim()
      .toLowerCase();

  const showErr = (el, msg = "This field is required") => {
    if (!el) return;
    el.classList.add("at-error");
    const nxt = el.nextElementSibling;
    if (!(nxt && nxt.classList.contains("at-error-message"))) {
      const hint = document.createElement("div");
      hint.className = "at-error-message";
      hint.textContent = msg;
      el.insertAdjacentElement("afterend", hint);
    }
  };
  const clearErr = (el) => {
    if (!el) return;
    el.classList.remove("at-error");
    const nxt = el.nextElementSibling;
    if (nxt && nxt.classList.contains("at-error-message")) nxt.remove();
  };

  const ensureCategoryOptions = (wrap) => {
    const sel = $(wrap, "#task-category");
    if (!sel) return;
    if (sel.options.length > 0) {
      const first = sel.options[0];
      if ((first.value || "").trim() === "") {
        first.disabled = true;
        first.hidden = true;
        first.selected = true;
      }
    }
    const vals = Array.from(sel.options).map((o) =>
      (o.value || o.text).toLowerCase()
    );
    const hasTech = vals.some((v) => v.includes("technical"));
    const hasUser = vals.some((v) => v.includes("user"));
    const onlyPH =
      sel.options.length === 1 &&
      String(sel.options[0].value || "").trim() === "";
    if (!hasTech && !hasUser && onlyPH) {
      sel.add(new Option("Technical Task", "technical"));
      sel.add(new Option("User Story", "user"));
    }
  };

  const normCategory = (raw) => {
    const v = String(raw || "")
      .trim()
      .toLowerCase();
    if (v.includes("technical")) return "Technical task";
    if (v.includes("user")) return "User Story";
    return "Technical task";
  };

  function initAssigned(wrap) {
    const hidden = $(wrap, "#task-assigned");
    if (!hidden) return null;
    hidden.style.display = "none";

    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    const panel = document.createElement("div");
    const preview = document.createElement("div");

    wrapper.className = "at-assign-field";
    input.className = "at-assign-input";
    panel.className = "at-assign-dd";
    preview.id = "at-assigned-preview";

    input.type = "text";
    input.readOnly = true;
    input.placeholder = "Select contacts to assign";

    hidden.insertAdjacentElement("afterend", preview);
    hidden.insertAdjacentElement("afterend", panel);
    hidden.insertAdjacentElement("afterend", wrapper);
    wrapper.append(input, panel);

    const state = {
      selectedByName: new Map(),
      currentUserLower: currentUserLower(),
      input,
      panel,
      preview,
    };

    input.addEventListener("click", async () => {
      const closed = panel.style.display !== "block";
      if (closed) await rebuildContacts(state);
      panel.style.display = closed ? "block" : "none";
    });
    document.addEventListener("click", (e) => {
      if (!input.parentElement.contains(e.target)) panel.style.display = "none";
    });

    return {
      getSelectedUsers: () =>
        Array.from(state.selectedByName.values()).map((u) => ({
          name: u.name,
        })),
      clearSelection: () => {
        state.selectedByName.clear();
        renderAssigneePreview(state); // Preview sauber leeren
        panel.querySelectorAll(".at-assign-item").forEach((row) => {
          row.classList.remove("at-is-selected");
          row.querySelector(".at-assign-check")?.classList.remove("at-checked");
        });
      },
      inputElement: input,
      _state: state,
    };
  }

  async function rebuildContacts(state) {
    const { panel, selectedByName, currentUserLower } = state;
    panel.innerHTML = "";

    let contacts = [];
    try {
      const resp = await fetch(FIREBASE_CONTACTS_URL);
      const payload = await resp.json();
      contacts =
        payload && typeof payload === "object"
          ? Object.values(payload)
              .map((c) => c?.name)
              .filter(Boolean)
          : [];
    } catch {}

    if (contacts.length === 0) {
      contacts = [
        "Sofia Müller",
        "Anton Mayer",
        "Anja Schulz",
        "Benedikt Ziegler",
        "David Eisenberg",
      ];
    }

    contacts.forEach((name) => {
      const row = document.createElement("div");
      row.className = "at-assign-item";
      row.dataset.name = name;

      const avatar = document.createElement("div");
      avatar.className = `at-assign-avatar at-av-c${colorIdx(name)}`;
      avatar.textContent = initials(name);

      const label = document.createElement("div");
      label.className = "at-assign-name";
      label.textContent =
        name.trim().toLowerCase() === currentUserLower ? `${name} (You)` : name;

      const check = document.createElement("span");
      check.className = "at-assign-check";

      if (selectedByName.has(name)) {
        row.classList.add("at-is-selected");
        check.classList.add("at-checked");
      }

      row.append(avatar, label, check);
      row.addEventListener("click", () => toggleAssignee(state, name));
      panel.appendChild(row);
    });

    // markiere bereits ausgewählte erneut
    for (const { name } of selectedByName.values()) {
      panel.querySelectorAll(".at-assign-item").forEach((r) => {
        if (r.dataset.name === name) r.classList.add("at-is-selected");
      });
    }
  }

  // 🔧 NEU: einheitliches Rendern der Badges, inkl. sauberem Entfernen
  function renderAssigneePreview(state) {
    const { preview, selectedByName, panel } = state;
    preview.innerHTML = "";

    const selected = Array.from(selectedByName.values());
    if (!selected.length) return;

    const row = document.createElement("div");
    row.className = "at-assign-strip";

    selected.slice(0, 3).forEach((p) => {
      const b = document.createElement("div");
      b.className = `at-assign-badge at-badge-c${p.colorIndex}`;
      b.textContent = initials(p.name);
      b.title = `${p.name} – remove`;

      // ⛔ ohne toggleAssignee – sonst wird wieder hinzugefügt
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        // 1) aus Auswahl entfernen
        selectedByName.delete(p.name);
        // 2) im Panel Checkbox/Row visuell entmarkieren
        panel.querySelectorAll(".at-assign-item").forEach((r) => {
          if (r.dataset.name === p.name) {
            r.classList.remove("at-is-selected");
            r.querySelector(".at-assign-check")?.classList.remove("at-checked");
          }
        });
        // 3) Preview neu zeichnen
        renderAssigneePreview(state);
      });

      row.appendChild(b);
    });

    if (selected.length > 3) {
      const more = document.createElement("div");
      more.className = "at-assign-more";
      more.textContent = `+${selected.length - 3}`;
      more.title = selected
        .slice(3)
        .map((p) => p.name)
        .join(", ");
      row.appendChild(more);
    }

    const hint = document.createElement("span");
    hint.className = "at-assign-hint";
    hint.textContent = "Click to remove";

    preview.append(row, hint);
  }

  function toggleAssignee(state, name) {
    const { selectedByName, panel, input } = state;

    if (selectedByName.has(name)) {
      selectedByName.delete(name);
      panel.querySelectorAll(".at-assign-item").forEach((r) => {
        if (r.dataset.name === name) {
          r.classList.remove("at-is-selected");
          r.querySelector(".at-assign-check")?.classList.remove("at-checked");
        }
      });
    } else {
      selectedByName.set(name, { name, colorIndex: colorIdx(name) });
      panel.querySelectorAll(".at-assign-item").forEach((r) => {
        if (r.dataset.name === name) {
          r.classList.add("at-is-selected");
          r.querySelector(".at-assign-check")?.classList.add("at-checked");
        }
      });
      clearErr(input);
    }

    // 🔄 einheitlich Preview updaten
    renderAssigneePreview(state);
  }

  // ===== Subtasks: fester Container + Composer =====
  function ensureSubtaskShell(root) {
    let shell = $(root, "#subtask-shell");
    if (!shell) {
      shell = document.createElement("div");
      shell.id = "subtask-shell";
      $(root, ".task-form-right")?.appendChild(shell);
    }
    let list = shell.querySelector("#subtask-list");
    if (!list) {
      list = document.createElement("ul");
      list.id = "subtask-list";
      shell.appendChild(list);
    }
    return list;
  }

  function initSubtaskComposer(root) {
    const input = $(root, "#subtask-input");
    const addBtn = $(root, "#add-subtask-btn");
    const list = ensureSubtaskShell(root);

    const actBtn = (d, title) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "at-subtask-action-btn";
      btn.title = title;
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="${d}" /></svg>`;
      return btn;
    };

    const editMode = (li) => {
      const existing = li.querySelector(".at-subtask-edit");
      if (existing) {
        existing.focus();
        const L = existing.value.length;
        existing.setSelectionRange(L, L);
        return;
      }
      const span = li.querySelector(".at-subtask-text");
      if (!span) return;
      const old = (li.dataset.text || span.textContent).trim();
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = old;
      inp.className = "at-subtask-edit";
      span.replaceWith(inp);
      inp.focus();
      inp.setSelectionRange(old.length, old.length);
      const finish = (commit) => {
        const val = commit ? inp.value.trim() : old;
        const ns = document.createElement("span");
        ns.className = "at-subtask-text";
        ns.textContent = val || old;
        li.dataset.text = val || old;
        if (inp.parentElement) inp.replaceWith(ns);
      };
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") finish(true);
        if (e.key === "Escape") finish(false);
      });
      inp.addEventListener("blur", () => finish(true));
    };

    const appendItem = (text) => {
      if (!text) return;
      const li = document.createElement("li");
      li.className = "at-subtask-item";
      li.dataset.text = text;

      const row = document.createElement("div");
      row.className = "at-subtask-row";

      const txt = document.createElement("span");
      txt.className = "at-subtask-text";
      txt.textContent = text;

      const actions = document.createElement("div");
      actions.className = "at-subtask-actions";

      const edit = actBtn(
        "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm15.71-9.04c.39-.39.39-1.03 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.99-1.67Z",
        "Edit"
      );
      const del = actBtn(
        "M6 7h12v2H6V7Zm2 3h8l-1 9H9L8 10Zm3-7h2v2h-2V3Z",
        "Delete"
      );

      edit.addEventListener("click", (e) => {
        e.stopPropagation();
        editMode(li);
      });
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        li.remove();
      });

      actions.append(edit, del);
      row.append(txt, actions);
      li.append(row);
      list.appendChild(li);
    };

    addBtn?.addEventListener("click", () => {
      const v = input?.value.trim();
      if (v) {
        appendItem(v);
        input.value = "";
      }
    });
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = input.value.trim();
        if (v) {
          appendItem(v);
          input.value = "";
        }
      }
    });

    return {
      collect: () =>
        Array.from(root.querySelectorAll("#subtask-list li")).map((li) => ({
          text: li.dataset.text || li.textContent.trim(),
          completed: false,
        })),
      clear: () => {
        const l = ensureSubtaskShell(root);
        if (l) l.innerHTML = "";
      },
    };
  }

  function initPriority(wrap) {
    const urgent = $(wrap, ".btn-urgent");
    const medium = $(wrap, ".btn-medium");
    const low = $(wrap, ".btn-low");
    let current = "medium";
    const set = (n) => {
      current = n;
      [urgent, medium, low].forEach((b) =>
        b?.setAttribute("aria-pressed", "false")
      );
      ({ urgent, medium, low })[n]?.setAttribute("aria-pressed", "true");
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
  }

  const buildPayload = (wrap, prio, subt, assigned) => {
    const title = $(wrap, "#task-title")?.value.trim() || "";
    const desc =
      $(wrap, "#task-desc")?.value.trim() || "No description provided";
    const due = $(wrap, "#task-due")?.value.trim() || "";
    const catSel = $(wrap, "#task-category");
    const rawCat = catSel
      ? catSel.value || catSel.options[catSel.selectedIndex]?.text
      : "";
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

  async function persistTask(task) {
    const resp = await fetch(FIREBASE_TASKS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    const created = await resp.json();
    const key = created && created.name;
    if (!key) return null;
    await fetch(`${FIREBASE_BASE_URL}/tasks/${key}/id.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(key),
    });
    return key;
  }

  function attachLifecycle(wrap, prio, subt, assigned) {
    const title = $(wrap, "#task-title");
    const due = $(wrap, "#task-due");
    const cat = $(wrap, "#task-category");
    const btnCreate = $(wrap, "#create-task-btn");
    const btnClear = $(wrap, "#clear-task-btn");

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
      } catch (e) {
        console.error("Error saving task:", e);
      }
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
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("addtask-container");
    if (!root) return;

    ensureCategoryOptions(root);
    const prio = initPriority(root);
    const subt = initSubtaskComposer(root);
    const assigned = initAssigned(root);

    attachLifecycle(root, prio, subt, assigned);
  });
})();
