// PWA 알림 서비스
class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  // 알림 권한 요청
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      throw new Error('알림 권한이 거부되었습니다.');
    }

    // 권한 요청
    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    return permission === 'granted';
  }

  // 기본 알림 발송
  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('알림을 표시할 수 없습니다:', this.permission);
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/simpleInfo/logo.png',
        badge: '/simpleInfo/logo.png',
        ...options
      });

      // 알림 클릭 시 포커스
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 자동 닫기 (5초 후)
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('알림 발송 실패:', error);
      return false;
    }
  }

  // 패치노트 알림 발송
  async showPatchnoteNotification(patchnote) {
    const title = `🔄 새로운 패치노트: ${patchnote.version}`;
    const body = patchnote.title;
    
    return await this.showNotification(title, {
      body: body,
      tag: 'patchnote', // 같은 태그로 중복 방지
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: '확인하기'
        }
      ]
    });
  }

  // 메인 공지사항 알림 발송 (비활성화됨 - 알림 발송하지 않음)
  async showMainNoticeNotification(notice) {
    // 메인 공지사항은 알림하지 않음
    return false;
  }

  // 일반 공지사항 알림 발송
  async showAnnouncementNotification(announcement) {
    const title = `📍 새로운 공지사항`;
    const body = announcement.title;
    
    return await this.showNotification(title, {
      body: body,
      tag: 'announcement',
      requireInteraction: false
    });
  }

  // 학교 차단 알림 발송
  async showBlockingNotification(isBlocked) {
    const title = isBlocked ? '🚫 학교 생활 도우미 가 서비스 차단됨' : '✅ 학교 생활 도우미 서비스 정상화';
    const body = isBlocked 
      ? '시스템 점검으로 인해 일시적으로 서비스가 차단되었습니다.'
      : '시스템 점검이 완료되어 정상적으로 서비스를 이용할 수 있습니다.';
    
    return await this.showNotification(title, {
      body: body,
      tag: 'school-blocking',
      requireInteraction: true, // 중요한 알림이므로 사용자 상호작용 필요
      urgent: true
    });
  }

  // 알림 권한 상태 확인
  getPermissionStatus() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      canShow: this.isSupported && this.permission === 'granted'
    };
  }

  // 알림 설정 저장
  saveNotificationSettings(settings) {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }

  // 알림 설정 불러오기
  getNotificationSettings() {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      patchnotes: true,
      announcements: true,
      mainNotice: true
    };
  }

  // 알림 설정 업데이트
  updateNotificationSetting(type, enabled) {
    const settings = this.getNotificationSettings();
    settings[type] = enabled;
    this.saveNotificationSettings(settings);
  }
}

export default new NotificationService();
