import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Error as ErrorIcon, Home } from '@mui/icons-material';
import './NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.background = '#f5f5f5';
  }, []);

  return (
    <div className="notfound-page">
      <div className="background-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
      <div className="notfound-card">
        <div className="notfound-icon">
          <ErrorIcon sx={{ fontSize: 64, color: '#d32f2f' }} />
        </div>
        <h2>페이지를 찾을 수 없습니다</h2>
        <p>요청하신 주소가 올바르지 않거나, 이동되었을 수 있어요.</p>
        <button className="notfound-home-btn" onClick={() => navigate('/')}> 
          <Home sx={{ fontSize: 20, marginRight: 6 }} /> 메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default NotFound;


