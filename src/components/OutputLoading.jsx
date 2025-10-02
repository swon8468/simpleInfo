import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import './OutputLoading.css';

function OutputLoading() {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe = null;
    
    const initializeConnection = async () => {
      try {
        const outputSessionId = sessionStorage.getItem('outputSessionId');
        const pin = sessionStorage.getItem('currentPin');
        
        
        if (outputSessionId && pin) {
          setPin(pin);
          
          // 제어용 기기 연결 대기
          unsubscribe = ConnectionDB.subscribeToOutputData(outputSessionId, (data) => {
            
            // connectedControlSession이 있으면 연결된 것으로 간주
            if (data.connectedControlSession) {
              // 페어링 ID 저장
              if (data.pairingId) {
                sessionStorage.setItem('pairingId', data.pairingId);
              }
              // 즉시 이동하지 말고 약간의 지연을 두고 이동
              setTimeout(() => {
                navigate('/output/main');
              }, 100);
            }
          });
        } else {
          console.error('OutputLoading: 세션 정보가 없습니다.');
          navigate('/');
        }
      } catch (error) {
        console.error('연결 초기화 실패:', error);
        navigate('/');
      }
    };
    
    initializeConnection();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigate]);

  return (
    <div className="output-loading">
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
