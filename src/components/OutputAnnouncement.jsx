import './OutputAnnouncement.css';

function OutputAnnouncement() {
  return (
    <div className="output-announcement">
      <h1>공지사항</h1>
      
      <div className="announcement-content">
        <div className="announcement-item">
          <h3>중간고사 일정 안내</h3>
          <p>10월 15일부터 10월 19일까지 중간고사가 진행됩니다.</p>
          <span className="date">2024.10.01</span>
        </div>
        
        <div className="announcement-item">
          <h3>체험학습 신청 안내</h3>
          <p>10월 20일 체험학습 신청을 받습니다. 신청서는 담임선생님께 제출해주세요.</p>
          <span className="date">2024.09.28</span>
        </div>
        
        <div className="announcement-item">
          <h3>건강검진 일정</h3>
          <p>10월 25일 전교생 건강검진이 예정되어 있습니다.</p>
          <span className="date">2024.09.25</span>
        </div>
      </div>
      
      <div className="location-icon">📍</div>
    </div>
  );
}

export default OutputAnnouncement;
