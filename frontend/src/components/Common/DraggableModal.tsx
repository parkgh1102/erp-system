import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Modal } from 'antd';
import type { ModalProps } from 'antd';

interface DraggableModalProps extends ModalProps {
  children?: React.ReactNode;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
  title,
  open,
  children,
  resizable = true,
  minWidth = 400,
  minHeight = 300,
  width: initialWidth,
  ...restProps
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0, startPosX: 0, startPosY: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // 모달이 닫힐 때 위치/크기 초기화
  useEffect(() => {
    if (!open) {
      setPosition({ x: 0, y: 0 });
      setSize({ width: 0, height: 0 });
    }
  }, [open]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.ant-modal-close') || target.closest('button')) {
      return;
    }

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
    e.preventDefault();
  }, [position]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    const modalElement = modalRef.current?.querySelector('.ant-modal') as HTMLElement;
    if (!modalElement) return;

    const rect = modalElement.getBoundingClientRect();

    setIsResizing(true);
    setResizeDirection(direction);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width || rect.width,
      startHeight: size.height || rect.height,
      startPosX: position.x,
      startPosY: position.y
    };
  }, [size, position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        setPosition({
          x: dragRef.current.posX + deltaX,
          y: dragRef.current.posY + deltaY
        });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeRef.current.startX;
        const deltaY = e.clientY - resizeRef.current.startY;

        let newWidth = resizeRef.current.startWidth;
        let newHeight = resizeRef.current.startHeight;
        let newPosX = resizeRef.current.startPosX;
        let newPosY = resizeRef.current.startPosY;

        if (resizeDirection.includes('e')) {
          newWidth = Math.max(minWidth, resizeRef.current.startWidth + deltaX);
        }
        if (resizeDirection.includes('w')) {
          const widthDelta = Math.min(deltaX, resizeRef.current.startWidth - minWidth);
          newWidth = resizeRef.current.startWidth - widthDelta;
          newPosX = resizeRef.current.startPosX + widthDelta;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(minHeight, resizeRef.current.startHeight + deltaY);
        }
        if (resizeDirection.includes('n')) {
          const heightDelta = Math.min(deltaY, resizeRef.current.startHeight - minHeight);
          newHeight = resizeRef.current.startHeight - heightDelta;
          newPosY = resizeRef.current.startPosY + heightDelta;
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newPosX, y: newPosY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, resizeDirection, minWidth, minHeight]);

  const draggableTitle = (
    <div
      onMouseDown={handleMouseDown}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        width: '100%',
        padding: '0'
      }}
    >
      {title}
    </div>
  );

  const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
  };

  const cornerStyle: React.CSSProperties = {
    ...resizeHandleStyle,
    width: '12px',
    height: '12px',
  };

  const edgeStyleHorizontal: React.CSSProperties = {
    ...resizeHandleStyle,
    height: '8px',
    left: '12px',
    right: '12px',
  };

  const edgeStyleVertical: React.CSSProperties = {
    ...resizeHandleStyle,
    width: '8px',
    top: '12px',
    bottom: '12px',
  };

  return (
    <Modal
      title={draggableTitle}
      open={open}
      width={size.width || initialWidth}
      {...restProps}
      modalRender={(modal) => (
        <div
          ref={modalRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            pointerEvents: 'auto',
            position: 'relative'
          }}
        >
          {modal}
          {resizable && open && (
            <>
              {/* 코너 핸들 */}
              <div
                style={{ ...cornerStyle, top: 0, left: 0, cursor: 'nw-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
              />
              <div
                style={{ ...cornerStyle, top: 0, right: 0, cursor: 'ne-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
              />
              <div
                style={{ ...cornerStyle, bottom: 0, left: 0, cursor: 'sw-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
              />
              <div
                style={{ ...cornerStyle, bottom: 0, right: 0, cursor: 'se-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
              />
              {/* 엣지 핸들 */}
              <div
                style={{ ...edgeStyleHorizontal, top: 0, cursor: 'n-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
              />
              <div
                style={{ ...edgeStyleHorizontal, bottom: 0, cursor: 's-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 's')}
              />
              <div
                style={{ ...edgeStyleVertical, left: 0, cursor: 'w-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
              />
              <div
                style={{ ...edgeStyleVertical, right: 0, cursor: 'e-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
              />
            </>
          )}
        </div>
      )}
      styles={{
        ...restProps.styles,
        body: {
          ...restProps.styles?.body,
          height: size.height ? `calc(${size.height}px - 110px)` : restProps.styles?.body?.height,
          overflow: 'auto'
        }
      }}
    >
      {children}
    </Modal>
  );
};

export default DraggableModal;
