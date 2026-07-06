import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { WidgetConfig } from '../../api'
import { WIDGET_REGISTRY } from '../../dashboard/widgetRegistry'

const WIDTH_OPTIONS = [33, 50, 66, 100] as const

function SortableRow({
  widget,
  onToggle,
  onWidthChange,
}: {
  widget: WidgetConfig
  onToggle: () => void
  onWidthChange: (width: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-slate-400 active:cursor-grabbing dark:text-slate-500"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <label className="flex flex-1 items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
        <input type="checkbox" checked={widget.enabled} onChange={onToggle} className="size-4" />
        {WIDGET_REGISTRY[widget.widget].label}
      </label>
      <select
        value={widget.width}
        onChange={(e) => onWidthChange(Number(e.target.value))}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        {WIDTH_OPTIONS.map((w) => (
          <option key={w} value={w}>
            {w}%
          </option>
        ))}
      </select>
    </div>
  )
}

export function LayoutEditor({
  initialWidgets,
  onSave,
  onCancel,
}: {
  initialWidgets: WidgetConfig[]
  onSave: (widgets: WidgetConfig[]) => void
  onCancel: () => void
}) {
  const [widgets, setWidgets] = useState(initialWidgets)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setWidgets((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {widgets.map((w) => (
              <SortableRow
                key={w.id}
                widget={w}
                onToggle={() =>
                  setWidgets((items) =>
                    items.map((i) => (i.id === w.id ? { ...i, enabled: !i.enabled } : i)),
                  )
                }
                onWidthChange={(width) =>
                  setWidgets((items) =>
                    items.map((i) => (i.id === w.id ? { ...i, width: width as WidgetConfig['width'] } : i)),
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(widgets)}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Save layout
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
