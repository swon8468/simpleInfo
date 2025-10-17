// 시스템 상태 모니터링 서비스
import { db } from '../firebase';
import { collection, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

class SystemMonitoringService {
  constructor() {
    this.subscribers = new Set();
    this.isMonitoring = false;
    this.lastActivity = null;
    this.systemStatus = {
      isOnline: false,
      lastActivity: null,
      activeConnections: 0,
      recentActivity: []
    };
  }

  // 시스템 상태 모니터링 시작
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('시스템 모니터링 시작');
    
    // 활성 연결 모니터링
    this.monitorActiveConnections();
    
    // 최근 활동 모니터링
    this.monitorRecentActivity();
    
    // 주기적 상태 체크
    this.startPeriodicCheck();
  }

  // 시스템 상태 모니터링 중지
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('시스템 모니터링 중지');
  }

  // 활성 연결 모니터링
  monitorActiveConnections() {
    const connectionsRef = collection(db, 'connections');
    const q = query(connectionsRef, orderBy('connectedAt', 'desc'));
    
    this.connectionsUnsubscribe = onSnapshot(q, (snapshot) => {
      const activeConnections = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'connected' || data.status === 'control_connected';
      });
      
      this.systemStatus.activeConnections = activeConnections.length;
      this.updateLastActivity();
      this.notifySubscribers();
    }, (error) => {
      console.error('활성 연결 모니터링 오류:', error);
    });
  }

  // 최근 활동 모니터링 (학사일정, 공지사항 등)
  monitorRecentActivity() {
    const activities = [
      { collection: 'schedules', field: 'createdAt' },
      { collection: 'announcements', field: 'createdAt' },
      { collection: 'meals', field: 'updatedAt' },
      { collection: 'mainNotice', field: 'updatedAt' }
    ];

    activities.forEach(activity => {
      const ref = collection(db, activity.collection);
      const q = query(ref, orderBy(activity.field, 'desc'), limit(1));
      
      onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          const timestamp = data[activity.field];
          
          if (timestamp) {
            this.updateLastActivity(timestamp.toDate());
          }
        }
        this.notifySubscribers();
      }, (error) => {
        console.error(`${activity.collection} 모니터링 오류:`, error);
      });
    });
  }

  // 주기적 상태 체크 (5분마다)
  startPeriodicCheck() {
    this.periodicInterval = setInterval(() => {
      this.checkSystemHealth();
    }, 5 * 60 * 1000); // 5분
  }

  // 시스템 건강 상태 체크
  async checkSystemHealth() {
    try {
      // Firebase 연결 테스트
      const testRef = collection(db, 'systemHealth');
      await getDocs(testRef);
      
      this.systemStatus.isOnline = true;
      this.updateLastActivity();
    } catch (error) {
      console.error('시스템 건강 상태 체크 실패:', error);
      this.systemStatus.isOnline = false;
    }
    
    this.notifySubscribers();
  }

  // 마지막 활동 시간 업데이트
  updateLastActivity(timestamp = new Date()) {
    this.lastActivity = timestamp;
    this.systemStatus.lastActivity = timestamp;
    
    // 최근 활동 목록에 추가 (최대 10개)
    this.systemStatus.recentActivity.unshift({
      timestamp: timestamp,
      type: 'system_check'
    });
    
    if (this.systemStatus.recentActivity.length > 10) {
      this.systemStatus.recentActivity = this.systemStatus.recentActivity.slice(0, 10);
    }
  }

  // 구독자에게 상태 변경 알림
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.getSystemStatus());
      } catch (error) {
        console.error('구독자 알림 오류:', error);
      }
    });
  }

  // 시스템 상태 구독
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // 즉시 현재 상태 전달
    callback(this.getSystemStatus());
    
    // 구독 해제 함수 반환
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // 현재 시스템 상태 반환
  getSystemStatus() {
    const now = new Date();
    const lastActivityTime = this.systemStatus.lastActivity;
    
    // 마지막 활동이 10분 이내면 정상 운영
    const isRecentlyActive = lastActivityTime && 
      (now.getTime() - lastActivityTime.getTime()) < 10 * 60 * 1000;
    
    return {
      ...this.systemStatus,
      isRecentlyActive,
      statusText: this.getStatusText(isRecentlyActive),
      statusColor: this.getStatusColor(isRecentlyActive)
    };
  }

  // 상태 텍스트 반환
  getStatusText(isRecentlyActive) {
    if (!this.systemStatus.isOnline) {
      return '오프라인';
    }
    
    if (isRecentlyActive) {
      return '정상 운영 중';
    }
    
    return '활동 없음';
  }

  // 상태 색상 반환
  getStatusColor(isRecentlyActive) {
    if (!this.systemStatus.isOnline) {
      return '#f44336'; // 빨간색
    }
    
    if (isRecentlyActive) {
      return '#4caf50'; // 초록색
    }
    
    return '#ff9800'; // 주황색
  }

  // 현재 상태 가져오기
  getCurrentStatus() {
    return Promise.resolve(this.getSystemStatus());
  }

  // 정리
  cleanup() {
    this.stopMonitoring();
    
    if (this.connectionsUnsubscribe) {
      this.connectionsUnsubscribe();
    }
    
    if (this.periodicInterval) {
      clearInterval(this.periodicInterval);
    }
    
    this.subscribers.clear();
  }
}

export default new SystemMonitoringService();
