class TTSService {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.lastReadContent = null; // 마지막으로 읽은 내용 저장
    this.lastReadAnnouncementId = null; // 마지막으로 읽은 공지사항 ID 저장
    this.isActivated = false; // 사용자 제스처로 활성화되었는지 확인
    this.autoPlayEnabled = false; // 자동 재생이 허용되었는지 확인
  }

  // TTS 재생
  speak(text, options = {}) {
    // 현재 재생 중인 음성이 있으면 중지
    this.stop();
    
    if (!text || text.trim() === '') {
      console.warn('TTS: 읽을 텍스트가 없습니다.');
      return;
    }

    // 라즈베리파이/리눅스 환경에서 TTS 지원 확인
    if (!this.isSupported()) {
      console.warn('TTS: 브라우저에서 음성 합성을 지원하지 않습니다.');
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

    try {
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
        } else {
          // 한국어 음성이 없으면 기본 음성 사용
          console.warn('TTS: 한국어 음성을 찾을 수 없습니다. 기본 음성을 사용합니다.');
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
        
        // 라즈베리파이에서 자주 발생하는 오류들에 대한 대체 방안
        if (event.error === 'synthesis-failed' || event.error === 'synthesis-unavailable') {
          console.warn('TTS: 음성 합성 실패. 라즈베리파이에서 TTS 엔진이 설치되지 않았을 수 있습니다.');
          console.warn('TTS: 해결 방법: sudo apt-get install espeak 또는 sudo apt-get install festival');
        }
      };

      this.currentUtterance.onpause = () => {
        this.isPaused = true;
        console.log('TTS: 음성 일시정지');
      };

      this.currentUtterance.onresume = () => {
        this.isPaused = false;
        console.log('TTS: 음성 재개');
      };

      // 음성 재생 시작 (타임아웃 설정)
      this.speechSynthesis.speak(this.currentUtterance);
      
      // 라즈베리파이에서 음성 로딩이 오래 걸릴 수 있으므로 타임아웃 설정
      setTimeout(() => {
        if (!this.isPlaying) {
          console.warn('TTS: 음성 재생이 시작되지 않았습니다. TTS 엔진을 확인해주세요.');
        }
      }, 3000);
      
    } catch (error) {
      console.error('TTS: 음성 합성 초기화 실패:', error);
      this.isPlaying = false;
      this.isPaused = false;
    }
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
      try {
        this.speechSynthesis.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        console.log('TTS: 음성 재생 중지');
      } catch (error) {
        console.warn('TTS: 음성 중지 중 오류 발생:', error);
        this.isPlaying = false;
        this.isPaused = false;
      }
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

  // 공지사항 내용 읽기 (제목 제외, 한 번만 읽기)
  speakAnnouncementContent(announcement, forceRead = false) {
    if (!announcement || !announcement.content) {
      console.warn('TTS: 공지사항 내용이 없습니다.');
      return;
    }

    // 라즈베리파이에서 TTS 지원 확인
    if (!this.isSupported()) {
      console.warn('TTS: 라즈베리파이에서 음성 합성을 지원하지 않습니다.');
      return;
    }

    // HTML 태그 제거 및 텍스트 정리
    const cleanContent = this.cleanText(announcement.content);
    
    // 이미 같은 공지사항을 읽었는지 확인 (강제 읽기가 아닌 경우)
    if (!forceRead && 
        this.lastReadAnnouncementId === announcement.id && 
        this.lastReadContent === cleanContent) {
      console.log('TTS: 이미 읽은 공지사항입니다. 건너뜁니다.');
      return;
    }

    // 자동 재생이 비활성화된 경우 사용자 제스처가 필요
    if (!forceRead && !this.autoPlayEnabled) {
      console.log('TTS: 자동 재생이 비활성화되어 있습니다. 사용자가 재생 버튼을 눌러주세요.');
      return;
    }

    // 읽을 텍스트 구성 (제목은 제외하고 내용만)
    const textToSpeak = cleanContent;
    
    // 마지막으로 읽은 내용 저장
    this.lastReadContent = cleanContent;
    this.lastReadAnnouncementId = announcement.id;
    
    // 라즈베리파이에 최적화된 설정으로 읽기
    this.speak(textToSpeak, {
      rate: 0.7,  // 라즈베리파이에서는 더 느리게
      pitch: 1.0,
      volume: 0.8,  // 볼륨을 조금 낮춤
      lang: 'ko-KR'  // 명시적으로 한국어 설정
    });
  }

  // 사용자 제스처로 TTS 활성화
  activateTTS() {
    this.isActivated = true;
    this.autoPlayEnabled = true;
    console.log('TTS: 사용자 제스처로 활성화되었습니다.');
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
