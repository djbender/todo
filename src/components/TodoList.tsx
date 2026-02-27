import React, { useState, useRef, useEffect } from 'react';
import {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useReorderTodosMutation,
} from '../services/api';
import { DarkModeToggle } from './DarkModeToggle';
import { toast } from './toastService';
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
  isToggling: boolean;
  onAnimationEnd: () => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

const SortableTodoItem: React.FC<TodoItemProps> = ({ todo, hasAnimated, isToggling, onAnimationEnd, onToggle, onDelete }) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const wasToggling = useRef(false);

  // Restore focus after DOM updates when toggle completes
  React.useEffect(() => {
    if (wasToggling.current && !isToggling) {
      checkboxRef.current?.focus();
    }
    wasToggling.current = isToggling;
  }, [isToggling]);

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
        className={/* c8 ignore next -- isDragging requires E2E */ `todo-item ${isDragging ? 'todo-item-dragging' : ''}`}
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
          ref={checkboxRef}
          type="checkbox"
          checked={todo.completed}
          disabled={isToggling}
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
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  // Render info: stable keys and animation state, computed in useEffect to avoid ref reads during render
  const [todoRenderInfo, setTodoRenderInfo] = useState(new Map<string, { stableKey: string; hasAnimated: boolean }>());
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

  // Track when a temp ID becomes a real ID, then compute stable keys and animation state.
  // All ref reads happen in useEffect to satisfy react-hooks/refs rule.
  useEffect(() => {
    if (!todos) return;

    const usedTempIds = new Set<string>();

    todos.forEach((currentTodo) => {
      // Skip if already mapped
      if (realToTempIdMap.current.has(currentTodo.id)) return;

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

    // Build render info map from refs (safe inside useEffect)
    const map = new Map<string, { stableKey: string; hasAnimated: boolean }>();
    todos.forEach((todo) => {
      let stableKey: string;
      if (todo.id.startsWith('temp-')) {
        // Still a temp item, use as-is
        stableKey = todo.id;
      } else {
        // Real ID - check if we have a mapping from this real ID to a temp ID
        const tempId = realToTempIdMap.current.get(todo.id);
        stableKey = tempId ?? todo.id;
      }
      map.set(todo.id, { stableKey, hasAnimated: animatedIds.current.has(stableKey) });
    });
    setTodoRenderInfo(map);
  }, [todos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      await createTodo(newTodoTitle).unwrap();
      setNewTodoTitle('');
    } catch /* c8 ignore start */ {
      toast.error('Failed to create todo');
    } /* c8 ignore stop */
  };

  const handleToggle = async (id: string, completed: boolean) => {
    if (togglingIds.has(id)) return;
    setTogglingIds(prev => new Set(prev).add(id));
    try {
      await updateTodo({ id, updates: { completed: !completed } }).unwrap();
    } catch {
      toast.error('Failed to update todo');
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id).unwrap();
    } catch {
      toast.error('Failed to delete todo');
    }
  };

  /* c8 ignore start - @dnd-kit requires E2E tests */
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
    } catch {
      toast.error('Failed to reorder todos');
    }
  };
  /* c8 ignore stop */

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
          items={/* c8 ignore next -- todos always defined past loading guard */ todos?.map((t) => t.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <ul className="todo-list">
            {todos?.map((todo) => {
              // Use temp ID as stable key if this was previously a temp item
              const { stableKey, hasAnimated } = todoRenderInfo.get(todo.id) ?? { stableKey: todo.id, hasAnimated: false };

              return (
                <SortableTodoItem
                  key={stableKey}
                  todo={todo}
                  hasAnimated={hasAnimated}
                  isToggling={togglingIds.has(todo.id)}
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
