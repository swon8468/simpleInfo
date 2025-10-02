import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionService from '../services/ConnectionService';
import './ControlMain.css';

function ControlMain() {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState('연결됨');

  useEffect(() => {
    // 연결 상태 확인
    const savedPin = localStorage.getItem('currentPin');
    const connectedPin = localStorage.getItem('connectedPin');
    const controlDeviceId = localStorage.getItem('controlDeviceId');
    const controlSessionId = localStorage.getItem('controlSessionId');
    const pairingId = localStorage.getItem('pairingId');
    
    console.log('ControlMain: 연결 상태 확인', { savedPin, connectedPin, controlDeviceId, controlSessionId, pairingId });
    
    if (savedPin && connectedPin && controlDeviceId && controlSessionId && pairingId) {
      setConnectionStatus('연결됨');
      console.log('ControlMain: 연결 상태 - 연결됨');
      
      // 관리자에 의한 연결 해제 감지를 위한 실시간 구독
      const unsubscribe = ConnectionService.subscribeToControlData(savedPin, (data) => {
        if (data.controlData && data.controlData.adminRemoved) {
          console.log('관리자에 의해 연결이 해제되었습니다:', data.controlData.message);
          setConnectionStatus('연결 안됨');
          localStorage.removeItem('currentPin');
          localStorage.removeItem('connectedPin');
          localStorage.removeItem('controlDeviceId');
          localStorage.removeItem('controlSessionId');
          localStorage.removeItem('pairingId');
          navigate('/');
        }
      });
      
      // 연결 상태 모니터링
      const cleanupMonitoring = ConnectionService.startConnectionMonitoring(savedPin, () => {
        // 연결 해제 시 메인 화면으로 이동
        setConnectionStatus('연결 안됨');
        localStorage.removeItem('currentPin');
        localStorage.removeItem('connectedPin');
        localStorage.removeItem('controlDeviceId');
        localStorage.removeItem('controlSessionId');
        localStorage.removeItem('pairingId');
        navigate('/control');
      });

      return () => {
        unsubscribe();
        cleanupMonitoring();
      };
    } else {
      setConnectionStatus('연결 안됨');
      console.log('ControlMain: 연결 상태 - 연결 안됨');
    }
  }, [navigate]);

  const sendControlData = async (page, scheduleView = 'monthly', mealDate = 0, announcementIndex = 0) => {
    const savedPin = localStorage.getItem('currentPin');
    const connectedPin = localStorage.getItem('connectedPin');
    
    console.log('ControlMain: 데이터 전송 시도', { page, scheduleView, mealDate, announcementIndex });
    console.log('ControlMain: 저장된 PIN:', savedPin, '연결된 PIN:', connectedPin);
    
    if (savedPin && connectedPin) {
      try {
        const controlData = {
          currentPage: page
        };
        
        // 각 페이지별로 필요한 데이터만 추가
        if (page === 'schedule') {
          controlData.scheduleView = scheduleView;
          controlData.scheduleDate = new Date().toISOString();
        } else if (page === 'meal') {
          controlData.mealDate = mealDate;
        } else if (page === 'announcement') {
          controlData.announcementIndex = announcementIndex;
        }
        
        console.log('ControlMain: 전송할 데이터:', controlData);
        
        // 연결된 PIN을 사용하여 데이터 전송
        await ConnectionService.sendControlData(connectedPin, controlData);
        console.log('ControlMain: 데이터 전송 완료');
      } catch (error) {
        console.error('제어 데이터 전송 실패:', error);
      }
    } else {
      console.error('ControlMain: 연결 정보가 없습니다.', { savedPin, connectedPin });
    }
  };

  const handleScheduleClick = async () => {
    await sendControlData('schedule', 'monthly'); // 학사일정 클릭 시 항상 'monthly'로 설정
    navigate('/control/schedule');
  };

  const handleMealClick = async () => {
    await sendControlData('meal');
    navigate('/control/meal');
  };

  const handleRoadmapClick = async () => {
    await sendControlData('roadmap');
    navigate('/control/roadmap');
  };

  const handleAnnouncementClick = async () => {
    await sendControlData('announcement');
    navigate('/control/announcement');
  };

  const handleConnectionInfoClick = () => {
    navigate('/control/connection-info');
  };

  const handleBackToMain = async () => {
    await sendControlData('main');
  };

  return (
    <div className="control-main">
      <div className="menu-grid">
        <button className="menu-btn" onClick={handleScheduleClick}>
          학사 일정
        </button>
        <button className="menu-btn" onClick={handleMealClick}>
          급식
        </button>
        <button className="menu-btn" onClick={handleRoadmapClick}>
          교실 배치
        </button>
        <button className="menu-btn" onClick={handleAnnouncementClick}>
          공지 사항
        </button>
      </div>

      <div className="connection-section">
        <button className="connection-info-btn" onClick={handleConnectionInfoClick}>
          연결 정보
        </button>
        <div className={`connection-status ${connectionStatus === '연결됨' ? 'connected' : 'disconnected'}`}>
          {connectionStatus}
        </div>
        <button className="main-screen-btn" onClick={handleBackToMain}>
          🏠 메인화면
        </button>
      </div>
    </div>
  );
}

export default ControlMain;
