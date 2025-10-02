import './OutputRoadmap.css';

function OutputRoadmap() {
  return (
    <div className="output-roadmap">
      <h1>로드맵</h1>
      
      <div className="roadmap-container">
        <div className="floor-plan">
          <div className="room-grid">
            {/* 1층 */}
            <div className="floor-label">1층</div>
            <div className="rooms-row">
              <div className="room">1-1</div>
              <div className="room">1-2</div>
              <div className="room">1-3</div>
            </div>
            
            {/* 2층 */}
            <div className="floor-label">2층</div>
            <div className="rooms-row">
              <div className="room">2-1</div>
              <div className="room">2-2</div>
              <div className="room">2-3</div>
            </div>
            
            {/* 3층 */}
            <div className="floor-label">3층</div>
            <div className="rooms-row">
              <div className="room">3-1</div>
              <div className="room">3-2</div>
              <div className="room">3-3</div>
            </div>
            
            {/* 특별실들 */}
            <div className="special-rooms">
              <div className="special-room faculty">교무실</div>
              <div className="special-room nurse">보건실</div>
              <div className="special-room library">도서관</div>
              <div className="special-room auditorium">강당</div>
              <div className="special-room cafeteria">급식실</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OutputRoadmap;
