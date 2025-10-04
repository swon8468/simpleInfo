import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>관리자 패널</h1>
      <p>관리자 패널이 정상적으로 로드되었습니다.</p>
      <button 
        onClick={() => {
          sessionStorage.removeItem('adminAuthenticated');
          setIsAuthenticated(false);
        }}
        style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        로그아웃
      </button>
    </div>
  );
}

export default AdminPanel;
