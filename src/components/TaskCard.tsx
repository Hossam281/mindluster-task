import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Chip,
  ListItemText,
} from "@mui/material";

import type { Task, ColumnType } from "../types/task";
import { COLUMNS } from "../types/task";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, column: ColumnType) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

const COLUMN_COLORS: Record<ColumnType, string> = {
  backlog: "#64748b",
  in_progress: "#f59e0b",
  review: "#8b5cf6",
  done: "#22c55e",
};

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onMove,
  draggable = true,
  onDragStart,
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [moveAnchorEl, setMoveAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Card
        draggable={draggable}
        onDragStart={onDragStart}
        sx={{
          cursor: draggable ? "grab" : "default",
          "&:active": draggable ? { cursor: "grabbing" } : {},
          transition: "box-shadow 0.2s, transform 0.2s",
          "&:hover": {
            boxShadow: 4,
            transform: "translateY(-2px)",
          },
        }}
      >
        <CardContent sx={{ pb: "12px !important", pt: 1.5, px: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
              {task.title}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
            </IconButton>
          </Box>
          {task.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {task.description}
            </Typography>
          )}
          <Chip
            label={COLUMNS.find((c) => c.key === task.column)?.label}
            size="small"
            sx={{
              mt: 1,
              height: 22,
              fontSize: "0.7rem",
              bgcolor: COLUMN_COLORS[task.column] + "22",
              color: COLUMN_COLORS[task.column],
              fontWeight: 600,
              display: { xs: "inline-flex", md: "none" },
            }}
          />
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit(task);
          }}
        >
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            setAnchorEl(null);
            setMoveAnchorEl(e.currentTarget);
          }}
        >
          <ListItemText>Move to</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(task.id);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={moveAnchorEl}
        open={Boolean(moveAnchorEl)}
        onClose={() => setMoveAnchorEl(null)}
      >
        {COLUMNS.filter((c) => c.key !== task.column).map((col) => (
          <MenuItem
            key={col.key}
            onClick={() => {
              setMoveAnchorEl(null);
              onMove(task.id, col.key);
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: COLUMN_COLORS[col.key],
                mr: 1.5,
              }}
            />
            {col.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default TaskCard;
