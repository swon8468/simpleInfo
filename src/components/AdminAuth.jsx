import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAuth.css';

function AdminAuth({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const ADMIN_PASSWORD = 'swon8468';

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

  return (
    <div className="admin-auth">
      <div className="auth-container">
        <div className="auth-header">
          <div className="admin-icon">🔒</div>
          <h1>관리자 인증</h1>
          <p>관리자 페이지에 접근하려면 비밀번호를 입력하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="관리자 비밀번호를 입력하세요"
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="auth-buttons">
            <button type="submit" disabled={isLoading} className="login-btn">
              {isLoading ? '확인 중...' : '로그인'}
            </button>
            <button type="button" onClick={handleBackToMain} className="back-btn">
              메인 화면으로
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminAuth;
