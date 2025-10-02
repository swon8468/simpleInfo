import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataService from '../services/DataService';
import ConnectionDB from '../services/ConnectionDB';
import AdminAuth from './AdminAuth';
import AdminAnnouncementTable from './AdminAnnouncementTable';
import AdminScheduleCalendar from './AdminScheduleCalendar';
import AdminMealCalendar from './AdminMealCalendar';
import './AdminPanel.css';

function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activePins, setActivePins] = useState([]);
  const [pinMessage, setPinMessage] = useState('');
  const [campusLayoutImage, setCampusLayoutImage] = useState(null);
  const [campusLayoutLoading, setCampusLayoutLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 세션에서 인증 상태 확인
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchActivePins(); // 인증되면 활성화된 PIN 목록 가져오기
      loadAllergyData(); // 알레르기 정보 로드
      loadCampusLayoutImage(); // 교실 배치 이미지 로드
      
      // 실시간으로 활성화된 PIN 상태 모니터링
      const interval = setInterval(() => {
        fetchActivePins();
      }, 5000); // 5초마다 확인
      
      return () => {
        clearInterval(interval);
      };
    }
  }, []);

  // 알레르기 정보 로드
  const loadAllergyData = async () => {
    try {
      const allergyData = await DataService.getAllergyInfo();
      setAllergyForm({
        items: allergyData.items || []
      });
    } catch (error) {
      console.error('알레르기 정보 로드 실패:', error);
    }
  };

  // 교실 배치 이미지 로드
  const loadCampusLayoutImage = async () => {
    try {
      const imageURL = await DataService.getCampusLayoutImage();
      setCampusLayoutImage(imageURL);
    } catch (error) {
      console.error('교실 배치 이미지 로드 실패:', error);
    }
  };

  // 활성화된 PIN 가져오기
  const fetchActivePins = async () => {
    try {
      console.log('AdminPanel: 활성화된 PIN 가져오기 시작');
      console.log('AdminPanel: 현재 시간:', new Date().toISOString());
      const pins = await ConnectionDB.getActiveConnections();
      console.log('AdminPanel: 가져온 활성화된 PIN:', pins);
      console.log('AdminPanel: PIN 배열 길이:', pins.length);
      console.log('AdminPanel: PIN 배열 타입:', typeof pins);
      console.log('AdminPanel: PIN 배열이 배열인가:', Array.isArray(pins));
      setActivePins(pins);
      console.log('AdminPanel: activePins 상태 업데이트 완료');
    } catch (error) {
      console.error('AdminPanel: 활성화된 PIN 가져오기 실패:', error);
      console.error('AdminPanel: 오류 상세:', error.message);
      setActivePins([]);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  // 활성화된 PIN 제거 핸들러
  const handleRemovePin = async (pinId) => {
    if (window.confirm(`정말로 PIN ${pinId}을(를) 제거하시겠습니까?`)) {
      try {
        // PIN으로 출력용 세션 찾기
        const outputSessions = await ConnectionDB.findOutputSessionByPin(pinId);
        
        if (outputSessions && outputSessions.length > 0) {
          const outputSession = outputSessions[0]; // 첫 번째 세션 사용
          const outputSessionId = outputSession.sessionId; // sessionId 필드 사용
          const controlSessionId = outputSession.connectedControlSession;
          
          console.log('AdminPanel: PIN 제거 시작', { pinId, outputSessionId, controlSessionId });
          
          // 연결된 제어용 디바이스가 있다면 메인 화면으로 이동하라는 신호 전송
          if (controlSessionId) {
            await ConnectionDB.sendControlData(controlSessionId, {
              currentPage: 'main',
              adminRemoved: true
            });
            
            // 제어용 디바이스가 신호를 받을 시간을 주기 위해 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // 출력용 세션 삭제 (연결된 제어용 세션도 함께 삭제됨)
          await ConnectionDB.disconnectSession(outputSessionId);
          
          setPinMessage(`PIN ${pinId}이(가) 성공적으로 제거되었습니다.`);
          fetchActivePins(); // 목록 새로고침
        } else {
          setPinMessage(`PIN ${pinId}을(를) 찾을 수 없습니다.`);
        }
      } catch (error) {
        console.error('PIN 제거 실패:', error);
        setPinMessage(`PIN ${pinId} 제거에 실패했습니다.`);
      }
      
      setTimeout(() => setPinMessage(''), 3000); // 3초 후 메시지 제거
    }
  };

  // 공지사항 관리
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: ''
  });

  // 알레르기 정보 관리
  const [allergyForm, setAllergyForm] = useState({
    items: []
  });

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const eventDate = `${scheduleForm.year}-${String(scheduleForm.month).padStart(2, '0')}-${String(scheduleForm.day).padStart(2, '0')}`;
      await DataService.addScheduleEvent(eventDate, scheduleForm.event, scheduleForm.target || []);
      showMessage('학사일정이 추가되었습니다.');
      setScheduleForm({ ...scheduleForm, event: '', target: [] });
    } catch (error) {
      showMessage('학사일정 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const lunchItems = mealForm.lunch.split(',').map(item => item.trim()).filter(item => item);
      const dinnerItems = mealForm.dinner.split(',').map(item => item.trim()).filter(item => item);
      
      await DataService.updateMealData(mealForm.date, lunchItems, dinnerItems);
      showMessage('급식 정보가 업데이트되었습니다.');
    } catch (error) {
      showMessage('급식 정보 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await DataService.addAnnouncement(announcementForm.title, announcementForm.content);
      showMessage('공지사항이 추가되었습니다.');
      setAnnouncementForm({ title: '', content: '' });
    } catch (error) {
      showMessage('공지사항 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAllergySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('알레르기 정보 제출 시작:', allergyForm.items);
      
      // 문자열을 배열로 변환
      let items = [];
      if (typeof allergyForm.items === 'string') {
        items = allergyForm.items
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
      } else if (Array.isArray(allergyForm.items)) {
        items = allergyForm.items.filter(item => item && item.trim().length > 0);
      }
      
      console.log('처리된 알레르기 항목들:', items);
      
      if (items.length === 0) {
        showMessage('알레르기 정보를 입력해주세요.');
        return;
      }
      
      await DataService.updateAllergyInfo(items);
      showMessage('알레르기 정보가 업데이트되었습니다.');
      
      // 폼 초기화
      setAllergyForm({ items: '' });
    } catch (error) {
      console.error('알레르기 정보 업데이트 오류:', error);
      showMessage('알레르기 정보 업데이트에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 교실 배치 이미지 업로드
  const handleCampusLayoutUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setCampusLayoutLoading(true);
    try {
      const imageURL = await DataService.uploadCampusLayoutImage(file);
      setCampusLayoutImage(imageURL);
      showMessage('교실 배치 이미지가 업로드되었습니다.');
    } catch (error) {
      showMessage('교실 배치 이미지 업로드에 실패했습니다.');
    } finally {
      setCampusLayoutLoading(false);
    }
  };

  // 교실 배치 이미지 삭제
  const handleCampusLayoutDelete = async () => {
    if (!campusLayoutImage) return;

    setCampusLayoutLoading(true);
    try {
      await DataService.deleteCampusLayoutImage();
      setCampusLayoutImage(null);
      showMessage('교실 배치 이미지가 삭제되었습니다.');
    } catch (error) {
      showMessage('교실 배치 이미지 삭제에 실패했습니다.');
    } finally {
      setCampusLayoutLoading(false);
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <AdminAuth onSuccess={handleAuthSuccess} />
      ) : (
        <div className="admin-panel">
          <div className="admin-header">
            <h1>관리자 패널</h1>
            <div className="header-buttons">
              <button className="logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
              <button className="main-btn" onClick={handleBackToMain}>
                메인 화면
              </button>
            </div>
          </div>

          {message && <div className="message">{message}</div>}

          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              학사일정
            </button>
            <button 
              className={`tab-btn ${activeTab === 'meal' ? 'active' : ''}`}
              onClick={() => setActiveTab('meal')}
            >
              급식
            </button>
            <button 
              className={`tab-btn ${activeTab === 'announcement' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcement')}
            >
              공지사항
            </button>
            <button 
              className={`tab-btn ${activeTab === 'allergy' ? 'active' : ''}`}
              onClick={() => setActiveTab('allergy')}
            >
              알레르기
            </button>
            <button 
              className={`tab-btn ${activeTab === 'campusLayout' ? 'active' : ''}`}
              onClick={() => setActiveTab('campusLayout')}
            >
              교실 배치
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pins' ? 'active' : ''}`}
              onClick={() => setActiveTab('pins')}
            >
              활성화된 PIN
            </button>
          </div>

          <div className="admin-content">
            {activeTab === 'schedule' && (
              <div className="form-section">
                <AdminScheduleCalendar />
              </div>
            )}

            {activeTab === 'meal' && (
              <div className="form-section">
                <AdminMealCalendar />
              </div>
            )}

            {activeTab === 'announcement' && (
              <AdminAnnouncementTable />
            )}

            {activeTab === 'allergy' && (
              <div className="form-section">
                <h2>알레르기 정보 관리</h2>
                <form onSubmit={handleAllergySubmit}>
                  <div className="form-group">
                    <label>알레르기 항목 (쉼표로 구분):</label>
                    <input
                      type="text"
                      value={typeof allergyForm.items === 'string' ? allergyForm.items : Array.isArray(allergyForm.items) ? allergyForm.items.join(', ') : ''}
                      onChange={(e) => setAllergyForm({ ...allergyForm, items: e.target.value })}
                      placeholder="예: 난류, 우유, 메일 등등"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading}>
                    {loading ? '업데이트 중...' : '업데이트'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'campusLayout' && (
              <div className="form-section">
                <h2>교실 배치 이미지 관리</h2>
                <div className="campus-layout-section">
                  <div className="image-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCampusLayoutUpload}
                      disabled={campusLayoutLoading}
                      id="campus-layout-upload"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="campus-layout-upload" className="upload-btn">
                      {campusLayoutLoading ? '업로드 중...' : '이미지 업로드'}
                    </label>
                  </div>
                  
                  <div className="current-image-section">
                    <h3>현재 교실 배치 이미지</h3>
                    {campusLayoutImage ? (
                      <div className="image-preview">
                        <img src={campusLayoutImage} alt="교실 배치" />
                        <button 
                          className="delete-btn-overlay" 
                          onClick={handleCampusLayoutDelete}
                          disabled={campusLayoutLoading}
                          title="이미지 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="no-image">
                        <p>업로드된 이미지가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pins' && (
              <div className="form-section">
                <h2>활성화된 PIN 관리</h2>
                {pinMessage && <p className="pin-message">{pinMessage}</p>}
                <div className="pin-info">
                  <p>현재 활성화된 PIN: <strong>{activePins.length}</strong>개 / 최대 10개</p>
                  {activePins.length >= 10 && (
                    <p className="pin-warning">⚠️ 최대 PIN 개수에 도달했습니다. 새로운 PIN 생성을 위해 기존 PIN을 제거해주세요.</p>
                  )}
                </div>
                {activePins.length === 0 ? (
                  <p>현재 활성화된 PIN이 없습니다.</p>
                ) : (
                  <ul className="pin-list">
                    {activePins.map((pin) => (
                      <li key={pin.pin} className="pin-item">
                        <span>PIN: <strong>{pin.pin}</strong> (연결 시간: {pin.connectedAt?.toDate ? pin.connectedAt.toDate().toLocaleString() : '알 수 없음'})</span>
                        <button className="btn remove-pin-btn" onClick={() => handleRemovePin(pin.pin)}>
                          제거
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AdminPanel;
