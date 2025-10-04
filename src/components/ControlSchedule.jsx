import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import './ControlSchedule.css';

function ControlSchedule() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('weekly'); // monthly or weekly
  const [currentDate, setCurrentDate] = useState(new Date());

  // 컴포넌트 마운트 시 초기 학사일정 데이터 전송 (주별)
  useEffect(() => {
    sendControlDataWithData('weekly', currentDate); // 매개변수 순서 수정: mode, date
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

  const sendControlDataWithData = async (mode, date) => {
    const controlSessionId = sessionStorage.getItem('controlSessionId');
    
    
    if (controlSessionId) {
      try {
        // date가 Date 객체인지 확인하고 변환
        let dateString;
        if (date instanceof Date) {
          dateString = date.toISOString();
        } else if (typeof date === 'string') {
          dateString = date;
        } else {
          dateString = new Date().toISOString();
        }
        
        const data = {
          currentPage: 'schedule',
          scheduleView: mode,
          scheduleDate: dateString
        };
        
        await ConnectionDB.sendControlData(controlSessionId, data);
      } catch (error) {
        console.error('제어 데이터 전송 실패:', error);
      }
    } else {
      console.error('ControlSchedule: 제어 세션 ID가 없습니다.');
    }
  };

  return (
    <div className="control-schedule">
      <div className="project-header">
        <h1>학교 생활 도우미</h1>
      </div>
      
      <h2>학사 일정</h2>
      
      <div className="navigation-buttons">
        <button className="nav-btn" onClick={handlePreviousPeriod}>
          {viewMode === 'monthly' ? '저번 달' : '이번주'}
        </button>
        <button className="nav-btn" onClick={handleNextPeriod}>
          {viewMode === 'monthly' ? '다음 달' : '다음주'}
        </button>
      </div>

      <div className="today-button-section">
        <button className="today-btn" onClick={handleToday}>
          {viewMode === 'monthly' ? '이번달로 이동' : '이번주로 이동'}
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
