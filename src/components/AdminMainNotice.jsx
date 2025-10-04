import { useState, useEffect } from 'react';
import ConnectionDB from '../services/ConnectionDB';
import NotificationService from '../services/NotificationService';
import './AdminMainNotice.css';

function AdminMainNotice() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activePins, setActivePins] = useState([]);
  const [activeNotices, setActiveNotices] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    targetPins: [],
    isActive: false
  });

  // 활성화된 PIN 가져오기
  const fetchActivePins = async () => {
    try {
      const pins = await ConnectionDB.getActiveConnections();
      setActivePins(pins);
    } catch (error) {
      console.error('PIN 가져오기 실패:', error);
      setActivePins([]);
    }
  };

  // 활성화된 공지사항 가져오기
  const fetchActiveNotices = async () => {
    try {
      const pins = await ConnectionDB.getActiveConnections();
      const notices = [];
      
      for (const pin of pins) {
        const sessions = await ConnectionDB.findOutputSessionByPin(pin.pin);
        if (sessions && sessions.length > 0) {
          const sessionData = sessions[0];
          if (sessionData.mainNotice && sessionData.mainNotice.isActive) {
            notices.push({
              pinId: pin.pin,
              sessionId: sessionData.sessionId,
              title: sessionData.mainNotice.title,
              content: sessionData.mainNotice.content,
              createdAt: sessionData.mainNotice.createdAt,
              timestamp: sessionData.mainNotice.timestamp
            });
          }
        }
      }
      
      setActiveNotices(notices);
    } catch (error) {
      console.error('공지사항 목록 가져오기 실패:', error);
      setActiveNotices([]);
    }
  };

  // 컴포넌트 마운트 시 PIN 목록과 공지사항 목록 로드
  useEffect(() => {
    fetchActivePins();
    fetchActiveNotices();
    
    // 여러 차례 시도로 PIN 목록 확실히 가져오기
    const retryFetchPins = () => {
      setTimeout(() => {
        console.log('AdminMainNotice: PIN 목록 재시도');
        fetchActivePins();
      }, 2000);
      setTimeout(() => {
        console.log('AdminMainNotice: PIN 목록 재시도 2차');
        fetchActivePins();
      }, 5000);
    };
    retryFetchPins();
    
    // 실시간으로 활성화된 PIN 상태 모니터링 (스냅샷 리스너)
    const unsubscribe = ConnectionDB.subscribeToActiveConnections((activePins) => {
      console.log('AdminMainNotice: 실시간 PIN 변경 감지:', activePins);
      setActivePins(activePins);
      fetchActiveNotices(); // 공지사항도 함께 업데이트
    });
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
        console.log('AdminMainNotice: 실시간 모니터링 구독 해제');
      }
    };
  }, []);

  const handlePinToggle = (pinId) => {
    setNoticeForm(prev => {
      const newTargetPins = prev.targetPins.includes(pinId)
        ? prev.targetPins.filter(id => id !== pinId)
        : [...prev.targetPins, pinId];
      
      // PIN 중복 체크 강화 - 편집 모달에서도 동작
      const checkedPins = newTargetPins.filter(targetPinId => {
        return activeNotices.some(notice => 
          notice.pinId === targetPinId && 
          (!editingNotice || notice.sessionId !== editingNotice.sessionId)
        );
      });
      
      if (checkedPins.length > 0) {
        setMessage(`PIN ${checkedPins.join(', ')}에는 이미 활성화된 공지사항이 있습니다.`);
        return prev;
      }
      
      return {
        ...prev,
        targetPins: newTargetPins
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      setMessage('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (noticeForm.targetPins.length === 0) {
      setMessage('최소 하나 이상의 PIN을 선택해주세요.');
      return;
    }

    setLoading(true);
    
    // 전송 시작 시 배경색 변경 효과 함수 호출
    try {
      await ConnectionDB.notifyMainNoticeActive(true);
    } catch (error) {
      // 배경색 변경 실패해도 메인 공지사항 전송은 계속 진행
    }
    try {
      // 각 선택된 PIN이 이미 공지사항을 가지고 있는지 확인
      const existingNotices = [];
      
      for (const pinId of noticeForm.targetPins) {
        const sessions = await ConnectionDB.findOutputSessionByPin(pinId);
        if (sessions && sessions.length > 0) {
          const sessionData = sessions[0];
          if (sessionData.mainNotice && sessionData.mainNotice.isActive) {
            existingNotices.push(pinId);
          }
        }
      }
      
      if (existingNotices.length > 0) {
        // 기존 공지사항을 자동으로 비활성화하고 새로 전송
        console.log(`기존 공지사항 비활성화 후 새로 전송: ${existingNotices.join(', ')}`);
        for (const pinId of existingNotices) {
          const sessions = await ConnectionDB.findOutputSessionByPin(pinId);
          if (sessions && sessions.length > 0) {
            const sessionData = sessions[0];
            await ConnectionDB.deactivateMainNotice(sessionData.sessionId);
          }
        }
      }

      // 각 선택된 PIN에 대한 공지사항 전송
      await Promise.all(
        noticeForm.targetPins.map(async (pinId) => {
          const sessions = await ConnectionDB.findOutputSessionByPin(pinId);
          if (sessions && sessions.length > 0) {
            const sessionId = sessions[0].sessionId;
            await ConnectionDB.sendMainNotice(sessionId, {
              title: noticeForm.title,
              content: noticeForm.content,
              createdAt: new Date().toISOString()
            });
          }
        })
      );

      // 활성 사용자에게 알림 발송
      try {
        await NotificationService.showMainNoticeNotification({
          title: noticeForm.title,
          content: noticeForm.content
        });
      } catch (error) {
        console.error('메인 공지사항 알림 발송 실패:', error);
      }

      setMessage('메인 공지사항이 성공적으로 전송되었습니다.');
      setNoticeForm({
        title: '',
        content: '',
        targetPins: [],
        isActive: true
      });
      refreshAfterSuccess(); // 목록 새로고침
    } catch (error) {
      console.error('공지사항 전송 실패:', error);
      setMessage('공지사항 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 공지사항 삭제
  const handleDeleteNotice = async (sessionId, pinId) => {
    if (window.confirm(`정말로 PIN ${pinId}의 공지사항을 삭제하시겠습니까?`)) {
      setLoading(true);
      try {
        await ConnectionDB.deactivateMainNotice(sessionId);
        setMessage('공지사항이 성공적으로 삭제되었습니다.');
        fetchActiveNotices(); // 목록 새로고침
      } catch (error) {
        console.error('공지사항 삭제 실패:', error);
        setMessage('공지사항 삭제에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  // 편집 모달 열기
  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title,
      content: notice.content,
      targetPins: [notice.pinId],
      isActive: true
    });
    setShowEditModal(true);
  };

  // 편집 모달 닫기
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      content: '',
      targetPins: [],
      isActive: false
    });
  };

  // 공지사항 수정
  const handleUpdateNotice = async (e) => {
    e.preventDefault();
    
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      setMessage('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (noticeForm.targetPins.length === 0) {
      setMessage('최소 하나 이상의 PIN을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 수정 시 다른 PIN으로 변경하는 경우 중복 체크
      const newTargetPins = noticeForm.targetPins.filter(pinId => pinId !== editingNotice.pinId);
      
      if (newTargetPins.length > 0) {
        const existingNotices = [];
        
        for (const pinId of newTargetPins) {
          const sessions = await ConnectionDB.findOutputSessionByPin(pinId);
          if (sessions && sessions.length > 0) {
            const sessionData = sessions[0];
            if (sessionData.mainNotice && sessionData.mainNotice.isActive && sessionData.sessionId !== editingNotice.sessionId) {
              existingNotices.push(pinId);
            }
          }
        }
        
        if (existingNotices.length > 0) {
          setMessage(`PIN ${existingNotices.join(', ')}에는 이미 활성화된 공지사항이 있습니다.`);
          return;
        }
      }

      // 기존 공지사항 삭제
      await ConnectionDB.deactivateMainNotice(editingNotice.sessionId);
      
      // 새로운 공지사항 전송
      await Promise.all(
        noticeForm.targetPins.map(async (pinId) => {
          const sessions = await ConnectionDB.findOutputSessionByPin(pinId);
          if (sessions && sessions.length > 0) {
            const sessionId = sessions[0].sessionId;
            await ConnectionDB.sendMainNotice(sessionId, {
              title: noticeForm.title,
              content: noticeForm.content,
              createdAt: new Date().toISOString()
            });
          }
        })
      );

      setMessage('공지사항이 성공적으로 수정되었습니다.');
      handleCloseEditModal();
      refreshAfterSuccess();
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
      setMessage('공지사항 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 성공 후 목록 새로고침 함수 추가
  const refreshAfterSuccess = () => {
    fetchActivePins();
    fetchActiveNotices();
  };

  return (
    <div className="admin-main-notice">
      <h2>메인 공지사항 관리</h2>
      
      {message && (
        <div className={`message ${message.includes('실패') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 추가 버튼 추가 */}
      <div className="add-notice-section">
        <button 
          type="button" 
          className="add-notice-btn"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          {showForm ? '메인 공지사항 작성 취소' : '+ 메인 공지사항 추가'}
        </button>
      </div>

      {/* 폼 조건부 렌더링 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="main-notice-form">
        <div className="form-group">
          <label htmlFor="title">제목 *</label>
          <input
            type="text"
            id="title"
            value={noticeForm.title}
            onChange={(e) => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="공지사항 제목을 입력하세요"
            required
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">내용 *</label>
          <textarea
            id="content"
            value={noticeForm.content}
            onChange={(e) => setNoticeForm(prev => ({ ...prev, content: e.target.value }))}
            placeholder="공지사항 내용을 입력하세요 (줄바꿈 포함)"
            required
            rows={8}
            maxLength={1000}
          />
          <small className="char-count">{noticeForm.content.length}/1000</small>
        </div>

        <div className="form-group">
          <label>대상 PIN 선택 *</label>
          <div className="pin-selection">
            {activePins.length === 0 ? (
              <p className="no-pins-message">현재 활성화된 PIN이 없습니다.</p>
            ) : (
              <div className="pin-checkboxes">
                {activePins.map((pin) => (
                  <label key={pin.pin} className="pin-checkbox">
                    <input
                      type="checkbox"
                      checked={noticeForm.targetPins.includes(pin.pin)}
                      onChange={() => handlePinToggle(pin.pin)}
                    />
                    <span className="pin-label">PIN {pin.pin}</span>
                    <small className="pin-status">({pin.status})</small>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || !noticeForm.title.trim() || !noticeForm.content.trim() || noticeForm.targetPins.length === 0}
          >
            {loading ? '전송 중...' : '메인 공지사항 전송'}
          </button>
        </div>
        </form>
      )}

      {/* 현재 활성화된 공지사항 목록 */}
      <div className="active-notices-section">
        <h3>현재 활성화된 공지사항</h3>
        
        {activeNotices.length === 0 ? (
          <p className="no-notices">현재 활성화된 공지사항이 없습니다.</p>
        ) : (
          <div className="notices-table">
            <table>
              <thead>
                <tr>
                  <th>대상 PIN</th>
                  <th>제목</th>
                  <th>내용 미리보기</th>
                  <th>작성일</th>
                  <th>조작</th>
                </tr>
              </thead>
              <tbody>
                {activeNotices.map((notice) => (
                  <tr key={notice.sessionId}>
                    <td className="pin-cell">
                      <span className="pin-badge">PIN {notice.pinId}</span>
                    </td>
                    <td className="title-cell">
                      <button 
                        className="title-edit-btn"
                        onClick={() => handleEditNotice(notice)}
                        disabled={loading}
                      >
                        {notice.title}
                      </button>
                    </td>
                    <td className="content-preview">
                      <div style={{ whiteSpace: 'pre-line' }}>
                        {notice.content.length > 50 
                          ? notice.content.substring(0, 50) + '...' 
                          : notice.content
                        }
                      </div>
                    </td>
                    <td className="date-cell">
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="action-cell">
                      <button 
                        className="delete-notice-btn"
                        onClick={() => handleDeleteNotice(notice.sessionId, notice.pinId)}
                        disabled={loading}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="notice-info">
        <h3>공지사항 안내</h3>
        <ul>
          <li>메인 공지사항이 전송되면 해당 PIN의 출력 화면이 공지사항으로 변경됩니다.</li>
          <li>공지사항 표시 중에는 제어용 다른 조작이 불가능합니다.</li>
          <li>내용에는 최대 1000자까지 작성할 수 있습니다.</li>
          <li>줄바꿈은 그대로 표시됩니다.</li>
          <li>각 PIN당 최대 1개의 공지사항만 제한됩니다.</li>
        </ul>
      </div>

      {/* 편집 모달 */}
      {showEditModal && editingNotice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>공지사항 수정</h3>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateNotice} className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-title">제목 *</label>
                <input
                  type="text"
                  id="edit-title"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="공지사항 제목을 입력하세요"
                  required
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-content">내용 *</label>
                <textarea
                  id="edit-content"
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="공지사항 내용을 입력하세요 (줄바꿈 포함)"
                  required
                  rows={8}
                  maxLength={1000}
                />
                <small className="char-count">{noticeForm.content.length}/1000</small>
              </div>

              <div className="form-group">
                <label>대상 PIN 선택 *</label>
                <div className="pin-selection">
                  {activePins.length === 0 ? (
                    <p className="no-pins-message">현재 활성화된 PIN이 없습니다.</p>
                  ) : (
                    <div className="pin-checkboxes">
                      {activePins.map((pin) => (
                        <label key={pin.pin} className="pin-checkbox">
                          <input
                            type="checkbox"
                            checked={noticeForm.targetPins.includes(pin.pin)}
                            onChange={() => handlePinToggle(pin.pin)}
                          />
                          <span className="pin-label">PIN {pin.pin}</span>
                          <small className="pin-status">({pin.status})</small>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCloseEditModal}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="update-btn"
                  disabled={loading || !noticeForm.title.trim() || !noticeForm.content.trim() || noticeForm.targetPins.length === 0}
                >
                  {loading ? '수정 중...' : '공지사항 수정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMainNotice;
