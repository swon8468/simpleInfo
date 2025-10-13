import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Visibility, VisibilityOff, Warning, Security } from '@mui/icons-material';
import DataService from '../services/DataService';
import ActivityLogService from '../services/ActivityLogService';
import './AdminAuth.css';

function AdminAuth({ onSuccess }) {
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 관리자 인증 화면 body 색 설정
    document.body.style.background = '#f5f5f5';
    
    // 초기 관리자 생성 (최고 관리자)
    initializeAdmin();
    
    return () => {
      document.body.style.background = '#f5f5f5';
    };
  }, []);

  // 초기 관리자 생성
  const initializeAdmin = async () => {
    try {
      await DataService.createInitialAdmin();
    } catch (error) {
      console.error('초기 관리자 생성 실패:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // DB에서 관리자 조회
      const admin = await DataService.getAdminByCode(adminCode);
      
      if (admin && admin.isActive) {
        console.log('로그인 성공한 관리자 정보:', admin);
        console.log('관리자 권한:', admin.permissions);
        console.log('systemManagement 권한 있음:', admin.permissions?.includes('systemManagement'));
        
        // 세션에 관리자 정보 저장
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminInfo', JSON.stringify({
          id: admin.id,
          name: admin.name,
          adminCode: admin.adminCode,
          permissions: admin.permissions,
          level: admin.level
        }));
        
        // 로그인 로그 기록
        await ActivityLogService.logAdminLogin(admin);
        
        onSuccess(admin);
      } else {
        setError('잘못된 관리자 코드이거나 비활성화된 계정입니다.');
      }
    } catch (error) {
      console.error('관리자 인증 실패:', error);
      setError('인증 중 오류가 발생했습니다.');
    }
    
    setIsLoading(false);
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleAdminCodeChange = (e) => {
    setAdminCode(e.target.value);
    setError(''); // 에러 메시지 초기화
  };

  return (
    <div className="admin-auth-screen">
      <div className="background-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
        <div className="decoration-square square-1"></div>
        <div className="decoration-square square-2"></div>
        <div className="decoration-triangle triangle-1"></div>
        <div className="decoration-triangle triangle-2"></div>
      </div>
      
      <div className="admin-auth-container">
        <div className="admin-auth-card">
          <div className="card-header">
            <div className="admin-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="20" height="14" x="2" y="7" rx="3" ry="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M9 10v-3a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M12 17a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="auth-title">관리자 인증</h1>
            <p className="auth-subtitle">학교 생활 도우미 관리자 페이지 접근</p>
            <div className="security-badge">
              <span className="security-icon"><Lock sx={{ fontSize: 20 }} /></span>
              <span>보안 인증 필요</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="admin-auth-form">
            <div className="password-input-container">
              <label htmlFor="adminCode" className="password-label">
                관리자 코드
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="adminCode"
                  value={adminCode}
                  onChange={handleAdminCodeChange}
                  placeholder="관리자 코드를 입력하세요"
                  className="password-input"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="error-container">
                <span className="error-icon"><Warning sx={{ fontSize: 20 }} /></span>
                <span className="error-message">{error}</span>
              </div>
            )}
            
            <div className="button-group">
              <button 
                type="submit" 
                className={`login-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || !adminCode.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>인증 중...</span>
                  </>
                ) : (
                  <>
                    <span className="login-icon">🔑</span>
                    <span>관리자 로그인</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="auth-footer">
              <button type="button" onClick={handleBackToMain} className="back-link">
                <span className="back-icon">←</span>
                <span>메인화면으로 돌아가기</span>
              </button>
              
              <div className="security-info">
                <span className="security-text">
                  <Security sx={{ fontSize: 16, marginRight: 0.5 }} /> 이 페이지는 관리자 전용입니다
                </span>
              </div>
            </div>
          </form>
        </div>
        
        <div className="auth-pattern">
          <div className="pattern-dot"></div>
          <div className="pattern-dot"></div>
          <div className="pattern-dot"></div>
          <div className="pattern-dot"></div>
          <div className="pattern-dot"></div>
        </div>
      </div>
    </div>
  );
}

export default AdminAuth;