# Kanban Task Management Dashboard

A modern, responsive Kanban-style ToDo application built as part of a Frontend Developer Assessment.

## 🚀 Features

- **Four Column Layout**: Tasks are organized into `Backlog`, `In Progress`, `Review`, and `Done` columns.
- **Full CRUD Operations**: Create new tasks, edit existing ones, and delete tasks directly from the board.
- **Drag & Drop**: Seamlessly move tasks between columns using native drag-and-drop interactions.
- **Infinite Scrolling**: Automatically loads more tasks as you scroll down each column for improved performance with large datasets.
- **Global Search**: Filter tasks across all columns by title or description using a debounced search bar.
- **State Management**: Uses **Zustand** for global search state and **React Query** for efficient server-state caching and synchronization.
- **Modern UI**: Built with **Material UI (MUI)** following a clean, premium design aesthetic.

---

## 🛠️ Installation & Setup

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/Hossam281/mindluster-task.git
cd mindluster-task
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the application
The project uses `concurrently` to run both the Vite development server and the JSON-mock server simultaneously.
```bash
npm start
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **JSON Server**: [http://localhost:4000/tasks](http://localhost:4000/tasks)

---

## 🌐 Live Preview & Production Build

**Live Demo URL**: https://kanban-todo-listtt.netlify.app/

> [!CAUTION]
> **Important Limitation**: This project is built using a local mock API (`json-server`). While a production build can be generated using `npm run build`, it will not be functional on a live server unless the `db.json` is replaced by a real, hosted backend or the candidates' own local server is running.

---

## 🧐 Developer Reflection & Feedback

While implementing this task according to the requirements, I identified several architectural and logistical points worth noting:

### 1. Pagination Overhead
Implementing pagination/infinite scroll *per column* forces the client to maintain 4 separate concurrent queries to the backend. For a simple task dashboard, this adds unnecessary complexity and network overhead compared to fetching the full dataset once and filtering on the client.

### 2. Global Search vs. Local Refetching
Having a single global search bar that updates a shared query state causes all 4 column queries to invalidate and refetch simultaneously whenever a user types. This pattern is less efficient than having local column-specific search states or a more granular filter strategy.

### 3. State Management Selection
**Zustand** was used as requested, but for an application this size—where only a simple search string is stored globally—Zustand (or Redux) is technically overkill. A  local state lifting would have sufficed. Global state solutions like Zustand are far better suited for features like **Theming**, **Localization**, or **Authentication**.

### 4. Timeline vs. Design Expectations
The provided eistmated time of **2 hours** is quite tight if design quality, responsiveness, drag-and-drop logic, and robust infinite scroll are all critical assessment parts. Achieving a premium look and feel alongside clean architecture without the use of AI assistant tools (as suggested in the doc) would be a significant challenge for any candidate within that window.

### 5. Backend "Gotchas" (JSON-Server)
During development, I discovered that `json-server` v1.0.0-beta has known bugs/limitations when combining global search (`q`) and property filters (`column`). To ensure a reliable experience, I downgraded to version `0.17.4`, which uses more stable query parameters (`_limit` and `X-Total-Count` headers).

---

## 💡 Suggestions for Improvement
The task is a great baseline for candidate assessment. However, adding challenges such as **Server-side Sorting** or **Complex Filtering (Date/Priority)** would better match the requirement of "advanced state management" and provide a better platform to showcase architectural decisions.
