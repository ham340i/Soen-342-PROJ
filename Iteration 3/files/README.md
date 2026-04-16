# Personal Task Management System (PTMS)

PTMS is a browser-based task management system built for SOEN 342. It supports task creation, recurring tasks, CSV import/export, collaborator management, iCalendar export, OCL constraint enforcement, and automatic persistence in the browser.

## Project Overview

This repository contains the final project deliverables for **SOEN 342 – Software Requirements and Deployment**.

### Team

- Team Lead: Mena Boulus
- Team Members: Ahmad Habbal, Abd Al Rahman Kabani

## Features

- Create and manage tasks with status, priority, due dates, project assignment, tags, and collaborators.
- Generate recurring tasks daily, weekly, or monthly.
- Import tasks from CSV files.
- Export tasks to CSV or iCalendar (.ics).
- View overloaded collaborators by category limit.
- Enforce the required OCL business rules.
- Persist data automatically with `localStorage`.

## How To Run

This is a static client-side app. No install step is required.

### Option 1: Open directly in a browser

1. Open `index.html` in Chrome, Firefox, Edge, or Safari.
2. Use the app immediately in the browser.
3. Data is saved automatically in `localStorage`.

### Option 2: Run on a local host

If you prefer `http://localhost`, serve the folder with a simple local server:

```bash
cd "Iteration 3/files"
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

If you use VS Code, the Live Server extension also works.

## How To Configure

There is no build configuration or environment setup required.

You can configure the app from the UI itself:

- Set collaborator limits on the Search page.
- Enter project, collaborator, and recurrence details when creating tasks.
- Choose CSV files from the Import page.
- Pick which tasks or projects to export on the iCal page.

## CSV Import Format

The CSV importer expects the following headers:

```text
TaskName,Description,Status,Priority,DueDate,ProjectName,Subtask,CollaboratorName,CollaboratorCategory,Tags
```

Notes:

- `TaskName` is required.
- Fields may be quoted.
- Tags should be separated with semicolons.
- If multiple rows share the same `TaskName` and `DueDate`, the importer merges subtasks and tags into the existing task.

## OCL Constraints

The project enforces the required business rules listed in `OCL_Constraints.md`:

| #   | Business Rule                                                                 | Enforcement                                                   |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | A task cannot have more than 20 sub-tasks                                     | Checked before adding subtasks during CSV import merge        |
| 2   | The number of open tasks without a due date should not exceed 50              | Checked before task creation; warns after CSV import          |
| 3   | The limit for open tasks for each collaborator category is a positive integer | Validated when updating limits via UI                         |
| 4   | No collaborator must be overloaded                                            | Checked before task creation; viewable on the Overloaded page |

## iCal Export

Tasks with a due date can be exported as `.ics` files compatible with Google Calendar, Apple Calendar, and Outlook.

Export modes:

- Single task from the task detail modal or iCal page.
- All tasks in a project from the iCal page.
- Filtered search results from the Search page.

Only tasks with a due date are exported. Subtasks are summarized in the event description and are not exported as separate events.

## Deliverables

| Artifact                       | File                                 |
| ------------------------------ | ------------------------------------ |
| Updated Use-Case Diagram       | `UseCaseDiagram.mermaid`             |
| Updated UML Class Diagram      | `UML_ClassDiagram.mermaid`           |
| Sequence Diagram (iCal export) | `SequenceDiagram_iCalExport.mermaid` |
| OCL Constraints                | `OCL_Constraints.md`                 |
| Final Project Code             | `index.html`, `styles.css`, `app.js` |
| README                         | `README.md`                          |

Mermaid diagrams can be rendered at [mermaid.live](https://mermaid.live) or in any Mermaid-compatible viewer.

## File Structure

```text
index.html                          Main application HTML
styles.css                          Application styles
app.js                              Application logic (Presentation + Domain + Gateway layers)
OCL_Constraints.md                  Formal OCL constraint specifications
UML_ClassDiagram.mermaid            Updated class diagram with Gateway pattern
SequenceDiagram_iCalExport.mermaid  Sequence diagram for iCal export flow
UseCaseDiagram.mermaid              Updated use-case diagram
README.md                           This file
```
