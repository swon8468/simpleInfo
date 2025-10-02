import { useState, useEffect } from 'react';
import './OutputSchedule.css';

function OutputSchedule() {
  const [viewMode, setViewMode] = useState('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());

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
