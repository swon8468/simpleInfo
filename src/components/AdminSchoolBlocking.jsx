import { useState, useEffect } from 'react';
import ConnectionDB from '../services/ConnectionDB';
import './AdminSchoolBlocking.css';

function AdminSchoolBlocking() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [blockingStatus, setBlockingStatus] = useState(false);

  useEffect(() => {
    checkBlockingStatus();
    
    // 실시간 차단 상태 모니터링
    const unsubscribe = ConnectionDB.subscribeToSchoolBlockingStatus((isActive) => {
      setBlockingStatus(isActive);
    });
    
    return () => unsubscribe();
  }, []);

  const checkBlockingStatus = async () => {
    try {
      setLoading(true);
      const status = await ConnectionDB.getSchoolBlockingStatus();
      setBlockingStatus(status);
    } catch (error) {
      setMessage('차단 상태 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBlocking = async () => {
    if (!window.confirm('학교 생활 도우미를 차단하시겠습니까?\n모든 사용자가 차단 화면을 보게 됩니다.')) {
      return;
    }

    setLoading(true);
    try {
      await ConnectionDB.setSchoolBlockingStatus(true);
      // 모든 연결된 디바이스에 차단 알림 전송
      await ConnectionDB.notifyBlockingStatus(true);
      setMessage('학교 생활 도우미가 차단되었습니다. 모든 디바이스에 즉시 적용됩니다.');
      setBlockingStatus(true);
    } catch (error) {
      setMessage('차단 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableBlocking = async () => {
    if (!window.confirm('학교 생활 도우미 차단을 해제하시겠습니까?\n모든 사용자가 정상적으로 사이트에 접근할 수 있게 됩니다.')) {
      return;
    }

    setLoading(true);
    try {
      await ConnectionDB.setSchoolBlockingStatus(false);
      // 모든 연결된 디바이스에 차단 해제 알림 전송
      await ConnectionDB.notifyBlockingStatus(false);
      setMessage('학교 생활 도우미 차단이 해제되었습니다. 모든 디바이스가 정상 작동합니다.');
      setBlockingStatus(false);
    } catch (error) {
      setMessage('차단 해제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-school-blocking">
      <div className="blocking-header">
        <h2>🏫 학교 생활 도우미 차단 관리</h2>
        <p>시스템 점검이나 긴급상황 시 학교 생활 도우미를 일시적으로 차단할 수 있습니다.</p>
      </div>

      {/* 상태 표시 */}
      <div className="status-section">
        <div className={`status-indicator ${blockingStatus ? 'blocked' : 'active'}`}>
          <span className="status-icon">
            {blockingStatus ? '🚫' : '✅'}
          </span>
          <span className="status-text">
            {blockingStatus ? '차단됨 (사용자 접근 불가)' : '정상 운영 중'}
          </span>
        </div>
      </div>

      {/* 차단 제어 버튼 */}
      <div className="control-section">
        <div className="control-buttons">
          {!blockingStatus ? (
            <button 
              className="block-btn"
              onClick={handleEnableBlocking}
              disabled={loading}
            >
              <span className="btn-icon">🚫</span>
              <span className="btn-text">차단 시작</span>
            </button>
          ) : (
            <button 
              className="unblock-btn"
              onClick={handleDisableBlocking}
              disabled={loading}
            >
              <span className="btn-icon">✅</span>
              <span className="btn-text">차단 해제</span>
            </button>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="info-section">
        <div className="info-card">
          <h3>📋 차단 기능 안내</h3>
          <ul className="info-list">
            <li>
              <strong>차단 시작:</strong> 모든 사용자가 차단 화면을 보게 됩니다.
            </li>
            <li>
              <strong>관리자 페이지:</strong> 차단 중에도 관리자 페이지는 정상 접근 가능합니다.
            </li>
            <li>
              <strong>실시간 반영:</strong> 차단 상태 변경이 즉시 반영됩니다.
            </li>
            <li>
              <strong>차단 화면:</strong> 시스템 점검 메시지와 함께 안내 화면을 표시합니다.
            </li>
          </ul>
        </div>

        <div className="warning-card">
          <h3>⚠️ 주의사항</h3>
          <ul className="warning-list">
            <li>차단 시 모든 학생과 교사가 서비스를 이용할 수 없습니다.</li>
            <li>긴급 상황이나 시스템 점검 시에만 사용하세요.</li>
            <li>차단 해제 후에도 기존 연결은 정상적으로 유지됩니다.</li>
          </ul>
        </div>
      </div>

      {/* 상태 확인 버튼 */}
      <div className="refresh-section">
        <button 
          className="refresh-btn"
          onClick={checkBlockingStatus}
          disabled={loading}
        >
          <span className="btn-icon">🔄</span>
          <span className="btn-text">상태 새로고침</span>
        </button>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`message ${message.includes('실패') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default AdminSchoolBlocking;
