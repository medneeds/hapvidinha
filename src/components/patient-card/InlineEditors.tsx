import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Plus, GripVertical, Star, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Inline editors shared by the UTI and the Emergency (UE) patient cards:
 * numbered sortable lists with highlight, single-line fields and long text.
 * Colour variants follow each sector's identity:
 * blue → stable, yellow → warning, red → critical, outside → neutral.
 */
export type EditorColorVariant = 'blue' | 'yellow' | 'red' | 'outside';

const HIGHLIGHT_STYLES: Record<EditorColorVariant, { bg: string; number: string; text: string; star: string }> = {
  blue: {
    bg: "bg-stable/[0.05] border border-stable/40 hover:bg-stable/10 hover:border-stable/60",
    number: "text-stable",
    text: "text-foreground font-semibold",
    star: "fill-stable text-stable",
  },
  yellow: {
    bg: "bg-warning/[0.05] border border-warning/40 hover:bg-warning/10 hover:border-warning/60",
    number: "text-warning",
    text: "text-foreground font-semibold",
    star: "fill-warning text-warning",
  },
  red: {
    bg: "bg-critical/[0.05] border border-critical/40 hover:bg-critical/10 hover:border-critical/60",
    number: "text-critical",
    text: "text-foreground font-semibold",
    star: "fill-critical text-critical",
  },
  outside: {
    bg: "bg-muted-foreground/[0.05] border border-muted-foreground/40 hover:bg-muted-foreground/10 hover:border-muted-foreground/60",
    number: "text-muted-foreground",
    text: "text-foreground font-semibold",
    star: "fill-muted-foreground text-muted-foreground",
  },
};

const SECTOR_ROW_HOVER: Record<EditorColorVariant, string> = {
  blue: "hover:bg-stable/[0.07]",
  yellow: "hover:bg-warning/[0.07]",
  red: "hover:bg-critical/[0.07]",
  outside: "hover:bg-muted-foreground/[0.07]",
};

const SECTOR_TEXT_HOVER: Record<EditorColorVariant, string> = {
  blue: "hover:text-stable",
  yellow: "hover:text-warning",
  red: "hover:text-critical",
  outside: "hover:text-foreground",
};

/** Typing boxes (border, focus ring, caret) in the sector colour. */
export const SECTOR_INPUT: Record<EditorColorVariant, string> = {
  blue: "border-stable/45 focus:border-stable focus:ring-2 focus:ring-stable/20 caret-stable",
  yellow: "border-warning/50 focus:border-warning focus:ring-2 focus:ring-warning/20 caret-warning",
  red: "border-critical/45 focus:border-critical focus:ring-2 focus:ring-critical/20 caret-critical",
  outside: "border-muted-foreground/40 focus:border-muted-foreground focus:ring-2 focus:ring-muted-foreground/20 caret-foreground",
};

/** Confirm (✓) icon colour in the sector colour. */
const SECTOR_CONFIRM: Record<EditorColorVariant, string> = {
  blue: "text-stable",
  yellow: "text-warning",
  red: "text-critical",
  outside: "text-muted-foreground",
};

/** Main card column cell: no box, thin divider between columns (compact layout shared by UE and UTI). */
export const COLUMN_CELL =
  "min-w-0 px-1.5 py-1 md:py-0 rounded-none transition-colors duration-200 border-t first:border-t-0 md:border-t-0 md:border-l md:first:border-l-0 border-border/50";

/** Very light hover tint of a column in the sector colour. */
export const COLUMN_HOVER: Record<EditorColorVariant, string> = {
  blue: "hover:bg-stable/[0.03]",
  yellow: "hover:bg-warning/[0.03]",
  red: "hover:bg-critical/[0.03]",
  outside: "hover:bg-muted-foreground/[0.03]",
};

/** Hover tint for clickable inline values, in the sector colour. */
export const SECTOR_FIELD_HOVER: Record<EditorColorVariant, string> = {
  blue: "hover:bg-stable/[0.07] hover:text-stable",
  yellow: "hover:bg-warning/[0.07] hover:text-warning",
  red: "hover:bg-critical/[0.07] hover:text-critical",
  outside: "hover:bg-muted-foreground/[0.07] hover:text-foreground",
};

/** Small, light row action (star / remove / confirm). Native button: no ghost box, no cursor glow. */
const ROW_ACTION =
  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] outline-none transition-[opacity,color,background-color] duration-150 focus-visible:ring-1 focus-visible:ring-ring";

