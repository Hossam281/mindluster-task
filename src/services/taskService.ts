import type { Task, ColumnType } from "../types/task";

const BASE_URL = "http://localhost:4000/tasks";

export interface PaginatedResult {
  tasks: Task[];
  total: number;
  hasNextPage: boolean;
}

export const fetchTasks = async (): Promise<Task[]> => {
  try {
    const res = await fetch(BASE_URL);
    return await res.json();
  } catch {
    throw new Error("Failed to fetch tasks");
  }
};

export const fetchTasksByColumn = async (
  column: ColumnType,
  page: number,
  limit: number,
  search: string = ""
): Promise<PaginatedResult> => {
  try {
    const sValue = search.trim();
    const searchParam = sValue ? `&q=${encodeURIComponent(sValue)}` : "";
    const res = await fetch(
      `${BASE_URL}?column=${column}&_page=${page}&_limit=${limit}${searchParam}`
    );
    
    const totalHeader = res.headers.get("x-total-count");
    const total = totalHeader ? parseInt(totalHeader, 10) : 0;
    
    const body = await res.json();
    
    return {
      tasks: body,
      total,
      hasNextPage: page * limit < total,
    };
  } catch {
    throw new Error(`Failed to fetch ${column} tasks`);
  }
};

export const createTask = async (task: Omit<Task, "id">): Promise<Task> => {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    return await res.json();
  } catch {
    throw new Error("Failed to create task");
  }
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return await res.json();
  } catch {
    throw new Error("Failed to update task");
  }
};

export const moveTask = async (id: string, column: ColumnType): Promise<Task> => {
  return updateTask(id, { column });
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  } catch {
    throw new Error("Failed to delete task");
  }
};
