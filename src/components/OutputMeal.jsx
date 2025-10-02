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

  const session = (controlData?.mealSession === 'dinner') ? 'dinner' : 'lunch';
  const titleText = session === 'lunch' ? '점심' : '저녁';
  const items = Array.isArray(mealData?.[session]) ? mealData[session] : [];

  return (
    <div className="output-meal">
      <div className="meal-poster">
        <div className="poster-title">{titleText}</div>
        <div className="poster-grid">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div key={index} className="poster-item">
                {item}
              </div>
            ))
          ) : (
            <div className="no-meal">급식 정보가 없습니다</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OutputMeal;
