// 전화번호 포맷팅 함수들 (한국 전화번호 체계)
export const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '');

  // 휴대폰 번호 (010, 011, 016, 017, 018, 019)
  if (numbers.startsWith('01')) {
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      // 010-123 또는 010-1234
      return numbers.replace(/(\d{3})(\d{1,4})/, '$1-$2');
    } else if (numbers.length <= 11) {
      // 010-123-4567 (3+3+4) 또는 010-1234-5678 (3+4+4)
      if (numbers.length === 10) {
        // 10자리: 010-123-4567
        return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      } else {
        // 11자리: 010-1234-5678
        return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
      }
    } else {
      return numbers.slice(0, 11).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  }
  // 서울 지역번호 (02)
  else if (numbers.startsWith('02')) {
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 6) {
      // 02-123 또는 02-1234
      return numbers.replace(/(\d{2})(\d{1,4})/, '$1-$2');
    } else if (numbers.length <= 10) {
      // 02-123-4567 (2+3+4) 또는 02-1234-5678 (2+4+4)
      if (numbers.length === 9) {
        return numbers.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
      } else {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
      }
    } else {
      return numbers.slice(0, 10).replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  }
  // 기타 지역번호 (031, 032, 033, 041, 042, 043, 044, 051, 052, 053, 054, 055, 061, 062, 063, 064)
  else if (numbers.length >= 3 && /^(031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)/.test(numbers)) {
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      // 031-123
      return numbers.replace(/(\d{3})(\d{1,3})/, '$1-$2');
    } else if (numbers.length <= 7) {
      // 031-123-4 또는 031-1234
      return numbers.replace(/(\d{3})(\d{3,4})/, '$1-$2');
    } else if (numbers.length <= 11) {
      // 031-123-4567 (3+3+4) 또는 031-1234-5678 (3+4+4)
      if (numbers.length === 10) {
        return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      } else {
        return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
      }
    } else {
      return numbers.slice(0, 11).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  }
  // 기본 형태 (알 수 없는 번호)
  else {
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return numbers.replace(/(\d{3})(\d{1,4})/, '$1-$2');
    } else if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3,4})(\d{1,4})/, '$1-$2-$3');
    } else {
      return numbers.slice(0, 11).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  }
};

// 사업자번호 포맷팅 (000-00-00000)
export const formatBusinessNumber = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '');

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 5) {
    return numbers.replace(/(\d{3})(\d{1,2})/, '$1-$2');
  } else if (numbers.length <= 10) {
    return numbers.replace(/(\d{3})(\d{2})(\d{1,5})/, '$1-$2-$3');
  } else {
    return numbers.slice(0, 10).replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
  }
};

// 팩스번호 포맷팅 (전화번호와 동일)
export const formatFaxNumber = (value: string): string => {
  return formatPhoneNumber(value);
};

// 일반 전화번호 포맷팅 (지역번호 포함)
export const formatLandlineNumber = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '');

  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    if (numbers.startsWith('02')) {
      return numbers.replace(/(\d{2})(\d{1,4})/, '$1-$2');
    } else {
      return numbers.replace(/(\d{3})(\d{1,3})/, '$1-$2');
    }
  } else if (numbers.length <= 10) {
    if (numbers.startsWith('02')) {
      return numbers.replace(/(\d{2})(\d{3,4})(\d{1,4})/, '$1-$2-$3');
    } else {
      return numbers.replace(/(\d{3})(\d{3})(\d{1,4})/, '$1-$2-$3');
    }
  } else {
    if (numbers.startsWith('02')) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    } else {
      return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  }
};

// 입력값 정제 (숫자만 추출)
export const extractNumbers = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};

// 하이픈 제거
export const removeHyphens = (value: string): string => {
  return value.replace(/-/g, '');
};