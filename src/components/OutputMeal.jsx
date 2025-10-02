import { useState, useEffect } from 'react';
import DataService from '../services/DataService';
import './OutputMeal.css';

function OutputMeal({ controlData }) {
  const [mealData, setMealData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const loadMealData = async () => {
      setLoading(true);
      try {
        const daysOffset = controlData?.mealDate || 0;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysOffset);
        
        // 날짜를 YYYY-MM-DD 형식으로 변환
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        const meals = await DataService.getMealData(dateString);
        setMealData(meals);
        setCurrentDate(targetDate);
      } catch (error) {
        console.error('급식 데이터 로드 실패:', error);
        setMealData(null);
      } finally {
        setLoading(false);
      }
    };

    loadMealData();
  }, [controlData?.mealDate]);

  const formatDate = (date) => {
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    
    return {
      month,
      day,
      weekday
    };
  };

  const getDateLabel = (daysOffset) => {
    if (daysOffset === 0) return '오늘의 급식';
    if (daysOffset < 0) return `${Math.abs(daysOffset)}일 전의 급식`;
    return `${daysOffset}일 후의 급식`;
  };

  const dateInfo = formatDate(currentDate);
  const dateLabel = getDateLabel(controlData?.mealDate || 0);

  if (loading) {
    return (
      <div className="output-meal">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>급식 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="output-meal">
      <div className="meal-header">
        <div className="date-section">
          <div className="weekday">{dateInfo.weekday}</div>
          <div className="date-number">{dateInfo.day}</div>
          <div className="month">{dateInfo.month}월</div>
        </div>
        <div className="title-section">
          <h1>{dateLabel}</h1>
        </div>
      </div>

      <div className="meal-content-container">
        <div className="meal-card lunch">
          <div className="meal-header-card">
            <div className="meal-icon">🍽️</div>
            <h2>점심</h2>
          </div>
          <div className="meal-items">
            {mealData?.lunch && mealData.lunch.length > 0 ? (
              <div className="meal-grid">
                <div className="meal-row">
                  <div className="meal-item">
                    <span className="item-text">{mealData.lunch[0] || ''}</span>
                  </div>
                  <div className="meal-item">
                    <span className="item-text">{mealData.lunch[1] || ''}</span>
                  </div>
                </div>
                <div className="meal-row">
                  <div className="meal-item">
                    <span className="item-text">{mealData.lunch[2] || ''}</span>
                  </div>
                  <div className="meal-item">
                    <span className="item-text">{mealData.lunch[3] || ''}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-meal">급식 정보가 없습니다</div>
            )}
          </div>
        </div>

        <div className="meal-card dinner">
          <div className="meal-header-card">
            <div className="meal-icon">🌙</div>
            <h2>저녁</h2>
          </div>
          <div className="meal-items">
            {mealData?.dinner && mealData.dinner.length > 0 ? (
              <div className="meal-grid">
                <div className="meal-row">
                  <div className="meal-item">
                    <span className="item-text">{mealData.dinner[0] || ''}</span>
                  </div>
                  <div className="meal-item">
                    <span className="item-text">{mealData.dinner[1] || ''}</span>
                  </div>
                </div>
                <div className="meal-row">
                  <div className="meal-item">
                    <span className="item-text">{mealData.dinner[2] || ''}</span>
                  </div>
                  <div className="meal-item">
                    <span className="item-text">{mealData.dinner[3] || ''}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-meal">급식 정보가 없습니다</div>
            )}
          </div>
        </div>
      </div>

      <div className="decorative-elements">
        <div className="decoration decoration-1">🍄</div>
        <div className="decoration decoration-2">🥕</div>
        <div className="decoration decoration-3">🥦</div>
        <div className="decoration decoration-4">🌶️</div>
        <div className="decoration decoration-5">🍅</div>
        <div className="decoration decoration-6">🥬</div>
      </div>
    </div>
  );
}

export default OutputMeal;
