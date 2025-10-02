import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import './OutputLoading.css';

function OutputLoading() {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const outputSessionId = sessionStorage.getItem('outputSessionId');
        const pin = sessionStorage.getItem('currentPin');
        
        if (outputSessionId && pin) {
          setPin(pin);
          
          // 제어용 기기 연결 대기
          const unsubscribe = ConnectionDB.subscribeToOutputData(outputSessionId, (data) => {
            console.log('OutputLoading: 연결 상태 확인:', data);
            
            // connectedControlSession이 있으면 연결된 것으로 간주
            if (data.connectedControlSession) {
              console.log('OutputLoading: 제어용 기기 연결됨, 메인 화면으로 이동');
              navigate('/output/main');
            }
          });
          
          // 컴포넌트 언마운트 시 정리
          return () => {
            unsubscribe();
          };
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
