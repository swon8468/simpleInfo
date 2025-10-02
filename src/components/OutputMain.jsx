import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionService from '../services/ConnectionService';
import DataService from '../services/DataService';
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

  useEffect(() => {
    // 연결된 PIN으로 실시간 데이터 구독
    const savedPin = localStorage.getItem('currentPin');
    const outputSessionId = localStorage.getItem('outputSessionId');
    console.log('OutputMain: 연결된 PIN:', savedPin, '세션 ID:', outputSessionId);
    
    if (savedPin && outputSessionId) {
      ConnectionService.subscribeToControlData(savedPin, (data) => {
        console.log('OutputMain: 실시간 데이터 수신:', data);
        setConnectionData(data);
        if (data.controlData) {
          const newControlData = data.controlData;
          const newPage = newControlData.currentPage || 'main';
          
          console.log('OutputMain: 새로운 제어 데이터:', newControlData);
          console.log('OutputMain: 새로운 페이지:', newPage);
          
          // 관리자에 의해 연결이 해제된 경우 메인 화면으로 이동
          if (newControlData.adminRemoved) {
            console.log('관리자에 의해 연결이 해제되었습니다:', newControlData.message);
            localStorage.removeItem('currentPin');
            localStorage.removeItem('outputSessionId');
            navigate('/');
            return;
          }
          
          // 제어 데이터 업데이트 (항상 업데이트)
          setControlData(newControlData);
          
          // 페이지 변경 (항상 업데이트)
          console.log('페이지 변경:', currentPage, '->', newPage);
          setCurrentPage(newPage);
        }
      });

              // 연결 모니터링 시작
              const cleanupMonitoring = ConnectionService.startConnectionMonitoring(savedPin, () => {
                // 연결 해제 시 제어용 기기도 연결 해제
                ConnectionService.disconnect(savedPin);
                // 출력용 화면을 메인으로 리셋하고 메인 화면으로 이동
                setCurrentPage('main');
                setControlData(null);
                navigate('/');
              });

      // 페이지 언로드 시 연결 해제
      const cleanupUnload = ConnectionService.setupPageUnloadHandler(savedPin);

      return () => {
        cleanupMonitoring();
        cleanupUnload();
      };
    }

    // 초기 데이터 로드
    console.log('useEffect에서 loadInitialData 호출');
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('loadInitialData 시작');
      
      // 학교 정보 로드
      const school = await DataService.getSchoolInfo();
      console.log('학교 정보 로드 완료:', school);
      setSchoolInfo(school);

      // 공지사항 로드
      console.log('공지사항 로드 시작...');
      const announcementData = await generateAnnouncementData();
      console.log('로드된 공지사항:', announcementData);
      console.log('공지사항 개수:', announcementData.length);
      setAnnouncements(announcementData);

      // 현재 날짜의 학사일정 로드
      const currentDate = new Date();
      const scheduleData = await generateScheduleData(currentDate, 'monthly');
      setScheduleData(scheduleData);

      // 오늘의 급식 로드
      const today = new Date().toISOString().split('T')[0];
      const mealData = await generateMealData(today);
      setMealData(mealData);

    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
    }
  };

  // 공지사항 데이터 생성 (Firebase 데이터 기반)
  const generateAnnouncementData = async () => {
    try {
      console.log('generateAnnouncementData 시작');
      const announcements = await DataService.getAnnouncements();
      console.log('Firebase에서 가져온 공지사항 데이터:', announcements);
      
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
      
      // 6주 * 7일 = 42일 달력
      for (let week = 0; week < 6; week++) {
        const weekData = [];
        for (let day = 0; day < 7; day++) {
          const dayData = {
            date: new Date(current),
            isCurrentMonth: current.getMonth() === month,
            events: current.getMonth() === month ? (schedules[current.getDate()] || []) : []
          };
          
          weekData.push(dayData);
          current.setDate(current.getDate() + 1);
        }
        calendar.push(weekData);
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
      console.log('급식 데이터 요청 날짜:', date);
      const meal = await DataService.getMealData(date);
      console.log('Firebase에서 가져온 급식 데이터:', meal);
      
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
    console.log('OutputMain: renderContent 호출, currentPage:', currentPage);
    switch (currentPage) {
      case 'schedule':
        console.log('OutputMain: 학사일정 렌더링');
        return <ScheduleDisplay controlData={controlData} />;
        
      case 'meal':
        console.log('OutputMain: 급식 렌더링');
        return <MealDisplay controlData={controlData} />;
        
      case 'roadmap':
        console.log('OutputMain: 교실 배치 렌더링');
        return <RoadmapDisplay />;
        
      case 'announcement':
        console.log('OutputMain: 공지사항 렌더링');
        return <AnnouncementDisplay announcements={announcements} controlData={controlData} />;
        
      default:
        console.log('OutputMain: 메인 화면 렌더링');
        // 메인 화면 - 로고와 제목만 표시
        return (
          <div className="main-display">
            <div className="logo-section">
              <div className="school-logo">🏫</div>
              <h1 className="main-title">{schoolInfo.name}</h1>
              <h2 className="main-subtitle">학교생활도우미</h2>
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
                  {week.map((day, dayIndex) => (
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
                  ))}
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
      if (days === -1) return '어제';
      if (days === 1) return '내일';
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
          <div className="loading">교실 배치 정보를 불러오는 중...</div>
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
          console.log('AnnouncementDisplay에서 데이터 로드 시작');
          const data = await generateAnnouncementData();
          console.log('AnnouncementDisplay에서 로드된 데이터:', data);
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

    console.log('AnnouncementDisplay 렌더링 시작');
    console.log('받은 announcements:', announcements);
    console.log('받은 controlData:', controlData);
    console.log('로드된 announcementData:', announcementData);
    
    const currentIndex = controlData?.announcementIndex || 0;
    const currentAnnouncement = announcementData?.[currentIndex] || announcementData?.[0];
    
    console.log('currentIndex:', currentIndex);
    console.log('currentAnnouncement:', currentAnnouncement);

    if (loading) {
      return <div className="loading">공지사항을 불러오는 중...</div>;
    }

    if (!announcementData || announcementData.length === 0) {
      console.log('공지사항이 없음 - 빈 배열 표시');
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
      console.log('현재 공지사항이 없음 - 로딩 표시');
      return <div className="loading">공지사항을 불러오는 중...</div>;
    }
    
    console.log('공지사항 표시 중:', currentAnnouncement);

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
          <p>{currentAnnouncement.content}</p>
          <div className="announcement-meta">
            <span>등록일: {currentAnnouncement.createdAt?.toDate?.()?.toLocaleDateString() || '2024.10.01'}</span>
            <span>조회수: {currentAnnouncement.views || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="output-main">
      {console.log('OutputMain: 렌더링, currentPage:', currentPage)}
      {currentPage === 'main' && (
        <>
          <div className="monitor-icon">🖥️</div>
          <h1 className="school-name">{schoolInfo.name || '광주동신여자고등학교'}</h1>
          <h2 className="app-title">학교생활도우미</h2>
          <h3 className="team-name">{schoolInfo.teamName || '-- 대충 팀 명 --'}</h3>
        </>
      )}
      
      <div className="content-area">
        {renderContent()}
      </div>
      
      {currentPage === 'main' && (
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span>연결됨</span>
        </div>
      )}
    </div>
  );
}

export default OutputMain;
