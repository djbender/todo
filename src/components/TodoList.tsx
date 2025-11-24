import React, { useState, useRef } from 'react';
import {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useReorderTodosMutation,
} from '../services/api';
import { DarkModeToggle } from './DarkModeToggle';
import { toast } from './Toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoItemProps {
  todo: Todo;
  hasAnimated: boolean;
  onAnimationEnd: () => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

const SortableTodoItem: React.FC<TodoItemProps> = ({ todo, hasAnimated, onAnimationEnd, onToggle, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const wrapperStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={wrapperStyle}>
      <li
        className={`todo-item ${isDragging ? 'todo-item-dragging' : ''}`}
        data-animated={hasAnimated ? 'true' : 'false'}
        onAnimationEnd={hasAnimated ? undefined : onAnimationEnd}
      >
        <span
          className="drag-handle"
          {...attributes}
          {...listeners}
          tabIndex={0}
          aria-label="Drag handle to reorder todo"
        >
          ⋮⋮
        </span>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id, todo.completed)}
        />
        <span className={todo.completed ? 'completed' : ''}>
          {todo.title}
        </span>
        <button onClick={() => onDelete(todo.id)}>Delete</button>
      </li>
    </div>
  );
};

export const TodoList: React.FC = () => {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const animatedIds = useRef(new Set<string>());
  const realToTempIdMap = useRef(new Map<string, string>());
  const previousTodos = useRef<Todo[]>([]);

  const { data: todos, isLoading, isError, error } = useGetTodosQuery();
  const [createTodo, { isLoading: isCreating }] = useCreateTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();
  const [reorderTodos] = useReorderTodosMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Track when a temp ID becomes a real ID (during render, not in useEffect)
  if (todos) {
    const usedTempIds = new Set<string>();

    todos.forEach((currentTodo) => {
      // Skip if already mapped
      if (realToTempIdMap.current.has(currentTodo.id)) {
        return;
      }

      // Find if this todo existed before with a temp ID that hasn't been used yet
      const previousTodo = previousTodos.current.find(
        (prev) =>
          prev.id.startsWith('temp-') &&
          prev.title === currentTodo.title &&
          !currentTodo.id.startsWith('temp-') &&
          !usedTempIds.has(prev.id)
      );

      if (previousTodo) {
        // Map real ID → temp ID
        realToTempIdMap.current.set(currentTodo.id, previousTodo.id);
        usedTempIds.add(previousTodo.id);
      }
    });

    previousTodos.current = [...todos];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      await createTodo(newTodoTitle).unwrap();
      setNewTodoTitle('');
    } catch (err) {
      console.error('Failed to create todo:', err);
      toast.error('Failed to create todo');
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await updateTodo({ id, updates: { completed: !completed } }).unwrap();
    } catch (err) {
      console.error('Failed to update todo:', err);
      toast.error('Failed to update todo');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id).unwrap();
    } catch (err) {
      console.error('Failed to delete todo:', err);
      toast.error('Failed to delete todo');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !todos) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(todos, oldIndex, newIndex);
    const orderedIds = reordered.map((t) => t.id);

    try {
      await reorderTodos(orderedIds).unwrap();
    } catch (err) {
      console.error('Failed to reorder todos:', err);
      toast.error('Failed to reorder todos');
    }
  };

  if (isLoading) {
    return <main><p>Loading todos...</p></main>;
  }

  if (isError) {
    return <main><mark>Error: {JSON.stringify(error)}</mark></main>;
  }

  return (
    <main>
      <header>
        <h1>Todo</h1>
        <DarkModeToggle />
      </header>

      <form onSubmit={handleSubmit} className="todo-form">
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="Enter a new todo..."
          disabled={isCreating}
        />
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Adding...' : 'Add Todo'}
        </button>
      </form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={todos?.map((t) => t.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <ul className="todo-list">
            {todos?.map((todo) => {
              // Use temp ID as stable key if this was previously a temp item
              let stableKey = todo.id;

              if (todo.id.startsWith('temp-')) {
                // Still a temp item, use as-is
                stableKey = todo.id;
              } else {
                // Real ID - check if we have a mapping from this real ID to a temp ID
                const tempId = realToTempIdMap.current.get(todo.id);
                if (tempId) {
                  stableKey = tempId;
                }
              }

              const hasAnimated = animatedIds.current.has(stableKey);

              return (
                <SortableTodoItem
                  key={stableKey}
                  todo={todo}
                  hasAnimated={hasAnimated}
                  onAnimationEnd={() => animatedIds.current.add(stableKey)}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>

      {todos?.length === 0 && (
        <p className="empty-state">No todos yet. Add one to get started!</p>
      )}
    </main>
  );
};
