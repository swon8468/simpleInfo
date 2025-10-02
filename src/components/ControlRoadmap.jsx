import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import './ControlRoadmap.css';

function ControlRoadmap() {
  const navigate = useNavigate();

  useEffect(() => {
    // 출력용 화면에 로드맵 표시 전송
    sendControlData('roadmap');
  }, []);

  const handleBackToMain = async () => {
    await sendControlData('main');
    navigate('/control/main');
  };

  const sendControlData = async (page) => {
    const controlSessionId = sessionStorage.getItem('controlSessionId');
    
    if (controlSessionId) {
      try {
        await ConnectionDB.sendControlData(controlSessionId, {
          currentPage: page
        });
      } catch (error) {
        console.error('제어 데이터 전송 실패:', error);
      }
    }
  };

  return (
    <div className="control-roadmap">
      <h1>교실 배치</h1>
      
      <div className="roadmap-message">
        <h2>스크린을 확인해주세요</h2>
        <p>교실 배치 정보는 출력 화면에서 확인할 수 있습니다.</p>
      </div>

      <button className="main-icon-btn" onClick={handleBackToMain}>
        🏠 메인화면
      </button>
    </div>
  );
}

export default ControlRoadmap;
