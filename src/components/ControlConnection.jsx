import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import './ControlConnection.css';

function ControlConnection() {
  const [pin, setPin] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleNumberClick = (number) => {
    if (pin.length < 6) {
      setPin(pin + number);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 6) return;
    
    setIsConnecting(true);
    setError('');
    
    try {
      const result = await ConnectionDB.connectControlDevice(pin);
      
      if (result.success) {
        sessionStorage.setItem('controlSessionId', result.controlSessionId);
        sessionStorage.setItem('outputSessionId', result.outputSessionId);
        sessionStorage.setItem('currentPin', result.pin);
        sessionStorage.setItem('pairingId', result.pairingId);
        navigate('/control/main');
      } else {
        setError(result.error || '잘못된 PIN입니다. 다시 입력해주세요.');
        setPin('');
      }
    } catch (error) {
      console.error('연결 실패:', error);
      setError(error.message || '연결에 실패했습니다. 다시 시도해주세요.');
      setPin('');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="control-connection">
      <h2>제어용 기기에 표시된 PIN을 입력하세요</h2>
      
      <div className="pin-input-container">
        <div className="pin-display">
          {pin.split('').map((digit, index) => (
            <div key={index} className="pin-digit">
              {digit}
            </div>
          ))}
          {Array.from({ length: 6 - pin.length }).map((_, index) => (
            <div key={index + pin.length} className="pin-digit empty"></div>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="keypad">
        {/* 매우 작은 높이에서는 한 줄로 배치 */}
        <div className="compact-layout">
          <button className="key" onClick={() => handleNumberClick('1')}>1</button>
          <button className="key" onClick={() => handleNumberClick('2')}>2</button>
          <button className="key" onClick={() => handleNumberClick('3')}>3</button>
          <button className="key" onClick={() => handleNumberClick('4')}>4</button>
          <button className="key" onClick={() => handleNumberClick('5')}>5</button>
          <button className="key" onClick={() => handleNumberClick('6')}>6</button>
          <button className="key" onClick={() => handleNumberClick('7')}>7</button>
          <button className="key" onClick={() => handleNumberClick('8')}>8</button>
          <button className="key" onClick={() => handleNumberClick('9')}>9</button>
          <button className="key" onClick={() => handleNumberClick('0')}>0</button>
          <button className="key backspace" onClick={handleBackspace}>⌫</button>
        </div>
        
        {/* 일반적인 높이에서는 기존 레이아웃 */}
        <div className="normal-layout">
          <div className="keypad-row">
            <button className="key" onClick={() => handleNumberClick('1')}>1</button>
            <button className="key" onClick={() => handleNumberClick('2')}>2</button>
            <button className="key" onClick={() => handleNumberClick('3')}>3</button>
          </div>
          <div className="keypad-row">
            <button className="key" onClick={() => handleNumberClick('4')}>4</button>
            <button className="key" onClick={() => handleNumberClick('5')}>5</button>
            <button className="key" onClick={() => handleNumberClick('6')}>6</button>
          </div>
          <div className="keypad-row">
            <button className="key" onClick={() => handleNumberClick('7')}>7</button>
            <button className="key" onClick={() => handleNumberClick('8')}>8</button>
            <button className="key" onClick={() => handleNumberClick('9')}>9</button>
          </div>
          <div className="keypad-row">
            <button className="key backspace" onClick={handleBackspace}>⌫</button>
            <button className="key" onClick={() => handleNumberClick('0')}>0</button>
            <button className="key empty"></button>
          </div>
        </div>
      </div>

      <button 
        className="pin-submit-btn" 
        onClick={handlePinSubmit}
        disabled={pin.length !== 6 || isConnecting}
      >
        {isConnecting ? '연결 중...' : 'PIN 입력'}
      </button>
    </div>
  );
}

export default ControlConnection;
