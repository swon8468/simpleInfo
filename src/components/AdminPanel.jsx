import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataService from '../services/DataService';
import ConnectionDB from '../services/ConnectionDB';
import AdminAuth from './AdminAuth';
import AdminAnnouncementTable from './AdminAnnouncementTable';
import AdminScheduleCalendar from './AdminScheduleCalendar';
import AdminMealCalendar from './AdminMealCalendar';
import AdminMainNotice from './AdminMainNotice';
import AdminPatchnotes from './AdminPatchnotes';
import AdminSchoolBlocking from './AdminSchoolBlocking';
import './AdminPanel.css';

function AdminPanel() {
  console.log('AdminPanel 컴포넌트 렌더링 시작');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activePins, setActivePins] = useState([]);
  const [pinMessage, setPinMessage] = useState('');
  const [pinNicknames, setPinNicknames] = useState({}); // PIN별 별명 정보
  const [editingNicknamePin, setEditingNicknamePin] = useState(null);
  const [nicknameValue, setNicknameValue] = useState('');
  const [campusLayoutImage, setCampusLayoutImage] = useState(null);
  const [campusLayoutLoading, setCampusLayoutLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 관리자 화면 body 색 설정
    document.body.style.background = '#f5f5f5';
    
    // 세션에서 인증 상태 확인
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      
      // 즉시 PIN 목록 가져오기
      fetchActivePins();
      
      // 여러 번 시도로 접속 전 연결된 PIN 포함
      const retryDelays = [1000, 3000, 5000, 8000];
      retryDelays.forEach((delay, index) => {
        setTimeout(() => {
          console.log(`AdminPanel: ${index + 1}차 PIN 목록 업데이트 실행 (${delay}ms 후)`);
          fetchActivePins();
        }, delay);
      });
      
      // 알레르기 정보 로드
      loadAllergyData();
      
      // 교실 배치 이미지 로드
      loadCampusLayoutImage();
      
      // 실시간으로 활성화된 PIN 상태 모니터링 (스냅샷 리스너)
      const unsubscribe = ConnectionDB.subscribeToActiveConnections(async (activePins) => {
        console.log('AdminPanel: 실시간 PIN 변경 감지:', activePins);
        if (activePins.length > 0) {
          console.log('AdminPanel: 실시간 감지로 PIN 업데이트:', activePins.length, '개');
          
          // 별명 정보 추가로 PIN 목록 업데이트
          try {
            const pinsWithNicknames = await ConnectionDB.getActiveConnections();
            setActivePins(pinsWithNicknames);
            console.log('AdminPanel: 별명 포함 PIN 목록 업데이트 완료');
          } catch (error) {
            console.error('AdminPanel: 별명 포함 PIN 목록 업데이트 실패:', error);
            setActivePins(activePins); // 별명 없이라도 기본 PIN 목록은 유지
          }
        } else {
          setActivePins(activePins);
        }
      });
      
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
          console.log('AdminPanel: 실시간 모니터링 구독 해제');
        }
      };
    }
  }, []);

  // 알레르기 정보 로드 (새로운 컬렉션 사용)
  const loadAllergyData = async () => {
    try {
      const allergyItems = await DataService.getAllergyItems();
      setAllergyForm({
        items: allergyItems.map(item => ({ id: item.id, name: item.name }))
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

  // 활성화된 PIN 가져오기 (별명 정보 포함)
  const fetchActivePins = async () => {
    try {
      console.log('AdminPanel.fetchActivePins: 시작 - 현재 시간:', new Date().toISOString());
      const pinsWithNicknames = await ConnectionDB.getActiveConnections();
      console.log('AdminPanel.fetchActivePins: 가져온 PIN 목록 (별명 포함):', pinsWithNicknames);
      console.log('AdminPanel.fetchActivePins: PIN 개수:', pinsWithNicknames.length);
      console.log('AdminPanel.fetchActivePins: PIN 상세 정보:', pinsWithNicknames.map(pin => ({ 
        sessionId: pin.sessionId, 
        pin: pin.pin, 
        nickname: pin.nickname,
        deviceType: pin.deviceType, 
        status: pin.status,
        createdAt: pin.createdAt,
        connectedAt: pin.connectedAt,
        hasControlDevice: pin.hasControlDevice
      })));
      
      // PIN이 없는 경우 추가로 다른 방법 시도
      if (pinsWithNicknames.length === 0) {
        console.log('AdminPanel.fetchActivePins: 초기 PIN 목록이 없음 - 다른 방법 시도');
        
        // 직접 Firebase 쿼리로 모든 연결 상태 확인
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          
          const connectionsRef = collection(db, 'connections');
          const allDocs = await getDocs(connectionsRef);
          console.log('AdminPanel.fetchActivePins: Firebase 직접 쿼리 - 전체 문서 수:', allDocs.size);
          
          const allPins = [];
          allDocs.forEach((doc) => {
            const data = doc.data();
            console.log('AdminPanel.fetchActivePins: Firebase 직접 쿼리 문서:', doc.id, data);
            
            // 출력용 디바이스이면서 6자리 PIN이 있는 경우 포함
            if (data.deviceType === 'output' && 
                data.pin && 
                data.pin.length === 6 &&
                (data.status === 'connected' || data.status === 'control_connected' || data.connectedControlSession)) {
              allPins.push({ sessionId: doc.id, ...data, nickname: data.nickname || '' });
            }
          });
          
          if (allPins.length > 0) {
            console.log('AdminPanel.fetchActivePins: 직접 쿼리로 발견된 PIN들:', allPins);
            setActivePins(allPins);
            setPinMessage(`직접 쿼리로 ${allPins.length}개의 PIN을 발견했습니다.`);
            return; // 직접 쿼리로 찾은 PIN들을 사용
          } else {
            setPinMessage('현재 활성화된 PIN이 없습니다.');
          }
        } catch (firebaseError) {
          console.error('AdminPanel.fetchActivePins: Firebase 직접 쿼리 실패:', firebaseError);
        }
      }
      
      setActivePins(pinsWithNicknames);
      if (pinsWithNicknames.length > 0) {
        setPinMessage(`정상적으로 ${pinsWithNicknames.length}개의 PIN을 조회했습니다.`);
      }
    } catch (error) {
      console.error('AdminPanel.fetchActivePins: PIN 가져오기 실패:', error);
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

  // PIN 별명 편집 시작
  const startEditNickname = (pin) => {
    setEditingNicknamePin(pin);
    setNicknameValue(pin.nickname || '');
  };

  // PIN 별명 저장
  const saveNickname = async (pin) => {
    try {
      const success = await ConnectionDB.setPinNickname(pin.pin, nicknameValue);
      if (success) {
        setPinMessage(`PIN ${pin.pin} 별명이 "${nicknameValue}"로 설정되었습니다.`);
        await fetchActivePins(); // PIN 목록 다시 가져오기
        setEditingNicknamePin(null);
        setNicknameValue('');
      } else {
        setPinMessage('별명 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('별명 저장 실패:', error);
      setPinMessage('별명 저장 중 오류가 발생했습니다.');
    }
  };

  // PIN 별명 편집 취소
  const cancelEditNickname = () => {
    setEditingNicknamePin(null);
    setNicknameValue('');
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
          
          
          // 연결된 제어용 디바이스가 있다면 메인 화면으로 이동하라는 신호 전송
          if (controlSessionId) {
            await ConnectionDB.sendControlData(controlSessionId, {
              currentPage: 'main',
              adminRemoved: true
            });
            
            // 제어용 디바이스가 신호를 받을 시간을 주기 위해 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 제어용 세션 먼저 삭제
            await ConnectionDB.disconnectSession(controlSessionId);
          }
          
          // 출력용 세션 삭제
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
    items: [],
    newItem: ''
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
      // 빈 항목 제거 후 처리
      const items = Array.isArray(allergyForm.items) 
        ? allergyForm.items.filter(item => item && item.name && item.name.trim().length > 0)
        : [];
      
      if (items.length === 0) {
        // 모든 항목이 제거된 경우 전체 삭제
        await DataService.deleteAllAllergyItems();
        showMessage('모든 알레르기 정보가 삭제되었습니다.');
      } else {
        // 기존 모든 항목을 삭제하고 새로운 항목들 추가
        await DataService.deleteAllAllergyItems();
        
        // 새로운 항목들을 하나씩 추가
        for (const item of items) {
          await DataService.addAllergyItem(item.name);
        }
        
        showMessage(`${items.length}개의 알레르기 정보가 업데이트되었습니다.`);
      }
      
      // 데이터 다시 로드
      await loadAllergyData();
      
      // 폼 초기화 (newItem도 유지)
      setAllergyForm(prev => ({ ...prev, newItem: '' }));
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
              className={`tab-btn ${activeTab === 'mainNotice' ? 'active' : ''}`}
              onClick={() => setActiveTab('mainNotice')}
            >
              메인 공지사항
            </button>
            <button 
              className={`tab-btn ${activeTab === 'patchnotes' ? 'active' : ''}`}
              onClick={() => setActiveTab('patchnotes')}
            >
              패치 노트
            </button>
            <button 
              className={`tab-btn ${activeTab === 'schoolBlocking' ? 'active' : ''}`}
              onClick={() => setActiveTab('schoolBlocking')}
            >
              학교 차단
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
                <div className="allergy-management">
                  <div className="allergy-items-list">
                    <h3>현재 알레르기 항목</h3>
                    {Array.isArray(allergyForm.items) && allergyForm.items.length > 0 ? (
                      <div className="allergy-items">
                        {allergyForm.items.map((item, index) => (
                          <div key={item.id || index} className="allergy-item">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const newItems = [...allergyForm.items];
                                newItems[index] = { ...item, name: e.target.value };
                                setAllergyForm({ ...allergyForm, items: newItems });
                              }}
                              className="allergy-item-input"
                              placeholder="알레르기 항목명"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = allergyForm.items.filter((_, i) => i !== index);
                                setAllergyForm({ ...allergyForm, items: newItems });
                              }}
                              className="remove-allergy-btn"
                              title="항목 삭제"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-allergy-items">설정된 알레르기 항목이 없습니다.</p>
                    )}
                  </div>
                  
                  <div className="add-allergy-section">
                    <h3>새 항목 추가</h3>
                    <div className="add-allergy-form">
                      <input
                        type="text"
                        value={allergyForm.newItem || ''}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          setAllergyForm(prev => ({ ...prev, newItem: inputValue }));
                          
                          // 쉼표로 구분된 입력 자동 처리
                          if (inputValue.includes(',')) {
                            const newItems = inputValue
                              .split(',')
                              .map(item => item.trim())
                              .filter(item => item.length > 0);
                            
                            if (newItems.length > 0) {
                              const existingItems = Array.isArray(prev.items) ? prev.items : [];
                              const combinedItems = [...existingItems, ...newItems.filter(item => !existingItems.includes(item))];
                              setAllergyForm(prev => ({ 
                                ...prev, 
                                items: combinedItems,
                                newItem: ''
                              }));
                            }
                          }
                        }}
                        placeholder="알레르기 항목명 입력 (쉼표로 구분 가능: 난류, 우유, 견과류)"
                        className="new-allergy-input"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (allergyForm.newItem && allergyForm.newItem.trim()) {
                            const inputValue = allergyForm.newItem.trim();
                            const existingItems = Array.isArray(allergyForm.items) 
                              ? allergyForm.items
                              : [];
                            
                            // 쉼표가 포함된 경우 여러 항목으로 분리
                            if (inputValue.includes(',')) {
                              const newItemNames = inputValue
                                .split(',')
                                .map(item => item.trim())
                                .filter(item => item.length > 0 && !existingItems.some(existing => existing.name === item));
                              
                              if (newItemNames.length > 0) {
                                const newItems = newItemNames.map(name => ({ id: `temp_${Date.now()}_${Math.random()}`, name }));
                                setAllergyForm({ 
                                  ...allergyForm, 
                                  items: [...existingItems, ...newItems],
                                  newItem: ''
                                });
                              } else {
                                setAllergyForm(prev => ({ ...prev, newItem: '' }));
                              }
                            } else {
                              // 단일 항목인 경우
                              if (!existingItems.some(existing => existing.name === inputValue)) {
                                const newItem = { id: `temp_${Date.now()}_${Math.random()}`, name: inputValue };
                                setAllergyForm({ 
                                  ...allergyForm, 
                                  items: [...existingItems, newItem],
                                  newItem: ''
                                });
                              } else {
                                setAllergyForm(prev => ({ ...prev, newItem: '' }));
                              }
                            }
                          }
                        }}
                        className="add-allergy-btn"
                        disabled={!allergyForm.newItem || !allergyForm.newItem.trim()}
                      >
                        추가
                      </button>
                    </div>
                    <p className="allergy-input-hint">
                      💡 쉼표로 여러 항목을 한 번에 입력할 수 있습니다: "난류, 우유, 견과류"
                    </p>
                  </div>
                  
                  <form onSubmit={handleAllergySubmit} className="allergy-submit-form">
                    <button type="submit" disabled={loading || !Array.isArray(allergyForm.items) || allergyForm.items.length === 0}>
                      {loading ? '업데이트 중...' : '변경사항 저장'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'mainNotice' && (
              <div className="form-section">
                <AdminMainNotice />
              </div>
            )}

            {activeTab === 'patchnotes' && (
              <div className="form-section">
                <AdminPatchnotes />
              </div>
            )}

            {activeTab === 'schoolBlocking' && (
              <div className="form-section">
                <AdminSchoolBlocking />
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
                  <p>📌 현재 활성화된 PIN: <strong style={{ color: '#007bff', fontSize: '1.2rem' }}>{activePins.length}</strong>개 / 최대 10개</p>
                  <p
                    className="realtime-indicator"
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={fetchActivePins}
                  >
                    PIN이 보이지 않으면 <span style={{ color: '#007bff', fontWeight: 'bold' }}>여기</span>를 누르면 새로고침 됩니다.
                  </p>
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
                        <div className="pin-info-section">
                          <div className="pin-main-info">
                            <span className="pin-number">PIN: <strong>{pin.pin}</strong></span>
                            <span className="pin-info">연결 시간: {pin.connectedAt?.toDate ? pin.connectedAt.toDate().toLocaleString() : '알 수 없음'}</span>
                          </div>
                          
                          {editingNicknamePin && editingNicknamePin.pin === pin.pin ? (
                            <div className="nickname-edit-section">
                              <input
                                type="text"
                                value={nicknameValue}
                                onChange={(e) => setNicknameValue(e.target.value)}
                                placeholder="별명을 입력하세요"
                                className="nickname-input"
                                maxLength={10}
                              />
                              <button 
                                className="btn save-nickname-btn" 
                                onClick={() => saveNickname(pin)}
                                disabled={nicknameValue.trim().length === 0}
                              >
                                저장
                              </button>
                              <button 
                                className="btn cancel-nickname-btn" 
                                onClick={cancelEditNickname}
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="nickname-display-section">
                              <span className="nickname-label">
                                별명: <strong>{pin.nickname || '없음'}</strong>
                              </span>
                              <button 
                                className="btn edit-nickname-btn" 
                                onClick={() => startEditNickname(pin)}
                              >
                                {pin.nickname ? '편집' : '추가'}
                              </button>
                            </div>
                          )}
                        </div>
                        <button className="btn remove-pin-btn" onClick={() => handleRemovePin(pin.pin)}>
                          PIN 제거
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
