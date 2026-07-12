import React, { useState } from 'react';
import { Typography } from 'antd';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NAV_ITEMS, normalizeCapacity, type NavArrangement } from '../../hooks/useMobileNav';

const { Text } = Typography;

type ContainerId = 'dock' | 'drawer';

interface MobileNavEditorProps {
  initial: NavArrangement;
  dockCapacity: number;
  isDark: boolean;
  brandPrimary: string;
  onChange: (next: NavArrangement) => void;
}

const isContainer = (id: string): id is ContainerId => id === 'dock' || id === 'drawer';

/** 아이콘 타일 (편집 모드 표시용) */
const Tile: React.FC<{
  itemKey: string;
  isDark: boolean;
  dragging?: boolean;
  overlay?: boolean;
}> = ({ itemKey, isDark, dragging, overlay }) => {
  const meta = NAV_ITEMS[itemKey];
  if (!meta) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '14px 4px',
        borderRadius: '12px',
        background: isDark ? '#262626' : '#f7f8fa',
        color: isDark ? '#d1d5db' : '#374151',
        border: `1px solid ${isDark ? '#3a3a3a' : '#eef0f3'}`,
        boxShadow: overlay ? '0 10px 24px rgba(0,0,0,0.28)' : 'none',
        opacity: dragging ? 0.35 : 1,
        transform: overlay ? 'scale(1.06)' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <div style={{ fontSize: '24px', lineHeight: 1 }}>{meta.icon}</div>
      <Text
        style={{
          fontSize: '12px',
          color: isDark ? '#d1d5db' : '#374151',
          whiteSpace: 'nowrap',
        }}
      >
        {meta.label}
      </Text>
    </div>
  );
};

/** 정렬 가능한 아이콘 (편집 모드에서 흔들림) */
const SortableTile: React.FC<{ itemKey: string; isDark: boolean }> = ({ itemKey, isDark }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemKey,
  });
  return (
    <div
      ref={setNodeRef}
      className="erp-nav-jiggle"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <Tile itemKey={itemKey} isDark={isDark} dragging={isDragging} />
    </div>
  );
};

/** 드롭 가능한 구역 래퍼 (비어 있어도 드롭 허용) */
const Zone: React.FC<{
  id: ContainerId;
  items: string[];
  columns: number;
  isDark: boolean;
  brandPrimary: string;
  children: React.ReactNode;
}> = ({ id, items, columns, isDark, brandPrimary, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext id={id} items={items} strategy={rectSortingStrategy}>
      <div
        ref={setNodeRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '8px',
          padding: '8px',
          borderRadius: '14px',
          minHeight: '84px',
          background: isOver
            ? isDark
              ? 'rgba(77,163,255,0.10)'
              : brandPrimary + '10'
            : isDark
              ? 'rgba(255,255,255,0.02)'
              : '#fafbfc',
          border: `1px dashed ${isOver ? brandPrimary : isDark ? '#3a3a3a' : '#e3e6ea'}`,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {children}
      </div>
    </SortableContext>
  );
};

const MobileNavEditor: React.FC<MobileNavEditorProps> = ({
  initial,
  dockCapacity,
  isDark,
  brandPrimary,
  onChange,
}) => {
  const [items, setItems] = useState<NavArrangement>({
    dock: [...initial.dock],
    drawer: [...initial.drawer],
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  // 마우스는 6px 이동 후 드래그, 터치는 150ms 롱프레스 후 드래그(스크롤/탭과 충돌 방지)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const findContainer = (arr: NavArrangement, id: string): ContainerId | null => {
    if (isContainer(id)) return id;
    if (arr.dock.includes(id)) return 'dock';
    if (arr.drawer.includes(id)) return 'drawer';
    return null;
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    setItems((prev) => {
      const activeC = findContainer(prev, activeIdStr);
      const overC = findContainer(prev, overIdStr);
      if (!activeC || !overC || activeC === overC) return prev;
      const activeItems = prev[activeC];
      const overItems = prev[overC];
      const overIndex = overItems.indexOf(overIdStr);
      const newIndex = isContainer(overIdStr) || overIndex < 0 ? overItems.length : overIndex;
      return {
        ...prev,
        [activeC]: activeItems.filter((k) => k !== activeIdStr),
        [overC]: [...overItems.slice(0, newIndex), activeIdStr, ...overItems.slice(newIndex)],
      } as NavArrangement;
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const activeIdStr = String(active.id);
    setItems((prev) => {
      let next = prev;
      if (over) {
        const overIdStr = String(over.id);
        const activeC = findContainer(prev, activeIdStr);
        const overC = findContainer(prev, overIdStr);
        if (activeC && overC && activeC === overC) {
          const list = prev[activeC];
          const oldIndex = list.indexOf(activeIdStr);
          const newIndex = isContainer(overIdStr) ? list.length - 1 : list.indexOf(overIdStr);
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            next = { ...prev, [activeC]: arrayMove(list, oldIndex, newIndex) };
          }
        }
      }
      const norm = normalizeCapacity(next, dockCapacity);
      // 부모 상태 갱신은 updater 밖에서(렌더 중 setState 경고 방지)
      queueMicrotask(() => onChange(norm));
      return norm;
    });
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToWindowEdges]}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div style={{ marginBottom: '14px' }}>
        <Text
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: isDark ? '#9ca3af' : '#6b7280',
            display: 'block',
            marginBottom: '6px',
            paddingLeft: '4px',
          }}
        >
          하단 바 ({dockCapacity}칸 고정)
        </Text>
        <Zone
          id="dock"
          items={items.dock}
          columns={dockCapacity}
          isDark={isDark}
          brandPrimary={brandPrimary}
        >
          {items.dock.map((k) => (
            <SortableTile key={k} itemKey={k} isDark={isDark} />
          ))}
        </Zone>
      </div>

      <div>
        <Text
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: isDark ? '#9ca3af' : '#6b7280',
            display: 'block',
            marginBottom: '6px',
            paddingLeft: '4px',
          }}
        >
          전체 메뉴
        </Text>
        <Zone
          id="drawer"
          items={items.drawer}
          columns={4}
          isDark={isDark}
          brandPrimary={brandPrimary}
        >
          {items.drawer.map((k) => (
            <SortableTile key={k} itemKey={k} isDark={isDark} />
          ))}
        </Zone>
      </div>

      <DragOverlay>
        {activeId ? <Tile itemKey={activeId} isDark={isDark} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default MobileNavEditor;
