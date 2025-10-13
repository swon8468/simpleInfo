import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Settings, Security, History, Warning, CheckCircle, Error, Refresh, FilterList, Search } from '@mui/icons-material';
import ActivityLogService from '../services/ActivityLogService';
import './AdminSystemManagement.css';

function AdminSystemManagement({ currentAdmin }) {
  const [pinCode, setPinCode] = useState('040507');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsCount, setLogsCount] = useState(100);

  useEffect(() => {
    loadPinCode();
    loadActivityLogs();
    
    // 실시간 로그 구독
    const unsubscribe = ActivityLogService.subscribeToActivityLogs((logs) => {
      setActivityLogs(logs);
      applyFilters(logs);
    }, logsCount);

    return () => {
      unsubscribe();
    };
  }, [logsCount]);

  // 필터 적용
  useEffect(() => {
    applyFilters(activityLogs);
  }, [searchTerm, levelFilter, activityLogs]);

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
      setLogsLoading(true);
      const logs = await ActivityLogService.getActivityLogs(logsCount);
      setActivityLogs(logs);
      applyFilters(logs);
    } catch (error) {
      showMessage('활동 로그 로드 실패', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  // 필터 적용 함수
  const applyFilters = (logs) => {
    let filtered = [...logs];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.adminId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 레벨 필터
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    setFilteredLogs(filtered);
  };

  // 로그 새로고침
  const refreshLogs = () => {
    loadActivityLogs();
  };

  const logActivity = async (action, level, details) => {
    try {
      await ActivityLogService.logActivity(action, level, details, currentAdmin);
    } catch (error) {
      console.error('활동 로그 작성 실패:', error);
    }
  };

  const handlePinCodeUpdate = async () => {
    if (!pinCode || pinCode.length !== 6) {
      showMessage('PIN 코드는 정확히 6자리 숫자여야 합니다', 'error');
      return;
    }
    
    if (!/^\d{6}$/.test(pinCode)) {
      showMessage('PIN 코드는 숫자만 입력 가능합니다', 'error');
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
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                    if (value.length <= 6) {
                      setPinCode(value);
                    }
                  }}
                  placeholder="6자리 숫자를 입력하세요"
                  maxLength={6}
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
                제어용과 출력용 디바이스 연결 해제 시 사용되는 PIN 코드입니다. (6자리 숫자)
              </small>
            </div>
            
            <button 
              className="update-btn"
              onClick={handlePinCodeUpdate}
              disabled={loading || !pinCode || pinCode.length !== 6}
            >
              {loading ? '업데이트 중...' : 'PIN 코드 업데이트'}
            </button>
          </div>
        </div>

        {/* 활동 로그 */}
        <div className="activity-logs-section">
          <div className="logs-header">
            <h3>시스템 활동 로그</h3>
            <div className="logs-controls">
              <div className="search-container">
                <Search sx={{ fontSize: 20, marginRight: 0.5 }} />
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="level-filter"
              >
                <option value="all">모든 레벨</option>
                <option value="major">대</option>
                <option value="medium">중</option>
                <option value="minor">소</option>
              </select>
              <select
                value={logsCount}
                onChange={(e) => setLogsCount(Number(e.target.value))}
                className="logs-count-select"
              >
                <option value={50}>50개</option>
                <option value={100}>100개</option>
                <option value={200}>200개</option>
                <option value={500}>500개</option>
              </select>
              <button 
                className="refresh-btn"
                onClick={refreshLogs}
                disabled={logsLoading}
              >
                <Refresh sx={{ fontSize: 20 }} />
                새로고침
              </button>
            </div>
          </div>
          
          <div className="logs-stats">
            <div className="stat-item">
              <span className="stat-label">전체 로그:</span>
              <span className="stat-value">{activityLogs.length}개</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">필터된 로그:</span>
              <span className="stat-value">{filteredLogs.length}개</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">대:</span>
              <span className="stat-value">{activityLogs.filter(log => log.level === 'major').length}개</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">중:</span>
              <span className="stat-value">{activityLogs.filter(log => log.level === 'medium').length}개</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">소:</span>
              <span className="stat-value">{activityLogs.filter(log => log.level === 'minor').length}개</span>
            </div>
          </div>

          <div className="logs-container">
            {logsLoading ? (
              <div className="loading-logs">
                <Refresh sx={{ fontSize: 48, color: '#ccc', animation: 'spin 1s linear infinite' }} />
                <p>로그를 불러오는 중...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="no-logs">
                <History sx={{ fontSize: 48, color: '#ccc' }} />
                <p>활동 로그가 없습니다</p>
              </div>
            ) : (
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>시간</th>
                      <th>레벨</th>
                      <th>작업</th>
                      <th>상세 내용</th>
                      <th>관리자</th>
                      <th>IP</th>
                      <th>세션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className={`log-row ${log.level}`}>
                        <td className="log-timestamp">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="log-level-cell">
                          <div className="log-level">
                            {getLevelIcon(log.level)}
                            <span className="level-text">{getLevelText(log.level)}</span>
                          </div>
                        </td>
                        <td className="log-action">{log.action}</td>
                        <td className="log-details">{log.details}</td>
                        <td className="log-admin">
                          <div className="admin-info">
                            <div className="admin-name">{log.adminName}</div>
                            <div className="admin-code">({log.adminId})</div>
                          </div>
                        </td>
                        <td className="log-ip">{log.ip || 'N/A'}</td>
                        <td className="log-session">{log.sessionId ? log.sessionId.substring(0, 8) + '...' : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
