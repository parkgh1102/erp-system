import{g as b,j as e}from"./index-CvO9CwHJ.js";import{r as a}from"./react-vendor-DTT0EbPP.js";import{H as N,G as P,t as T,aT as B,K as M,A as v,w as $,aU as h,T as G,c as _,B as c,S as u,Q as L,ay as Q,aC as V,b as O,f as W}from"./antd-vendor-pqAGYc1F.js";import"./utils-vendor-BsYhjA75.js";const{Text:k,Paragraph:Y}=G,{TextArea:H}=L,X=()=>{const{message:C}=N.useApp(),[d,f]=a.useState(!1),[p,n]=a.useState([]),[m,y]=a.useState(""),[i,j]=a.useState(!1),[o,S]=a.useState(null),A=a.useRef(null),R=()=>{A.current?.scrollIntoView({behavior:"smooth"})};a.useEffect(()=>{R()},[p]),a.useEffect(()=>{d&&!o&&w()},[d]);const w=async()=>{try{const s=await b.get("/chatbot/status");S(s.data),s.data.hasApiKey?n([{id:Date.now().toString(),role:"assistant",content:`안녕하세요! 🤖 ERP 시스템 AI 어시스턴트입니다.

다음과 같은 작업을 할 수 있습니다:

📊 **조회 기능:**
• 이번 달 매출은 얼마인가요?
• 매입 현황을 알려주세요
• 고객 정보를 조회해주세요
• 제품 재고 현황을 보여주세요
• 전체 통계를 알려주세요

✏️ **등록 기능:**

**매출 (과세):**
• 홍길동에게 노트북 2대 100만원에 판매했어요
• 박경환 고객에게 상품A 5개 50만원 판매

**매출 (면세):**
• 농협에 쌀 100kg 50만원 면세로 판매
• 김철수에게 도서 20권 10만원 면세 판매

**매입:**
• ABC상사에서 부품 50개 200만원에 구매
• 농협에서 사과 100kg 50만원 면세로 구매

**수금:**
• 박경환에게 50만원 현금으로 받았어요
• 홍길동한테 100만원 계좌이체로 수금

**입금:**
• 김철수에게 30만원 보냈어요
• ABC상사한테 200만원 입금

무엇을 도와드릴까요?`,timestamp:new Date}]):n([{id:Date.now().toString(),role:"assistant",content:`⚠️ Gemini API 키가 설정되지 않았습니다.

백엔드 .env 파일에 GEMINI_API_KEY를 설정해주세요.

무료 API 키는 https://makersuite.google.com/app/apikey 에서 발급받을 수 있습니다.`,timestamp:new Date}])}catch{C.error("챗봇 연결에 실패했습니다.")}},x=async s=>{const r=s||m;if(!r.trim()||i)return;const z={id:Date.now().toString(),role:"user",content:r,timestamp:new Date};n(t=>[...t,z]),y(""),j(!0);try{const t=await b.post("/chatbot/message",{message:r},{timeout:6e4}),l={id:(Date.now()+1).toString(),role:"assistant",content:t.data.message,timestamp:new Date(t.data.timestamp),data:t.data.data};n(g=>[...g,l])}catch(t){let l="죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.";t.response?.data?.needsApiKey?l=`⚠️ Gemini API 키가 설정되지 않았습니다.

백엔드 .env 파일에 GEMINI_API_KEY를 설정해주세요.`:t.response?.data?.error&&(l=t.response.data.error);const g={id:(Date.now()+1).toString(),role:"assistant",content:l,timestamp:new Date};n(K=>[...K,g])}finally{j(!1)}},I=()=>{n([]),S(null),w()},D=["이번 달 매출은 얼마인가요?","홍길동에게 노트북 2대 100만원 판매","농협에 쌀 100kg 50만원 면세로 판매","박경환에게 50만원 현금 수금"],E=s=>{x(s)};return e.jsxs(P,{theme:{algorithm:T.defaultAlgorithm,token:{colorPrimary:"#1890ff",colorBgContainer:"#ffffff",colorText:"rgba(0, 0, 0, 0.88)",colorTextSecondary:"rgba(0, 0, 0, 0.65)",colorBorder:"#d9d9d9"}},children:[!d&&e.jsx("div",{className:"chatbot-button",onClick:()=>f(!0),children:e.jsx(B,{style:{fontSize:"24px"}})}),d&&e.jsx("div",{className:"chatbot-window",children:e.jsxs(M,{title:e.jsxs(u,{children:[e.jsx(h,{style:{fontSize:"20px",color:"#1890ff"}}),e.jsx("span",{children:"ERP AI 어시스턴트"}),o?.hasApiKey&&e.jsx(W,{color:"success",style:{marginLeft:"auto"},children:o.model})]}),extra:e.jsxs(u,{children:[e.jsx(c,{type:"text",icon:e.jsx(V,{}),onClick:I,size:"small"}),e.jsx(c,{type:"text",icon:e.jsx(O,{}),onClick:()=>f(!1),size:"small"})]}),style:{height:"100%",display:"flex",flexDirection:"column"},styles:{body:{flex:1,display:"flex",flexDirection:"column",padding:0}},children:[e.jsxs("div",{className:"chatbot-messages",children:[p.map(s=>e.jsxs("div",{className:`message ${s.role==="user"?"message-user":"message-assistant"}`,children:[e.jsx(v,{icon:s.role==="user"?e.jsx($,{}):e.jsx(h,{}),style:{backgroundColor:s.role==="user"?"#1890ff":"#52c41a"}}),e.jsxs("div",{className:"message-content",children:[e.jsx(Y,{style:{margin:0,whiteSpace:"pre-wrap"},children:s.content}),e.jsx(k,{type:"secondary",style:{fontSize:"12px"},children:s.timestamp.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})})]})]},s.id)),i&&e.jsxs("div",{className:"message message-assistant",children:[e.jsx(v,{icon:e.jsx(h,{}),style:{backgroundColor:"#52c41a"}}),e.jsxs("div",{className:"message-content",children:[e.jsx(_,{size:"small"})," 답변 생성 중..."]})]}),e.jsx("div",{ref:A})]}),p.length>0&&o?.hasApiKey&&e.jsxs("div",{className:"suggested-questions",children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"},children:[e.jsx(k,{type:"secondary",style:{fontSize:"12px"},children:"💡 추천 질문:"}),e.jsx(c,{type:"link",size:"small",onClick:I,style:{fontSize:"13px",padding:"4px 8px",height:"auto",fontWeight:500},children:"🔄 처음으로"})]}),e.jsx(u,{wrap:!0,children:D.map((s,r)=>e.jsx(c,{size:"small",onClick:()=>E(s),disabled:i,children:s},r))})]}),e.jsxs("div",{className:"chatbot-input",children:[e.jsx(H,{value:m,onChange:s=>y(s.target.value),onPressEnter:s=>{s.shiftKey||(s.preventDefault(),x())},placeholder:"메시지를 입력하세요...",autoSize:{minRows:1,maxRows:4},disabled:i||!o?.hasApiKey}),e.jsx(c,{type:"primary",icon:e.jsx(Q,{}),onClick:()=>x(),loading:i,disabled:!m.trim()||!o?.hasApiKey,children:"전송"})]})]})})]})};export{X as default};
