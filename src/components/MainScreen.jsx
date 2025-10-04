import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ConnectionDB from '../services/ConnectionDB';
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
      console.log('MainScreen.checkActivePin: 시작 - 현재 시간:', new Date().toISOString());
      const activeConnections = await ConnectionDB.getActiveConnections();
      console.log('MainScreen.checkActivePin: 가져온 연결 목록:', activeConnections);
      const count = activeConnections.length;
      console.log('MainScreen.checkActivePin: 연결 개수:', count);
      setActivePinCount(count);
      
      if (count > 0) {
        const activeConnection = activeConnections[0];
        console.log('MainScreen.checkActivePin: 첫 번째 연결:', activeConnection);
        setActivePinNumber(activeConnection.sessionId);
        setHasActivePin(true);
      } else {
        console.log('MainScreen.checkActivePin: 연결 없음');
        setHasActivePin(false);
        setActivePinNumber(null);
      }
    } catch (error) {
      console.error('MainScreen.checkActivePin: 활성 PIN 확인 실패:', error);
      setHasActivePin(false);
      setActivePinNumber(null);
      setActivePinCount(0);
    }
  };

  useEffect(() => {
    // 활성화된 PIN 확인
    checkActivePin();
    
    // 실시간으로 활성화된 PIN 상태 모니터링 (스냅샷 리스너)
    const unsubscribe = ConnectionDB.subscribeToActiveConnections((activePins) => {
      console.log('MainScreen: 실시간 PIN 변경 감지:', activePins);
      const count = activePins.length;
      setActivePinCount(count);
      
      if (count > 0) {
        const activeConnection = activePins[0];
        console.log('MainScreen: 첫 번째 연결:', activeConnection);
        setActivePinNumber(activeConnection.sessionId);
        setHasActivePin(true);
      } else {
        console.log('MainScreen: 연결 없음');
        setHasActivePin(false);
        setActivePinNumber(null);
      }
    });
    
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
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
        console.log('MainScreen: 실시간 모니터링 구독 해제');
      }
    };
  }, [navigate]);

  const handleControlMode = () => {
    navigate('/control');
  };

  const handleOutputMode = async () => {
    try {
      
      // 최대 PIN 개수 확인 (10개까지 허용)
      if (activePinCount >= 10) {
        alert('최대 PIN 개수(10개)에 도달했습니다. 기존 PIN을 제거한 후 다시 시도해주세요.');
        return;
      }
      
      // 출력용 세션 생성
      const result = await ConnectionDB.createOutputSession();
      sessionStorage.setItem('outputSessionId', result.sessionId);
      sessionStorage.setItem('currentPin', result.pin);
      navigate('/output');
    } catch (error) {
      console.error('출력용 세션 생성 실패:', error);
      alert(error.message || '출력용 세션 생성에 실패했습니다.');
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

      {/* 패치 노트 및 버전 정보 */}
      <div className="patchnote-section">
        <div className="version-info">
          <h4>🔄 버전 정보</h4>
          <p className="version-number">v1.0.0</p>
          <p className="version-date">최종 업데이트: 2025-10-04</p>
        </div>
        
        <div className="patchnote-info">
          <h4>📋 최근 주요 업데이트</h4>
          <div className="patchnote-list">
            <div className="patchnote-item">
              <span className="feature-badge new">NEW</span>
              <span>메인 공지사항 시스템 - PIN별 타겟팅 및 실시간 표시</span>
            </div>
            <div className="patchnote-item">
              <span className="feature-badge new">NEW</span>
              <span>PWA 지원 - 모바일 앱처럼 설치 및 오프라인 사용</span>
            </div>
            <div className="patchnote-item">
              <span className="feature-badge improved">IMPROVED</span>
              <span>실시간 PIN 연결 감지 및 자동 모니터링</span>
            </div>
            <div className="patchnote-item">
              <span className="feature-badge improved">IMPROVED</span>
              <span>모바일 반응형 디자인 최적화</span>
            </div>
            <div className="patchnote-item">
              <span className="feature-badge fixed">FIXED</span>
              <span>관리자 페이지 새로고침 없이 즉시 PIN 목록 표시</span>
            </div>
          </div>
          <div className="patchnote-footer">
            <p>자세한 사항은 관리자 페이지의 패치 노트에서 확인하세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainScreen;