/** Hidden until the row is hovered/focused; softly visible on touch screens (no hover there). */
const ROW_ACTION_REVEAL =
  "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-60";

/** Keeps the typing box focused when a row button is pressed, so blur does not save/close it first. */
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

// Sortable Item for drag-and-drop with optional highlight
interface SortableItemProps {
  id: string;
  index: number;
  value: string;
  onEdit: (id: string, newValue: string) => void;
  onDelete: (id: string) => void;
  showDragHandle?: boolean;
  isHighlighted?: boolean;
  onToggleHighlight?: (id: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  highlightColorVariant?: EditorColorVariant;
  /** Extra always-visible action(s) for this item (e.g. PSM status cycle on UE pendencies). */
  extraActions?: React.ReactNode;
  /** Denser rows for the main card columns (smaller text and padding). */
  compact?: boolean;
  /** Fade in when the row was just added in this session. */
  animateIn?: boolean;
}

const SortableItem = memo(function SortableItem({ id, index, value, onEdit, onDelete, showDragHandle = true, isHighlighted, onToggleHighlight, onKeyDown, autoFocus, highlightColorVariant = 'blue', extraActions, compact = false, animateIn = false }: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(autoFocus || false);
  const [localValue, setLocalValue] = useState(value);
  const [isLeaving, setIsLeaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height to fit the full content while editing
  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = isLeaving
    ? { opacity: 0, transform: 'translateX(-4px)', transition: 'opacity 140ms ease, transform 140ms ease' }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // place caret at end + size to content on open
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
      autoResize(inputRef.current);
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      setIsEditing(true);
    }
  }, [autoFocus]);

  const handleSave = () => {
    const next = localValue.trim().toUpperCase();
    if (next && next !== value) {
      onEdit(id, next);
    }
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLeaving) return;
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      onDelete(id);
      return;
    }
    // Short fade-out, then remove (by id, so other deletions in between cannot shift it).
    setIsLeaving(true);
    window.setTimeout(() => onDelete(id), 140);
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
      onKeyDown?.(e);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
      onKeyDown?.(e);
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  // Highlight color styles — borda sutil na cor do setor (tokens semânticos)
  const hStyles = HIGHLIGHT_STYLES[highlightColorVariant];
  const sectorHover = SECTOR_ROW_HOVER[highlightColorVariant];
  const sectorTextHover = SECTOR_TEXT_HOVER[highlightColorVariant];

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "flex items-start gap-1 group/row rounded-sm px-1 -mx-0.5 transition-colors duration-150",
        compact ? "py-0.5" : "py-1 items-center",
        isDragging && "z-50 shadow-sm",
        isHighlighted ? hStyles.bg : sectorHover,
        animateIn && "animate-in fade-in-0 slide-in-from-top-1 duration-200 motion-reduce:animate-none"
      )}
    >
      {showDragHandle && (
        <button
          type="button"
          data-no-glass
          className="cursor-grab active:cursor-grabbing p-0 mt-[2px] opacity-30 hover:opacity-80 transition-opacity flex-shrink-0 touch-none"
          aria-label="Arrastar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
        </button>
      )}
      <span className={cn(
        "font-semibold text-[10px] min-w-[14px] flex-shrink-0 tabular-nums",
        compact && "leading-snug",
        isHighlighted ? hStyles.number : "text-muted-foreground"
      )}>{index + 1}.</span>
      
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value.toUpperCase());
            autoResize(e.currentTarget);
          }}
          rows={1}
          className={cn(
            "flex-1 min-w-0 w-full bg-background text-foreground border rounded outline-none uppercase font-medium tracking-tight resize-none overflow-hidden whitespace-pre-wrap break-words",
            compact ? "text-[11px] leading-snug px-1.5 py-0.5" : "text-[12px] leading-snug px-2 py-1",
            SECTOR_INPUT[highlightColorVariant]
          )}
          onKeyDown={handleKeyDownInternal}
          onBlur={handleSave}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span 
            className={cn(
              "flex-1 min-w-0 break-words cursor-text transition-colors tracking-tight",
              compact ? "text-[10px] leading-snug font-medium uppercase" : "text-[11px] leading-relaxed",
              sectorTextHover,
              isHighlighted ? hStyles.text : "text-foreground/90"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {value}
          </span>
          {extraActions}
          {onToggleHighlight && (
            <button
              type="button"
              data-no-glass
              className={cn(
                ROW_ACTION,
                isHighlighted ? "opacity-100" : ROW_ACTION_REVEAL,
                "hover:bg-muted/60"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleHighlight(id);
              }}
              title={isHighlighted ? "Remover destaque" : "Destacar"}
              aria-label={isHighlighted ? "Remover destaque" : "Destacar item"}
            >
              <Star className={cn(
                "h-2.5 w-2.5 transition-colors",
                isHighlighted ? hStyles.star : "text-muted-foreground"
              )} />
            </button>
          )}
          <button
            type="button"
            data-no-glass
            className={cn(
              ROW_ACTION,
              ROW_ACTION_REVEAL,
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            )}
            onClick={handleDelete}
            title="Remover item"
            aria-label="Remover item"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </>
      )}
    </div>
  );
});

