import { db } from '../firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';

class ActivityLogService {
  constructor() {
    this.subscribers = new Set();
  }

  // 활동 로그 기록
  async logActivity(action, level, details, adminInfo = null, ip = null) {
    try {
      // IP가 제공되지 않으면 비동기로 가져오기
      let clientIP = ip;
      if (!clientIP) {
        clientIP = await this.getClientIP();
      }
      
      const logData = {
        timestamp: new Date(),
        adminId: adminInfo?.adminCode || 'system',
        adminName: adminInfo?.name || '시스템',
        action,
        level, // 'major', 'medium', 'minor'
        details,
        ip: clientIP,
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId()
      };

      await addDoc(collection(db, 'activityLogs'), logData);
      
      // 구독자들에게 알림
      this.notifySubscribers();
    } catch (error) {
      console.error('활동 로그 작성 실패:', error);
    }
  }

  // 관리자 로그인 로그
  async logAdminLogin(adminInfo, ip = null) {
    await this.logActivity(
      '관리자 로그인',
      'major',
      `관리자 ${adminInfo.name} (${adminInfo.adminCode}) 로그인`,
      adminInfo,
      ip
    );
  }

  // 관리자 로그아웃 로그
  async logAdminLogout(adminInfo, ip = null) {
    await this.logActivity(
      '관리자 로그아웃',
      'medium',
      `관리자 ${adminInfo.name} (${adminInfo.adminCode}) 로그아웃`,
      adminInfo,
      ip
    );
  }

  // PIN 생성 로그
  async logPinCreation(pin, adminInfo, ip = null) {
    await this.logActivity(
      'PIN 생성',
      'major',
      `새로운 PIN ${pin} 생성됨`,
      adminInfo,
      ip
    );
  }

  // 디바이스 연결 로그
  async logDeviceConnection(deviceType, pin, adminInfo, ip = null) {
    await this.logActivity(
      '디바이스 연결',
      'medium',
      `${deviceType} 디바이스가 PIN ${pin}으로 연결됨`,
      adminInfo,
      ip
    );
  }

  // 디바이스 연결 해제 로그
  async logDeviceDisconnection(deviceType, pin, adminInfo, ip = null) {
    await this.logActivity(
      '디바이스 연결 해제',
      'medium',
      `${deviceType} 디바이스가 PIN ${pin}으로 연결 해제됨`,
      adminInfo,
      ip
    );
  }

  // 기기 연결 성공 로그
  async logConnectionSuccess(controlSessionId, outputSessionId, pin, adminInfo, ip = null) {
    await this.logActivity(
      '기기 연결 성공',
      'major',
      `제어용 기기(${controlSessionId})와 출력용 기기(${outputSessionId})가 PIN ${pin}으로 연결됨`,
      adminInfo,
      ip
    );
  }

  // 기기 연결 실패 로그
  async logConnectionFailure(pin, reason, adminInfo, ip = null) {
    await this.logActivity(
      '기기 연결 실패',
      'medium',
      `PIN ${pin} 연결 실패: ${reason}`,
      adminInfo,
      ip
    );
  }

  // 관리자에 의한 연결 해제 로그
  async logAdminDisconnection(sessionId, adminInfo, ip = null) {
    await this.logActivity(
      '관리자 연결 해제',
      'major',
      `관리자가 세션 ${sessionId} 연결을 해제함`,
      adminInfo,
      ip
    );
  }

  // 공지사항 관리 로그
  async logAnnouncementAction(action, announcementId, title, adminInfo, ip = null) {
    await this.logActivity(
      `공지사항 ${action}`,
      'medium',
      `공지사항 "${title}" (ID: ${announcementId}) ${action}`,
      adminInfo,
      ip
    );
  }

  // 메인 공지사항 활성화/비활성화 로그
  async logMainNoticeToggle(isActive, noticeTitle, adminInfo, ip = null) {
    const action = isActive ? '활성화' : '비활성화';
    await this.logActivity(
      `메인 공지사항 ${action}`,
      'major',
      `메인 공지사항 "${noticeTitle}" ${action}`,
      adminInfo,
      ip
    );
  }

  // 학교 차단 상태 변경 로그
  async logSchoolBlockingToggle(isBlocked, adminInfo, ip = null) {
    const action = isBlocked ? '차단 시작' : '차단 해제';
    await this.logActivity(
      `학교 차단 ${action}`,
      'major',
      `학교 생활 도우미 ${action}`,
      adminInfo,
      ip
    );
  }

