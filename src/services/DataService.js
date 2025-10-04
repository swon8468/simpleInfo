import { db, storage } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

class DataService {
  // 학사일정 데이터 관리
  async getScheduleData(year, month) {
    try {
      const scheduleRef = collection(db, 'schedules');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const q = query(
        scheduleRef, 
        where('eventDate', '>=', startDate),
        where('eventDate', '<=', endDate),
        orderBy('eventDate')
      );
      const querySnapshot = await getDocs(q);
      
      const schedules = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const eventDate = data.eventDate.toDate();
        const day = eventDate.getDate();
        
        if (!schedules[day]) {
          schedules[day] = [];
        }
        
        schedules[day].push({
          id: doc.id,
          title: data.title,
          target: data.target || [],
          createdAt: data.createdAt
        });
      });
      
      return schedules;
    } catch (error) {
      console.error('학사일정 데이터 가져오기 실패:', error);
      return {};
    }
  }

  // 주간 학사일정 데이터 가져오기
  async getWeeklyScheduleData(startDate, endDate) {
    try {
      console.log('DataService: 주간 학사일정 데이터 가져오기 시작', { startDate, endDate });
      
      // Date 객체를 Firebase Timestamp로 변환
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      console.log('DataService: 변환된 타임스탬프', { startTimestamp, endTimestamp });
      
      const scheduleRef = collection(db, 'schedules');
      const q = query(
        scheduleRef,
        where('eventDate', '>=', startTimestamp),
        where('eventDate', '<=', endTimestamp),
        orderBy('eventDate')
      );
      const querySnapshot = await getDocs(q);
      
      const schedules = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const eventDate = data.eventDate.toDate();
        const day = eventDate.getDate();
        
        if (!schedules[day]) {
          schedules[day] = [];
        }
        
        schedules[day].push({
          id: doc.id,
          title: data.title,
          target: data.target || [],
          createdAt: data.createdAt
        });
      });
      
      console.log('DataService: 주간 학사일정 데이터 가져오기 완료', schedules);
      return schedules;
    } catch (error) {
      console.error('주간 학사일정 데이터 가져오기 실패:', error);
      return {};
    }
  }

  async addScheduleEvent(year, month, day, title, target = []) {
    try {
      const scheduleRef = collection(db, 'schedules');
      const eventDate = new Date(year, month - 1, day);
      
      await addDoc(scheduleRef, {
        title,
        target,
        eventDate: eventDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('학사일정이 추가되었습니다.');
    } catch (error) {
      console.error('학사일정 추가 실패:', error);
      throw error;
    }
  }

  // 학사일정 수정
  async updateScheduleEventById(eventId, eventData) {
    try {
      const eventRef = doc(db, 'schedules', eventId);
      await updateDoc(eventRef, {
        ...eventData,
        updatedAt: serverTimestamp()
      });
      console.log('학사일정이 수정되었습니다.');
    } catch (error) {
      console.error('학사일정 수정 실패:', error);
      throw error;
    }
  }

  // 학사일정 삭제
  async deleteScheduleEvent(eventId) {
    try {
      const eventRef = doc(db, 'schedules', eventId);
      await deleteDoc(eventRef);
      console.log('학사일정이 삭제되었습니다.');
    } catch (error) {
      console.error('학사일정 삭제 실패:', error);
      throw error;
    }
  }

  async updateScheduleEvent(year, month, day, events) {
    try {
      const scheduleRef = collection(db, 'schedules');
      const q = query(
        scheduleRef,
        where('year', '==', year),
        where('month', '==', month),
        where('day', '==', day)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          events,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(scheduleRef, {
          year,
          month,
          day,
          events,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('학사일정 업데이트 실패:', error);
    }
  }

  // 급식 데이터 관리
  async getMealData(date) {
    try {
      const mealRef = collection(db, 'meals');
      const q = query(
        mealRef,
        where('date', '==', date)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const mealDoc = querySnapshot.docs[0].data();
        return {
          lunch: mealDoc.lunch || [],
          dinner: mealDoc.dinner || []
        };
      }
      
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
  }

  async addMealData(date, lunch, dinner) {
    try {
      const mealRef = collection(db, 'meals');
      await addDoc(mealRef, {
        date,
        lunch,
        dinner,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('급식 데이터 추가 실패:', error);
    }
  }

  async updateMealData(date, lunchItems, dinnerItems) {
    try {
      const mealRef = collection(db, 'meals');
      const q = query(mealRef, where('date', '==', date));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          lunch: lunchItems,
          dinner: dinnerItems,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(mealRef, {
          date,
          lunch: lunchItems,
          dinner: dinnerItems,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('급식 정보가 업데이트되었습니다.');
    } catch (error) {
      console.error('급식 정보 업데이트 실패:', error);
      throw error;
    }
  }

  // 급식 정보 삭제
  async deleteMealData(date) {
    try {
      const mealRef = collection(db, 'meals');
      const q = query(mealRef, where('date', '==', date));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      
      console.log('급식 정보가 삭제되었습니다.');
    } catch (error) {
      console.error('급식 정보 삭제 실패:', error);
      throw error;
    }
  }

  // 공지사항 데이터 관리
  async getAnnouncements() {
    try {
      console.log('DataService.getAnnouncements 시작');
      console.log('Firebase db 객체:', db);
      console.log('Firebase 연결 상태 확인 중...');
      
      // Firebase 연결 테스트
      const testRef = collection(db, 'announcements');
      console.log('테스트 컬렉션 참조:', testRef);
      
      const announcementRef = collection(db, 'announcements');
      console.log('announcementRef:', announcementRef);
      
      const q = query(announcementRef);
      console.log('쿼리 객체 (orderBy 제거):', q);
      
      console.log('Firebase 쿼리 실행 중...');
      const querySnapshot = await getDocs(q);
      console.log('Firebase 쿼리 결과:', querySnapshot.size, '개 문서');
      console.log('쿼리 소스:', querySnapshot.metadata.fromCache ? '캐시에서' : '서버에서');
      
      const announcements = [];
      querySnapshot.forEach((doc) => {
        console.log('문서 ID:', doc.id, '데이터:', doc.data());
        announcements.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('최종 공지사항 배열:', announcements);
      return announcements;
    } catch (error) {
      console.error('공지사항 데이터 가져오기 실패:', error);
      console.error('에러 상세:', error.message);
      console.error('에러 코드:', error.code);
      console.error('에러 스택:', error.stack);
      return [];
    }
  }

  async incrementAnnouncementViews(announcementId) {
    try {
      const announcementRef = doc(db, 'announcements', announcementId);
      await updateDoc(announcementRef, {
        views: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('공지사항 조회수 증가 실패:', error);
    }
  }

  async addAnnouncement(title, content) {
    try {
      const announcementRef = collection(db, 'announcements');
      await addDoc(announcementRef, {
        title,
        content,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('공지사항 추가 실패:', error);
    }
  }

  async updateAnnouncement(id, title, content) {
    try {
      const announcementRef = doc(db, 'announcements', id);
      await updateDoc(announcementRef, {
        title,
        content,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('공지사항 업데이트 실패:', error);
    }
  }

  async deleteAnnouncement(id) {
    try {
      const announcementRef = doc(db, 'announcements', id);
      await deleteDoc(announcementRef);
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
    }
  }

  async incrementAnnouncementViews(id) {
    try {
      const announcementRef = doc(db, 'announcements', id);
      const docSnap = await getDoc(announcementRef);
      
      if (docSnap.exists()) {
        const currentViews = docSnap.data().views || 0;
        await updateDoc(announcementRef, {
          views: currentViews + 1,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('공지사항 조회수 증가 실패:', error);
    }
  }

  // 알레르기 정보 관리
  async getAllergyInfo() {
    try {
      const allergyRef = doc(db, 'settings', 'allergy');
      const docSnap = await getDoc(allergyRef);
      
      if (docSnap.exists()) {
        return docSnap.data().items || [];
      }
      return [];
    } catch (error) {
      console.error('알레르기 정보 가져오기 실패:', error);
      return [];
    }
  }

  // 학교 정보 관리
  async getSchoolInfo() {
    try {
      const schoolRef = doc(db, 'settings', 'school');
      const docSnap = await getDoc(schoolRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return {};
    } catch (error) {
      console.error('학교 정보 가져오기 실패:', error);
      return {};
    }
  }

  async updateSchoolInfo(name, teamName) {
    try {
      const schoolRef = doc(db, 'settings', 'school');
      await updateDoc(schoolRef, {
        name,
        teamName,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('학교 정보 업데이트 실패:', error);
    }
  }

  // 알레르기 정보 업데이트
  async updateAllergyInfo(items) {
    try {
      console.log('DataService: 알레르기 정보 업데이트 시작:', items);
      
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('알레르기 정보가 올바르지 않습니다.');
      }
      
      const allergyRef = doc(db, 'settings', 'allergy');
      const data = {
        items: items,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      console.log('Firestore에 저장할 데이터:', data);
      
      await setDoc(allergyRef, data, { merge: true });
      
      console.log('알레르기 정보 업데이트 완료');
    } catch (error) {
      console.error('알레르기 정보 업데이트 실패:', error);
      throw error;
    }
  }

  // 초기 데이터 설정
  async initializeData() {
    // 하드코딩된 기본 데이터 삽입 로직 제거
    // DB에 데이터가 없을 경우, 프론트엔드에서 안내하거나 별도 처리 필요
    // 이 함수는 더 이상 아무 동작도 하지 않음
    return;
  }
  // 교실 배치 이미지 관리
  async uploadCampusLayoutImage(file) {
    try {
      console.log('이미지 업로드 시작:', file.name, file.size, file.type);
      
      // 파일 유효성 검사
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
        throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
      }
      
      // 고유한 파일명 생성
      const timestamp = Date.now();
      const fileName = `campus-layout-${timestamp}.${file.name.split('.').pop()}`;
      const imageRef = ref(storage, `campus-layout/${fileName}`);
      
      console.log('Storage 참조 생성:', imageRef.fullPath);
      
      // 이미지 업로드 (메타데이터 포함)
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: 'admin',
          uploadTime: timestamp.toString()
        }
      };
      
      const uploadResult = await uploadBytes(imageRef, file, metadata);
      console.log('업로드 완료:', uploadResult);
      
      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('다운로드 URL:', downloadURL);
      
      // Firestore에 이미지 URL 저장
      const docRef = doc(db, 'settings', 'campusLayout');
      await setDoc(docRef, {
        imageURL: downloadURL,
        fileName: fileName,
        uploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('Firestore 저장 완료');
      return downloadURL;
    } catch (error) {
      console.error('교실 배치 이미지 업로드 실패:', error);
      
      // 구체적인 오류 메시지 제공
      if (error.code === 'storage/unauthorized') {
        throw new Error('Firebase Storage 권한이 없습니다. 관리자에게 문의하세요.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('업로드가 취소되었습니다.');
      } else if (error.code === 'storage/unknown') {
        throw new Error('알 수 없는 오류가 발생했습니다.');
      }
      
      throw error;
    }
  }

  async getCampusLayoutImage() {
    try {
      const docRef = doc(db, 'settings', 'campusLayout');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().imageURL;
      }
      return null;
    } catch (error) {
      console.error('교실 배치 이미지 가져오기 실패:', error);
      return null;
    }
  }

  async deleteCampusLayoutImage() {
    try {
      console.log('이미지 삭제 시작');
      
      // Firestore에서 현재 이미지 정보 가져오기
      const docRef = doc(db, 'settings', 'campusLayout');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fileName = data.fileName;
        
        if (fileName) {
          // Storage에서 이미지 삭제
          const imageRef = ref(storage, `campus-layout/${fileName}`);
          await deleteObject(imageRef);
          console.log('Storage에서 이미지 삭제 완료:', fileName);
        }
      }
      
      // Firestore에서 URL 삭제
      await setDoc(docRef, {
        imageURL: null,
        fileName: null,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('Firestore에서 이미지 정보 삭제 완료');
    } catch (error) {
      console.error('교실 배치 이미지 삭제 실패:', error);
      throw error;
    }
  }

  // 패치 노트 관련 함수들
  async getPatchnotes() {
    try {
      const patchnotesRef = collection(db, 'patchnotes');
      const patchnotesSnapshot = await getDocs(patchnotesRef);
      return patchnotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error('패치 노트 목록을 가져오는데 실패했습니다.');
    }
  }

  async createPatchnote(patchnoteData) {
    try {
      const patchnotesRef = collection(db, 'patchnotes');

      await addDoc(patchnotesRef, {
        version: patchnoteData.version,
        date: patchnoteData.date,
        title: patchnoteData.title,
        content: patchnoteData.content,
        type: patchnoteData.type,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('패치 노트 등록에 실패했습니다.');
    }
  }

  async updatePatchnote(patchnoteId, patchnoteData) {
    try {
      const patchnoteRef = doc(db, 'patchnotes', patchnoteId);
      await updateDoc(patchnoteRef, {
        version: patchnoteData.version,
        date: patchnoteData.date,
        title: patchnoteData.title,
        content: patchnoteData.content,
        type: patchnoteData.type,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('패치 노트 수정에 실패했습니다.');
    }
  }

  async deletePatchnote(patchnoteId) {
    try {
      const patchnoteRef = doc(db, 'patchnotes', patchnoteId);
      await deleteDoc(patchnoteRef);
    } catch (error) {
      throw new Error('패치 노트 삭제에 실패했습니다.');
    }
  }
}

export default new DataService();