// Inline editable array field with full functionality
interface InlineEditableArrayProps {
  items: string[];
  onUpdate: (items: string[]) => void;
  placeholder?: string;
  showNumbers?: boolean;
  colorClass?: string;
  maxCollapsedItems?: number;
  label?: string;
  icon?: React.ReactNode;
  alwaysShowAll?: boolean;
  highlightedIndices?: number[];
  onUpdateHighlights?: (indices: number[]) => void;
  // Combined update for items + highlights (prevents race conditions on delete)
  onUpdateBoth?: (items: string[], highlights: number[]) => void;
  onEnterPress?: () => void;
  onTabPress?: () => void;
  fieldId?: string;
  isActive?: boolean;
  iconColorClass?: string;
  highlightColorVariant?: EditorColorVariant;
  /** Extra buttons in the column header, next to "+" (UE only: quick templates, exam curves). */
  headerActions?: React.ReactNode;
  /** Extra per-item action (UE only: PSM status cycle). */
  renderItemActions?: (item: string, index: number) => React.ReactNode;
  /** Compact column style (no box, sentence-case title, denser rows) used in the main card columns. */
  compact?: boolean;
}

export function InlineEditableArray({ 
  items, 
  onUpdate, 
  placeholder = "Clique para adicionar",
  showNumbers = true,
  colorClass,
  maxCollapsedItems,
  label,
  icon,
  alwaysShowAll = false,
  highlightedIndices = [],
  onUpdateHighlights,
  onUpdateBoth,
  onEnterPress,
  onTabPress,
  fieldId,
  isActive,
  iconColorClass = "text-primary/60 hover:text-primary",
  highlightColorVariant = 'blue',
  headerActions,
  renderItemActions,
  compact = false,
}: InlineEditableArrayProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");
  const newInputRef = useRef<HTMLTextAreaElement>(null);

  // Stable IDs per item (required by dnd-kit). We keep an internal parallel array of ids
  // and reorder it together with items.
  const makeId = () => {
    const prefix = fieldId || 'item';
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  };

  const [itemIds, setItemIds] = useState<string[]>(() => items.map(() => makeId()));
  // Rows added in this session fade in; existing rows render without motion.
  const freshIdsRef = useRef<Set<string>>(new Set());
  
  // Track previous items length to detect external changes vs internal changes
  const prevItemsLengthRef = useRef(items.length);
  const isInternalChangeRef = useRef(false);

  // Latest values for the stable row callbacks (lets memoized rows skip re-rendering while typing).
  const latestRef = useRef({ items, itemIds, highlightedIndices, onUpdate, onUpdateBoth, onUpdateHighlights, onTabPress });
  latestRef.current = { items, itemIds, highlightedIndices, onUpdate, onUpdateBoth, onUpdateHighlights, onTabPress };

  // Keep ids array length in sync with items length
  useEffect(() => {
    // If this is an internal change (we already handled it), skip
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      prevItemsLengthRef.current = items.length;
      return;
    }
    
    setItemIds((prev) => {
      if (prev.length === items.length) return prev;
      if (prev.length < items.length) {
        // Items were added externally
        const toAdd = items.length - prev.length;
        return [...prev, ...Array.from({ length: toAdd }, () => makeId())];
      }
      // Items were removed externally - trim from end
      return prev.slice(0, items.length);
    });
    
    prevItemsLengthRef.current = items.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Activate adding mode when this column becomes active
  useEffect(() => {
    if (isActive) {
      setIsAddingNew(true);
    }
  }, [isActive]);

  useEffect(() => {
    if (isAddingNew && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [isAddingNew]);

  // Shrink the new-item box back to one line once its text is cleared (after Enter).
  useEffect(() => {
    if (!newItemValue && newInputRef.current) {
      newInputRef.current.style.height = 'auto';
    }
  }, [newItemValue]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = itemIds.findIndex(id => id === active.id);
      const newIndex = itemIds.findIndex(id => id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return;
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      const newIds = arrayMove(itemIds, oldIndex, newIndex);
      
      // Reorder highlights correctly: map old highlight indices to new positions
      let newHighlights: number[] = [];
      if (onUpdateHighlights && highlightedIndices.length > 0) {
        newHighlights = highlightedIndices.map(idx => {
          if (idx === oldIndex) return newIndex;
          if (oldIndex < newIndex) {
            // Item moved down: indices between shift up by 1
            if (idx > oldIndex && idx <= newIndex) return idx - 1;
          } else {
            // Item moved up: indices between shift down by 1
            if (idx >= newIndex && idx < oldIndex) return idx + 1;
          }
          return idx;
        });
      }
      
      // Update both items and highlights in a single batch
      isInternalChangeRef.current = true;
      setItemIds(newIds);
      
      // Use combined update to prevent race conditions
      if (onUpdateBoth && highlightedIndices.length > 0) {
        onUpdateBoth(newItems, newHighlights);
      } else {
        onUpdate(newItems);
        if (onUpdateHighlights && highlightedIndices.length > 0) {
          onUpdateHighlights(newHighlights);
        }
      }
    }
  };

  const handleAddItem = (continueAdding: boolean = false) => {
    if (newItemValue.trim()) {
      const newId = makeId();
      freshIdsRef.current.add(newId);
      isInternalChangeRef.current = true;
      setItemIds((prev) => [...prev, newId]);
      onUpdate([...items, newItemValue.trim().toUpperCase()]);
      setNewItemValue("");
      if (!continueAdding) {
        setIsAddingNew(false);
      }
    } else {
      setIsAddingNew(false);
    }
  };

  const cancelAdding = () => {
    setIsAddingNew(false);
    setNewItemValue("");
  };

  const openAdding = () => {
    if (isAddingNew) {
      newInputRef.current?.focus();
      return;
    }
    setIsAddingNew(true);
  };

  // Stable row callbacks: resolve the row by id against the latest list.
  const editItem = useCallback((id: string, newValue: string) => {
    const { items: cur, itemIds: ids, onUpdate: update } = latestRef.current;
    const idx = ids.indexOf(id);
    if (idx < 0 || cur[idx] === newValue) return;
    const next = [...cur];
    next[idx] = newValue;
    update(next);
  }, []);

  const deleteItem = useCallback((id: string) => {
    const { items: cur, itemIds: ids, highlightedIndices: hl, onUpdate: update, onUpdateBoth: updateBoth, onUpdateHighlights: updateHl } = latestRef.current;
    const idx = ids.indexOf(id);
    if (idx < 0) return;
    isInternalChangeRef.current = true;
    freshIdsRef.current.delete(id);
    setItemIds((prev) => prev.filter((x) => x !== id));
    const newItems = cur.filter((_, i) => i !== idx);
    const newHighlights = hl.filter(i => i !== idx).map(i => (i > idx ? i - 1 : i));
    // Use combined update to prevent race conditions
    if (updateBoth) {
      updateBoth(newItems, newHighlights);
    } else {
      update(newItems);
      updateHl?.(newHighlights);
    }
  }, []);

  const toggleHighlight = useCallback((id: string) => {
    const { itemIds: ids, highlightedIndices: hl, onUpdateHighlights: updateHl } = latestRef.current;
    if (!updateHl) return;
    const idx = ids.indexOf(id);
    if (idx < 0) return;
    updateHl(hl.includes(idx) ? hl.filter(i => i !== idx) : [...hl, idx]);
  }, []);

  const handleItemKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Enter pressed on existing item - start adding new
      setIsAddingNew(true);
    } else if (e.key === 'Tab') {
      // Tab pressed - move to next column
      latestRef.current.onTabPress?.();
    }
  }, []);

  const displayItems = maxCollapsedItems && !alwaysShowAll ? items.slice(0, maxCollapsedItems) : items;
  const hiddenCount = maxCollapsedItems && !alwaysShowAll ? Math.max(0, items.length - maxCollapsedItems) : 0;

  return (
    <div className={cn(compact ? "py-0.5" : "rounded-md p-1.5", colorClass)}>
      {label && (
        <div className={cn("flex items-center justify-between", compact ? "mb-0.5 gap-1" : "mb-1")}>
          <div className={cn("flex items-center min-w-0", compact ? "gap-1" : "gap-1.5")}>
            {!compact && icon}
            {compact ? (
              <span className="text-[10px] font-medium text-muted-foreground truncate">{label}</span>
            ) : (
              <span className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">{label}</span>
            )}
            {!compact && items.length > 0 && (
              <Badge variant="secondary" className="h-3.5 px-1 text-[9px] font-medium">{items.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {headerActions}
            <button
              type="button"
              data-no-glass
              className={cn(ROW_ACTION, "hover:bg-muted/60", iconColorClass)}
              onMouseDown={keepFocus}
              onClick={(e) => {
                e.stopPropagation();
                openAdding();
              }}
              title="Adicionar item"
              aria-label="Adicionar item"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-0.5">
        {items.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itemIds.slice(0, displayItems.length)} strategy={verticalListSortingStrategy}>
              {displayItems.map((item, realIdx) => {
                // displayItems = items.slice(0, maxCollapsedItems), so the display index is the real index
                const id = itemIds[realIdx];
                if (!id) return null;
                return (
                  <SortableItem
                    key={id}
                    id={id}
                    index={realIdx}
                    value={item}
                    onEdit={editItem}
                    onDelete={deleteItem}
                    showDragHandle={showNumbers}
                    isHighlighted={highlightedIndices.includes(realIdx)}
                    onToggleHighlight={onUpdateHighlights ? toggleHighlight : undefined}
                    onKeyDown={handleItemKeyDown}
                    highlightColorVariant={highlightColorVariant}
                    extraActions={renderItemActions?.(item, realIdx)}
                    compact={compact}
                    animateIn={freshIdsRef.current.has(id)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        ) : !isAddingNew ? (
          <span 
            className={cn("text-muted-foreground/50 cursor-pointer hover:text-muted-foreground italic pl-0.5", compact ? "text-[10px]" : "text-[11px]")}
            onClick={() => setIsAddingNew(true)}
          >
            {placeholder}
          </span>
        ) : null}
        
        {hiddenCount > 0 && (
          <span className="text-[10px] text-muted-foreground pl-5 italic">+{hiddenCount} mais</span>
        )}
        
        {isAddingNew && (
          <div className={cn(
            "flex items-start gap-1 rounded-sm px-1 -mx-0.5 animate-in fade-in-0 duration-150 motion-reduce:animate-none",
            compact ? "py-0.5" : "py-1"
          )}>
            {showNumbers && <span className="w-2.5 flex-shrink-0" aria-hidden />}
            <span className={cn(
              "font-semibold text-[10px] min-w-[14px] flex-shrink-0 tabular-nums text-muted-foreground/60",
              compact ? "leading-snug pt-[3px]" : "pt-1"
            )}>{items.length + 1}.</span>
            <textarea
              ref={newInputRef}
              value={newItemValue}
              onChange={(e) => {
                setNewItemValue(e.target.value.toUpperCase());
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }}
              placeholder="NOVO ITEM…"
              rows={1}
              className={cn(
                "flex-1 min-w-0 w-full bg-background text-foreground border rounded outline-none uppercase font-medium tracking-tight resize-none overflow-hidden whitespace-pre-wrap break-words placeholder:font-normal placeholder:text-muted-foreground/50",
                compact ? "text-[11px] leading-snug px-1.5 py-0.5" : "text-[12px] leading-snug px-2 py-1",
                SECTOR_INPUT[highlightColorVariant]
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddItem(true);
                  onEnterPress?.();
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  handleAddItem(false);
                  onTabPress?.();
                } else if (e.key === 'Escape') {
                  cancelAdding();
                }
              }}
              onBlur={() => handleAddItem(false)}
            />
            <button
              type="button"
              data-no-glass
              className={cn(ROW_ACTION, "mt-[3px] hover:bg-muted/60", SECTOR_CONFIRM[highlightColorVariant])}
              onMouseDown={keepFocus}
              onClick={() => handleAddItem(false)}
              title="Salvar item (Enter)"
              aria-label="Salvar item"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              data-no-glass
              className={cn(ROW_ACTION, "mt-[3px] text-muted-foreground hover:text-destructive hover:bg-destructive/10")}
              onMouseDown={keepFocus}
              onClick={cancelAdding}
              title="Cancelar (Esc)"
              aria-label="Cancelar"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        
        {!label && !isAddingNew && items.length > 0 && (
          <button
            type="button"
            data-no-glass
            className={cn("inline-flex items-center h-5 text-[10px] mt-1 rounded-sm px-1 -mx-1 transition-colors hover:bg-muted/60", iconColorClass)}
            onMouseDown={keepFocus}
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingNew(true);
            }}
          >
            <Plus className="h-3 w-3 mr-0.5" /> Adicionar
          </button>
        )}
      </div>
    </div>
  );
}

// Single value inline editable field
interface InlineEditableFieldProps {
  value: string;
  onUpdate: (value: string) => void;
  placeholder?: string;
  className?: string;
  colorVariant?: EditorColorVariant;
}

export function InlineEditableField({ value, onUpdate, placeholder = "-", className, colorVariant = 'blue' }: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    onUpdate(localValue.toUpperCase());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value.toUpperCase())}
        className={cn("bg-background text-foreground border rounded px-1.5 py-0.5 outline-none text-sm w-full uppercase", SECTOR_INPUT[colorVariant], className)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setIsEditing(false);
        }}
        onBlur={handleSave}
      />
    );
  }

  return (
    <span 
      className={cn(
        "cursor-pointer transition-colors rounded-sm px-0.5 -mx-0.5",
        SECTOR_FIELD_HOVER[colorVariant],
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </span>
  );
}

// Collapsible inline editable textarea for longer text - optimized for space
interface InlineEditableTextareaProps {
  value: string;
  onUpdate: (value: string) => void;
  placeholder?: string;
  colorVariant?: EditorColorVariant;
}

export function InlineEditableTextarea({ value, onUpdate, placeholder = "-", colorVariant = 'blue' }: InlineEditableTextareaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content overflows the collapsed height
  const [hasOverflow, setHasOverflow] = useState(false);
  
  useEffect(() => {
    if (contentRef.current && !isEditing) {
      const element = contentRef.current;
      // Check if content height exceeds collapsed max height (48px = ~3 lines)
      setHasOverflow(element.scrollHeight > 48);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    onUpdate(localValue.toUpperCase());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value.toUpperCase());
        }}
        className={cn("w-full bg-background text-foreground border rounded px-2 py-1.5 outline-none text-xs uppercase min-h-[80px] max-h-[300px] resize-y overflow-auto", SECTOR_INPUT[colorVariant])}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsEditing(false);
        }}
        onBlur={handleSave}
        onClick={(e) => e.stopPropagation()}
        style={{ resize: 'vertical' }}
      />
    );
  }

  return (
    <div className="relative">
      <div 
        ref={contentRef}
        className={cn(
          "cursor-pointer transition-all duration-200 text-xs whitespace-pre-wrap overflow-hidden rounded-sm px-1 -mx-1",
          SECTOR_FIELD_HOVER[colorVariant],
          !isTextExpanded && hasOverflow ? "max-h-[48px]" : "max-h-none"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {value || <span className="text-muted-foreground/50 italic text-xs">{placeholder}</span>}
      </div>
      
      {/* Gradient fade when collapsed with overflow */}
      {hasOverflow && !isTextExpanded && !isEditing && (
        <div className="absolute bottom-5 left-0 right-0 h-4 bg-gradient-to-t from-muted/30 to-transparent pointer-events-none" />
      )}
      
      {/* Expand/Collapse button - only show if content overflows */}
      {hasOverflow && !isEditing && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary mt-0.5"
          onClick={(e) => {
            e.stopPropagation();
            setIsTextExpanded(!isTextExpanded);
          }}
        >
          {isTextExpanded ? (
            <>
              <ChevronDown className="h-3 w-3 mr-0.5 rotate-180" />
              Retrair
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-0.5" />
              Expandir
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * Smooth open/close for card sections (columns) without unmounting them,
 * so typing state is kept and the motion is fluid. Respects reduced motion.
 */
export function SmoothCollapse({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  const inertProps = open ? {} : ({ inert: "" } as Record<string, string>);
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
      aria-hidden={!open}
      {...inertProps}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/** Animation classes for Radix CollapsibleContent (detail areas of the cards). */
export const COLLAPSIBLE_CONTENT_MOTION =
  "overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up motion-reduce:animate-none";