  // PIN 코드 변경 로그
  async logPinCodeChange(oldPin, newPin, adminInfo, ip = null) {
    await this.logActivity(
      'PIN 코드 변경',
      'major',
      `PIN 코드를 ${oldPin}에서 ${newPin}으로 변경`,
      adminInfo,
      ip
    );
  }

  // 시스템 설정 변경 로그
  async logSystemSettingChange(setting, oldValue, newValue, adminInfo, ip = null) {
    await this.logActivity(
      '시스템 설정 변경',
      'medium',
      `${setting} 설정을 "${oldValue}"에서 "${newValue}"으로 변경`,
      adminInfo,
      ip
    );
  }

  // 페이지 접근 로그
  async logPageAccess(pageName, adminInfo, ip = null) {
    await this.logActivity(
      '페이지 접근',
      'minor',
      `${pageName} 페이지 접근`,
      adminInfo,
      ip
    );
  }

  // 데이터 조회 로그
  async logDataAccess(dataType, adminInfo, ip = null) {
    await this.logActivity(
      '데이터 조회',
      'minor',
      `${dataType} 데이터 조회`,
      adminInfo,
      ip
    );
  }


  // 학사일정 관리 로그
  async logScheduleAction(action, details, adminInfo, ip = null) {
    await this.logActivity(
      `학사일정 ${action}`,
      'medium',
      details,
      adminInfo,
      ip
    );
  }

  // 급식 관리 로그
  async logMealAction(action, details, adminInfo, ip = null) {
    await this.logActivity(
      `급식 ${action}`,
      'medium',
      details,
      adminInfo,
      ip
    );
  }

  // 관리자 계정 관리 로그
  async logAdminAccountAction(action, adminName, adminCode, adminInfo, ip = null) {
    await this.logActivity(
      `관리자 계정 ${action}`,
      'major',
      `관리자 ${adminName} (${adminCode}) ${action}`,
      adminInfo,
      ip
    );
  }

  // 시스템 설정 변경 로그
  async logSystemSettingChange(setting, oldValue, newValue, adminInfo, ip = null) {
    await this.logActivity(
      '시스템 설정 변경',
      'major',
      `${setting}: ${oldValue} → ${newValue}`,
      adminInfo,
      ip
    );
  }

  // 활동 로그 조회
  async getActivityLogs(limitCount = 100) {
    try {
      const logsRef = collection(db, 'activityLogs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      
      return logs;
    } catch (error) {
      console.error('활동 로그 조회 실패:', error);
      return [];
    }
  }

  // 실시간 활동 로그 구독
  subscribeToActivityLogs(callback, limitCount = 100) {
    try {
      const logsRef = collection(db, 'activityLogs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(limitCount));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs = [];
        querySnapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() });
        });
        callback(logs);
      });

      return unsubscribe;
    } catch (error) {
      console.error('활동 로그 구독 실패:', error);
      return () => {};
    }
  }

  // 구독자들에게 알림
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('구독자 알림 실패:', error);
      }
    });
  }

  // 클라이언트 IP 가져오기
  async getClientIP() {
    try {
      // 먼저 로컬 저장된 IP 확인
      const stored = sessionStorage.getItem('clientIP');
      const storedTime = sessionStorage.getItem('clientIPTime');
      
      // 1시간 이내의 IP가 있으면 사용
      if (stored && storedTime && (Date.now() - parseInt(storedTime)) < 3600000) {
        return stored;
      }
      
      // 외부 API로 IP 가져오기
      const response = await fetch('https://api.ipify.org?format=json');
      if (response.ok) {
        const data = await response.json();
        const ip = data.ip;
        
        // IP 저장
        sessionStorage.setItem('clientIP', ip);
        sessionStorage.setItem('clientIPTime', Date.now().toString());
        
        return ip;
      }
    } catch (error) {
      console.warn('IP 주소 가져오기 실패:', error);
    }
    
    // 실패 시 로컬 저장된 IP 또는 N/A 반환
    const fallback = sessionStorage.getItem('clientIP');
    return fallback || 'N/A';
  }

  // 세션 ID 생성
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
}

export default new ActivityLogService();
