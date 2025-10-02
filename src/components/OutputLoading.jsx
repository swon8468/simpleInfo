import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionService from '../services/ConnectionService';
import './OutputLoading.css';

function OutputLoading() {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const generatedPin = await ConnectionService.generatePin();
        setPin(generatedPin);
        
        // 제어용 기기 연결 대기
        ConnectionService.subscribeToControlData(generatedPin, (data) => {
          if (data.status === 'connected') {
            navigate('/output/main');
          }
        });
        
      } catch (error) {
        console.error('연결 초기화 실패:', error);
        // 에러 발생 시 기본 PIN 생성
        const fallbackPin = Math.floor(100000 + Math.random() * 900000).toString();
        setPin(fallbackPin);
        
        setTimeout(() => {
          navigate('/output/main');
        }, 3000);
      }
    };
    
    initializeConnection();
  }, [navigate]);

  return (
    <div className="output-loading">
      <div className="monitor-icon">🖥️</div>
      <h2>제어용 기기에 아래의 PIN을 입력하세요!</h2>
      
      <div className="pin-display">
        <span className="pin-label">PIN:</span>
        <span className="pin-number">{pin}</span>
      </div>
      
      <div className="loading-text">
        제어용 기기 연결을 기다리는 중...
      </div>
    </div>
  );
}

export default OutputLoading;
