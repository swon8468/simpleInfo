import { useState, useRef } from 'react';
import DataService from '../services/DataService';
import './AdminPhotoGallery.css';

function AdminPhotoGallery({ photos, onAdd, onDelete, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target: [],
    eventDate: '',
    imageFile: null,
    imagePreview: null
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const targetArray = formData.target.includes(value) 
        ? formData.target.filter(item => item !== value)
        : [...formData.target, value];
      setFormData(prev => ({ ...prev, target: targetArray }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        alert('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.imageFile) {
      alert('사진을 선택해주세요.');
      return;
    }
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('간단 설명을 입력해주세요.');
      return;
    }
    
    if (!formData.eventDate) {
      alert('행사일을 선택해주세요.');
      return;
    }
    
    if (formData.target.length === 0) {
      alert('대상을 최소 하나 선택해주세요.');
      return;
    }

    if (photos.length >= 100) {
      alert('최대 100장까지만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    try {
      // 이미지 업로드
      const uploadResult = await DataService.uploadPhotoGalleryImage(formData.imageFile);
      
      // 사진 데이터 생성
      const photoData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        target: formData.target,
        eventDate: new Date(formData.eventDate),
        imageURL: uploadResult.imageURL,
        fileName: uploadResult.fileName
      };
      
      await onAdd(photoData);
      
      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        target: [],
        eventDate: '',
        imageFile: null,
        imagePreview: null
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      alert('사진 업로드에 실패했습니다: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (date) => {
    if (date && date.toDate) {
      return date.toDate().toLocaleDateString('ko-KR');
    } else if (date) {
      return new Date(date).toLocaleDateString('ko-KR');
    }
    return '';
  };

  return (
    <div className="admin-photo-gallery">
      <div className="photo-gallery-header">
        <h2>우리 학교 사진관</h2>
        <p className="photo-count">현재 사진: {photos.length}장 / 최대 100장</p>
      </div>

      {/* 사진 추가 폼 */}
      <div className="photo-add-form">
        <h3>새 사진 추가</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="imageFile">사진 *</label>
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                required
              />
              {formData.imagePreview && (
                <div className="image-preview">
                  <img src={formData.imagePreview} alt="미리보기" />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="title">제목 *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="사진 제목을 입력하세요"
                maxLength={50}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">간단 설명 * (최대 50자)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="사진에 대한 간단한 설명을 입력하세요"
                maxLength={50}
                rows={3}
                required
              />
              <div className="char-count">{formData.description.length}/50</div>
            </div>
            
            <div className="form-group">
              <label htmlFor="eventDate">행사일 *</label>
              <input
                type="date"
                id="eventDate"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>대상 * (중복 선택 가능)</label>
            <div className="target-checkboxes">
              {['1학년', '2학년', '3학년'].map(grade => (
                <label key={grade} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={grade}
                    checked={formData.target.includes(grade)}
                    onChange={handleInputChange}
                  />
                  {grade}
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={uploading || loading || photos.length >= 100}
          >
            {uploading ? '업로드 중...' : '사진 추가'}
          </button>
        </form>
      </div>

      {/* 사진 목록 */}
      <div className="photo-list">
        <h3>등록된 사진</h3>
        {photos.length === 0 ? (
          <p className="no-photos">등록된 사진이 없습니다.</p>
        ) : (
          <div className="photos-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="photo-item">
                <div className="photo-image">
                  <img src={photo.imageURL} alt={photo.title} />
                </div>
                <div className="photo-info">
                  <h4>{photo.title}</h4>
                  <p className="photo-description">{photo.description}</p>
                  <p className="photo-date">{formatDate(photo.eventDate)}</p>
                  <div className="photo-target">
                    대상: {photo.target.join(', ')}
                  </div>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => onDelete(photo.id)}
                  disabled={loading}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPhotoGallery;


