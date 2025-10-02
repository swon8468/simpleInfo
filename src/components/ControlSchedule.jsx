import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionService from '../services/ConnectionService';
import './ControlSchedule.css';

function ControlSchedule() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('monthly'); // monthly or weekly
  const [currentDate, setCurrentDate] = useState(new Date());

  // 컴포넌트 마운트 시 초기 학사일정 데이터 전송 (월별)
  useEffect(() => {
    sendControlDataWithData(currentDate, 'monthly'); // 초기 데이터 전송 시 'monthly' 사용
  }, []); // 빈 배열로 한 번만 실행

  const handleBackToMain = async () => {
    await sendControlData('main');
    navigate('/control/main');
  };

  const handlePreviousPeriod = async () => {
    let newDate;
    if (viewMode === 'monthly') {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    } else {
      newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
    }
    
    setCurrentDate(newDate);
    
    // 출력용 화면에 변경사항 전송
    await sendControlDataWithData(viewMode, newDate);
  };

  const handleNextPeriod = async () => {
    let newDate;
    if (viewMode === 'monthly') {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    } else {
      newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
    }
    
    setCurrentDate(newDate);
    
    // 출력용 화면에 변경사항 전송
    await sendControlDataWithData(viewMode, newDate);
  };

  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    
    // 출력용 화면에 변경사항 전송
    await sendControlDataWithData(mode, currentDate);
  };

  const handleToday = async () => {
    const today = new Date();
    setCurrentDate(today);
    
    // 출력용 화면에 변경사항 전송
    await sendControlDataWithData(viewMode, today);
  };

  const sendControlData = async (page) => {
    const savedPin = localStorage.getItem('currentPin');
    const connectedPin = localStorage.getItem('connectedPin');
    
    if (savedPin && connectedPin) {
      try {
        await ConnectionService.sendControlData(connectedPin, {
          currentPage: page
        });
      } catch (error) {
        console.error('제어 데이터 전송 실패:', error);
      }
    }
  };

  const sendControlDataWithData = async (mode, date) => {
    const savedPin = localStorage.getItem('currentPin');
    const connectedPin = localStorage.getItem('connectedPin');
    
    if (savedPin && connectedPin) {
      try {
        await ConnectionService.sendControlData(connectedPin, {
          currentPage: 'schedule',
          scheduleView: mode,
          scheduleDate: date.toISOString()
        });
      } catch (error) {
        console.error('제어 데이터 전송 실패:', error);
      }
    }
  };

  return (
    <div className="control-schedule">
      <div className="project-header">
        <h1>학교생활도우미</h1>
      </div>
      
      <h2>학사 일정</h2>
      
      <div className="navigation-buttons">
        <button className="nav-btn" onClick={handlePreviousPeriod}>
          {viewMode === 'monthly' ? '저번 달' : '저번 주'}
        </button>
        <button className="nav-btn" onClick={handleNextPeriod}>
          {viewMode === 'monthly' ? '다음 달' : '다음 주'}
        </button>
      </div>

      <div className="today-button-section">
        <button className="today-btn" onClick={handleToday}>
          이번달로 이동
        </button>
      </div>

      <div className="display-format">
        <h3>표시 형식</h3>
        <div className="format-buttons">
          <button 
            className={`format-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('monthly')}
          >
            월별
          </button>
          <button 
            className={`format-btn ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('weekly')}
          >
            주별
          </button>
        </div>
      </div>

      <button className="main-icon-btn" onClick={handleBackToMain}>
        🏠 메인화면
      </button>
    </div>
  );
}

export default ControlSchedule;
