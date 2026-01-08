import { useRef, useState, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

export const useDraggableModal = () => {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const initialMousePos = useRef<Position>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 타이틀 영역에서만 드래그 시작
    const target = e.target as HTMLElement;
    if (target.closest('.ant-modal-close') || target.closest('button')) {
      return;
    }

    setIsDragging(true);
    dragStartPos.current = { ...position };
    initialMousePos.current = { x: e.clientX, y: e.clientY };

    e.preventDefault();
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - initialMousePos.current.x;
    const deltaY = e.clientY - initialMousePos.current.y;

    setPosition({
      x: dragStartPos.current.x + deltaX,
      y: dragStartPos.current.y + deltaY
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetPosition = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  const modalRender = useCallback((modal: React.ReactNode) => {
    return (
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onMouseMove={handleMouseMove as any}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {modal}
      </div>
    );
  }, [position, isDragging, handleMouseMove, handleMouseUp]);

  const titleProps = {
    onMouseDown: handleMouseDown,
    style: { cursor: 'grab', userSelect: 'none' as const }
  };

  return {
    position,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetPosition,
    modalRender,
    titleProps,
    modalProps: {
      style: {
        transform: `translate(${position.x}px, ${position.y}px)`,
      }
    }
  };
};

export default useDraggableModal;
