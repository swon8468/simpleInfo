import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionDB from '../services/ConnectionDB';
import DataService from '../services/DataService';
import { School, Campaign } from '@mui/icons-material';
import './OutputMain.css';

function OutputMain() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('main');
  const [connectionData, setConnectionData] = useState(null);
  const [controlData, setControlData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [mealData, setMealData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    teamName: ''
  });
  const [mainNotice, setMainNotice] = useState(null);
  const [showMainNotice, setShowMainNotice] = useState(false);
  const [photoGallery, setPhotoGallery] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // 메인 공지사항 활성화 시 body 배경색 변경
  useEffect(() => {
    if (showMainNotice && mainNotice) {
      // 메인 공지사항 활성화 시 body에 그라디언트 배경 적용
      document.body.style.background = 'linear-gradient(135deg, #00C851 0%, #007E33 100%)';
      document.body.style.minHeight = '100vh';
    } else {
      // 메인 공지사항 비활성화 시 원래 배경으로 되돌리기
      document.body.style.background = '#f5f5f5';
      document.body.style.minHeight = 'auto';
    }

    // cleanup 함수에서 원래 스타일로 되돌리기
    return () => {
      document.body.style.background = '#f5f5f5';
      document.body.style.minHeight = 'auto';
    };
  }, [showMainNotice, mainNotice]);

  useEffect(() => {
    // 출력용 화면 body 색 설정
    document.body.style.background = '#f5f5f5';
    
    // 연결된 PIN으로 실시간 데이터 구독
    const savedPin = sessionStorage.getItem('currentPin');
    const outputSessionId = sessionStorage.getItem('outputSessionId');
    const pairingId = sessionStorage.getItem('pairingId');
    
    if (savedPin && outputSessionId) {
      ConnectionDB.subscribeToOutputData(outputSessionId, (data) => {
        setConnectionData(data);
        
        // 메인 공지사항 처리
        if (data.mainNotice && data.mainNotice.isActive) {
          setMainNotice(data.mainNotice);
          setShowMainNotice(true);
        } else {
          setMainNotice(null);
          setShowMainNotice(false);
        }
        
        if (data.controlData) {
          const newControlData = data.controlData;
          const newPage = newControlData.currentPage || 'main';
          
          
          // 관리자에 의해 연결이 해제된 경우 메인 화면으로 이동
          if (newControlData.adminRemoved) {
            sessionStorage.removeItem('currentPin');
            sessionStorage.removeItem('outputSessionId');
            sessionStorage.removeItem('pairingId');
            navigate('/');
            return;
          }
          
          // 제어 데이터 업데이트 (항상 업데이트)
          setControlData(newControlData);
          
          // 페이지 변경 (항상 업데이트)
          setCurrentPage(newPage);
        } else {
          console.log('');
        }
      });
      
      // Heartbeat 주기적 실행 (연결 유지) - 1분마다
      const heartbeatInterval = setInterval(async () => {
        try {
          await ConnectionDB.heartbeatSession(outputSessionId);
        } catch (error) {
          console.error('Heartbeat 실패:', error);
        }
      }, 60000); // 1분마다
      
      return () => {
        clearInterval(heartbeatInterval);
      };
    } else {
      // 세션 정보가 없으면 메인 화면으로 리다이렉트
      navigate('/');
    }
    
    // 페이지 언로드 핸들러 설정
    const handleBeforeUnload = () => {
      if (outputSessionId) {
        ConnectionDB.disconnectSession(outputSessionId);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // cleanup 함수에서 세션 삭제하지 않음 (페이지 언로드 시에만 삭제)
    };
  }, [navigate]);

  // 사진 슬라이드쇼 자동 전환
  useEffect(() => {
    if (photoGallery.length > 1) {
      const interval = setInterval(() => {
        setCurrentPhotoIndex((prevIndex) => 
          (prevIndex + 1) % photoGallery.length
        );
      }, 20000); // 20초마다 전환

      return () => clearInterval(interval);
    }
  }, [photoGallery]);

  const loadInitialData = async () => {
    try {
      
      // 학교 정보 로드
      const school = await DataService.getSchoolInfo();
      setSchoolInfo(school);

      // 공지사항 로드
      const announcementData = await generateAnnouncementData();
      setAnnouncements(announcementData);

      // 현재 날짜의 학사일정 로드
      const currentDate = new Date();
      const scheduleData = await generateScheduleData(currentDate, 'monthly');
      setScheduleData(scheduleData);

      // 오늘의 급식 로드
      const today = new Date().toISOString().split('T')[0];
      const mealData = await generateMealData(today);
      setMealData(mealData);

      // 사진관 데이터 로드
      const photos = await DataService.getPhotoGallery();
      setPhotoGallery(photos);

    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
    }
  };

  // 공지사항 데이터 생성 (Firebase 데이터 기반)
  const generateAnnouncementData = async () => {
    try {
      const announcements = await DataService.getAnnouncements();
      
      if (announcements && announcements.length > 0) {
        return announcements;
      }
      
      // DB에 데이터가 없을 때는 빈 배열 반환
      return [];
    } catch (error) {
      console.error('공지사항 데이터 가져오기 실패:', error);
      return [];
    }
  };

  // 학사일정 데이터 생성 (Firebase 데이터 기반)
  const generateScheduleData = async (date, viewMode) => {
    const currentDate = date ? new Date(date) : new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === 'monthly') {
      // Firebase에서 해당 월의 학사일정 가져오기
      const schedules = await DataService.getScheduleData(year, month + 1);
      
      // 월별 달력 생성
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // 일요일부터 시작
      
      const calendar = [];
      const current = new Date(startDate);
      
      // 현재 달의 마지막 날 계산
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      
      // 달력 생성 (현재 달만)
      for (let week = 0; week < 6; week++) {
        const weekData = [];
        
        for (let day = 0; day < 7; day++) {
          const dayNumber = (week * 7) + day + 1 - firstDay.getDay();
          
          // 현재 달의 날짜 범위를 벗어나면 표시하지 않음
          if (dayNumber > lastDayOfMonth || dayNumber <= 0) {
            weekData.push(null);
            continue;
          }
          
          const dayDate = new Date(year, month, dayNumber);
          const dayData = {
            date: dayDate,
            isCurrentMonth: true,
            events: schedules[dayNumber] || []
          };
          
          weekData.push(dayData);
        }
        
        calendar.push(weekData);
        
        // 현재 달의 마지막 날을 지났으면 중단
        if ((week + 1) * 7 - firstDay.getDay() > lastDayOfMonth) {
          break;
        }
      }
      
      return {
        type: 'monthly',
        calendar: calendar,
        monthName: `${month + 1}월`,
        year: year
      };
    } else {
      // 주별 달력 생성
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // 주간 데이터 가져오기
      const schedules = await DataService.getWeeklyScheduleData(weekStart, weekEnd);
      
      const weekData = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);
        
        const dayData = {
          date: new Date(dayDate),
          events: schedules[dayDate.getDate()] || []
        };
        
        weekData.push(dayData);
      }
      
      return {
        type: 'weekly',
        weekData: weekData,
        weekStart: weekStart,
        weekEnd: weekEnd
      };
    }
  };

  // 급식 데이터 생성 (Firebase 데이터 기반)
  const generateMealData = async (date) => {
    try {
      const meal = await DataService.getMealData(date);
      
      if (meal && (meal.lunch.length > 0 || meal.dinner.length > 0)) {
        return {
          lunch: meal.lunch || [],
          dinner: meal.dinner || []
        };
      }
      
      // DB에 데이터가 없을 때는 빈 배열 반환
      return {
        lunch: [],
        dinner: []
      };
    } catch (error) {
      console.error('급식 데이터 가져오기 실패:', error);
      return {
        lunch: [],
        dinner: []
      };
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'schedule':
        return <ScheduleDisplay controlData={controlData} />;
        
      case 'meal':
        return <MealDisplay controlData={controlData} />;
        
      case 'roadmap':
        return <RoadmapDisplay />;
        
      case 'announcement':
        return <AnnouncementDisplay announcements={announcements} controlData={controlData} />;
        
      default:
        // 메인 화면 - 사진 슬라이드쇼와 제목 표시
        return (
          <div className="main-display">
            <div className="logo-section">
              {photoGallery.length > 0 ? (
                <div className="photo-slideshow">
                  <div className="photo-container">
                    <img 
                      src={photoGallery[currentPhotoIndex]?.imageURL} 
                      alt={photoGallery[currentPhotoIndex]?.title}
                      className="school-photo"
                    />
                    <div className="photo-info">
                      <h3 className="photo-title">{photoGallery[currentPhotoIndex]?.title}</h3>
                      <p className="photo-description">{photoGallery[currentPhotoIndex]?.description}</p>
                      <p className="photo-date">
                        {photoGallery[currentPhotoIndex]?.eventDate?.toDate?.()?.toLocaleDateString('ko-KR') || 
                         new Date(photoGallery[currentPhotoIndex]?.eventDate).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="school-logo"><School sx={{ fontSize: 80 }} /></div>
              )}
              <h1 className="main-title">{schoolInfo.name}</h1>
              <h2 className="main-subtitle">학교 생활 도우미</h2>
            </div>
          </div>
        );
    }
  };

  // 학사일정 컴포넌트
  const ScheduleDisplay = ({ controlData }) => {
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadScheduleData = async () => {
        setLoading(true);
        try {
          const data = await generateScheduleData(
            controlData?.scheduleDate, 
            controlData?.scheduleView || 'monthly'
          );
          setScheduleData(data);
        } catch (error) {
          console.error('학사일정 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      };

      loadScheduleData();
    }, [controlData?.scheduleDate, controlData?.scheduleView]);

    if (loading) {
      return <div className="loading">학사일정을 불러오는 중...</div>;
    }

    if (scheduleData?.type === 'monthly') {
      return (
        <div className="schedule-display">
          <h2>{scheduleData.year}년 {scheduleData.monthName} 학사일정</h2>
          <div className="calendar-container">
            <div className="calendar-header">
              <div className="day-header">일</div>
              <div className="day-header">월</div>
              <div className="day-header">화</div>
              <div className="day-header">수</div>
              <div className="day-header">목</div>
              <div className="day-header">금</div>
              <div className="day-header">토</div>
            </div>
            <div className="calendar-body">
              {scheduleData.calendar.map((week, weekIndex) => (
                <div key={weekIndex} className="calendar-week">
                  {week.map((day, dayIndex) => {
                    // null 값 처리 (현재 달이 아닌 날짜는 표시하지 않음)
                    if (!day) {
                      return <div key={dayIndex} className="calendar-day empty-day"></div>;
                    }
                    
                    return (
                      <div key={dayIndex} className={`calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'}`}>
                        <div className={`day-number ${day.date.getDay() === 0 ? 'sunday' : day.date.getDay() === 6 ? 'saturday' : ''}`}>
                          {day.date.getDate()}
                        </div>
                        <div className="day-events">
                          {day.events.map((event, eventIndex) => (
                            <div key={eventIndex} className="event-item">
                              <div className="event-title">{event.title}</div>
                              {event.target && event.target.length > 0 && (
                                <div className="event-target">
                                  {event.target.length > 1 ? 
                                    event.target.map((grade, gradeIndex) => (
                                      <div key={gradeIndex} className="grade-item">{grade}</div>
                                    )) : 
                                    event.target.join(', ')
                                  }
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
            } else {
              const formatDate = (date) => {
                return `${date.getMonth() + 1}월 ${date.getDate()}일`;
              };
              
              return (
                <div className="schedule-display">
                  <h2>주간 학사일정</h2>
                  <div className="week-range">
                    {formatDate(scheduleData?.weekStart)} ~ {formatDate(scheduleData?.weekEnd)}
                  </div>
                  <div className="weekly-calendar">
                    <div className="week-header">
                      <div className="week-day">일</div>
                      <div className="week-day">월</div>
                      <div className="week-day">화</div>
                      <div className="week-day">수</div>
                      <div className="week-day">목</div>
                      <div className="week-day">금</div>
                      <div className="week-day">토</div>
                    </div>
                    <div className="week-body">
                      {scheduleData?.weekData.map((day, index) => (
                        <div key={index} className="week-day-cell">
                          <div className={`week-day-number ${day.date.getDay() === 0 ? 'sunday' : day.date.getDay() === 6 ? 'saturday' : ''}`}>
                            {day.date.getDate()}
                          </div>
                          <div className="week-day-events">
                            {day.events.map((event, eventIndex) => (
                              <div key={eventIndex} className="week-event-item">
                                <div className="event-title">{event.title}</div>
                                {event.target && event.target.length > 0 && (
                                  <div className="event-target">
                                    {event.target.length > 1 ? 
                                      event.target.map((grade, gradeIndex) => (
                                        <div key={gradeIndex} className="grade-item">{grade}</div>
                                      )) : 
                                      event.target.join(', ')
                                    }
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
  };

  // 급식 컴포넌트
  const MealDisplay = ({ controlData }) => {
    const [mealData, setMealData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadMealData = async () => {
        setLoading(true);
        try {
          const days = controlData?.mealDate || 0;
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + days);
          const dateStr = targetDate.toISOString().split('T')[0];
          
          const data = await generateMealData(dateStr);
          setMealData(data);
        } catch (error) {
          console.error('급식 데이터 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      };

      loadMealData();
    }, [controlData?.mealDate]);

    if (loading) {
      return <div className="loading">급식 정보를 불러오는 중...</div>;
    }

    const getDateLabel = (days) => {
      if (days === 0) return '오늘';
      if (days < 0) return `${Math.abs(days)}일 전`;
      return `${days}일 후`;
    };

    return (
      <div className="meal-display">
        <div className="meal-date-header">
          <h2>{getDateLabel(controlData?.mealDate || 0)}의 급식</h2>
        </div>
        <div className="meal-sections">
          <div className="meal-section lunch-section">
            <h3>점심</h3>
            <div className="meal-items">
              {mealData?.lunch && mealData.lunch.length > 0 ? (
                mealData.lunch.map((item, index) => (
                  <div key={index} className="meal-item">{item}</div>
                ))
              ) : (
                <div className="no-meal-data">급식 정보가 없습니다.</div>
              )}
            </div>
          </div>
          <div className="meal-section dinner-section">
            <h3>저녁</h3>
            <div className="meal-items">
              {mealData?.dinner && mealData.dinner.length > 0 ? (
                mealData.dinner.map((item, index) => (
                  <div key={index} className="meal-item">{item}</div>
                ))
              ) : (
                <div className="no-meal-data">급식 정보가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 교내 배치도 컴포넌트
  const RoadmapDisplay = () => {
    const [campusImage, setCampusImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadCampusImage = async () => {
        try {
          const imageURL = await DataService.getCampusLayoutImage();
          setCampusImage(imageURL);
        } catch (error) {
          console.error('교실 배치 이미지 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      };

      loadCampusImage();
    }, []);

    if (loading) {
      return (
        <div className="roadmap-display">
          <h2>교내 배치도</h2>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>교실 배치 이미지를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="roadmap-display">
        <h2>교내 배치도</h2>
        {campusImage ? (
          <div className="campus-image-container">
            <img src={campusImage} alt="교실 배치도" className="campus-image" />
          </div>
        ) : (
          <div className="no-campus-image">
            <h3>준비 중</h3>
            <p>교실 배치도가 준비 중입니다.</p>
          </div>
        )}
      </div>
    );
  };

  // 공지사항 컴포넌트
  const AnnouncementDisplay = ({ announcements, controlData }) => {
    const [announcementData, setAnnouncementData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadAnnouncementData = async () => {
        setLoading(true);
        try {
          const data = await generateAnnouncementData();
          setAnnouncementData(data);
          
          // 현재 표시되는 공지사항의 조회수 증가
          const currentIndex = controlData?.announcementIndex || 0;
          const currentAnnouncement = data?.[currentIndex] || data?.[0];
          if (currentAnnouncement && currentAnnouncement.id) {
            await DataService.incrementAnnouncementViews(currentAnnouncement.id);
          }
        } catch (error) {
          console.error('공지사항 데이터 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      };

      loadAnnouncementData();
    }, [controlData?.announcementIndex]);
    
    const currentIndex = controlData?.announcementIndex || 0;
    const currentAnnouncement = announcementData?.[currentIndex] || announcementData?.[0];
    

    if (loading) {
      return <div className="loading">공지사항을 불러오는 중...</div>;
    }

    if (!announcementData || announcementData.length === 0) {
      return (
        <div className="announcement-display">
          <h2>공지사항</h2>
          <div className="no-announcements">
            등록된 공지사항이 없습니다.
          </div>
        </div>
      );
    }

    if (!currentAnnouncement) {
      return <div className="loading">공지사항을 불러오는 중...</div>;
    }
    

    return (
      <div className="announcement-display">
        <h2>공지사항</h2>
        <div className="announcement-table">
          <div className="announcement-header">
            <div className="col-number">번호</div>
            <div className="col-title">제목</div>
            <div className="col-date">등록일</div>
          </div>
          {announcementData.map((announcement, index) => (
            <div key={announcement.id} className={`announcement-row ${index === currentIndex ? 'active' : ''}`}>
              <div className="col-number">{index + 1}</div>
              <div className="col-title">{announcement.title}</div>
              <div className="col-date">{announcement.createdAt?.toDate?.()?.toLocaleDateString() || '2024.10.01'}</div>
            </div>
          ))}
        </div>
        <div className="announcement-content">
          <h3>{currentAnnouncement.title}</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{currentAnnouncement.content}</p>
          <div className="announcement-meta">
            <span>등록일: {currentAnnouncement.createdAt?.toDate?.()?.toLocaleDateString() || '2024.10.01'}</span>
            <span>조회수: {currentAnnouncement.views || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  // 메인 공지사항이 활성화된 경우 별도 화면 표시 (제어용과 동일한 구조)
  if (showMainNotice && mainNotice) {
    return (
      <div className="output-main notice-notice-active">
        <div className="notice-notice-header">
          <h1><Campaign sx={{ fontSize: 32, marginRight: 1 }} /> 메인 공지사항 활성화 중</h1>
        </div>
        
        <div className="notice-notice-content">
          <div className="notice-notice-text">
            <p><strong>{mainNotice.title}</strong></p>
            <p style={{ whiteSpace: 'pre-line' }}>{mainNotice.content}</p>
          </div>
          
          <div className="notice-notice-info">
            <div className="notice-notice-date">
              작성일: {new Date(mainNotice.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="output-main">
      {currentPage === 'main' && (
        <>
          <h1 className="school-name">{schoolInfo.name || '광주동신여자고등학교'}</h1>
          <h2 className="app-title">학교 생활 도우미</h2>
        </>
      )}
      
      <div className="content-area">
        {renderContent()}
      </div>
      
      {currentPage === 'main' && (
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span>연결됨</span>
          {/* 현재 PIN 표시 */}
          {sessionStorage.getItem('currentPin') && (
            <span>PIN: {sessionStorage.getItem('currentPin')}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default OutputMain;
