import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import TTSService from '../services/TTSService';
import './ControlAnnouncement.css';

function ControlAnnouncement() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const handlePreviousPost = async () => {
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    await sendAnnouncementDataWithIndex(newIndex);
  };

  const handleNextPost = async () => {
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    await sendAnnouncementDataWithIndex(newIndex);
  };

  const sendAnnouncementDataWithIndex = async (index) => {
    const controlSessionId = sessionStorage.getItem('controlSessionId');
    
    if (controlSessionId) {
      try {
        await ConnectionDB.sendControlData(controlSessionId, {
          currentPage: 'announcement',
          announcementIndex: index
        });
      } catch (error) {
        console.error('제어 데이터 전송 실패:', error);
      }
    }
  };

  const handleListenAgain = async () => {
    // 출력용에 다시 듣기 신호 전송
    const controlSessionId = sessionStorage.getItem('controlSessionId');
    
    if (controlSessionId) {
      try {
        await ConnectionDB.sendControlData(controlSessionId, {
          currentPage: 'announcement',
          announcementIndex: currentIndex,
          reReadAnnouncement: true // 다시 읽기 플래그
        });
      } catch (error) {
        console.error('다시 듣기 신호 전송 실패:', error);
      }
    }
  };

  return (
    <div className="control-announcement">
      <h1>공지사항</h1>
      
      <div className="announcement-navigation">
        <button className="nav-btn" onClick={handlePreviousPost}>이전 게시물</button>
        <button className="nav-btn" onClick={handleNextPost}>다음 게시물</button>
      </div>

      <div className="current-post">
        <p>현재 게시물: {currentIndex + 1}번째</p>
        <button className="listen-btn" onClick={handleListenAgain}>
          🔊 다시 듣기
        </button>
      </div>

      <button className="main-icon-btn" onClick={handleBackToMain}>
        🏠 메인화면
      </button>
    </div>
  );
}

export default ControlAnnouncement;
