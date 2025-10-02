import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import './ControlConnectionInfo.css';

function ControlConnectionInfo() {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState('연결 안됨');
  const [pin, setPin] = useState('');
  const [showPinPopup, setShowPinPopup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 현재 연결된 PIN 정보 가져오기 (실제로는 sessionStorage나 context에서 관리)
    const savedPin = sessionStorage.getItem('currentPin');
    if (savedPin) {
      setPin(savedPin);
      setConnectionStatus('연결됨');
    }
  }, []);

  const handlePinButtonClick = () => {
    setShowPinPopup(true);
    setPinInput('');
    setPasswordInput('');
    setErrorMessage('');
    setIsAuthenticated(false);
  };

  const handleKeypadClick = (number) => {
    if (passwordInput.length < 6) {
      setPasswordInput(prev => prev + number);
    }
  };

  const handleKeypadBackspace = () => {
    setPasswordInput(prev => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPasswordInput('');
  };

  const handlePinSubmit = async () => {
    if (passwordInput.length !== 6) {
      setErrorMessage('6자리 비밀번호를 입력해주세요.');
      return;
    }

    if (passwordInput !== '040507') {
      setErrorMessage('비밀번호가 올바르지 않습니다.');
      return;
    }

    // 비밀번호가 올바르면 팝업을 닫고 바로 연결 해제 실행
    setShowPinPopup(false);
    setIsAuthenticated(true);
    setErrorMessage('');
    
    // 바로 연결 해제 실행
    await executeDisconnect();
  };

  const handlePinCancel = () => {
    setShowPinPopup(false);
    setPinInput('');
    setPasswordInput('');
    setErrorMessage('');
    setIsAuthenticated(false);
  };

  const executeDisconnect = async () => {
    const controlSessionId = sessionStorage.getItem('controlSessionId');
    const outputSessionId = sessionStorage.getItem('outputSessionId');
    
    if (controlSessionId) {
      try {
        
        // 출력용 디바이스에게 메인 화면으로 이동하라는 신호 전송
        if (outputSessionId) {
          await ConnectionDB.sendControlData(controlSessionId, {
            currentPage: 'main',
            adminRemoved: true
          });
          
          // 출력용 디바이스가 신호를 받을 시간을 주기 위해 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 연결 해제
        await ConnectionDB.disconnectSession(controlSessionId);
        
        // sessionStorage 정리
        sessionStorage.removeItem('controlSessionId');
        sessionStorage.removeItem('outputSessionId');
        sessionStorage.removeItem('currentPin');
        sessionStorage.removeItem('pairingId');
        
        setConnectionStatus('연결 안됨');
        setPin('');
        setIsAuthenticated(false);
        
        // 연결 해제 후 메인 화면으로 이동
        navigate('/');
      } catch (error) {
        console.error('연결 해제 실패:', error);
        setErrorMessage('연결 해제에 실패했습니다. 다시 시도해주세요.');
      }
    } else {
      setErrorMessage('연결된 세션이 없습니다.');
    }
  };

  const handleDisconnect = async () => {
    // 인증이 완료되지 않았으면 팝업 표시
    if (!isAuthenticated) {
      handlePinButtonClick();
      return;
    }

    // 인증이 완료되었으면 연결 해제 실행
    await executeDisconnect();
  };

  const handleBackToMain = () => {
    navigate('/control/main');
  };

  return (
    <div className="control-connection-info">
      <h1>연결 정보</h1>
      
      <div className="connection-status">
        <div className="status-item">
          <span className="label">연결 상태:</span>
          <span className={`status ${connectionStatus === '연결됨' ? 'connected' : 'disconnected'}`}>
            {connectionStatus}
          </span>
        </div>
        
        {pin && (
          <div className="status-item">
            <span className="label">PIN 번호:</span>
            <span className="pin-value">{pin}</span>
          </div>
        )}
        
        <div className="status-item">
          <span className="label">연결 시간:</span>
          <span className="time-value">{new Date().toLocaleString()}</span>
        </div>
      </div>

      <div className="connection-actions">
        <button className="disconnect-btn" onClick={handleDisconnect} disabled={!pin}>
          연결 해제
        </button>
      </div>

      <button className="main-icon-btn" onClick={handleBackToMain}>
        🏠 메인 화면
      </button>

      {/* PIN 입력 팝업 */}
      {showPinPopup && (
        <div className="pin-popup-overlay">
          <div className="pin-popup">
            <h2>연결 해제</h2>
            <div className="password-display">
              <div className="password-dots">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div 
                    key={index} 
                    className={`password-dot ${passwordInput.length > index ? 'filled' : ''}`}
                  />
                ))}
              </div>
              <div className="password-text">
                비밀번호를 입력하세요
              </div>
            </div>
            
            {errorMessage && (
              <div className="error-message">{errorMessage}</div>
            )}
            
            <div className="keypad">
              <div className="keypad-row">
                <button className="keypad-btn" onClick={() => handleKeypadClick('1')}>1</button>
                <button className="keypad-btn" onClick={() => handleKeypadClick('2')}>2</button>
                <button className="keypad-btn" onClick={() => handleKeypadClick('3')}>3</button>
              </div>
              <div className="keypad-row">
                <button className="keypad-btn" onClick={() => handleKeypadClick('4')}>4</button>
                <button className="keypad-btn" onClick={() => handleKeypadClick('5')}>5</button>
                <button className="keypad-btn" onClick={() => handleKeypadClick('6')}>6</button>
              </div>
              <div className="keypad-row">
                <button className="keypad-btn" onClick={() => handleKeypadClick('7')}>7</button>
                <button className="keypad-btn" onClick={() => handleKeypadClick('8')}>8</button>
                <button className="keypad-btn" onClick={() => handleKeypadClick('9')}>9</button>
              </div>
              <div className="keypad-row">
                <button className="keypad-btn" onClick={() => handleKeypadClick('0')}>0</button>
                <button className="keypad-btn backspace-btn" onClick={handleKeypadBackspace}>⌫</button>
                <button className="keypad-btn clear-btn" onClick={handleKeypadClear}>C</button>
              </div>
            </div>
            
            <div className="popup-buttons">
              <button className="submit-btn" onClick={handlePinSubmit} disabled={passwordInput.length !== 6}>
                확인
              </button>
              <button className="cancel-btn" onClick={handlePinCancel}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ControlConnectionInfo;
