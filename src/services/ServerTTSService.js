class ServerTTSService {
  constructor() {
    this.isPlaying = false;
    this.currentAudio = null;
    this.lastReadContent = null;
    this.lastReadAnnouncementId = null;
    this.isActivated = false;
    this.autoPlayEnabled = false;
  }

  // 라즈베리파이에서 직접 espeak 실행
  async speak(text, options = {}) {
    if (!text || text.trim() === '') {
      console.warn('TTS: 읽을 텍스트가 없습니다.');
      return;
    }

    // 현재 재생 중인 음성이 있으면 중지
    this.stop();

    try {
      // 라즈베리파이에서 직접 espeak 실행
      const rate = options.rate || 0.8;
      const pitch = options.pitch || 1.0;
      const volume = options.volume || 0.9;
      
      console.log('TTS: espeak 실행 중...', text.substring(0, 50) + '...');
      
      // fetch를 사용하여 로컬 서버에 TTS 요청
      const response = await fetch('http://localhost:5000/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          lang: 'ko-KR',
          rate: rate,
          pitch: pitch,
          volume: volume
        })
      });

      if (!response.ok) {
        throw new Error(`TTS 서버 오류: ${response.status}`);
      }

      // 오디오 데이터를 Blob으로 받기
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 오디오 재생
      this.currentAudio = new Audio(audioUrl);
      this.isPlaying = true;

      this.currentAudio.onplay = () => {
        console.log('TTS: 음성 재생 시작');
      };

      this.currentAudio.onended = () => {
        this.isPlaying = false;
        this.isPaused = false;
        console.log('TTS: 음성 재생 완료');
        URL.revokeObjectURL(audioUrl);
      };

      this.currentAudio.onerror = (event) => {
        this.isPlaying = false;
        this.isPaused = false;
        console.error('TTS: 오디오 재생 오류:', event);
        URL.revokeObjectURL(audioUrl);
      };

      await this.currentAudio.play();

    } catch (error) {
      console.error('TTS: espeak 실행 실패:', error);
      console.warn('TTS: 서버가 실행되지 않았을 수 있습니다. ./start_tts_server.sh를 실행해주세요.');
      this.isPlaying = false;
      this.isPaused = false;
    }
  }

  // TTS 일시정지
  pause() {
    if (this.currentAudio && this.isPlaying && !this.isPaused) {
      this.currentAudio.pause();
      this.isPaused = true;
      console.log('TTS: 음성 일시정지');
    }
  }

  // TTS 재개
  resume() {
    if (this.currentAudio && this.isPlaying && this.isPaused) {
      this.currentAudio.play();
      this.isPaused = false;
      console.log('TTS: 음성 재개');
    }
  }

  // TTS 중지
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
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
      isSupported: true // 서버 TTS는 항상 지원됨
    };
  }

  // 공지사항 내용 읽기
  async speakAnnouncementContent(announcement, forceRead = false) {
    if (!announcement || !announcement.content) {
      console.warn('TTS: 공지사항 내용이 없습니다.');
      return;
    }

    // HTML 태그 제거 및 텍스트 정리
    const cleanContent = this.cleanText(announcement.content);
    
    // 이미 같은 공지사항을 읽었는지 확인
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

    // 마지막으로 읽은 내용 저장
    this.lastReadContent = cleanContent;
    this.lastReadAnnouncementId = announcement.id;
    
    // 서버 TTS로 읽기
    await this.speak(cleanContent, {
      rate: 0.8,
      pitch: 1.0,
      volume: 0.9,
      lang: 'ko-KR'
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
    return true; // 서버 TTS는 항상 지원됨
  }
}

// 싱글톤 인스턴스 생성
const serverTTSService = new ServerTTSService();

export default serverTTSService;