import { useState, useEffect } from 'react';
import './OutputSchedule.css';

function OutputSchedule() {
  const [viewMode, setViewMode] = useState('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());

  // 샘플 학사일정 데이터
  const sampleSchedule = {
    monthly: {
      '10월': {
        '일요일': [''],
        '월요일': ['중간고사 (1-3학년)', '수행평가'],
        '화요일': ['체험학습', '모의고사'],
        '수요일': ['방과후 종료'],
        '목요일': ['건강검진'],
        '금요일': ['자율학습'],
        '토요일': ['']
      }
    },
    weekly: {
      '10월 (9/28 ~ 10/4)': {
        '일요일 9/28': [''],
        '월요일 9/29': ['중간고사 (1-3학년)'],
        '화요일 9/30': ['체험학습'],
        '수요일 10/01': ['방과후 종료'],
        '목요일 10/02': ['건강검진'],
        '금요일 10/03': ['자율학습'],
        '토요일 10/04': ['']
      }
    }
  };

  const getCurrentSchedule = () => {
    if (viewMode === 'monthly') {
      return sampleSchedule.monthly['10월'];
    } else {
      return sampleSchedule.weekly['10월 (9/28 ~ 10/4)'];
    }
  };

  const schedule = getCurrentSchedule();

  return (
    <div className="output-schedule">
      <h1>{viewMode === 'monthly' ? '10월 학사일정' : '10월 학사일정 (9/28 ~ 10/4)'}</h1>
      
      <div className="schedule-table">
        {Object.entries(schedule).map(([day, events]) => (
          <div key={day} className="schedule-row">
            <div className="day-cell">{day}</div>
            <div className="events-cell">
              {events.map((event, index) => (
                <div key={index} className="event-item">
                  {event}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OutputSchedule;
