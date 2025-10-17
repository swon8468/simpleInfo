import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import DataService from '../services/DataService';
import './ControlRoadmap.css';

function ControlRoadmap() {
  const navigate = useNavigate();
  const [campusImages, setCampusImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampusImages();
  }, []);

  const loadCampusImages = async () => {
    try {
      const images = await DataService.getCampusLayoutImages();
      setCampusImages(images);
      
      // 첫 번째 이미지를 기본 선택
      if (images.length > 0) {
        setSelectedImageId(images[0].id);
        sendControlData('roadmap', images[0].id);
      }
    } catch (error) {
      console.error('교실 배치 이미지 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMain = async () => {
    await sendControlData('main');
    navigate('/control/main');
  };

  const handleImageSelect = async (imageId) => {
    setSelectedImageId(imageId);
    // 로딩 상태 전송
    await sendControlData('roadmap', imageId, true);
    // 잠시 후 로딩 상태 해제
    setTimeout(async () => {
      await sendControlData('roadmap', imageId, false);
    }, 1000);
  };

  const sendControlData = async (page, imageId = null, isLoading = false) => {
    const controlSessionId = sessionStorage.getItem('controlSessionId');
    
    if (controlSessionId) {
      try {
        await ConnectionDB.sendControlData(controlSessionId, {
          currentPage: page,
          selectedImageId: imageId,
          isLoading: isLoading
        });
      } catch (error) {
        console.error('제어 데이터 전송 실패:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="control-roadmap">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>교실 배치 이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="control-roadmap">
      <h1>교실 배치</h1>
      
      {campusImages.length === 0 ? (
        <div className="no-images-message">
          <h2>업로드된 이미지가 없습니다</h2>
          <p>관리자 페이지에서 교실 배치 이미지를 업로드해주세요.</p>
        </div>
      ) : (
        <div className="image-selection">
          <h2>표시할 층을 선택하세요</h2>
          <div className="floor-buttons-grid">
            {campusImages.map((image) => (
              <button 
                key={image.id} 
                className={`floor-button ${selectedImageId === image.id ? 'selected' : ''}`}
                onClick={() => handleImageSelect(image.id)}
              >
                <div className="button-content">
                  <h3>{image.buildingName || '건물명 없음'}</h3>
                  <p className="floor">{image.floorNumber || '층수 없음'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="main-icon-btn" onClick={handleBackToMain}>
        🏠 메인화면
      </button>
    </div>
  );
}

export default ControlRoadmap;
