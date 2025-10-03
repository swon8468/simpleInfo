import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import './ControlMain.css';

function ControlMain() {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState('연결됨');

  useEffect(() => {
    // 연결 상태 확인
    const controlSessionId = sessionStorage.getItem('controlSessionId');
    const outputSessionId = sessionStorage.getItem('outputSessionId');
    const pairingId = sessionStorage.getItem('pairingId');
    
    
    if (controlSessionId && outputSessionId && pairingId) {
      setConnectionStatus('연결됨');
      
      // 관리자에 의한 연결 해제 감지를 위한 실시간 구독
      const unsubscribe = ConnectionDB.subscribeToOutputData(outputSessionId, (data) => {
        if (data.controlData && data.controlData.adminRemoved) {
          setConnectionStatus('연결 안됨');
          sessionStorage.removeItem('controlSessionId');
          sessionStorage.removeItem('outputSessionId');
          sessionStorage.removeItem('currentPin');
          sessionStorage.removeItem('pairingId');
          navigate('/');
        }
      });
      
      return () => {
        unsubscribe();
      };
    } else {
      setConnectionStatus('연결 안됨');
    }
  }, [navigate]);

  const sendControlData = async (page, scheduleView = 'monthly', mealDate = 0, announcementIndex = 0) => {
    const controlSessionId = sessionStorage.getItem('controlSessionId');
    const outputSessionId = sessionStorage.getItem('outputSessionId');
    const pairingId = sessionStorage.getItem('pairingId');
    
    if (controlSessionId) {
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
        
        
        // ConnectionDB를 사용하여 데이터 전송
        await ConnectionDB.sendControlData(controlSessionId, controlData);
      } catch (error) {
        console.error('제어 데이터 전송 실패:', error);
      }
    } else {
      console.error('ControlMain: 제어 세션 ID가 없습니다.');
    }
  };

  const handleScheduleClick = async () => {
    await sendControlData('schedule', 'weekly'); // 학사일정 클릭 시 항상 'weekly'로 설정
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
        <div className="status-indicator">
          <div className={`status-dot ${connectionStatus === '연결됨' ? 'connected' : 'disconnected'}`}></div>
          <span>{connectionStatus}</span>
        </div>
        <button className="main-screen-btn" onClick={handleBackToMain}>
          🏠 메인화면
        </button>
      </div>
    </div>
  );
}

export default ControlMain;
