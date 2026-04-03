# SOEN 342 – Software Requirements and Deployment  

This repository contains the project setup and deliverables for **SOEN 342 – Software Requirements and Deployment**.

---

## Course Information

- Course: SOEN 342 – Software Requirements and Deployment  
- Term: Winter 2026  

---

## Team Information

**Team Lead**  
- Mena Boulus
  
**Team Members** 
- Ahmad Habbal 
- Abd Al Rahman Kabani  

---

## Project: Personal Task Management System (PTMS)

A browser-based task management system with full CRUD, CSV import/export, recurring tasks, collaborator management, iCalendar export, OCL constraint enforcement, and persistent storage.

### How to Run

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. No server, build step, or dependencies required — everything runs client-side.
3. Data persists automatically via `localStorage` between sessions.

---

## Iteration 3 — Deployment and OCL

### 1. Formal Specifications (OCL Constraints)

All four required business rules are formally specified in OCL and enforced in the system code. See `OCL_Constraints.md` for the full formal specifications.

| # | Business Rule | Enforcement |
|---|---------------|-------------|
| 1 | A task cannot have more than 20 sub-tasks | Checked before adding subtasks during CSV import merge |
| 2 | The number of open tasks without a due date should not exceed 50 | Checked before task creation; warns after CSV import |
| 3 | The limit for open tasks for each collaborator category is a positive integer | Validated when updating limits via UI |
| 4 | No collaborator must be overloaded | Checked before task creation; viewable on Overloaded page |

### 2. iCal Integration

Users can export tasks to standard iCalendar (.ics) format compatible with Google Calendar, Apple Calendar, and Outlook.

**Export modes:**
- **Single task** — from the iCal Export page dropdown, or via the "Export to iCal" button in any task's detail modal.
- **All tasks in a project** — select a project from the dropdown on the iCal Export page.
- **Filtered list** — exports the current search/filter results from the Search page.

**Rules:**
- Only tasks with a due date are eligible for export. Tasks without a due date are silently ignored.
- Each eligible task becomes one calendar entry containing: title, description, due date, status, priority, and project name.
- If a task has subtasks, they are summarized in the description field. Subtasks are NOT exported as separate calendar entries.

**Architecture:**
- The `ICalGateway` object implements the **Gateway pattern** to interface the domain with the iCal export format.
- See the updated Class Diagram and Sequence Diagram.

### 3. Overloaded Collaborators

A dedicated sidebar menu item (**Overloaded**) lists all collaborators whose open task assignments exceed their category limit. The table shows collaborator name, category, current open assignment count, limit, and overage.

### 4. Persistency Layer

All application state (tasks, projects, collaborators, collaborator limits) is automatically persisted to `localStorage` after every state-mutating operation:
- Task creation (form or CSV import)
- Collaborator limit updates

Data is loaded from `localStorage` on application startup. Implemented via the `PersistenceGateway` object (Gateway pattern).

---

## Deliverables

| Artifact | File |
|----------|------|
| Updated Use-Case Diagram | `UseCaseDiagram.mermaid` |
| Updated UML Class Diagram | `UML_ClassDiagram.mermaid` |
| Sequence Diagram (iCal export) | `SequenceDiagram_iCalExport.mermaid` |
| OCL Constraints | `OCL_Constraints.md` |
| Final Project Code | `index.html`, `styles.css`, `app.js` |
| README | `README.md` (this file) |

**Note:** Mermaid diagrams can be rendered at [mermaid.live](https://mermaid.live) or in any Mermaid-compatible viewer (GitHub, VS Code plugin, etc.).

---

## File Structure

```
index.html                          Main application HTML
styles.css                          Application styles
app.js                              Application logic (Presentation + Domain + Gateway layers)
OCL_Constraints.md                  Formal OCL constraint specifications
UML_ClassDiagram.mermaid            Updated class diagram with Gateway pattern
SequenceDiagram_iCalExport.mermaid  Sequence diagram for iCal export flow
UseCaseDiagram.mermaid              Updated use-case diagram
README.md                           This file
```
