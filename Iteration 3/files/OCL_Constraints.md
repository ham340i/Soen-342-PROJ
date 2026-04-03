# OCL Constraints — PTMS (Personal Task Management System)

## Constraint 1: Maximum Sub-tasks per Task

**Business Rule:** "A task cannot have more than 20 sub-tasks."

```ocl
context Task
inv maxSubtasks:
  self.subtasks->size() <= 20
```

**Enforcement:** The system checks `subtasks->size()` before adding any subtask, both during CSV import merging and during task creation. If the task already contains 20 subtasks, the additional subtask is rejected with a warning.

---

## Constraint 2: Open Tasks Without a Due Date

**Business Rule:** "The number of open tasks without a due date should not exceed 50."

```ocl
context Task
inv maxOpenNoDueDate:
  Task.allInstances()->select(t |
    (t.status = Status::OPEN or t.status = Status::IN_PROGRESS)
    and t.dueDate.oclIsUndefined()
  )->size() <= 50
```

**Enforcement:** Before creating new tasks, the system counts all existing open/in-progress tasks that have no due date. If adding the new task(s) would cause this count to exceed 50, the creation is blocked with an error message.

---

## Constraint 3: Collaborator Category Limits Must Be Positive

**Business Rule:** "The limit for open tasks for each collaborator category is a positive integer."

```ocl
context CollaboratorLimits
inv seniorLimitPositive:
  self.seniorLimit > 0

context CollaboratorLimits
inv intermediateLimitPositive:
  self.intermediateLimit > 0

context CollaboratorLimits
inv juniorLimitPositive:
  self.juniorLimit > 0
```

**Enforcement:** When updating collaborator limits via the UI, the system validates that each limit value is a finite integer greater than or equal to 1 before accepting the change. Invalid values are rejected with an error toast.

---

## Constraint 4: No Collaborator Must Be Overloaded

**Business Rule:** "No collaborator must be overloaded" — i.e., the number of assigned tasks that are open should not exceed the limit for the collaborator's category.

```ocl
context Collaborator
inv notOverloaded:
  let limit : Integer = CollaboratorLimits.getLimitForCategory(self.category) in
  let openAssignments : Integer =
    Task.allInstances()
      ->select(t | t.status = Status::OPEN or t.status = Status::IN_PROGRESS)
      ->collect(t | t.subtasks)->flatten()
      ->select(s |
          (s.status = Status::OPEN or s.status = Status::IN_PROGRESS)
          and s.collaborator = self.name
      )->size()
  in
    openAssignments <= limit
```

**Enforcement:** The system checks this constraint before assigning new tasks to collaborators. If the assignment would cause a collaborator to exceed their category's limit, the task creation is blocked with an error message specifying the collaborator, their current count, and the limit. Additionally, the "Overloaded Collaborators" page provides a dedicated view listing all collaborators currently in violation of this constraint, showing their name, category, current open assignment count, limit, and overage amount.
