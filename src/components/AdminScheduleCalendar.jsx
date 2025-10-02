import React, { useState, useEffect } from 'react';
import DataService from '../services/DataService';
import './AdminScheduleCalendar.css';

function AdminScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    target: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const schedules = await DataService.getScheduleData(year, month);
      
      // schedules 객체를 배열로 변환
      const eventsArray = [];
      Object.keys(schedules).forEach(day => {
        schedules[day].forEach(event => {
          eventsArray.push({
            ...event,
            eventDate: new Date(year, month - 1, parseInt(day))
          });
        });
      });
      
      setEvents(eventsArray);
    } catch (error) {
      console.error('학사일정 로드 실패:', error);
      setEvents([]); // 오류 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const current = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dayEvents = Array.isArray(events) ? events.filter(event => {
          const eventDate = new Date(event.eventDate);
          return eventDate.getDate() === current.getDate() &&
                 eventDate.getMonth() === current.getMonth() &&
                 eventDate.getFullYear() === current.getFullYear();
        }) : [];
        
        weekDays.push({
          date: new Date(current),
          events: dayEvents,
          isCurrentMonth: current.getMonth() === month
        });
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
    }
    
    return calendar;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowForm(true);
    setEditingEvent(null);
    setFormData({ title: '', target: [] });
  };

  const handleEventClick = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      target: event.target || []
    });
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 로컬 날짜를 사용하여 시간대 변환 문제 방지
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const eventDate = `${year}-${month}-${day}`;
      
      if (editingEvent) {
        // 수정
        await DataService.updateScheduleEventById(editingEvent.id, {
          eventDate,
          title: formData.title,
          target: formData.target
        });
      } else {
        // 추가
        const eventDateObj = new Date(eventDate);
        const year = eventDateObj.getFullYear();
        const month = eventDateObj.getMonth() + 1;
        const day = eventDateObj.getDate();
        
        await DataService.addScheduleEvent(year, month, day, formData.title, formData.target);
      }
      
      setShowForm(false);
      setEditingEvent(null);
      setFormData({ title: '', target: [] });
      loadEvents();
    } catch (error) {
      console.error('학사일정 저장 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      try {
        await DataService.deleteScheduleEvent(eventId);
        loadEvents();
      } catch (error) {
        console.error('학사일정 삭제 실패:', error);
      }
    }
  };

  const handleTargetChange = (target, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        target: [...prev.target, target]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        target: prev.target.filter(t => t !== target)
      }));
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const calendar = generateCalendar();
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="admin-schedule-calendar">
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)}>이전 달</button>
        <h2>{currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}</h2>
        <button onClick={() => navigateMonth(1)}>다음 달</button>
      </div>

      {loading ? (
        <div className="loading-spinner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '10%', margin: '0 auto' }}>
          <div className="spinner"></div>
          <p>학사일정을 불러오는 중...</p>
        </div>
      ) : (
        <div className="calendar-grid">
        <div className="calendar-week-header">
          {dayNames.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        
        {calendar.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => (
              <div 
                key={dayIndex} 
                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''}`}
                onClick={() => handleDateClick(day.date)}
              >
                <div className={`day-number ${day.date.getDay() === 0 ? 'sunday' : day.date.getDay() === 6 ? 'saturday' : ''}`}>
                  {day.date.getDate()}
                </div>
                <div className="day-events">
                  {day.events.map((event, eventIndex) => (
                    <div 
                      key={eventIndex} 
                      className="event-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      <div className="event-title">{event.title}</div>
                      <div className="event-target">{event.target?.join(', ')}</div>
                      <button 
                        className="delete-event-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      )}

      {showForm && (
        <div className="event-form-overlay">
          <div className="event-form">
            <h3>{editingEvent ? '일정 수정' : '일정 추가'}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>제목:</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>대상:</label>
                <div className="checkbox-group">
                  {['1학년', '2학년', '3학년'].map(grade => (
                    <label key={grade}>
                      <input
                        type="checkbox"
                        checked={formData.target.includes(grade)}
                        onChange={(e) => handleTargetChange(grade, e.target.checked)}
                      />
                      {grade}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? '저장 중...' : (editingEvent ? '수정' : '추가')}
                </button>
                <button type="button" onClick={() => setShowForm(false)}>
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminScheduleCalendar;
