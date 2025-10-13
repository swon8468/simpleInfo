class TTSService {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
  }

  // TTS 재생
  speak(text, options = {}) {
    // 현재 재생 중인 음성이 있으면 중지
    this.stop();
    
    if (!text || text.trim() === '') {
      console.warn('TTS: 읽을 텍스트가 없습니다.');
      return;
    }

    // 기본 옵션 설정
    const defaultOptions = {
      lang: 'ko-KR',           // 한국어
      rate: 0.9,               // 속도 (0.1 ~ 10)
      pitch: 1.0,             // 음높이 (0 ~ 2)
      volume: 1.0,            // 볼륨 (0 ~ 1)
      voice: null             // 음성 (null이면 기본 음성)
    };

    const settings = { ...defaultOptions, ...options };

    // SpeechSynthesisUtterance 객체 생성
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    
    // 설정 적용
    this.currentUtterance.lang = settings.lang;
    this.currentUtterance.rate = settings.rate;
    this.currentUtterance.pitch = settings.pitch;
    this.currentUtterance.volume = settings.volume;

    // 음성 설정 (한국어 음성 우선 선택)
    if (settings.voice) {
      this.currentUtterance.voice = settings.voice;
    } else {
      // 사용 가능한 한국어 음성 중 첫 번째 선택
      const voices = this.speechSynthesis.getVoices();
      const koreanVoice = voices.find(voice => voice.lang.startsWith('ko'));
      if (koreanVoice) {
        this.currentUtterance.voice = koreanVoice;
      }
    }

    // 이벤트 리스너 설정
    this.currentUtterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      console.log('TTS: 음성 재생 시작');
    };

    this.currentUtterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      console.log('TTS: 음성 재생 완료');
    };

    this.currentUtterance.onerror = (event) => {
      this.isPlaying = false;
      this.isPaused = false;
      console.error('TTS: 음성 재생 오류:', event.error);
    };

    this.currentUtterance.onpause = () => {
      this.isPaused = true;
      console.log('TTS: 음성 일시정지');
    };

    this.currentUtterance.onresume = () => {
      this.isPaused = false;
      console.log('TTS: 음성 재개');
    };

    // 음성 재생 시작
    this.speechSynthesis.speak(this.currentUtterance);
  }

  // TTS 일시정지
  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.speechSynthesis.pause();
    }
  }

  // TTS 재개
  resume() {
    if (this.isPlaying && this.isPaused) {
      this.speechSynthesis.resume();
    }
  }

  // TTS 중지
  stop() {
    if (this.isPlaying) {
      this.speechSynthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      console.log('TTS: 음성 재생 중지');
    }
  }

  // 현재 상태 확인
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isSupported: 'speechSynthesis' in window
    };
  }

  // 사용 가능한 음성 목록 가져오기
  getVoices() {
    return this.speechSynthesis.getVoices();
  }

  // 한국어 음성 목록 가져오기
  getKoreanVoices() {
    const voices = this.getVoices();
    return voices.filter(voice => voice.lang.startsWith('ko'));
  }

  // 공지사항 내용 읽기 (제목 제외)
  speakAnnouncementContent(announcement) {
    if (!announcement || !announcement.content) {
      console.warn('TTS: 공지사항 내용이 없습니다.');
      return;
    }

    // HTML 태그 제거 및 텍스트 정리
    const cleanContent = this.cleanText(announcement.content);
    
    // 읽을 텍스트 구성 (제목은 제외하고 내용만)
    const textToSpeak = `공지사항 내용입니다. ${cleanContent}`;
    
    this.speak(textToSpeak, {
      rate: 0.8,  // 조금 느리게 읽기
      pitch: 1.0,
      volume: 0.9
    });
  }

  // 텍스트 정리 함수
  cleanText(text) {
    if (!text) return '';
    
    // HTML 태그 제거
    let cleanText = text.replace(/<[^>]*>/g, '');
    
    // 특수 문자 정리
    cleanText = cleanText.replace(/&nbsp;/g, ' ');
    cleanText = cleanText.replace(/&amp;/g, '&');
    cleanText = cleanText.replace(/&lt;/g, '<');
    cleanText = cleanText.replace(/&gt;/g, '>');
    cleanText = cleanText.replace(/&quot;/g, '"');
    
    // 연속된 공백을 하나로 변경
    cleanText = cleanText.replace(/\s+/g, ' ');
    
    // 앞뒤 공백 제거
    cleanText = cleanText.trim();
    
    return cleanText;
  }

  // 브라우저 지원 여부 확인
  isSupported() {
    return 'speechSynthesis' in window;
  }
}

// 싱글톤 인스턴스 생성
const ttsService = new TTSService();

export default ttsService;
