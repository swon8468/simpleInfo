import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Build, CheckCircle, Logout, Refresh } from '@mui/icons-material';
import AdminAuth from './AdminAuth';

function AdminPanel() {
  console.log('AdminPanel 디버그 버전 렌더링');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AdminPanel useEffect 실행');
    const savedAuth = sessionStorage.getItem('adminAuthenticated');
    console.log('저장된 인증 상태:', savedAuth);
    
    if (savedAuth === 'true') {
      console.log('관리자 인증됨');
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    console.log('인증 성공 처리');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    console.log('인증되지 않음, AdminAuth 표시');
    return <AdminAuth onSuccess={handleAuthSuccess} />;
  }

  console.log('관리자 패널 표시');
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      position: 'relative',
      zIndex: 9999
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}><Build sx={{ fontSize: 24, marginRight: 1 }} /> 관리자 패널</h1>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2><CheckCircle sx={{ fontSize: 20, marginRight: 1 }} /> 관리자 패널이 정상적으로 로드되었습니다!</h2>
        <p>문제가 해결되었습니다.</p>
        <div style={{ margin: '20px 0' }}>
          <strong>현재 URL:</strong> {window.location.href}<br/>
          <strong>경로:</strong> {window.location.pathname}<br/>
          <strong>시간:</strong> {new Date().toLocaleString()}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => {
            sessionStorage.removeItem('adminAuthenticated');
            setIsAuthenticated(false);
            console.log('로그아웃됨');
          }}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <Logout sx={{ fontSize: 16, marginRight: 0.5 }} /> 로그아웃
        </button>
        
        <button 
          onClick={() => {
            console.log('새로고침');
            window.location.reload();
          }}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <Refresh sx={{ fontSize: 16, marginRight: 0.5 }} /> 새로고침
        </button>
      </div>
    </div>
  );
}

export default AdminPanel;
