import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import { School, Build, Rocket, AccessTime } from '@mui/icons-material';
import './SchoolBlockingScreen.css';

function SchoolBlockingScreen() {
  const [blockingActive, setBlockingActive] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // 현재 경로 기준으로 차단 화면 표시 여부 결정
    const params = new URLSearchParams(location.search);
    const adminMode = params.get('admin') === 'true';
    if (adminMode) {
      // 관리자 페이지에서는 차단 화면을 표시하지 않음
      setBlockingActive(false);
      return;
    }

    // 학교 생활 도우미 차단 상태 확인 및 구독
    let unsubscribe = () => {};
    const run = async () => {
      await checkSchoolBlockingStatus();
      unsubscribe = ConnectionDB.subscribeToSchoolBlockingStatus((isActive) => {
        setBlockingActive(isActive);
      });
    };
    run();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [location.pathname]);

  const checkSchoolBlockingStatus = async () => {
    try {
      // Firebase에서 차단 상태 확인
      const blockingStatus = await ConnectionDB.getSchoolBlockingStatus();
      setBlockingActive(blockingStatus);
    } catch (error) {
      console.error('차단 상태 확인 실패:', error);
    }
  };


  // 차단이 활성화된 경우 차단 화면 표시
  if (blockingActive) {
    return (
      <div className="school-blocking-screen">
        <div className="blocking-container">
          <div className="blocking-icon">
            <School sx={{ fontSize: 80 }} />
          </div>
          <h1 className="blocking-title">학교 생활 도우미 일시 중단</h1>
          <p className="blocking-message">
            현재 시스템 점검 및 업데이트 작업으로 인하여<br />
            학교 생활 도우미 서비스가 일시적으로 중단됩니다.
          </p>
          <div className="blocking-details">
            <div className="detail-item">
              <span className="detail-icon"><Build sx={{ fontSize: 24 }} /></span>
              <span>시스템 점검 및 업그레이드</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon"><Rocket sx={{ fontSize: 24 }} /></span>
              <span>더 나은 서비스를 위한 준비</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon"><AccessTime sx={{ fontSize: 24 }} /></span>
              <span>곧 다시 만나요!</span>
            </div>
           </div>
          <div className="blocking-footer">
            <p>감사합니다.</p>
            <p className="contact-info">
              문의사항이 있으시면 관리자에게 연락바랍니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 차단이 비활성화된 경우 null 반환 (정상 페이지 표시)
  return null;
}

export default SchoolBlockingScreen;
