# 가온FS ERP 안드로이드 앱

WebView 기반 안드로이드 앱으로 www.webapperp.ai.kr 웹사이트를 네이티브 앱처럼 사용할 수 있습니다.

## 주요 기능

- ✅ WebView 기반 앱
- ✅ 로그인 세션 자동 유지
- ✅ 뒤로가기 버튼 지원
- ✅ 파일 다운로드 지원
- ✅ 스플래시 화면
- ✅ 오프라인 감지 및 재연결
- ✅ JavaScript 완전 지원

## 빌드 방법

### 1. Android Studio 설치
https://developer.android.com/studio 에서 최신 버전 다운로드

### 2. 프로젝트 열기
1. Android Studio 실행
2. "Open an Existing Project" 선택
3. `android-app` 폴더 선택

### 3. Gradle 동기화
- 프로젝트 열면 자동으로 Gradle 동기화 시작
- 필요한 라이브러리 자동 다운로드

### 4. 앱 실행 (테스트)
1. 상단 메뉴에서 `Run > Run 'app'` 또는 `Shift + F10`
2. 에뮬레이터 또는 실제 기기 선택
3. 앱 실행 확인

### 5. APK 빌드 (배포용)
1. 상단 메뉴에서 `Build > Build Bundle(s) / APK(s) > Build APK(s)`
2. 빌드 완료 후 `app/build/outputs/apk/release/app-release.apk` 생성
3. 이 APK 파일을 안드로이드 기기에 설치 가능

### 6. Google Play Store 배포용 AAB 빌드
1. 상단 메뉴에서 `Build > Generate Signed Bundle / APK`
2. `Android App Bundle` 선택
3. 키스토어 생성 또는 기존 키 사용
4. `app/build/outputs/bundle/release/app-release.aab` 생성
5. Google Play Console에 업로드

## 프로젝트 구조

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/gaonfscorp/erp/
│   │   │   ├── MainActivity.kt          # 메인 WebView 화면
│   │   │   └── SplashActivity.kt        # 스플래시 화면
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   │   ├── activity_main.xml
│   │   │   │   └── activity_splash.xml
│   │   │   ├── values/
│   │   │   │   ├── strings.xml
│   │   │   │   └── colors.xml
│   │   │   └── xml/
│   │   │       └── network_security_config.xml
│   │   └── AndroidManifest.xml
│   ├── build.gradle
│   └── proguard-rules.pro
├── build.gradle
├── settings.gradle
└── gradle.properties
```

## 앱 아이콘 변경 방법

1. Android Studio에서 `app/res` 우클릭
2. `New > Image Asset` 선택
3. `Icon Type: Launcher Icons` 선택
4. 이미지 파일 선택하여 자동으로 여러 해상도 생성
5. `Next > Finish`

## 앱 정보 수정

### 앱 이름 변경
`app/src/main/res/values/strings.xml` 파일에서:
```xml
<string name="app_name">새로운 앱 이름</string>
```

### 패키지명 변경
1. `build.gradle (app)` 파일에서 `applicationId` 수정
2. 폴더 구조도 함께 변경 필요

### 버전 변경
`build.gradle (app)` 파일에서:
```gradle
versionCode 2        // 증가
versionName "1.1.0"  // 수정
```

## 웹사이트 URL 변경

`MainActivity.kt` 파일에서:
```kotlin
private val webUrl = "https://새로운-웹사이트-주소.com"
```

## 문제 해결

### Gradle 동기화 실패
- Android Studio 재시작
- `File > Invalidate Caches / Restart` 실행

### APK 설치 오류
- 기존 앱 삭제 후 재설치
- 개발자 옵션 활성화 확인

### WebView 로딩 안됨
- 인터넷 연결 확인
- AndroidManifest.xml에 INTERNET 권한 있는지 확인

## 라이선스

© 2025 가온FS. All rights reserved.
