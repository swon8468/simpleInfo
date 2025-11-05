import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataService from '../services/DataService';
import ConnectionDB from '../services/ConnectionDB';
import './ControlRoadmap.css';

function ControlRoadmap() {
  const navigate = useNavigate();
  const [campusImages, setCampusImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCampusImages();
  }, []);

  const loadCampusImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('제어용: 교내 배치 이미지 로드 시작');
      const images = await DataService.getCampusLayoutImages();
      console.log('제어용: 로드된 이미지 개수:', images.length);
      console.log('제어용: 로드된 이미지 데이터:', images);
      
      setCampusImages(images);
      
      // 첫 번째 이미지를 기본 선택하고 즉시 전송
      if (images.length > 0) {
        const firstImage = images[0];
        console.log('제어용: 첫 번째 이미지 선택:', firstImage);
        setSelectedImageId(firstImage.id);
        await sendImageToOutput(firstImage);
      }
    } catch (error) {
      console.error('제어용: 교내 배치 이미지 로드 실패:', error);
      setError('이미지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (imageId) => {
    try {
      console.log('제어용: 이미지 선택:', imageId);
      
      const selectedImage = campusImages.find(img => img.id === imageId);
      if (!selectedImage) {
        console.error('제어용: 선택된 이미지를 찾을 수 없음:', imageId);
        return;
      }

      setSelectedImageId(imageId);
      await sendImageToOutput(selectedImage);
    } catch (error) {
      console.error('제어용: 이미지 선택 실패:', error);
    }
  };

  const sendImageToOutput = async (image) => {
    try {
      console.log('제어용: 출력용으로 이미지 전송:', image);
      
      // 세션 스토리지에서 제어 세션 ID 가져오기
      const controlSessionId = sessionStorage.getItem('controlSessionId');
      if (!controlSessionId) {
        console.error('제어용: 제어 세션 ID가 없음');
        return;
      }

      // Firebase를 통한 데이터 전송
      const imageData = {
        currentPage: 'roadmap',
        selectedImageId: image.id,
        imageURL: image.imageURL,
        buildingName: image.buildingName || '건물명 없음',
        floorNumber: image.floorNumber || '층수 없음',
        description: image.description || '',
        timestamp: Date.now()
      };

      await ConnectionDB.sendControlData(controlSessionId, imageData);
      console.log('제어용: Firebase를 통한 이미지 데이터 전송 완료:', imageData);
    } catch (error) {
      console.error('제어용: 이미지 전송 실패:', error);
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

  if (loading) {
    return (
      <div className="control-roadmap">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>교내 배치 이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="control-roadmap">
        <div className="error-container">
          <h2>오류 발생</h2>
          <p>{error}</p>
          <button onClick={loadCampusImages} className="retry-btn">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (campusImages.length === 0) {
    return (
      <div className="control-roadmap">
        <h1>교내 배치</h1>
        <div className="no-images-message">
          <h2>업로드된 이미지가 없습니다</h2>
          <p>관리자 페이지에서 교내 배치 이미지를 업로드해주세요.</p>
        </div>
        <button className="main-icon-btn" onClick={handleBackToMain}>
          🏠 메인화면
        </button>
      </div>
    );
  }

  return (
    <div className="control-roadmap">
      <h1>교내 배치</h1>
      
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
                {image.description && (
                  <p className="description">{image.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className="main-icon-btn" onClick={handleBackToMain}>
        🏠 메인화면
      </button>
    </div>
  );
}

export default ControlRoadmap;