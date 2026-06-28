import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InboxOutlined, FileDoneOutlined, CloseOutlined } from '@ant-design/icons';

interface AnimatedFileUploadProps {
  accept?: string;
  /** 파일 선택 시 호출. 진행률을 직접 제어하려면 progress prop 사용. */
  onFile?: (file: File) => void;
  /** 외부에서 업로드 진행률(0~100)을 제어할 때 사용. 미지정 시 데모 진행 애니메이션. */
  progress?: number;
  hint?: string;
}

/**
 * 부드러운 애니메이션이 있는 파일 업로드 영역 (영상 ③ 데모 기반).
 * 드래그&드롭 + 클릭 선택, 진행률 바, 완료 상태 표시.
 */
export const AnimatedFileUpload: React.FC<AnimatedFileUploadProps> = ({
  accept,
  onFile,
  progress,
  hint = '파일을 끌어다 놓거나 클릭하여 선택',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [innerProgress, setInnerProgress] = useState(0);
  const pct = progress !== undefined ? progress : innerProgress;
  const done = pct >= 100;

  const handleFile = (f: File) => {
    setFile(f);
    onFile?.(f);
    if (progress === undefined) {
      // 데모용 진행 애니메이션
      setInnerProgress(0);
      let p = 0;
      const timer = setInterval(() => {
        p += Math.random() * 18 + 6;
        if (p >= 100) {
          p = 100;
          clearInterval(timer);
        }
        setInnerProgress(Math.round(p));
      }, 180);
    }
  };

  const reset = () => {
    setFile(null);
    setInnerProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      onClick={() => !file && inputRef.current?.click()}
      animate={{
        borderColor: dragOver ? '#1B61A8' : '#d9d9d9',
        backgroundColor: dragOver ? '#e6f4ff' : '#fafafa',
      }}
      style={{
        position: 'relative',
        border: '2px dashed #d9d9d9',
        borderRadius: 12,
        padding: '28px 20px',
        textAlign: 'center',
        cursor: file ? 'default' : 'pointer',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              animate={{ y: dragOver ? -6 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <InboxOutlined style={{ fontSize: 40, color: '#1B61A8' }} />
            </motion.div>
            <div style={{ marginTop: 10, color: '#666', fontSize: 14 }}>{hint}</div>
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <motion.span
                animate={done ? { scale: [1, 1.3, 1], color: '#52c41a' } : { color: '#1B61A8' }}
                transition={{ duration: 0.4 }}
              >
                <FileDoneOutlined style={{ fontSize: 22 }} />
              </motion.span>
              <span style={{ fontSize: 14, color: '#333', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#999' }}
              >
                <CloseOutlined />
              </button>
            </div>

            <div style={{ marginTop: 14, height: 8, borderRadius: 6, background: '#f0f0f0', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${pct}%`, backgroundColor: done ? '#52c41a' : '#1B61A8' }}
                transition={{ ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 6 }}
              />
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: done ? '#52c41a' : '#1B61A8', fontWeight: 600 }}>
              {done ? '업로드 완료' : `${pct}%`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedFileUpload;
