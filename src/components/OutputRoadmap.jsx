import { useState, useEffect } from 'react';
import DataService from '../services/DataService';
import ConnectionDB from '../services/ConnectionDB';
import './OutputRoadmap.css';

function OutputRoadmap() {
  const [campusImages, setCampusImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCampusImages();
    setupImageListener();
  }, []);

  const loadCampusImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('출력용: 교내 배치 이미지 로드 시작');
      const images = await DataService.getCampusLayoutImages();
      console.log('출력용: 로드된 이미지 개수:', images.length);
      console.log('출력용: 로드된 이미지 데이터:', images);
      
      setCampusImages(images);
      
      // 첫 번째 이미지를 기본 선택
      if (images.length > 0) {
        console.log('출력용: 첫 번째 이미지 기본 선택:', images[0]);
        setSelectedImage(images[0]);
      }
    } catch (error) {
      console.error('출력용: 교내 배치 이미지 로드 실패:', error);
      setError('이미지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const setupImageListener = () => {
    const sessionId = sessionStorage.getItem('outputSessionId');
    console.log('출력용: 세션 스토리지에서 출력 세션 ID 확인:', sessionId);
    
    if (!sessionId) {
      console.error('출력용: 출력 세션 ID가 없음');
      return;
    }

    console.log('출력용: Firebase 리스너 설정 시작:', sessionId);
    
    const unsubscribe = ConnectionDB.listenToControlData(sessionId, (data) => {
      console.log('출력용: Firebase에서 제어 데이터 수신:', data);
      console.log('출력용: 현재 campusImages 개수:', campusImages.length);
      
      if (data.currentPage === 'roadmap' && data.selectedImageId) {
        console.log('출력용: roadmap 페이지 데이터 수신, 선택된 이미지 ID:', data.selectedImageId);
        
        // 이미지 로딩 시작
        setImageLoading(true);
        
        // campusImages에서 해당 이미지 찾기
        const image = campusImages.find(img => img.id === data.selectedImageId);
        console.log('출력용: campusImages에서 찾은 이미지:', image);
        
        if (image) {
          console.log('출력용: 이미지 찾음, 상태 업데이트:', image);
          setSelectedImage({
            id: image.id,
            imageURL: image.imageURL,
            buildingName: image.buildingName,
            floorNumber: image.floorNumber,
            description: image.description
          });
        } else {
          console.log('출력용: campusImages에서 이미지를 찾을 수 없음, 직접 전송된 데이터 사용');
          // 직접 전송된 데이터 사용
          if (data.imageURL) {
            console.log('출력용: 직접 전송된 이미지 데이터로 상태 업데이트:', data);
            setSelectedImage({
              id: data.selectedImageId,
              imageURL: data.imageURL,
              buildingName: data.buildingName,
              floorNumber: data.floorNumber,
              description: data.description
            });
          } else {
            console.error('출력용: 이미지 URL이 없음');
            setImageLoading(false);
          }
        }
      } else {
        console.log('출력용: roadmap 페이지가 아니거나 selectedImageId가 없음');
      }
    });

    return unsubscribe;
  };

  // campusImages가 업데이트되면 리스너 재설정
  useEffect(() => {
    if (campusImages.length > 0) {
      const unsubscribe = setupImageListener();
      return unsubscribe;
    }
  }, [campusImages]);

  if (loading) {
    return (
      <div className="output-roadmap">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>교내 배치 이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="output-roadmap">
        <div className="error-container">
          <h2>오류 발생</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (campusImages.length === 0) {
    return (
      <div className="output-roadmap">
        <h1>교내 배치</h1>
        <div className="no-campus-image">
          <h3>업로드된 이미지가 없습니다</h3>
          <p>관리자 페이지에서 교내 배치 이미지를 업로드해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="output-roadmap">
      <h1>교내 배치</h1>
      
      {selectedImage ? (
        <div className="campus-image-container">
          {imageLoading && (
            <div className="loading-container" style={{ position: 'absolute', zIndex: 10 }}>
              <div className="loading-spinner"></div>
              <p>이미지를 불러오는 중...</p>
            </div>
          )}
          <img 
            src={selectedImage.imageURL} 
            alt={`${selectedImage.buildingName} ${selectedImage.floorNumber}`}
            className="campus-image"
            onError={(e) => {
              console.error('출력용: 이미지 로드 실패:', selectedImage.imageURL);
              e.target.style.display = 'none';
              setImageLoading(false);
            }}
            onLoad={() => {
              console.log('출력용: 이미지 로드 성공:', selectedImage.imageURL);
              setImageLoading(false);
            }}
          />
          <div className="image-info">
            <h3>{selectedImage.buildingName} {selectedImage.floorNumber}</h3>
            {selectedImage.description && (
              <p className="description">{selectedImage.description}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="no-campus-image">
          <h3>준비 중</h3>
          <p>제어용 디바이스에서 층을 선택해주세요.</p>
        </div>
      )}
    </div>
  );
}

export default OutputRoadmap;