# SOEN 342 – Software Requirements and Deployment  

This repository contains the project setup and deliverables for **SOEN 342 – Software Requirements and Deployment**.

---

## Team Information

**Team Lead**  
- Mena Boulus 40291619
  
**Team Members** 
- Ahmad Al Habbal 40261029
- Abd Al Rahman Al Kabani 40247395 

---

## Course Information

- Course: SOEN 342 – Software Requirements and Deployment  
- Term: Winter 2026  
- Iteration: Final Project (Personal Task Management System - PTMS)  
- Submission: GitHub  

---

## Project Overview

**Personal Task Management System (PTMS)** is a browser-based task management system developed for SOEN 342.

The system allows a single user to create, manage, and organize tasks efficiently. It includes advanced features such as recurring tasks, CSV import/export, collaborator management, iCalendar export, and enforcement of business rules using OCL constraints.

---

## Features

- Create and manage tasks with:
  - Status, priority, due date
  - Project assignment
  - Tags and collaborators  
- Generate recurring tasks (daily, weekly, monthly)  
- Import tasks from CSV files  
- Export tasks to CSV or iCalendar (.ics) format  
- View overloaded collaborators based on category limits  
- Enforce business rules using OCL constraints  
- Automatically persist data using browser localStorage  

---

## How to Run

This is a **client-side application**. No installation is required.

### Option 1: Open in Browser
- Open `index.html` in any browser (Chrome, Firefox, Edge, Safari)  
- The application runs directly  
- Data is saved automatically using localStorage  

### Option 2: Run on Localhost
- Serve the project folder using a local server  
- Or use **VS Code Live Server extension**  

---

## Configuration

No setup or environment configuration is required.

The application is configurable through the UI:
- Set collaborator limits from the Search page  
- Add projects, collaborators, and recurrence when creating tasks  
- Import CSV files from the Import page  
- Export tasks or projects from the iCal page  

---

## CSV Import Format

The CSV importer expects structured headers such as:
- TaskName (required)
- Description
- Status
- Priority
- DueDate
- ProjectName
- Tags
- Collaborator

**Notes:**
- Fields may be quoted  
- Tags must be separated by semicolons  
- Tasks with the same TaskName and DueDate are merged  

---

## OCL Constraints

The system enforces key business rules:

1. A task cannot have more than 20 subtasks  
2. Open tasks without a due date must not exceed 50  
3. Collaborator limits must be positive integers  
4. No collaborator should exceed their task limit  

---

## iCalendar Export

Tasks with due dates can be exported as `.ics` files compatible with:
- Google Calendar  
- Apple Calendar  
- Outlook  

**Export Options:**
- Single task  
- All tasks in a project  
- Filtered search results  

---

## Deliverables

- Use Case Diagram  
- UML Class Diagram  
- Sequence Diagram (iCal Export)  
- OCL Constraints  
- Final Project Implementation  
- README Documentation  

---

## Repository Structure
index.html → Main application
styles.css → Styling
app.js → Application logic
OCL_Constraints.md → OCL rules
UML_ClassDiagram.mermaid → Class diagram
SequenceDiagram_iCalExport.mermaid → Sequence diagram
UseCaseDiagram.mermaid → Use case diagram
README.md → Project documentation

---

## Notes

- The system follows object-oriented design principles  
- All required constraints and features are implemented  
- The application runs fully in the browser without backend dependencies  
