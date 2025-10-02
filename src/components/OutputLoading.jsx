import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
        const unsubscribe = ConnectionService.subscribeToControlData(generatedPin, (data) => {
          console.log('OutputLoading: 연결 상태 확인:', data);
          console.log('OutputLoading: status:', data.status, 'connectedControlDevice:', data.connectedControlDevice);
          
          // connectedControlDevice가 있으면 연결된 것으로 간주
          if (data.connectedControlDevice) {
            console.log('OutputLoading: 제어용 기기 연결됨, 페어링 ID 저장:', data.pairingId);
            localStorage.setItem('pairingId', data.pairingId); // 페어링 ID 저장
            navigate('/output/main');
          }
        });
        
        // 5초마다 연결 상태 확인 (백업 로직)
        const checkConnectionInterval = setInterval(async () => {
          try {
            const docRef = doc(db, 'connections', generatedPin);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              console.log('OutputLoading: 주기적 연결 상태 확인:', data);
              if (data.connectedControlDevice) {
                console.log('OutputLoading: 주기적 확인에서 연결 감지, 페어링 ID 저장:', data.pairingId);
                localStorage.setItem('pairingId', data.pairingId); // 페어링 ID 저장
                clearInterval(checkConnectionInterval);
                unsubscribe();
                navigate('/output/main');
              }
            }
          } catch (error) {
            console.error('OutputLoading: 주기적 연결 확인 실패:', error);
          }
        }, 5000);
        
        // 컴포넌트 언마운트 시 정리
        return () => {
          clearInterval(checkConnectionInterval);
          unsubscribe();
        };
        
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
