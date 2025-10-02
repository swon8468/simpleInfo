import './OutputMeal.css';

function OutputMeal() {
  return (
    <div className="output-meal">
      <h1>급식</h1>
      
      <div className="meal-display">
        <div className="meal-card lunch">
          <h2>점심</h2>
          <div className="meal-content">
            <p>• 김치찌개</p>
            <p>• 불고기</p>
            <p>• 밥</p>
            <p>• 김치</p>
            <p>• 우유</p>
          </div>
        </div>
        
        <div className="meal-card dinner">
          <h2>저녁</h2>
          <div className="meal-content">
            <p>• 된장찌개</p>
            <p>• 제육볶음</p>
            <p>• 밥</p>
            <p>• 나물</p>
            <p>• 과일</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OutputMeal;
