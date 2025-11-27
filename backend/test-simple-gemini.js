const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyBgnDpPbTKcjggaNxxAjMbPFrYtsZhUFO0');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function testGemini() {
  try {
    console.log('🔍 Gemini API 테스트 시작...\n');
    console.log('모델: gemini-2.5-flash');
    console.log('질문: "안녕하세요?"\n');

    const startTime = Date.now();

    const result = await model.generateContent('안녕하세요?');
    const response = await result.response;
    const text = response.text();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✅ 응답 성공!');
    console.log(`⏱️ 응답 시간: ${duration}초\n`);
    console.log('📝 응답 내용:');
    console.log(text);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.status) {
      console.error('HTTP 상태:', error.status);
    }
    if (error.errorDetails) {
      console.error('상세:', error.errorDetails);
    }
  }
}

testGemini();
