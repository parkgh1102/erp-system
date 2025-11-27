const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyBgnDpPbTKcjggaNxxAjMbPFrYtsZhUFO0');

async function listModels() {
  try {
    console.log('🔍 Gemini API로 사용 가능한 모델 목록 조회 중...\n');

    // List all available models
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBgnDpPbTKcjggaNxxAjMbPFrYtsZhUFO0'
    );

    if (!response.ok) {
      console.error('❌ API 요청 실패:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('에러 내용:', errorText);
      return;
    }

    const data = await response.json();

    console.log('✅ 사용 가능한 모델 목록:\n');

    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`📌 모델명: ${model.name}`);
        console.log(`   - Display Name: ${model.displayName}`);
        console.log(`   - Description: ${model.description}`);
        console.log(`   - Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
        console.log('');
      });

      // generateContent를 지원하는 모델만 필터링
      const generationModels = data.models.filter(m =>
        m.supportedGenerationMethods?.includes('generateContent')
      );

      console.log('\n🎯 generateContent를 지원하는 모델:');
      generationModels.forEach(model => {
        console.log(`   - ${model.name}`);
      });
    } else {
      console.log('❌ 사용 가능한 모델이 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

listModels();
