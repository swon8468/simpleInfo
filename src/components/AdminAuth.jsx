import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAuth.css';

function AdminAuth({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const ADMIN_PASSWORD = 'swon8468';

  useEffect(() => {
    // 관리자 인증 화면 body 색 설정
    document.body.style.background = '#f5f5f5';
    
    return () => {
      document.body.style.background = '#f5f5f5';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 비밀번호 확인
    if (password === ADMIN_PASSWORD) {
      // 세션에 인증 상태 저장
      sessionStorage.setItem('adminAuthenticated', 'true');
      onSuccess();
    } else {
      setError('잘못된 비밀번호입니다.');
    }
    
    setIsLoading(false);
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
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
              <span className="security-icon">🔒</span>
              <span>보안 인증 필요</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="admin-auth-form">
            <div className="password-input-container">
              <label htmlFor="password" className="password-label">
                관리자 비밀번호
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="비밀번호를 입력하세요"
                  className="password-input"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="error-container">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
              </div>
            )}
            
            <div className="button-group">
              <button 
                type="submit" 
                className={`login-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || !password.trim()}
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
                  🛡️ 이 페이지는 관리자 전용입니다
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