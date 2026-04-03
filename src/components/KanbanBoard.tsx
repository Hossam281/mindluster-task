import { useState, useRef, useEffect } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  fetchTasks,
  fetchTasksByColumn,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
} from "../services/taskService";
import { useFilterStore } from "../store/filterStore";
import type { Task, ColumnType } from "../types/task";
import { COLUMNS } from "../types/task";

const COLUMN_COLORS: Record<ColumnType, string> = {
  backlog: "#64748b",
  in_progress: "#f59e0b",
  review: "#8b5cf6",
  done: "#22c55e",
};
const PAGE_SIZE = 4;

function useColumnTasks(column: ColumnType, search: string) {
  return useInfiniteQuery({
    queryKey: ["tasks", column, search],
    queryFn: ({ pageParam = 1 }) =>
      fetchTasksByColumn(column, pageParam, PAGE_SIZE, search),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

const KanbanBoard = () => {
  const queryClient = useQueryClient();
  const search = useFilterStore((s) => s.search);
  const setSearch = useFilterStore((s) => s.setSearch);

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks"] });

  const { data: allData } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: fetchTasks,
  });
  const globalTotal = allData?.length ?? 0;

  const create = useMutation({
    mutationFn: (t: Omit<Task, "id">) => createTask(t),
    onSuccess: invalidateAll,
  });
  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      updateTask(id, updates),
    onSuccess: invalidateAll,
  });
  const move = useMutation({
    mutationFn: ({ id, column }: { id: string; column: ColumnType }) =>
      moveTask(id, column),
    onSuccess: invalidateAll,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: invalidateAll,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColumn, setFormColumn] = useState<ColumnType>("backlog");

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [moveAnchor, setMoveAnchor] = useState<null | HTMLElement>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const draggedTask = useRef<Task | null>(null);

  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error";
  }>({ open: false, msg: "", sev: "success" });
  const notify = (msg: string, sev: "success" | "error" = "success") =>
    setToast({ open: true, msg, sev });

  const openCreate = (col: ColumnType = "backlog") => {
    setEditingTask(null);
    setFormTitle("");
    setFormDesc("");
    setFormColumn(col);
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description);
    setFormColumn(task.column);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formTitle.trim()) return;
    const data = {
      title: formTitle.trim(),
      description: formDesc.trim(),
      column: formColumn,
    };
    if (editingTask) {
      update.mutate(
        { id: editingTask.id, updates: data },
        {
          onSuccess: () => notify("Task updated"),
          onError: () => notify("Failed to update", "error"),
        }
      );
    } else {
      create.mutate(data, {
        onSuccess: () => notify("Task created"),
        onError: () => notify("Failed to create", "error"),
      });
    }
    setDialogOpen(false);
    setEditingTask(null);
  };

  const handleDelete = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => notify("Task deleted"),
      onError: () => notify("Failed to delete", "error"),
    });
  };

  const handleMove = (id: string, col: ColumnType) => {
    move.mutate(
      { id, column: col },
      { onError: () => notify("Failed to move", "error") }
    );
  };

  const handleDrop = (col: ColumnType) => {
    const t = draggedTask.current;
    if (t && t.column !== col) handleMove(t.id, col);
    draggedTask.current = null;
  };

  return (
    <div className="kanban-page">
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Kanban Board</h1>
          <span className="task-count">{globalTotal} Total</span>
        </div>
        <div className="topbar-right">
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => openCreate()}>
            + New Task
          </button>
        </div>
      </header>

      <main className="board">
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            col={col}
            search={debouncedSearch}
            onDrop={handleDrop}
            onEdit={openEdit}
            onCreate={openCreate}
            onMenuOpen={(task, el) => {
              setActiveTask(task);
              setMenuAnchor(el);
            }}
            draggedTask={draggedTask}
          />
        ))}
      </main>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            if (activeTask) openEdit(activeTask);
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            setMenuAnchor(null);
            setMoveAnchor(e.currentTarget);
          }}
        >
          Move to
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            if (activeTask) handleDelete(activeTask.id);
          }}
          sx={{ color: "#ef4444" }}
        >
          Delete
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={moveAnchor}
        open={Boolean(moveAnchor)}
        onClose={() => setMoveAnchor(null)}
      >
        {activeTask &&
          COLUMNS.filter((c) => c.key !== activeTask.column).map((c) => (
            <MenuItem
              key={c.key}
              onClick={() => {
                setMoveAnchor(null);
                handleMove(activeTask.id, c.key);
              }}
            >
              <span
                className="column-dot"
                style={{ background: COLUMN_COLORS[c.key], marginRight: 10 }}
              />
              {c.label}
            </MenuItem>
          ))}
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTask(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: "8px !important",
          }}
        >
          <TextField
            label="Title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Description"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Column"
            value={formColumn}
            onChange={(e) => setFormColumn(e.target.value as ColumnType)}
            select
            fullWidth
          >
            {COLUMNS.map((c) => (
              <MenuItem key={c.key} value={c.key}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setEditingTask(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formTitle.trim()}
          >
            {editingTask ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.sev}
          onClose={() => setToast((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </div>
  );
};

interface ColumnProps {
  col: { key: ColumnType; label: string };
  search: string;
  onDrop: (col: ColumnType) => void;
  onEdit: (task: Task) => void;
  onCreate: (col: ColumnType) => void;
  onMenuOpen: (task: Task, el: HTMLElement) => void;
  draggedTask: React.RefObject<Task | null>;
}

function Column({
  col,
  search,
  onDrop,
  onCreate,
  onMenuOpen,
  draggedTask,
}: ColumnProps) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useColumnTasks(col.key, search);

  const allTasks = data?.pages.flatMap((p) => p.tasks) ?? [];
  const total = data?.pages[0]?.total ?? 0;

 
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !hasNextPage || isFetchingNextPage) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { root, rootMargin: "0px 0px 100px 0px", threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, allTasks.length]);

  return (
    <section
      className="column"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={() => onDrop(col.key)}
    >
      <div className="column-header">
        <span
          className="column-dot"
          style={{ background: COLUMN_COLORS[col.key] }}
        />
        <span className="column-title">{col.label}</span>
        <span className="column-count">{total}</span>
      </div>

      <div className="card-list" ref={scrollRef}>
        {isLoading ? (
          <div className="column-empty">
            <CircularProgress size={24} />
          </div>
        ) : allTasks.length === 0 ? (
          <p className="column-empty">No tasks</p>
        ) : (
          allTasks.map((task) => (
            <div
              key={task.id}
              className="task-card"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                draggedTask.current = task;
              }}
            >
              <div className="card-top">
                <span className="card-title">{task.title}</span>
                <button
                  className="card-menu-btn"
                  onClick={(e) => onMenuOpen(task, e.currentTarget)}
                >
                  ...
                </button>
              </div>
              {task.description && (
                <p className="card-desc">{task.description}</p>
              )}
            </div>
          ))
        )}

        {hasNextPage && <div ref={sentinelRef} style={{ height: 20 }} />}

        {isFetchingNextPage && (
          <div className="column-empty">
            <CircularProgress size={20} />
          </div>
        )}
      </div>

      <button className="btn-text add-btn" onClick={() => onCreate(col.key)}>
        + Add task
      </button>
    </section>
  );
}

export default KanbanBoard;
