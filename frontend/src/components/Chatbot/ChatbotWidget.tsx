import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Avatar, Space, Typography, Tag, Spin, App, ConfigProvider, theme } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  UserOutlined,
  CloseOutlined,
  MessageOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../../utils/api';
import './ChatbotWidget.css';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

interface ChatbotStatus {
  status: string;
  hasApiKey: boolean;
  model: string;
  features: string[];
}

const ChatbotWidget: React.FC = () => {
  const { message } = App.useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ChatbotStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 챗봇 상태 확인
  useEffect(() => {
    if (isOpen && !status) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const response = await api.get('/chatbot/status');
      setStatus(response.data);

      if (!response.data.hasApiKey) {
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          content: '⚠️ Gemini API 키가 설정되지 않았습니다.\n\n백엔드 .env 파일에 GEMINI_API_KEY를 설정해주세요.\n\n무료 API 키는 https://makersuite.google.com/app/apikey 에서 발급받을 수 있습니다.',
          timestamp: new Date()
        }]);
      } else {
        // 환영 메시지
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          content: '안녕하세요! 🤖 ERP 시스템 AI 어시스턴트입니다.\n\n다음과 같은 작업을 할 수 있습니다:\n\n📊 **조회 기능:**\n• 이번 달 매출은 얼마인가요?\n• 매입 현황을 알려주세요\n• 고객 정보를 조회해주세요\n• 제품 재고 현황을 보여주세요\n• 전체 통계를 알려주세요\n\n✏️ **등록 기능:**\n\n**매출 (과세):**\n• 홍길동에게 노트북 2대 100만원에 판매했어요\n• 박경환 고객에게 상품A 5개 50만원 판매\n\n**매출 (면세):**\n• 농협에 쌀 100kg 50만원 면세로 판매\n• 김철수에게 도서 20권 10만원 면세 판매\n\n**매입:**\n• ABC상사에서 부품 50개 200만원에 구매\n• 농협에서 사과 100kg 50만원 면세로 구매\n\n**수금:**\n• 박경환에게 50만원 현금으로 받았어요\n• 홍길동한테 100만원 계좌이체로 수금\n\n**입금:**\n• 김철수에게 30만원 보냈어요\n• ABC상사한테 200만원 입금\n\n무엇을 도와드릴까요?',
          timestamp: new Date()
        }]);
      }
    } catch (error: any) {
      console.error('챗봇 상태 확인 실패:', error);
      message.error('챗봇 연결에 실패했습니다.');
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.post('/chatbot/message', {
        message: textToSend
      }, {
        timeout: 60000 // 60초 타임아웃 (Gemini API 응답 대기)
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(response.data.timestamp),
        data: response.data.data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('챗봇 메시지 전송 실패:', error);

      let errorMessage = '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.';

      if (error.response?.data?.needsApiKey) {
        errorMessage = '⚠️ Gemini API 키가 설정되지 않았습니다.\n\n백엔드 .env 파일에 GEMINI_API_KEY를 설정해주세요.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      const errorAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setStatus(null);
    checkStatus();
  };

  // 추천 질문 버튼
  const suggestedQuestions = [
    '이번 달 매출은 얼마인가요?',
    '홍길동에게 노트북 2대 100만원 판매',
    '농협에 쌀 100kg 50만원 면세로 판매',
    '박경환에게 50만원 현금 수금'
  ];

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1B61A8',
          colorBgContainer: '#ffffff',
          colorText: 'rgba(0, 0, 0, 0.88)',
          colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
          colorBorder: '#d9d9d9',
        },
      }}
    >
      {/* 챗봇 버튼 */}
      {!isOpen && (
        <div className="chatbot-button" onClick={() => setIsOpen(true)}>
          <MessageOutlined style={{ fontSize: '24px' }} />
        </div>
      )}

      {/* 챗봇 윈도우 */}
      {isOpen && (
        <div className="chatbot-window">
          <Card
            title={
              <Space>
                <RobotOutlined style={{ fontSize: '20px', color: '#1B61A8' }} />
                <span>ERP AI 어시스턴트</span>
                {status?.hasApiKey && (
                  <Tag color="success" style={{ marginLeft: 'auto' }}>
                    {status.model}
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  size="small"
                />
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => setIsOpen(false)}
                  size="small"
                />
              </Space>
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
          >
            {/* 메시지 영역 */}
            <div className="chatbot-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}
                >
                  <Avatar
                    icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: msg.role === 'user' ? '#1B61A8' : '#52c41a'
                    }}
                  />
                  <div className="message-content">
                    <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {msg.timestamp.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message message-assistant">
                  <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
                  <div className="message-content">
                    <Spin size="small" /> 답변 생성 중...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 추천 질문과 리셋 버튼 (메시지가 있을 때 항상 표시) */}
            {messages.length > 0 && status?.hasApiKey && (
              <div className="suggested-questions">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    💡 추천 질문:
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    onClick={handleReset}
                    style={{ fontSize: '13px', padding: '4px 8px', height: 'auto', fontWeight: 500 }}
                  >
                    🔄 처음으로
                  </Button>
                </div>
                <Space wrap>
                  {suggestedQuestions.map((q, index) => (
                    <Button
                      key={index}
                      size="small"
                      onClick={() => handleSuggestedQuestion(q)}
                      disabled={loading}
                    >
                      {q}
                    </Button>
                  ))}
                </Space>
              </div>
            )}

            {/* 입력 영역 */}
            <div className="chatbot-input">
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="메시지를 입력하세요..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={loading || !status?.hasApiKey}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleSend()}
                loading={loading}
                disabled={!inputValue.trim() || !status?.hasApiKey}
              >
                전송
              </Button>
            </div>
          </Card>
        </div>
      )}
    </ConfigProvider>
  );
};

export default ChatbotWidget;
