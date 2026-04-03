    class ActivityEntry {
      constructor(description) {
        this.entryId = makeId("entry");
        this.timestamp = new Date().toISOString();
        this.description = description;
      }
    }

    class Subtask {
      constructor(title, status = "OPEN", collaborator = "") {
        this.subtaskId = makeId("sub");
        this.title = title;
        this.status = status;
        this.collaborator = collaborator;
      }
    }

    class Project {
      constructor(name, description = "") {
        this.projectId = makeId("prj");
        this.name = name;
        this.description = description;
      }
    }

    class Collaborator {
      constructor(name, category = "INTERMEDIATE") {
        this.collaboratorId = makeId("col");
        this.name = name;
        this.category = category;
      }
    }

    class Task {
      constructor({
        title,
        description = "",
        status = "OPEN",
        priority = "MEDIUM",
        dueDate = "",
        projectId = "",
        subtasks = [],
        tags = [],
        recurrence = null,
        seriesId = ""
      }) {
        if (!String(title || "").trim()) {
          throw new Error("Task title is required");
        }
        this.taskId = makeId("tsk");
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.createdAt = new Date().toISOString();
        this.dueDate = dueDate;
        this.projectId = projectId;
        this.subtasks = subtasks;
        this.tags = tags;
        this.recurrence = recurrence;
        this.seriesId = seriesId;
        this.activityEntries = [];
      }
    }

    const state = {
      tasks: [],
      projects: [],
      collaborators: [],
      importRows: [],
      selectedCsvName: "",
      selectedCsvFile: null,
      currentFilteredTaskIds: [],
      collaboratorLimits: {
        SENIOR: 2,
        INTERMEDIATE: 5,
        JUNIOR: 10
      }
    };

    const els = {
      navButtons: Array.from(document.querySelectorAll(".nav-btn")),
      pages: Array.from(document.querySelectorAll(".page")),
      headerTotal: document.getElementById("header-total"),
      headerOpen: document.getElementById("header-open"),

      createTitle: document.getElementById("create-title"),
      createDescription: document.getElementById("create-description"),
      createStatus: document.getElementById("create-status"),
      createPriority: document.getElementById("create-priority"),
      createProjectName: document.getElementById("create-project-name"),
      createProjectDescription: document.getElementById("create-project-description"),
      createDueDate: document.getElementById("create-due-date"),
      createCollaborators: document.getElementById("create-collaborators"),
      createRecurrenceType: document.getElementById("create-recurrence-type"),
      createRecurrenceInterval: document.getElementById("create-recurrence-interval"),
      createRecurrenceStart: document.getElementById("create-recurrence-start"),
      createRecurrenceEnd: document.getElementById("create-recurrence-end"),
      createMonthlyDay: document.getElementById("create-monthly-day"),
      createTags: document.getElementById("create-tags"),
      createWeekdayChecks: Array.from(document.querySelectorAll(".create-weekday")),
      createTaskBtn: document.getElementById("create-task-btn"),
      applyLimitsBtn: document.getElementById("apply-limits-btn"),
      limitSenior: document.getElementById("limit-senior"),
      limitIntermediate: document.getElementById("limit-intermediate"),
      limitJunior: document.getElementById("limit-junior"),

      searchKeyword: document.getElementById("search-keyword"),
      searchStatus: document.getElementById("search-status"),
      searchPriority: document.getElementById("search-priority"),
      searchProject: document.getElementById("search-project"),
      searchDayOfWeek: document.getElementById("search-day-of-week"),
      searchDueFrom: document.getElementById("search-due-from"),
      searchDueTo: document.getElementById("search-due-to"),
      searchSort: document.getElementById("search-sort"),
      applyFiltersBtn: document.getElementById("apply-filters-btn"),
      clearFiltersBtn: document.getElementById("clear-filters-btn"),
      exportFilteredBtn: document.getElementById("export-filtered-btn"),
      resultsWrap: document.getElementById("results-wrap"),
      resultCount: document.getElementById("result-count"),

      dropZone: document.getElementById("drop-zone"),
      fileInput: document.getElementById("csv-file-input"),
      selectedFile: document.getElementById("selected-file"),
      parsePreviewBtn: document.getElementById("parse-preview-btn"),
      confirmImportBtn: document.getElementById("confirm-import-btn"),
      previewWrap: document.getElementById("preview-wrap"),
      importLog: document.getElementById("import-log"),
      importSummary: document.getElementById("import-summary"),

      statsGrid: document.getElementById("stats-grid"),
      exportBtn: document.getElementById("export-btn"),
      exportNote: document.getElementById("export-note"),

      taskModal: document.getElementById("task-modal"),
      closeModalBtn: document.getElementById("close-modal-btn"),
      taskModalContent: document.getElementById("task-modal-content"),
      taskModalTitle: document.getElementById("task-modal-title"),

      toasts: document.getElementById("toasts"),

      // iCal export elements
      icalMode: document.getElementById("ical-mode"),
      icalTaskSelect: document.getElementById("ical-task-select"),
      icalProjectSelect: document.getElementById("ical-project-select"),
      icalTaskField: document.getElementById("ical-task-field"),
      icalProjectField: document.getElementById("ical-project-field"),
      icalExportBtn: document.getElementById("ical-export-btn"),
      icalExportNote: document.getElementById("ical-export-note"),

      // Overloaded page
      overloadedList: document.getElementById("overloaded-list")
    };

    const PRIORITY_WEIGHT = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    const RECOGNIZED_HEADERS = {
      taskname: "TaskName",
      description: "Description",
      subtask: "Subtask",
      status: "Status",
      priority: "Priority",
      duedate: "DueDate",
      projectname: "ProjectName",
      projectdescription: "ProjectDescription",
      collaboratorname: "CollaboratorName",
      collaboratorcategory: "CollaboratorCategory",
      collaborators: "Collaborators",
      tags: "Tags"
      ,
      recurrencetype: "RecurrenceType",
      recurrenceinterval: "RecurrenceInterval",
      recurrencestart: "RecurrenceStart",
      recurrenceend: "RecurrenceEnd",
      recurrenceweekdays: "RecurrenceWeekdays",
      recurrencemonthday: "RecurrenceMonthDay"
    };

    // ==================== PERSISTENCY LAYER ====================
    const PersistenceGateway = {
      STORAGE_KEY: "ptms_state",
      save() {
        try {
          const data = {
            tasks: state.tasks,
            projects: state.projects,
            collaborators: state.collaborators,
            collaboratorLimits: state.collaboratorLimits
          };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn("Persistence save failed:", e);
        }
      },
      load() {
        try {
          const raw = localStorage.getItem(this.STORAGE_KEY);
          if (!raw) return false;
          const data = JSON.parse(raw);
          if (data.tasks) state.tasks = data.tasks;
          if (data.projects) state.projects = data.projects;
          if (data.collaborators) state.collaborators = data.collaborators;
          if (data.collaboratorLimits) state.collaboratorLimits = data.collaboratorLimits;
          return true;
        } catch (e) {
          console.warn("Persistence load failed:", e);
          return false;
        }
      },
      clear() {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    };

    function persistState() {
      PersistenceGateway.save();
    }

    // ==================== iCal EXPORT GATEWAY ====================
    const ICalGateway = {
      generateUID() {
        return "ptms-" + Math.random().toString(36).slice(2, 14) + "@ptms";
      },
      escapeICalText(text) {
        return String(text || "")
          .replace(/\\/g, "\\\\")
          .replace(/;/g, "\\;")
          .replace(/,/g, "\\,")
          .replace(/\n/g, "\\n");
      },
      formatICalDate(isoDate) {
        // Convert YYYY-MM-DD to YYYYMMDD (all-day VALUE=DATE)
        return String(isoDate).replace(/-/g, "");
      },
      buildVEvent(task, projectName) {
        const lines = [];
        lines.push("BEGIN:VEVENT");
        lines.push("UID:" + this.generateUID());
        lines.push("DTSTAMP:" + this.nowStamp());
        lines.push("DTSTART;VALUE=DATE:" + this.formatICalDate(task.dueDate));
        lines.push("DTEND;VALUE=DATE:" + this.formatICalDate(addDays(task.dueDate, 1)));
        lines.push("SUMMARY:" + this.escapeICalText(task.title));

        // Build description with status, priority, project, and subtask summary
        let desc = "";
        if (task.description) desc += task.description + "\n\n";
        desc += "Status: " + task.status + "\n";
        desc += "Priority: " + task.priority + "\n";
        if (projectName) desc += "Project: " + projectName + "\n";
        if (task.subtasks && task.subtasks.length > 0) {
          desc += "\nSubtasks (" + task.subtasks.length + "):\n";
          task.subtasks.forEach((s, i) => {
            const mark = s.status === "COMPLETED" ? "[x]" : "[ ]";
            desc += "  " + mark + " " + s.title;
            if (s.collaborator) desc += " (" + s.collaborator + ")";
            desc += "\n";
          });
        }
        lines.push("DESCRIPTION:" + this.escapeICalText(desc));
        lines.push("END:VEVENT");
        return lines.join("\r\n");
      },
      nowStamp() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return d.getUTCFullYear() +
          pad(d.getUTCMonth() + 1) +
          pad(d.getUTCDate()) + "T" +
          pad(d.getUTCHours()) +
          pad(d.getUTCMinutes()) +
          pad(d.getUTCSeconds()) + "Z";
      },
      exportTasks(tasks) {
        // Filter: only tasks with a due date are eligible
        const eligible = tasks.filter((t) => t.dueDate);
        if (!eligible.length) {
          return { ok: false, message: "No eligible tasks (only tasks with a due date can be exported)." };
        }

        const lines = [];
        lines.push("BEGIN:VCALENDAR");
        lines.push("VERSION:2.0");
        lines.push("PRODID:-//PTMS//Personal Task Management System//EN");
        lines.push("CALSCALE:GREGORIAN");
        lines.push("METHOD:PUBLISH");

        eligible.forEach((task) => {
          const project = getProjectById(task.projectId);
          const projectName = project ? project.name : "";
          lines.push(this.buildVEvent(task, projectName));
        });

        lines.push("END:VCALENDAR");
        return { ok: true, content: lines.join("\r\n"), count: eligible.length };
      }
    };

    // ==================== OCL CONSTRAINTS ====================
    const OCLConstraints = {
      // "A task cannot have more than 20 sub-tasks."
      maxSubtasks(task) {
        return task.subtasks.length <= 20;
      },
      // "The number of open tasks without a due date should not exceed 50."
      maxOpenTasksWithoutDueDate() {
        const count = state.tasks.filter((t) => isOpenLikeStatus(t.status) && !t.dueDate).length;
        return count <= 50;
      },
      // "The limit for open tasks for each collaborator category is a positive integer."
      limitsArePositive() {
        return state.collaboratorLimits.SENIOR >= 1 &&
               state.collaboratorLimits.INTERMEDIATE >= 1 &&
               state.collaboratorLimits.JUNIOR >= 1;
      },
      // "No collaborator must be overloaded."
      noCollaboratorOverloaded() {
        return getOverloadedCollaborators().length === 0;
      },
      // Validate all constraints, return array of violations
      validate(taskForSubtaskCheck) {
        const violations = [];
        if (taskForSubtaskCheck && !this.maxSubtasks(taskForSubtaskCheck)) {
          violations.push("A task cannot have more than 20 sub-tasks.");
        }
        if (!this.maxOpenTasksWithoutDueDate()) {
          violations.push("The number of open tasks without a due date must not exceed 50.");
        }
        if (!this.limitsArePositive()) {
          violations.push("Collaborator category limits must be positive integers.");
        }
        return violations;
      }
    };

    function getOverloadedCollaborators() {
      return state.collaborators
        .map((c) => {
          const openCount = countOpenAssignments(c.name);
          const limit = state.collaboratorLimits[c.category] || state.collaboratorLimits.INTERMEDIATE;
          return { name: c.name, category: c.category, openCount, limit, over: openCount - limit };
        })
        .filter((c) => c.openCount > c.limit);
    }

    bindEvents();
    init();

    function init() {
      const loaded = PersistenceGateway.load();
      if (loaded) {
        appendLog("info", "Loaded persisted data from localStorage.");
      }
      // Sync limit inputs from state
      els.limitSenior.value = state.collaboratorLimits.SENIOR;
      els.limitIntermediate.value = state.collaboratorLimits.INTERMEDIATE;
      els.limitJunior.value = state.collaboratorLimits.JUNIOR;

      renderSearchProjectOptions();
      applySearchAndRender();
      renderStats();
      renderICalOptions();
      renderOverloadedList();
      appendLog("info", "Import console ready. Select a CSV file to begin.");
    }

    function bindEvents() {
      els.navButtons.forEach((btn) => {
        btn.addEventListener("click", () => switchPage(btn.dataset.page));
      });

      els.createTaskBtn.addEventListener("click", handleCreateTask);
      els.applyLimitsBtn.addEventListener("click", handleApplyCollaboratorLimits);

      els.applyFiltersBtn.addEventListener("click", () => applySearchAndRender());
      els.clearFiltersBtn.addEventListener("click", () => {
        resetSearchFilters();
        applySearchAndRender();
      });
      els.exportFilteredBtn.addEventListener("click", handleExportFiltered);

      els.dropZone.addEventListener("click", () => els.fileInput.click());
      els.dropZone.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          els.fileInput.click();
        }
      });

      ["dragenter", "dragover"].forEach((eventName) => {
        els.dropZone.addEventListener(eventName, (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          els.dropZone.classList.add("drag-over");
        });
      });

      ["dragleave", "drop"].forEach((eventName) => {
        els.dropZone.addEventListener(eventName, (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          els.dropZone.classList.remove("drag-over");
        });
      });

      els.dropZone.addEventListener("drop", (ev) => {
        const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
        handleSelectedFile(file);
      });

      els.fileInput.addEventListener("change", (ev) => {
        const file = ev.target.files && ev.target.files[0];
        handleSelectedFile(file);
      });

      els.parsePreviewBtn.addEventListener("click", handleParsePreview);
      els.confirmImportBtn.addEventListener("click", handleConfirmImport);

      els.exportBtn.addEventListener("click", handleExport);

      // iCal export
      els.icalMode.addEventListener("change", handleICalModeChange);
      els.icalExportBtn.addEventListener("click", handleICalExport);

      els.closeModalBtn.addEventListener("click", closeModal);
      els.taskModal.addEventListener("click", (ev) => {
        if (ev.target === els.taskModal) {
          closeModal();
        }
      });
      document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && els.taskModal.classList.contains("open")) {
          closeModal();
        }
      });
    }

    function switchPage(pageId) {
      els.navButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.page === pageId));
      els.pages.forEach((page) => page.classList.toggle("active", page.id === pageId));
      if (pageId === "search-page") {
        applySearchAndRender();
      }
      if (pageId === "export-page") {
        renderStats();
      }
      if (pageId === "ical-page") {
        renderICalOptions();
      }
      if (pageId === "overloaded-page") {
        renderOverloadedList();
      }
    }

    function updateHeaderMetrics() {
      els.headerTotal.textContent = String(state.tasks.length);
      const openCount = state.tasks.filter((t) => t.status === "OPEN").length;
      els.headerOpen.textContent = String(openCount);
    }

    function resetSearchFilters() {
      els.searchKeyword.value = "";
      els.searchStatus.value = "";
      els.searchPriority.value = "";
      els.searchProject.value = "";
      els.searchDayOfWeek.value = "";
      els.searchDueFrom.value = "";
      els.searchDueTo.value = "";
      els.searchSort.value = "due_asc";
    }

    function applySearchAndRender() {
      const keyword = els.searchKeyword.value.trim().toLowerCase();
      const status = els.searchStatus.value;
      const priority = els.searchPriority.value;
      const projectId = els.searchProject.value;
      const dayOfWeek = els.searchDayOfWeek.value;
      const dueFrom = els.searchDueFrom.value;
      const dueTo = els.searchDueTo.value;
      const sort = els.searchSort.value;

      const hasAnyCriteria = Boolean(keyword || status || priority || projectId || dayOfWeek || dueFrom || dueTo);

      let results = state.tasks.filter((task) => {
        if (keyword) {
          const hay = (task.title + " " + task.description).toLowerCase();
          if (!hay.includes(keyword)) return false;
        }
        if (status && task.status !== status) return false;
        if (priority && task.priority !== priority) return false;
        if (projectId && task.projectId !== projectId) return false;
        if (dayOfWeek) {
          if (!task.dueDate) return false;
          const dueDay = getDayOfWeek(task.dueDate);
          if (String(dueDay) !== String(dayOfWeek)) return false;
        }
        if (dueFrom && (!task.dueDate || task.dueDate < dueFrom)) return false;
        if (dueTo && (!task.dueDate || task.dueDate > dueTo)) return false;
        if (!hasAnyCriteria && task.status !== "OPEN") return false;
        return true;
      });

      results = sortTasks(results, sort);
      state.currentFilteredTaskIds = results.map((t) => t.taskId);
      renderResultsTable(results, hasAnyCriteria);
      updateHeaderMetrics();
      renderStats();
    }

    function sortTasks(tasks, sort) {
      const copy = tasks.slice();
      copy.sort((a, b) => {
        if (sort === "due_asc") {
          const av = a.dueDate || "9999-12-31";
          const bv = b.dueDate || "9999-12-31";
          return av.localeCompare(bv) || a.title.localeCompare(b.title);
        }
        if (sort === "priority_desc") {
          return (PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]) || a.title.localeCompare(b.title);
        }
        if (sort === "title_asc") {
          return a.title.localeCompare(b.title);
        }
        if (sort === "created_desc") {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return 0;
      });
      return copy;
    }

    function renderResultsTable(tasks, hasCriteria) {
      els.resultCount.textContent = hasCriteria
        ? `${tasks.length} result(s)`
        : `${tasks.length} open task(s) in default view`;

      if (!tasks.length) {
        els.resultsWrap.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="18" y="20" width="84" height="78" rx="10" stroke="#496080" stroke-width="4" />
              <path d="M34 45h52M34 59h35M34 73h43" stroke="#73A0D9" stroke-width="4" stroke-linecap="round" />
              <circle cx="87" cy="80" r="12" stroke="#4fd187" stroke-width="4" />
              <path d="M82 80l4 4 7-8" stroke="#4fd187" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div style="margin-top:10px;">No tasks found for the selected criteria.</div>
          </div>
        `;
        return;
      }

      const rows = tasks.map((task) => {
        const project = getProjectById(task.projectId);
        const tags = task.tags.length
          ? task.tags.map((tag) => `<span class="badge tag">${esc(tag)}</span>`).join("")
          : `<span class="muted">-</span>`;

        return `
          <tr class="task-row" data-task-id="${esc(task.taskId)}">
            <td>${esc(task.title)}</td>
            <td>${statusBadge(task.status)}</td>
            <td>${priorityBadge(task.priority)}</td>
            <td>${project ? esc(project.name) : "<span class='muted'>-</span>"}</td>
            <td class="mono">${task.dueDate ? esc(task.dueDate) : "<span class='muted'>-</span>"}</td>
            <td>${task.subtasks.length}</td>
            <td>${tags}</td>
          </tr>
        `;
      }).join("");

      els.resultsWrap.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Project</th>
                <th>Due Date</th>
                <th>Subtasks</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;

      Array.from(els.resultsWrap.querySelectorAll(".task-row")).forEach((row) => {
        row.addEventListener("click", () => {
          const task = state.tasks.find((t) => t.taskId === row.dataset.taskId);
          if (task) openTaskModal(task);
        });
      });
    }

    function openTaskModal(task) {
      const project = getProjectById(task.projectId);

      const subtasksHtml = task.subtasks.length
        ? task.subtasks.map((s) => {
            const mark = s.status === "COMPLETED" ? "[x]" : "[ ]";
            return `<div class="list-row"><div><span class="subtask-check mono">${mark}</span>${esc(s.title)}</div><div class="muted">${s.collaborator ? esc(s.collaborator) : "-"}</div></div>`;
          }).join("")
        : `<div class="muted">No subtasks.</div>`;

      const activitiesHtml = task.activityEntries.length
        ? task.activityEntries
            .slice()
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .map((entry) => {
              return `<div class="list-row"><div>${esc(entry.description)}</div><div class="mono muted">${esc(entry.timestamp)}</div></div>`;
            }).join("")
        : `<div class="muted">No activity entries.</div>`;

      const tags = task.tags.length ? task.tags.map((tag) => `<span class="badge tag">${esc(tag)}</span>`).join("") : "<span class='muted'>-</span>";

      els.taskModalTitle.textContent = `Task Details: ${task.title}`;
      els.taskModalContent.innerHTML = `
        <div class="detail-grid">
          <div class="detail-item"><div class="label">Task ID</div><div class="value mono">${esc(task.taskId)}</div></div>
          <div class="detail-item"><div class="label">Created At</div><div class="value mono">${esc(task.createdAt)}</div></div>
          <div class="detail-item"><div class="label">Title</div><div class="value">${esc(task.title)}</div></div>
          <div class="detail-item"><div class="label">Description</div><div class="value">${task.description ? esc(task.description) : "<span class='muted'>-</span>"}</div></div>
          <div class="detail-item"><div class="label">Status</div><div class="value">${statusBadge(task.status)}</div></div>
          <div class="detail-item"><div class="label">Priority</div><div class="value">${priorityBadge(task.priority)}</div></div>
          <div class="detail-item"><div class="label">Due Date</div><div class="value mono">${task.dueDate ? esc(task.dueDate) : "<span class='muted'>-</span>"}</div></div>
          <div class="detail-item"><div class="label">Project</div><div class="value">${project ? esc(project.name) : "<span class='muted'>-</span>"}</div></div>
          <div class="detail-item"><div class="label">Project Description</div><div class="value">${project && project.description ? esc(project.description) : "<span class='muted'>-</span>"}</div></div>
          <div class="detail-item"><div class="label">Tags</div><div class="value">${tags}</div></div>
        </div>

        <div class="detail-section">
          <h4 style="margin: 0 0 8px; font-family: var(--heading-font);">Subtasks (${task.subtasks.length})</h4>
          <div class="list">${subtasksHtml}</div>
        </div>

        <div class="detail-section">
          <h4 style="margin: 0 0 8px; font-family: var(--heading-font);">Activity History (${task.activityEntries.length})</h4>
          <div class="list">${activitiesHtml}</div>
        </div>

        <div class="detail-section">
          <div class="btn-row">
            <button class="btn success modal-ical-export-btn" type="button" data-task-id="${esc(task.taskId)}"${task.dueDate ? '' : ' disabled'}>📅 Export to iCal (.ics)</button>
            ${task.dueDate ? '' : '<span class="muted">Task has no due date — not eligible for iCal export.</span>'}
          </div>
        </div>
      `;

      els.taskModal.classList.add("open");
      els.taskModal.setAttribute("aria-hidden", "false");

      // Bind modal iCal export button
      const modalICalBtn = els.taskModalContent.querySelector(".modal-ical-export-btn");
      if (modalICalBtn) {
        modalICalBtn.addEventListener("click", () => {
          const t = state.tasks.find((x) => x.taskId === modalICalBtn.dataset.taskId);
          if (t) {
            const result = ICalGateway.exportTasks([t]);
            if (result.ok) {
              const filename = "ptms-task-" + new Date().toISOString().slice(0, 10) + ".ics";
              downloadText(filename, result.content, "text/calendar;charset=utf-8");
              toast("Exported task to " + filename, "ok");
            } else {
              toast(result.message, "warn");
            }
          }
        });
      }
    }

    function closeModal() {
      els.taskModal.classList.remove("open");
      els.taskModal.setAttribute("aria-hidden", "true");
      els.taskModalContent.innerHTML = "";
    }

    function handleSelectedFile(file) {
      if (!file) {
        return;
      }
      const isCsv = /\.csv$/i.test(file.name) || file.type === "text/csv";
      if (!isCsv) {
        toast("Only .csv files are supported.", "error");
        appendLog("error", `Rejected file '${safeForLog(file.name)}' (not CSV).`);
        return;
      }
      state.selectedCsvName = file.name;
      state.selectedCsvFile = file;
      els.selectedFile.textContent = `Selected: ${file.name}`;
      try {
        els.fileInput.files = createFileList(file);
      } catch (err) {
        // Some browser contexts may not allow assigning FileList programmatically.
      }
      appendLog("info", `File selected: ${safeForLog(file.name)}`);
      els.confirmImportBtn.disabled = true;
      state.importRows = [];
      els.previewWrap.innerHTML = "";
      els.importSummary.textContent = "";
    }

    function createFileList(file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      return dt.files;
    }

    async function handleParsePreview() {
      const file = state.selectedCsvFile || (els.fileInput.files && els.fileInput.files[0]);
      if (!file) {
        toast("Please choose a CSV file first.", "warn");
        appendLog("warn", "Parse requested with no file selected.");
        return;
      }

      try {
        const text = await file.text();
        const rows = parseCsv(text);
        if (!rows.length) {
          toast("CSV appears empty.", "warn");
          appendLog("warn", "CSV parsed with 0 data rows.");
          els.confirmImportBtn.disabled = true;
          state.importRows = [];
          renderPreview([]);
          return;
        }

        const headerInfo = buildHeaderInfo(rows[0]);
        if (!headerInfo.hasTaskName) {
          toast("CSV must include a TaskName header.", "error");
          appendLog("error", "CSV missing required header: TaskName.");
          els.confirmImportBtn.disabled = true;
          state.importRows = [];
          renderPreview([]);
          return;
        }

        const mapped = mapRowsByHeader(rows, headerInfo.map);
        state.importRows = mapped;
        renderPreview(mapped.slice(0, 8));
        els.confirmImportBtn.disabled = mapped.length === 0;
        appendLog("ok", `Parsed ${mapped.length} row(s). Previewing first ${Math.min(8, mapped.length)} row(s).`);
      } catch (err) {
        toast("Failed to parse CSV file.", "error");
        appendLog("error", `CSV parse failed: ${safeForLog(err.message || String(err))}`);
        els.confirmImportBtn.disabled = true;
      }
    }

    function renderPreview(rows) {
      if (!rows.length) {
        els.previewWrap.innerHTML = `
          <div class="empty-state" style="margin-top:12px;">
            <div>No preview available.</div>
          </div>
        `;
        return;
      }

      const columns = [
        "TaskName", "Description", "Status", "Priority", "DueDate", "ProjectName", "Subtask", "CollaboratorName", "CollaboratorCategory", "Tags"
      ];

      const headerHtml = columns.map((c) => `<th>${esc(c)}</th>`).join("");
      const rowHtml = rows.map((r) => {
        const cells = columns.map((c) => `<td>${r[c] ? esc(r[c]) : "<span class='muted'>-</span>"}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");

      els.previewWrap.innerHTML = `
        <h4 style="margin:10px 0 8px; font-family: var(--heading-font); letter-spacing:0.03em;">Preview (first ${rows.length} row(s))</h4>
        <div class="table-wrap" style="max-height:300px;">
          <table>
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowHtml}</tbody>
          </table>
        </div>
      `;
    }

    function handleConfirmImport() {
      if (!state.importRows.length) {
        toast("No parsed rows to import.", "warn");
        appendLog("warn", "Import attempted before parsing rows.");
        return;
      }

      let created = 0;
      let skipped = 0;
      const total = state.importRows.length;

      state.importRows.forEach((row, index) => {
        const rowNo = index + 1;
        const taskNameRaw = (row.TaskName || "").trim();
        if (!taskNameRaw) {
          skipped += 1;
          appendLog("warn", `[row ${rowNo}] skipped: TaskName is required.`);
          return;
        }

        const dueDateNorm = normalizeDate(row.DueDate);
        if ((row.DueDate || "").trim() && !dueDateNorm) {
          appendLog("warn", `[row ${rowNo}] due date '${safeForLog(row.DueDate)}' invalid; stored as blank.`);
        }

        const statusNorm = normalizeStatus(row.Status);
        const priorityNorm = normalizePriority(row.Priority);

        const projectName = (row.ProjectName || "").trim();
        const project = projectName ? ensureProject(projectName) : null;

        const tags = splitTags(row.Tags);

        const dupe = findTaskByNameAndDue(taskNameRaw, dueDateNorm);

        const subtaskTitle = (row.Subtask || "").trim();
        const collaboratorName = (row.CollaboratorName || "").trim();
        const collaboratorCategory = normalizeCollaboratorCategory(row.CollaboratorCategory);

        if (collaboratorName) {
          ensureCollaborator(collaboratorName, collaboratorCategory);
        }

        if (dupe) {
          skipped += 1;
          let merged = false;

          if (subtaskTitle) {
            const existsSub = dupe.subtasks.some((st) => {
              return st.title.trim().toLowerCase() === subtaskTitle.toLowerCase() &&
                (st.collaborator || "").trim().toLowerCase() === collaboratorName.toLowerCase();
            });
            if (!existsSub) {
              if (dupe.subtasks.length >= 20) {
                appendLog("warn", `[row ${rowNo}] subtask skipped: task already has 20 sub-tasks (OCL limit).`);
              } else {
                dupe.subtasks.push(new Subtask(subtaskTitle, "OPEN", collaboratorName));
                merged = true;
              }
            }
          }

          tags.forEach((tag) => {
            if (!dupe.tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
              dupe.tags.push(tag);
              merged = true;
            }
          });

          if (merged) {
            dupe.activityEntries.push(new ActivityEntry("CSV row merged into existing task"));
            appendLog("skip", `[row ${rowNo}] duplicate skipped; merged subtask/tag data into existing task.`);
          } else {
            appendLog("skip", `[row ${rowNo}] duplicate skipped; no new merge data.`);
          }
          return;
        }

        const task = new Task({
          title: taskNameRaw,
          description: (row.Description || "").trim(),
          status: statusNorm,
          priority: priorityNorm,
          dueDate: dueDateNorm,
          projectId: project ? project.projectId : "",
          subtasks: [],
          tags
        });

        if (subtaskTitle) {
          task.subtasks.push(new Subtask(subtaskTitle, "OPEN", collaboratorName));
        }

        task.activityEntries.push(new ActivityEntry("Task created via CSV import"));
        state.tasks.push(task);
        created += 1;

        appendLog("ok", `[row ${rowNo}] ok: task '${safeForLog(task.title)}' created.`);
      });

      const summary = `Import complete: ${created} created, ${skipped} skipped, ${total} total.`;
      els.importSummary.textContent = summary;
      appendLog("info", summary);

      toast(`Import finished: ${created} created, ${skipped} skipped.`, created > 0 ? "ok" : "warn");

      // OCL: post-import constraint checks (warn but don't undo)
      const oclViolations = OCLConstraints.validate();
      if (oclViolations.length) {
        oclViolations.forEach((v) => {
          toast("OCL Warning: " + v, "warn");
          appendLog("warn", "OCL Constraint violated: " + v);
        });
      }

      renderSearchProjectOptions();
      applySearchAndRender();
      renderStats();
      persistState();
      state.importRows = [];
      els.confirmImportBtn.disabled = true;
    }

    function handleCreateTask() {
      const title = String(els.createTitle.value || "").trim();
      if (!title) {
        toast("Task name is required.", "error");
        return;
      }

      const description = String(els.createDescription.value || "").trim();
      const status = normalizeStatus(els.createStatus.value);
      const priority = normalizePriority(els.createPriority.value);
      const tags = splitTags(els.createTags.value);

      const projectName = String(els.createProjectName.value || "").trim();
      const projectDescription = String(els.createProjectDescription.value || "").trim();
      const project = projectName ? ensureProject(projectName, projectDescription) : null;

      const collaborators = parseCollaboratorsInput(els.createCollaborators.value);
      collaborators.forEach((c) => ensureCollaborator(c.name, c.category));

      const recurrence = buildRecurrenceFromCreateForm();
      if (recurrence && recurrence.error) {
        toast(recurrence.error, "error");
        return;
      }

      let dueDates = [];
      if (recurrence && recurrence.type !== "NONE") {
        dueDates = generateOccurrenceDates(recurrence);
        if (!dueDates.length) {
          toast("No occurrences generated. Check recurrence settings.", "error");
          return;
        }
      } else {
        const due = normalizeDate(els.createDueDate.value);
        dueDates = [due || ""];
      }

      const openAssignmentsPerCollaborator = isOpenLikeStatus(status) ? dueDates.length : 0;
      const assignmentCheck = canAssignCollaborators(collaborators, openAssignmentsPerCollaborator);
      if (!assignmentCheck.ok) {
        toast(assignmentCheck.message, "error");
        return;
      }

      // OCL pre-check: open tasks without due date limit
      if (isOpenLikeStatus(status)) {
        const noDueDateCount = dueDates.filter((d) => !d).length;
        if (noDueDateCount > 0) {
          const currentNoDue = state.tasks.filter((t) => isOpenLikeStatus(t.status) && !t.dueDate).length;
          if (currentNoDue + noDueDateCount > 50) {
            toast("OCL Constraint: Cannot exceed 50 open tasks without a due date.", "error");
            return;
          }
        }
      }

      const seriesId = dueDates.length > 1 ? makeId("series") : "";
      let created = 0;
      let skipped = 0;

      dueDates.forEach((dueDate) => {
        if (findTaskByNameAndDue(title, dueDate)) {
          skipped += 1;
          return;
        }

        const task = new Task({
          title,
          description,
          status,
          priority,
          dueDate,
          projectId: project ? project.projectId : "",
          subtasks: collaborators.map((c) => new Subtask(`Collaborator: ${c.name}`, "OPEN", c.name)),
          tags,
          recurrence: recurrence && recurrence.type !== "NONE" ? recurrence : null,
          seriesId
        });

        task.activityEntries.push(new ActivityEntry("Task created from Create Task form"));
        if (task.seriesId) {
          task.activityEntries.push(new ActivityEntry(`Generated from recurrence series ${task.seriesId}`));
        }
        state.tasks.push(task);
        created += 1;
      });

      if (!created) {
        toast("No tasks were created (likely duplicate TaskName + DueDate).", "warn");
        return;
      }

      // OCL: check constraints after creation
      const oclViolations = OCLConstraints.validate();
      if (oclViolations.length) {
        oclViolations.forEach((v) => toast("OCL Constraint: " + v, "warn"));
      }

      applySearchAndRender();
      renderSearchProjectOptions();
      renderStats();
      persistState();
      toast(`Created ${created} task(s).${skipped ? ` Skipped ${skipped} duplicate(s).` : ""}`, "ok");
    }

    function handleApplyCollaboratorLimits() {
      const senior = Number(els.limitSenior.value);
      const intermediate = Number(els.limitIntermediate.value);
      const junior = Number(els.limitJunior.value);

      if (senior < 1 || intermediate < 1 || junior < 1 || !Number.isFinite(senior) || !Number.isFinite(intermediate) || !Number.isFinite(junior)) {
        toast("Limits must be valid positive numbers.", "error");
        return;
      }

      state.collaboratorLimits.SENIOR = senior;
      state.collaboratorLimits.INTERMEDIATE = intermediate;
      state.collaboratorLimits.JUNIOR = junior;

      const overloaded = state.collaborators
        .map((c) => {
          const openCount = countOpenAssignments(c.name);
          const limit = state.collaboratorLimits[c.category] || state.collaboratorLimits.INTERMEDIATE;
          return { name: c.name, category: c.category, openCount, limit };
        })
        .filter((c) => c.openCount > c.limit);

      if (overloaded.length) {
        toast(`Limits updated. ${overloaded.length} collaborator(s) currently overloaded.`, "warn");
      } else {
        toast("Collaborator limits updated.", "ok");
      }
      persistState();
    }

    function handleExportFiltered() {
      const filtered = state.tasks.filter((t) => state.currentFilteredTaskIds.includes(t.taskId));
      if (!filtered.length) {
        toast("No filtered results to export.", "warn");
        return;
      }
      exportTasksToCsv(filtered, "ptms-search-results");
    }

    function parseCollaboratorsInput(raw) {
      const entries = String(raw || "")
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean);

      const out = [];
      entries.forEach((entry) => {
        const pair = entry.split(":");
        const name = String(pair[0] || "").trim();
        if (!name) return;
        const categoryRaw = String(pair[1] || "").trim();
        const existing = findCollaboratorByName(name);
        const category = categoryRaw
          ? normalizeCollaboratorCategory(categoryRaw)
          : (existing ? existing.category : "INTERMEDIATE");
        if (!out.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
          out.push({ name, category });
        }
      });
      return out;
    }

    function buildRecurrenceFromCreateForm() {
      const type = String(els.createRecurrenceType.value || "NONE").toUpperCase();
      const interval = Number(els.createRecurrenceInterval.value || 1);
      const start = normalizeDate(els.createRecurrenceStart.value);
      const end = normalizeDate(els.createRecurrenceEnd.value);

      if (type === "NONE") {
        return { type: "NONE" };
      }

      if (!start || !end) {
        return { error: "Recurrence start and end date are required for recurring tasks." };
      }
      if (start > end) {
        return { error: "Recurrence start date must be before or equal to end date." };
      }
      if (!Number.isFinite(interval) || interval < 1) {
        return { error: "Recurrence interval must be >= 1." };
      }

      const weekdays = els.createWeekdayChecks
        .filter((c) => c.checked)
        .map((c) => Number(c.value));
      const monthDay = Number(els.createMonthlyDay.value || 0);

      return {
        type,
        interval,
        start,
        end,
        weekdays,
        monthDay: monthDay >= 1 && monthDay <= 31 ? monthDay : null
      };
    }

    function generateOccurrenceDates(recurrence) {
      const type = recurrence.type;
      if (type === "DAILY") {
        const out = [];
        let cursor = recurrence.start;
        while (cursor <= recurrence.end) {
          out.push(cursor);
          cursor = addDays(cursor, recurrence.interval);
        }
        return out;
      }

      if (type === "WEEKLY") {
        const out = [];
        const selectedDays = recurrence.weekdays.length
          ? recurrence.weekdays.slice()
          : [getDayOfWeek(recurrence.start)];
        const startDate = parseIsoDate(recurrence.start);
        let cursor = recurrence.start;
        while (cursor <= recurrence.end) {
          const day = getDayOfWeek(cursor);
          const diffDays = Math.floor((parseIsoDate(cursor).getTime() - startDate.getTime()) / 86400000);
          const weekIndex = Math.floor(diffDays / 7);
          if (selectedDays.includes(day) && (weekIndex % recurrence.interval === 0)) {
            out.push(cursor);
          }
          cursor = addDays(cursor, 1);
        }
        return out;
      }

      if (type === "MONTHLY") {
        const out = [];
        const start = parseIsoDate(recurrence.start);
        const end = parseIsoDate(recurrence.end);
        const targetDay = recurrence.monthDay || start.getUTCDate();

        let year = start.getUTCFullYear();
        let month = start.getUTCMonth();

        while (true) {
          const monthStart = new Date(Date.UTC(year, month, 1));
          if (monthStart > end) break;

          const candidate = dateOnMonthDay(year, month, targetDay);
          if (candidate && candidate >= start && candidate <= end) {
            out.push(toIsoDate(candidate));
          }

          const next = addMonthsUtc(year, month, recurrence.interval);
          year = next.year;
          month = next.month;
        }
        return out;
      }

      return [];
    }

    function canAssignCollaborators(collaborators, increment) {
      if (!collaborators.length || increment <= 0) {
        return { ok: true };
      }

      for (const collaborator of collaborators) {
        const existing = findCollaboratorByName(collaborator.name);
        const category = existing ? existing.category : collaborator.category;
        const limit = state.collaboratorLimits[category] || state.collaboratorLimits.INTERMEDIATE;
        const current = countOpenAssignments(collaborator.name);
        if (current + increment > limit) {
          return {
            ok: false,
            message: `${collaborator.name} (${category}) would exceed limit ${limit}. Current=${current}, New=${increment}.`
          };
        }
      }
      return { ok: true };
    }

    function countOpenAssignments(collaboratorName) {
      const needle = String(collaboratorName || "").trim().toLowerCase();
      if (!needle) return 0;
      let count = 0;
      state.tasks.forEach((task) => {
        if (!isOpenLikeStatus(task.status)) return;
        task.subtasks.forEach((sub) => {
          if (!isOpenLikeStatus(sub.status)) return;
          if (String(sub.collaborator || "").trim().toLowerCase() === needle) {
            count += 1;
          }
        });
      });
      return count;
    }

    function isOpenLikeStatus(status) {
      return status === "OPEN" || status === "IN_PROGRESS";
    }

    function getDayOfWeek(isoDate) {
      return parseIsoDate(isoDate).getUTCDay();
    }

    function parseIsoDate(isoDate) {
      const [year, month, day] = String(isoDate).split("-").map((v) => Number(v));
      return new Date(Date.UTC(year, month - 1, day));
    }

    function toIsoDate(date) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    function addDays(isoDate, count) {
      const date = parseIsoDate(isoDate);
      date.setUTCDate(date.getUTCDate() + count);
      return toIsoDate(date);
    }

    function addMonthsUtc(year, month, count) {
      const date = new Date(Date.UTC(year, month + count, 1));
      return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
    }

    function dateOnMonthDay(year, month, day) {
      const date = new Date(Date.UTC(year, month, day));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
        return null;
      }
      return date;
    }

    function appendLog(type, text) {
      const safeType = (type === "ok" || type === "warn" || type === "error" || type === "info" || type === "skip") ? type : "info";
      const effectiveType = safeType === "skip" ? "warn" : safeType;
      const line = document.createElement("div");
      line.className = `log-line log-${effectiveType}`;
      line.textContent = text;
      els.importLog.appendChild(line);
      els.importLog.scrollTop = els.importLog.scrollHeight;
    }

    function renderSearchProjectOptions() {
      const current = els.searchProject.value;
      const options = ['<option value="">Any</option>'];
      state.projects
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((project) => {
          options.push(`<option value="${esc(project.projectId)}">${esc(project.name)}</option>`);
        });
      els.searchProject.innerHTML = options.join("");
      if (state.projects.some((p) => p.projectId === current)) {
        els.searchProject.value = current;
      }
    }

    function renderStats() {
      const total = state.tasks.length;
      const open = state.tasks.filter((t) => t.status === "OPEN").length;
      const inProgress = state.tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const completed = state.tasks.filter((t) => t.status === "COMPLETED").length;
      const cancelled = state.tasks.filter((t) => t.status === "CANCELLED").length;
      const projectCount = state.projects.length;
      const subtaskCount = state.tasks.reduce((acc, task) => acc + task.subtasks.length, 0);

      const items = [
        ["Total Tasks", total],
        ["Open", open],
        ["In-Progress", inProgress],
        ["Completed", completed],
        ["Cancelled", cancelled],
        ["Projects", projectCount],
        ["Subtasks", subtaskCount]
      ];

      els.statsGrid.innerHTML = items.map(([label, value]) => {
        return `<div class="stat"><span class="value">${esc(String(value))}</span><span class="label">${esc(label)}</span></div>`;
      }).join("");

      els.exportBtn.disabled = total === 0;
      els.exportNote.textContent = total === 0 ? "Add or import tasks to enable export." : `Ready to export ${total} task(s).`;
      updateHeaderMetrics();
    }

    function handleExport() {
      if (!state.tasks.length) {
        toast("Export disabled because task list is empty.", "warn");
        return;
      }

      exportTasksToCsv(state.tasks, "ptms-export");
    }

    function exportTasksToCsv(tasks, prefix) {
      if (!tasks.length) {
        toast("Nothing to export.", "warn");
        return;
      }

      const headers = [
        "TaskName",
        "Description",
        "Status",
        "Priority",
        "DueDate",
        "CreatedAt",
        "ProjectName",
        "ProjectDescription",
        "Subtask",
        "SubtaskStatus",
        "SubtaskCollaborator",
        "CollaboratorCategory",
        "Tags",
        "SeriesId",
        "RecurrenceType",
        "RecurrenceInterval",
        "RecurrenceStart",
        "RecurrenceEnd",
        "RecurrenceWeekdays",
        "RecurrenceMonthDay",
        "ActivityTimestamp",
        "ActivityDescription"
      ];

      const lines = [headers];

      tasks.forEach((task) => {
        const project = getProjectById(task.projectId);
        const taskTags = task.tags.join(";");
        const subtasks = task.subtasks.length ? task.subtasks : [null];
        const activities = task.activityEntries.length ? task.activityEntries : [null];

        subtasks.forEach((subtask) => {
          activities.forEach((activity) => {
            const collaboratorCategory = subtask && subtask.collaborator
              ? (findCollaboratorByName(subtask.collaborator)?.category || "")
              : "";

            lines.push([
              task.title,
              task.description,
              task.status,
              task.priority,
              task.dueDate,
              task.createdAt,
              project ? project.name : "",
              project ? project.description : "",
              subtask ? subtask.title : "",
              subtask ? subtask.status : "",
              subtask ? subtask.collaborator : "",
              collaboratorCategory,
              taskTags,
              task.seriesId || "",
              task.recurrence ? task.recurrence.type || "" : "",
              task.recurrence ? task.recurrence.interval || "" : "",
              task.recurrence ? task.recurrence.start || "" : "",
              task.recurrence ? task.recurrence.end || "" : "",
              task.recurrence ? (task.recurrence.weekdays || []).join(";") : "",
              task.recurrence ? task.recurrence.monthDay || "" : "",
              activity ? activity.timestamp : "",
              activity ? activity.description : ""
            ]);
          });
        });
      });

      const csv = lines.map((line) => line.map(csvEscape).join(",")).join("\n");
      const date = new Date().toISOString().slice(0, 10);
      const filename = `${prefix}-${date}.csv`;
      downloadText(filename, csv, "text/csv;charset=utf-8");
      toast(`Export successful: ${filename}`, "ok");
    }

    function parseCsv(text) {
      const rows = [];
      let row = [];
      let field = "";
      let inQuotes = false;

      for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (inQuotes) {
          if (char === '"' && next === '"') {
            field += '"';
            i += 1;
          } else if (char === '"') {
            inQuotes = false;
          } else {
            field += char;
          }
          continue;
        }

        if (char === '"') {
          inQuotes = true;
          continue;
        }

        if (char === ',') {
          row.push(field);
          field = "";
          continue;
        }

        if (char === "\n") {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
          continue;
        }

        if (char === "\r") {
          continue;
        }

        field += char;
      }

      if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
      }

      while (rows.length && rows[rows.length - 1].every((cell) => !String(cell || "").trim())) {
        rows.pop();
      }

      if (!rows.length) return [];

      return rows;
    }

    function buildHeaderInfo(headerRow) {
      const headerMap = {};
      let hasTaskName = false;

      headerRow.forEach((name, idx) => {
        const key = String(name || "").trim().toLowerCase();
        if (RECOGNIZED_HEADERS[key]) {
          const canonical = RECOGNIZED_HEADERS[key];
          headerMap[canonical] = idx;
          if (canonical === "TaskName") {
            hasTaskName = true;
          }
        }
      });

      return { map: headerMap, hasTaskName };
    }

    function mapRowsByHeader(rows, headerMap) {
      const [headerRow, ...dataRows] = rows;

      return dataRows
        .map((row) => {
          const mapped = {};
          Object.keys(RECOGNIZED_HEADERS).forEach((k) => {
            const canonical = RECOGNIZED_HEADERS[k];
            const idx = headerMap[canonical];
            mapped[canonical] = idx === undefined ? "" : String(row[idx] || "").trim();
          });
          return mapped;
        })
        .filter((r) => Object.values(r).some((v) => String(v).trim() !== ""));
    }

    function ensureProject(name, description = "") {
      const existing = state.projects.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        if (!existing.description && description) {
          existing.description = description;
        }
        return existing;
      }
      const project = new Project(name, description || "Created automatically via CSV import");
      state.projects.push(project);
      appendLog("info", `Auto-created project: ${safeForLog(name)}.`);
      return project;
    }

    function ensureCollaborator(name, category) {
      const existing = state.collaborators.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        if (!existing.category && category) {
          existing.category = category;
        }
        return existing;
      }
      const collaborator = new Collaborator(name, category);
      state.collaborators.push(collaborator);
      appendLog("info", `Auto-created collaborator: ${safeForLog(name)} (${safeForLog(category)}).`);
      return collaborator;
    }

    function findTaskByNameAndDue(taskName, dueDate) {
      return state.tasks.find((task) => {
        return task.title.trim().toLowerCase() === taskName.trim().toLowerCase() &&
          (task.dueDate || "") === (dueDate || "");
      });
    }

    function getProjectById(projectId) {
      if (!projectId) return null;
      return state.projects.find((p) => p.projectId === projectId) || null;
    }

    function findCollaboratorByName(name) {
      return state.collaborators.find((c) => c.name.toLowerCase() === String(name || "").trim().toLowerCase()) || null;
    }

    function normalizeDate(input) {
      const raw = String(input || "").trim();
      if (!raw) return "";

      let year;
      let month;
      let day;

      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        [year, month, day] = raw.split("-").map((v) => Number(v));
      } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
        const parts = raw.split("/").map((v) => Number(v));
        month = parts[0];
        day = parts[1];
        year = parts[2];
      } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(raw)) {
        const parts = raw.split("-").map((v) => Number(v));
        day = parts[0];
        month = parts[1];
        year = parts[2];
      } else {
        return "";
      }

      const d = new Date(Date.UTC(year, month - 1, day));
      if (
        d.getUTCFullYear() !== year ||
        d.getUTCMonth() + 1 !== month ||
        d.getUTCDate() !== day
      ) {
        return "";
      }

      const mm = String(month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      return `${year}-${mm}-${dd}`;
    }

    function normalizeStatus(value) {
      const v = String(value || "").trim().toLowerCase();
      if (!v) return "OPEN";
      if (["open", "todo", "to do", "new"].includes(v)) return "OPEN";
      if (["in progress", "in-progress", "in_progress", "progress", "doing", "started", "working"].includes(v)) return "IN_PROGRESS";
      if (["completed", "complete", "done", "closed", "finished"].includes(v)) return "COMPLETED";
      if (["cancelled", "canceled", "void"].includes(v)) return "CANCELLED";
      return "OPEN";
    }

    function normalizePriority(value) {
      const v = String(value || "").trim().toLowerCase();
      if (!v) return "MEDIUM";
      if (["high", "h", "urgent", "critical", "p1", "high priority"].includes(v)) return "HIGH";
      if (["medium", "med", "m", "normal", "p2", "medium priority", "moderate"].includes(v)) return "MEDIUM";
      if (["low", "l", "minor", "p3", "low priority"].includes(v)) return "LOW";
      return "MEDIUM";
    }

    function normalizeCollaboratorCategory(value) {
      const v = String(value || "").trim().toLowerCase();
      if (!v) return "INTERMEDIATE";
      if (["senior", "sr", "lead"].includes(v)) return "SENIOR";
      if (["intermediate", "mid", "middle"].includes(v)) return "INTERMEDIATE";
      if (["junior", "jr", "entry"].includes(v)) return "JUNIOR";
      return "INTERMEDIATE";
    }

    function splitTags(value) {
      return String(value || "")
        .split(";")
        .map((tag) => tag.trim())
        .filter((tag, idx, arr) => tag && arr.findIndex((x) => x.toLowerCase() === tag.toLowerCase()) === idx);
    }

    function statusBadge(status) {
      const cls = {
        OPEN: "status-open",
        IN_PROGRESS: "status-progress",
        COMPLETED: "status-completed",
        CANCELLED: "status-cancelled"
      }[status] || "status-open";
      return `<span class="badge ${cls}">${esc(status)}</span>`;
    }

    function priorityBadge(priority) {
      const cls = {
        HIGH: "prio-high",
        MEDIUM: "prio-medium",
        LOW: "prio-low"
      }[priority] || "prio-medium";
      return `<span class="badge ${cls}">${esc(priority)}</span>`;
    }

    function safeForLog(value) {
      return String(value || "").replace(/[\r\n\t]+/g, " ").slice(0, 240);
    }

    function makeId(prefix) {
      const token = Math.random().toString(36).slice(2, 10);
      return `${prefix}_${token}`;
    }

    function esc(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function csvEscape(value) {
      const text = String(value == null ? "" : value);
      const needsQuotes = /[",\n\r]/.test(text);
      const escaped = text.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    }

    function downloadText(filename, text, mimeType) {
      const blob = new Blob([text], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function toast(message, kind = "ok") {
      const div = document.createElement("div");
      div.className = `toast ${kind === "error" ? "error" : kind === "warn" ? "warn" : "ok"}`;
      div.textContent = message;
      els.toasts.appendChild(div);
      setTimeout(() => {
        div.remove();
      }, 3500);
    }

    // ==================== iCal UI ====================
    function renderICalOptions() {
      // Populate task select (only tasks with due dates)
      const eligibleTasks = state.tasks.filter((t) => t.dueDate);
      els.icalTaskSelect.innerHTML = eligibleTasks.length
        ? eligibleTasks.map((t) => `<option value="${esc(t.taskId)}">${esc(t.title)} (${esc(t.dueDate)})</option>`).join("")
        : '<option value="">No tasks with due dates</option>';

      // Populate project select
      els.icalProjectSelect.innerHTML = state.projects.length
        ? state.projects.map((p) => `<option value="${esc(p.projectId)}">${esc(p.name)}</option>`).join("")
        : '<option value="">No projects</option>';

      handleICalModeChange();

      const total = eligibleTasks.length;
      els.icalExportNote.textContent = total
        ? `${total} task(s) with due dates available for export.`
        : "No tasks with due dates to export.";
    }

    function handleICalModeChange() {
      const mode = els.icalMode.value;
      els.icalTaskField.style.display = mode === "single" ? "" : "none";
      els.icalProjectField.style.display = mode === "project" ? "" : "none";
    }

    function handleICalExport() {
      const mode = els.icalMode.value;
      let tasksToExport = [];

      if (mode === "single") {
        const taskId = els.icalTaskSelect.value;
        const task = state.tasks.find((t) => t.taskId === taskId);
        if (!task) {
          toast("Please select a task.", "warn");
          return;
        }
        tasksToExport = [task];
      } else if (mode === "project") {
        const projectId = els.icalProjectSelect.value;
        if (!projectId) {
          toast("Please select a project.", "warn");
          return;
        }
        tasksToExport = state.tasks.filter((t) => t.projectId === projectId);
      } else if (mode === "filtered") {
        tasksToExport = state.tasks.filter((t) => state.currentFilteredTaskIds.includes(t.taskId));
      }

      if (!tasksToExport.length) {
        toast("No tasks selected for export.", "warn");
        return;
      }

      // Use the ICalGateway
      const result = ICalGateway.exportTasks(tasksToExport);
      if (!result.ok) {
        toast(result.message, "warn");
        return;
      }

      const filename = "ptms-export-" + new Date().toISOString().slice(0, 10) + ".ics";
      downloadText(filename, result.content, "text/calendar;charset=utf-8");
      toast(`Exported ${result.count} task(s) to ${filename}`, "ok");
    }

    // ==================== OVERLOADED COLLABORATORS ====================
    function renderOverloadedList() {
      const overloaded = getOverloadedCollaborators();

      if (!overloaded.length) {
        els.overloadedList.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="60" cy="60" r="40" stroke="#4fd187" stroke-width="4" />
              <path d="M42 60l12 12 24-24" stroke="#4fd187" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div style="margin-top:10px;">No overloaded collaborators. All assignments are within limits.</div>
          </div>
        `;
        return;
      }

      const rows = overloaded.map((c) => {
        return `
          <tr>
            <td>${esc(c.name)}</td>
            <td><span class="badge status-open">${esc(c.category)}</span></td>
            <td class="mono">${c.openCount}</td>
            <td class="mono">${c.limit}</td>
            <td><span class="badge prio-high">+${c.over} over</span></td>
          </tr>
        `;
      }).join("");

      els.overloadedList.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Collaborator</th>
                <th>Category</th>
                <th>Open Assignments</th>
                <th>Limit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="btn-row" style="margin-top:10px;">
          <span class="muted">${overloaded.length} collaborator(s) currently overloaded.</span>
        </div>
      `;
    }