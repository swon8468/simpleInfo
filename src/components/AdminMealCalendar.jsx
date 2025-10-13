import React, { useState, useEffect } from 'react';
import DataService from '../services/DataService';
import './AdminMealCalendar.css';

function AdminMealCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [formData, setFormData] = useState({
    lunch: '',
    dinner: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMeals();
  }, [currentDate]);

  const loadMeals = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      
      const mealsArray = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        try {
          const meal = await DataService.getMealData(date);
          if (meal && (meal.lunch.length > 0 || meal.dinner.length > 0)) {
            mealsArray.push({
              date,
              lunch: meal.lunch,
              dinner: meal.dinner
            });
          }
        } catch (error) {
          // 해당 날짜에 급식 정보가 없으면 무시
        }
      }
      
      setMeals(mealsArray);
    } catch (error) {
      console.error('급식 정보 로드 실패:', error);
      setMeals([]); // 오류 시 빈 배열로 설정
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
        const dayMeal = Array.isArray(meals) ? meals.find(meal => {
          const mealDate = new Date(meal.date);
          return mealDate.getDate() === current.getDate() &&
                 mealDate.getMonth() === current.getMonth() &&
                 mealDate.getFullYear() === current.getFullYear();
        }) : null;
        
        weekDays.push({
          date: new Date(current),
          meal: dayMeal,
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
    setEditingMeal(null);
    setFormData({ lunch: '', dinner: '' });
  };

  const handleMealClick = (meal) => {
    setEditingMeal(meal);
    setFormData({
      lunch: meal.lunch.join(', '),
      dinner: meal.dinner.join(', ')
    });
    
    // 수정할 급식의 날짜를 selectedDate로 설정
    if (meal.date) {
      const mealDate = meal.date instanceof Date ? meal.date : new Date(meal.date);
      setSelectedDate(mealDate);
    }
    
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // selectedDate가 null인지 확인
      if (!selectedDate) {
        console.error('선택된 날짜가 없습니다.');
        return;
      }
      
      // 로컬 날짜를 사용하여 시간대 변환 문제 방지
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const mealDate = `${year}-${month}-${day}`;
      const lunchItems = formData.lunch.split(',').map(item => item.trim()).filter(item => item);
      const dinnerItems = formData.dinner.split(',').map(item => item.trim()).filter(item => item);
      
      if (editingMeal) {
        // 수정
        await DataService.updateMealData(mealDate, lunchItems, dinnerItems);
      } else {
        // 추가
        await DataService.updateMealData(mealDate, lunchItems, dinnerItems);
      }
      
      setShowForm(false);
      setEditingMeal(null);
      setFormData({ lunch: '', dinner: '' });
      loadMeals();
    } catch (error) {
      console.error('급식 정보 저장 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (mealDate) => {
    if (window.confirm('정말로 이 날의 급식 정보를 삭제하시겠습니까?')) {
      try {
        await DataService.deleteMealData(mealDate);
        loadMeals();
      } catch (error) {
        console.error('급식 정보 삭제 실패:', error);
      }
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
    <div className="admin-meal-calendar">
      <h2 className="meal-calendar-title">급식 목록</h2>
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)}>이전 달</button>
        <h2>{currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}</h2>
        <button onClick={() => navigateMonth(1)}>다음 달</button>
      </div>

      {loading ? (
        <div className="loading-spinner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '10%', margin: '0 auto' }}>
          <div className="spinner"></div>
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
                <div className="day-number">{day.date.getDate()}</div>
                <div className="day-meals">
                  {day.meal ? (
                    <div 
                      className="meal-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMealClick(day.meal);
                      }}
                    >
                      <div className="meal-lunch">
                        <strong>점심:</strong> {day.meal.lunch.slice(0, 2).join(', ')}
                        {day.meal.lunch.length > 2 && '...'}
                      </div>
                      <div className="meal-dinner">
                        <strong>저녁:</strong> {day.meal.dinner.slice(0, 2).join(', ')}
                        {day.meal.dinner.length > 2 && '...'}
                      </div>
                      <button 
                        className="delete-meal-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMeal(day.meal.date);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="no-meal">
                      급식 정보 없음
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      )}

      {showForm && (
        <div className="meal-form-overlay">
          <div className="meal-form">
            <h3>{editingMeal ? '급식 정보 수정' : '급식 정보 추가'}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>점심 메뉴 (쉼표로 구분):</label>
                <textarea
                  value={formData.lunch}
                  onChange={(e) => setFormData(prev => ({ ...prev, lunch: e.target.value }))}
                  placeholder="예: 김치찌개, 불고기, 밥, 김치, 우유"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>저녁 메뉴 (쉼표로 구분):</label>
                <textarea
                  value={formData.dinner}
                  onChange={(e) => setFormData(prev => ({ ...prev, dinner: e.target.value }))}
                  placeholder="예: 된장찌개, 제육볶음, 밥, 김치, 요구르트"
                  rows="3"
                />
              </div>
              
              <div className="form-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? '저장 중...' : (editingMeal ? '수정' : '추가')}
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

export default AdminMealCalendar;
