import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ConnectionService from '../services/ConnectionService';
import logoImage from '/logo.png';
import './MainScreen.css';

function MainScreen() {
  const navigate = useNavigate();
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [hasActivePin, setHasActivePin] = useState(false);
  const [activePinNumber, setActivePinNumber] = useState(null);
  const [activePinCount, setActivePinCount] = useState(0);

  // 활성화된 PIN 확인 함수
  const checkActivePin = async () => {
    try {
      const connectionsRef = collection(db, 'connections');
      const q = query(
        connectionsRef, 
        where('deviceType', '==', 'output'),
        where('status', '==', 'connected')
      );
      const querySnapshot = await getDocs(q);
      
      const count = querySnapshot.size;
      setActivePinCount(count);
      
      if (count > 0) {
        const activeConnection = querySnapshot.docs[0];
        setActivePinNumber(activeConnection.id);
        setHasActivePin(true);
      } else {
        setHasActivePin(false);
        setActivePinNumber(null);
      }
    } catch (error) {
      console.error('활성 PIN 확인 실패:', error);
      setHasActivePin(false);
      setActivePinNumber(null);
      setActivePinCount(0);
    }
  };

  useEffect(() => {
    // 활성화된 PIN 확인
    checkActivePin();
    
    // 실시간으로 활성화된 PIN 상태 모니터링
    const interval = setInterval(() => {
      checkActivePin();
    }, 5000); // 5초마다 확인
    
    // 특정 조건에서 관리자 버튼 표시 (예: URL 파라미터 또는 특정 키 조합)
    const urlParams = new URLSearchParams(window.location.search);
    const adminMode = urlParams.get('admin');
    
    // 또는 특정 키 조합 감지
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdminButton(true);
      }
    };

    if (adminMode === 'true') {
      setShowAdminButton(true);
      // admin=true로 접속시 바로 관리자 페이지로 이동
      navigate('/admin');
    }

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval); // 인터벌 정리
    };
  }, [navigate]);

  const handleControlMode = () => {
    navigate('/control');
  };

  const handleOutputMode = async () => {
    try {
      console.log('MainScreen: 출력용 모드 시작, activePinCount:', activePinCount);
      
      // 최대 PIN 개수 확인 (10개까지 허용)
      console.log('MainScreen: 최대 PIN 개수 확인, activePinCount:', activePinCount);
      if (activePinCount >= 10) {
        alert('최대 PIN 개수(10개)에 도달했습니다. 기존 PIN을 제거한 후 다시 시도해주세요.');
        return;
      }
      
      // PIN 생성 시도
      console.log('MainScreen: PIN 생성 시도');
      const pin = await ConnectionService.generatePin();
      localStorage.setItem('currentPin', pin);
      navigate('/output');
    } catch (error) {
      console.error('PIN 생성 실패:', error);
      alert(error.message || 'PIN 생성에 실패했습니다.');
    }
  };

  const handleAdminMode = () => {
    navigate('/admin');
  };

  return (
    <div className="main-screen">
      <div className="monitor-icon">
        <img src={logoImage} alt="학교 로고" />
      </div>
      <h1 className="school-name">광주동신여자고등학교</h1>
      <h2 className="app-title">학교생활도우미</h2>
      
      <div className="mode-selection">
        {activePinCount >= 10 ? (
          <div className="active-pin-warning">
            <h3>⚠️ 최대 연결 수에 도달했습니다</h3>
            <p>현재 활성화된 연결: <strong>{activePinCount}</strong>개 / 최대 10개</p>
            <p>새로운 연결을 위해서는 관리자 페이지에서 기존 PIN을 제거해야 합니다.</p>
            <div className="warning-buttons">
              <button className="mode-btn admin-btn" onClick={handleAdminMode}>
                관리자 페이지로 이동
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3>모드를 선택하세요</h3>
            {activePinCount > 0 && (
              <p className="connection-info">
                현재 활성화된 연결: <strong>{activePinCount}</strong>개 / 최대 10개
              </p>
            )}
            <div className="mode-buttons">
              <button className="mode-btn control-btn" onClick={handleControlMode}>
                제어용
              </button>
              <button className="mode-btn output-btn" onClick={handleOutputMode}>
                출력용
              </button>
              {showAdminButton && (
                <button className="mode-btn admin-btn" onClick={handleAdminMode}>
                  관리자
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default MainScreen;
