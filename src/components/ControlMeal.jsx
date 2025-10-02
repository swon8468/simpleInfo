import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import DataService from '../services/DataService';
import './ControlMeal.css';

function ControlMeal() {
  const navigate = useNavigate();
  const [mealDate, setMealDate] = useState(0); // 0 = 오늘, -1 = 어제, 1 = 내일
  const [allergyInfo, setAllergyInfo] = useState([]);

  useEffect(() => {
    loadAllergyInfo();
  }, []);

  const loadAllergyInfo = async () => {
    try {
      console.log('ControlMeal: 알레르기 정보 로드 시작');
      const allergyData = await DataService.getAllergyInfo();
      console.log('ControlMeal: 가져온 알레르기 데이터:', allergyData);
      setAllergyInfo(allergyData || []);
      console.log('ControlMeal: 알레르기 정보 설정 완료, 길이:', (allergyData || []).length);
    } catch (error) {
      console.error('알레르기 정보 로드 실패:', error);
    }
  };

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

  const handleDateChange = async (days) => {
    setMealDate(days);
    await sendMealDataWithDate(days);
  };

  const sendMealDataWithDate = async (days) => {
    const controlSessionId = sessionStorage.getItem('controlSessionId');
    
    
    if (controlSessionId) {
      try {
        const data = {
          currentPage: 'meal',
          mealDate: days
        };
        
        await ConnectionDB.sendControlData(controlSessionId, data);
      } catch (error) {
        console.error('제어 데이터 전송 실패:', error);
      }
    } else {
      console.error('ControlMeal: 제어 세션 ID가 없습니다.');
    }
  };

  const getDateLabel = (days) => {
    if (days === 0) return '오늘';
    if (days === -1) return '어제';
    if (days === 1) return '내일';
    if (days === 2) return '3일 후'; // 내일 다음은 3일 후
    if (days === 3) return '4일 후';
    if (days < 0) return `${Math.abs(days)}일 전`;
    return `${days}일 후`;
  };

  return (
    <div className="control-meal">
      <div className="project-header">
        <h1>학교생활도우미</h1>
      </div>
      
      <h2>급식</h2>
      
      <div className="meal-navigation">
        <button className="meal-btn" onClick={() => handleDateChange(mealDate - 1)}>
          {getDateLabel(mealDate - 1)}
        </button>
        <div className="current-date">
          현재: {getDateLabel(mealDate)}
        </div>
        <button className="meal-btn" onClick={() => handleDateChange(mealDate + 1)}>
          {getDateLabel(mealDate + 1)}
        </button>
      </div>

      <div className="today-button-section">
        <button className="today-btn" onClick={() => handleDateChange(0)}>
          오늘로 이동
        </button>
      </div>

      <div className="allergy-info">
        <h3>알레르기 정보</h3>
        <div className="allergy-table">
          {allergyInfo.length > 0 ? (
            <table>
              <tbody>
                {Array.from({ length: 6 }, (_, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: 4 }, (_, colIndex) => {
                      const itemIndex = rowIndex * 4 + colIndex;
                      const item = allergyInfo[itemIndex];
                      return (
                        <td key={colIndex} className="allergy-cell">
                          {item ? `${itemIndex + 1}. ${item}` : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-allergy-data">
              등록된 알레르기 정보가 없습니다.
            </div>
          )}
        </div>
      </div>

      <button className="main-icon-btn" onClick={handleBackToMain}>
        🏠 메인화면
      </button>
    </div>
  );
}

export default ControlMeal;
