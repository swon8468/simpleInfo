import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ConnectionDB from '../services/ConnectionDB';
import DataService from '../services/DataService';
import NotificationService from '../services/NotificationService';
import { Warning, Refresh, Notifications, GetApp } from '@mui/icons-material';
import logoImage from '/logo.png';
import './MainScreen.css';
import ActivityLogService from '../services/ActivityLogService';

function MainScreen() {
  const navigate = useNavigate();
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [hasActivePin, setHasActivePin] = useState(false);
  const [activePinNumber, setActivePinNumber] = useState(null);
  const [activePinCount, setActivePinCount] = useState(0);
  const [showPatchnoteModal, setShowPatchnoteModal] = useState(false);
  const [patchnotes, setPatchnotes] = useState([]);
  const [latestVersion, setLatestVersion] = useState('v1.0.0');
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [schoolBlockingStatus, setSchoolBlockingStatus] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // 버전 비교 함수 (v2.0.0 > v1.9.0 > v1.8.0)
  const compareVersions = (a, b) => {
    const parseVersion = (version) => {
      const [, major, minor, patch] = version.match(/v?(\d+)\.(\d+)\.(\d+)/) || [0, 0, 0, 0];
      return { major: parseInt(major), minor: parseInt(minor), patch: parseInt(patch) };
    };
    
    const versionA = parseVersion(a.version);
    const versionB = parseVersion(b.version);
    
    if (versionA.major !== versionB.major) return versionB.major - versionA.major;
    if (versionA.minor !== versionB.minor) return versionB.minor - versionA.minor;
    return versionB.patch - versionA.patch;
  };

  // 패치 노트 가져오기
  const fetchPatchnotes = async () => {
    try {
      const data = await DataService.getPatchnotes();
      const sortedPatchnotes = data.sort(compareVersions); // 버전 역순 정렬
      setPatchnotes(sortedPatchnotes);
      
      // 최신 버전 설정 (첫 번째 항목이 가장 최신 버전)
      if (sortedPatchnotes.length > 0) {
        setLatestVersion(sortedPatchnotes[0].version || 'v1.0.0');
      }
    } catch (error) {
      console.error('패치 노트 로드 실패:', error);
    }
  };

  // 모달 열기/닫기
  const handlePatchnoteClick = () => {
    setShowPatchnoteModal(true);
    fetchPatchnotes();
  };

  const handleCloseModal = () => {
    setShowPatchnoteModal(false);
  };

  // 알림 권한 요청
  const requestNotificationPermission = async () => {
    try {
      const granted = await NotificationService.requestPermission();
      setNotificationPermission(granted);
      if (granted) {
        alert('알림 권한이 허용되었습니다! 새로운 패치노트나 공지사항을 받을 수 있습니다.');
      }
    } catch (error) {
      alert('알림 권한 요청에 실패했습니다: ' + error.message);
    }
  };

  // 알림 상태 초기화 및 버전 설정
  useEffect(() => {
    const status = NotificationService.getPermissionStatus();
    setNotificationSupported(status.isSupported);
    setNotificationPermission(status.canShow);
    
    // 초기 버전 설정
    fetchPatchnotes();
    
    // 메인 화면 body 색 설정
    document.body.style.background = '#f5f5f5';

    // 접속 로그 기록 (IP는 best-effort, 클라이언트에서 수집 불가 시 N/A)
    ActivityLogService.logActivity('메인 화면 접속', 'minor', '사용자가 메인 화면(/)에 접속함');
    
    // cleanup에서 원래 색상으로 되돌리기
    return () => {
      document.body.style.background = '#f5f5f5';
    };
  }, []);


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

  // 학교 차단 상태 확인 함수
  const checkSchoolBlockingStatus = async () => {
    try {
      const status = await ConnectionDB.getSchoolBlockingStatus();
      setSchoolBlockingStatus(status);
    } catch (error) {
      console.error('학교 차단 상태 확인 실패:', error);
    }
  };

  useEffect(() => {
    // PWA 설치 프롬프트 처리
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // PWA 설치 완료 처리
    window.addEventListener('appinstalled', () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    // 활성화된 PIN 확인
    checkActivePin();
    
    // 학교 차단 상태 확인
    checkSchoolBlockingStatus();
    
    // 실시간으로 활성화된 PIN 상태 모니터링 (스냅샷 리스너)
    const unsubscribePins = ConnectionDB.subscribeToActiveConnections((activePins) => {
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

    // 실시간으로 학교 차단 상태 모니터링
    const unsubscribeBlocking = ConnectionDB.subscribeToSchoolBlockingStatus((isActive) => {
      setSchoolBlockingStatus(isActive);
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
      if (unsubscribePins && typeof unsubscribePins === 'function') {
        unsubscribePins();
        console.log('MainScreen: PIN 실시간 모니터링 구독 해제');
      }
      if (unsubscribeBlocking && typeof unsubscribeBlocking === 'function') {
        unsubscribeBlocking();
        console.log('MainScreen: 차단 상태 실시간 모니터링 구독 해제');
      }
    };
  }, [navigate]);

  // PWA 설치 함수
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA 설치 승인됨');
      } else {
        console.log('PWA 설치 거부됨');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

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
    const url = new URL(window.location.href);
    url.pathname = `${import.meta.env.BASE_URL}`; // 루트로
    url.searchParams.set('admin', 'true');
    window.location.href = url.toString();
  };

  return (
    <div className="main-screen">
      <div className="monitor-icon">
        <img src={logoImage} alt="학교 로고" />
      </div>
      <h1 className="school-name">광주동신여자고등학교</h1>
      <h2 className="app-title">학교 생활 도우미</h2>
      
      <div className="mode-selection">
        {activePinCount >= 10 ? (
          <div className="active-pin-warning">
            <h3><Warning sx={{ fontSize: 24, marginRight: 1 }} /> 최대 연결 수에 도달했습니다</h3>
            <p>현재 활성화된 연결: <strong>{activePinCount}</strong>개 / 최대 10개</p>
            <p>새로운 연결을 위해서는 관리자에게 문의해주세요.</p>
          </div>
        ) : (
          <>
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

      {/* 버전 정보 및 알림 설정 */}
      <div className="version-section">
        <button className="version-button" onClick={handlePatchnoteClick}>
          <div className="version-content">
            <span className="version-icon"><Refresh sx={{ fontSize: 24 }} /></span>
            <div className="version-text">
              <span className="version-number">{latestVersion}</span>
              <span className="version-label">패치 노트 보기</span>
            </div>
          </div>
        </button>
        
        {/* 알림 권한 요청 (PWA 지원시만) */}
        {notificationSupported && !notificationPermission && (
          <button className="notification-button" onClick={requestNotificationPermission}>
            <span className="notification-icon"><Notifications sx={{ fontSize: 24 }} /></span>
            <span>알림 허용</span>
          </button>
        )}
        
        {/* PWA 설치 버튼 */}
        {showInstallButton && (
          <button className="install-button" onClick={handleInstallPWA}>
            <span className="install-icon"><GetApp sx={{ fontSize: 24 }} /></span>
            <span>앱 설치</span>
          </button>
        )}
      </div>

      {/* 패치 노트 모달 */}
      {showPatchnoteModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>패치 노트</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              {patchnotes.length === 0 ? (
                <p className="no-patchnotes">등록된 패치 노트가 없습니다.</p>
              ) : (
                <div className="patchnotes-list">
                  {patchnotes.map((patchnote) => (
                    <div key={patchnote.id} className="patchnote-card">
                      <div className="patchnote-header">
                        <span className={`version-badge ${patchnote.type}`}>
                          {patchnote.version}
                        </span>
                        <span className="patchnote-date">
                          {patchnote.date ? 
                            new Date(patchnote.date + 'T00:00:00').toLocaleDateString('ko-KR') :
                            new Date(patchnote.createdAt).toLocaleDateString('ko-KR')
                          }
                        </span>
                      </div>
                      <div className="patchnote-content">
                        <h4>{patchnote.title}</h4>
                        <div className="patchnote-details">
                          {patchnote.content.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainScreen;
