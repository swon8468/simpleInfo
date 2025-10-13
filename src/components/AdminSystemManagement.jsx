import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Settings, Security, History, Warning, CheckCircle, Error } from '@mui/icons-material';
import './AdminSystemManagement.css';

function AdminSystemManagement({ currentAdmin }) {
  const [pinCode, setPinCode] = useState('040507');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    loadPinCode();
    loadActivityLogs();
  }, []);

  const loadPinCode = async () => {
    try {
      const pinDoc = await getDoc(doc(db, 'system', 'pinCode'));
      if (pinDoc.exists()) {
        setPinCode(pinDoc.data().code || '040507');
      }
    } catch (error) {
      showMessage('PIN 코드 로드 실패', 'error');
    }
  };

  const loadActivityLogs = async () => {
    try {
      const logsRef = collection(db, 'systemLogs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      
      setActivityLogs(logs);
    } catch (error) {
      showMessage('활동 로그 로드 실패', 'error');
    }
  };

  const logActivity = async (action, level, details) => {
    try {
      const logData = {
        timestamp: new Date(),
        adminId: currentAdmin?.adminCode || 'unknown',
        adminName: currentAdmin?.name || 'unknown',
        action,
        level, // 'major', 'medium', 'minor'
        details,
        ip: 'admin-panel' // 실제 환경에서는 IP 주소를 가져와야 함
      };

      await addDoc(collection(db, 'systemLogs'), logData);
      
      // 로그 목록 새로고침
      loadActivityLogs();
    } catch (error) {
      console.error('활동 로그 작성 실패:', error);
    }
  };

  const handlePinCodeUpdate = async () => {
    if (!pinCode || pinCode.length < 4) {
      showMessage('PIN 코드는 최소 4자리 이상이어야 합니다', 'error');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'system', 'pinCode'), {
        code: pinCode,
        updatedAt: new Date(),
        updatedBy: currentAdmin?.adminCode || 'unknown'
      });

      await logActivity(
        'PIN 코드 변경',
        'major',
        `PIN 코드가 ${pinCode}로 변경됨`
      );

      showMessage('PIN 코드가 성공적으로 업데이트되었습니다', 'success');
    } catch (error) {
      showMessage('PIN 코드 업데이트 실패', 'error');
      await logActivity(
        'PIN 코드 변경 실패',
        'medium',
        `오류: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestPinCode = async () => {
    try {
      await logActivity(
        'PIN 코드 테스트',
        'minor',
        `PIN 코드 ${pinCode} 테스트 실행`
      );
      showMessage('PIN 코드 테스트가 완료되었습니다', 'success');
    } catch (error) {
      showMessage('PIN 코드 테스트 실패', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'major':
        return <Error sx={{ fontSize: 16, color: '#d32f2f' }} />;
      case 'medium':
        return <Warning sx={{ fontSize: 16, color: '#ed6c02' }} />;
      case 'minor':
        return <CheckCircle sx={{ fontSize: 16, color: '#2e7d32' }} />;
      default:
        return <History sx={{ fontSize: 16 }} />;
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'major':
        return '대';
      case 'medium':
        return '중';
      case 'minor':
        return '소';
      default:
        return '알 수 없음';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className="admin-system-management">
      <div className="system-header">
        <Settings sx={{ fontSize: 24, marginRight: 1 }} />
        <h2>시스템 관리</h2>
        <div className="admin-info">
          <Security sx={{ fontSize: 16, marginRight: 0.5 }} />
          <span>최고 관리자 전용</span>
        </div>
      </div>

      <div className="system-content">
        {/* PIN 코드 관리 */}
        <div className="pin-management-section">
          <h3>연결 해제 PIN 코드 관리</h3>
          <div className="pin-form">
            <div className="form-group">
              <label htmlFor="pinCode">PIN 코드</label>
              <div className="pin-input-container">
                <input
                  type="text"
                  id="pinCode"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="PIN 코드를 입력하세요"
                  maxLength={10}
                />
                <button 
                  className="test-btn"
                  onClick={handleTestPinCode}
                  disabled={loading}
                >
                  테스트
                </button>
              </div>
              <small className="form-help">
                제어용과 출력용 디바이스 연결 해제 시 사용되는 PIN 코드입니다.
              </small>
            </div>
            
            <button 
              className="update-btn"
              onClick={handlePinCodeUpdate}
              disabled={loading || !pinCode}
            >
              {loading ? '업데이트 중...' : 'PIN 코드 업데이트'}
            </button>
          </div>
        </div>

        {/* 활동 로그 */}
        <div className="activity-logs-section">
          <h3>시스템 활동 로그</h3>
          <div className="logs-container">
            {activityLogs.length === 0 ? (
              <div className="no-logs">
                <History sx={{ fontSize: 48, color: '#ccc' }} />
                <p>활동 로그가 없습니다</p>
              </div>
            ) : (
              <div className="logs-list">
                {activityLogs.map((log) => (
                  <div key={log.id} className={`log-item ${log.level}`}>
                    <div className="log-header">
                      <div className="log-level">
                        {getLevelIcon(log.level)}
                        <span className="level-text">{getLevelText(log.level)}</span>
                      </div>
                      <div className="log-timestamp">
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                    <div className="log-content">
                      <div className="log-action">{log.action}</div>
                      <div className="log-details">{log.details}</div>
                      <div className="log-admin">
                        관리자: {log.adminName} ({log.adminId})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`message ${messageType}`}>
          {messageType === 'success' ? (
            <CheckCircle sx={{ fontSize: 20, marginRight: 1 }} />
          ) : (
            <Error sx={{ fontSize: 20, marginRight: 1 }} />
          )}
          {message}
        </div>
      )}
    </div>
  );
}

export default AdminSystemManagement;
