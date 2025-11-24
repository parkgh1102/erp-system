import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import 'antd/dist/reset.css'
import './index.css'
import './styles/mobile.css'
import { message } from 'antd'

// 전역 메시지 설정: 모든 토스트 알림을 2초로 통일
message.config({
  duration: 2,
  maxCount: 3,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)