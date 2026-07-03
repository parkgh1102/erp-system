import React from 'react';
import { Resizable } from 'react-resizable';
import type { ResizeCallbackData } from 'react-resizable';
import './ResizableTitle.css';

interface ResizableTitleProps extends React.HTMLAttributes<HTMLTableCellElement> {
  onResize?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
  width?: number;
}

/**
 * antd Table 헤더 셀을 마우스로 드래그해 폭 조절 가능하게 하는 셀 컴포넌트.
 * useResizableColumns 훅과 함께 `components={{ header: { cell: ResizableTitle } }}` 로 사용.
 * width/onResize 가 없으면(리사이즈 비활성 컬럼) 일반 <th> 로 렌더한다.
 */
const ResizableTitle: React.FC<ResizableTitleProps> = (props) => {
  const { onResize, width, ...restProps } = props;

  if (!width || !onResize) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export default ResizableTitle;
