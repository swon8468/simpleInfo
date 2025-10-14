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
      
      console.log('학사일정이 추가되었습니다:', { year, month, day, title, target });
    } catch (error) {
      console.error('학사일정 추가 실패:', error);
      throw error;
    }
  }

  // 학사일정 수정
  async updateScheduleEventById(eventId, eventData) {
    try {
      const eventRef = doc(db, 'schedules', eventId);
      
      // eventDate가 문자열인 경우 Date 객체로 변환
      const updateData = { ...eventData };
      if (updateData.eventDate && typeof updateData.eventDate === 'string') {
        updateData.eventDate = new Date(updateData.eventDate);
      }
      
      await updateDoc(eventRef, {
        ...updateData,
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
      
      console.log('급식 데이터가 추가되었습니다:', { date, lunch, dinner });
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
        
        console.log('급식 데이터가 생성되었습니다:', { date, lunchItems, dinnerItems });
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
      const announcementRef = collection(db, 'announcements');
      const q = query(announcementRef);
      const querySnapshot = await getDocs(q);
      
      const announcements = [];
      querySnapshot.forEach((doc) => {
        announcements.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return announcements;
    } catch (error) {
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
      // 공지사항 조회수 증가 실패
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
      throw error;
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
      throw error;
    }
  }

  async deleteAnnouncement(id) {
    try {
      const announcementRef = doc(db, 'announcements', id);
      await deleteDoc(announcementRef);
    } catch (error) {
      throw error;
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
      // 공지사항 조회수 증가 실패
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

  // 알레르기 정보 관리 (새로운 컬렉션)
  async getAllergyItems() {
    try {
      const allergyItemsRef = collection(db, 'allergyItems');
      const allergyItemsSnapshot = await getDocs(allergyItemsRef);
      return allergyItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error('알레르기 항목 목록을 가져오는데 실패했습니다.');
    }
  }

  async addAllergyItem(itemName) {
    try {
      const allergyItemsRef = collection(db, 'allergyItems');
      await addDoc(allergyItemsRef, {
        name: itemName.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('알레르기 항목 추가에 실패했습니다.');
    }
  }

  async updateAllergyItem(itemId, itemName) {
    try {
      const itemRef = doc(db, 'allergyItems', itemId);
      await updateDoc(itemRef, {
        name: itemName.trim(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('알레르기 항목 수정에 실패했습니다.');
    }
  }

  async deleteAllergyItem(itemId) {
    try {
      const itemRef = doc(db, 'allergyItems', itemId);
      await deleteDoc(itemRef);
    } catch (error) {
      throw new Error('알레르기 항목 삭제에 실패했습니다.');
    }
  }

  async deleteAllAllergyItems() {
    try {
      const allergyItemsRef = collection(db, 'allergyItems');
      const allergyItemsSnapshot = await getDocs(allergyItemsRef);
      
      const deletePromises = allergyItemsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      throw new Error('모든 알레르기 항목 삭제에 실패했습니다.');
    }
  }

  // 관리자 관리
  async getAdmins() {
    try {
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, orderBy('createdAt', 'desc'));
      const adminsSnapshot = await getDocs(q);
      return adminsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('관리자 목록 가져오기 실패:', error);
      throw error;
    }
  }

  async getAdminByCode(adminCode) {
    try {
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('adminCode', '==', adminCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('관리자 조회 실패:', error);
      throw error;
    }
  }

  async createAdmin(adminData) {
    try {
      // 관리자 코드 중복 확인
      const existingAdmin = await this.getAdminByCode(adminData.adminCode);
      if (existingAdmin) {
        throw new Error('이미 존재하는 관리자 코드입니다.');
      }

      const adminsRef = collection(db, 'admins');
      const docRef = await addDoc(adminsRef, {
        name: adminData.name,
        adminCode: adminData.adminCode,
        permissions: adminData.permissions || [],
        level: adminData.level || '일반 관리자',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      });
      
      return docRef.id;
    } catch (error) {
      console.error('관리자 생성 실패:', error);
      throw error;
    }
  }

  async updateAdmin(adminId, adminData) {
    try {
      const adminRef = doc(db, 'admins', adminId);
      
      // 관리자 코드는 수정 불가
      const updateData = {
        name: adminData.name,
        permissions: adminData.permissions || [],
        level: adminData.level || '일반 관리자',
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(adminRef, updateData);
    } catch (error) {
      console.error('관리자 수정 실패:', error);
      throw error;
    }
  }

  async deleteAdmin(adminId) {
    try {
      const adminRef = doc(db, 'admins', adminId);
      await deleteDoc(adminRef);
    } catch (error) {
      console.error('관리자 삭제 실패:', error);
      throw error;
    }
  }

  async checkAdminCodeExists(adminCode, excludeId = null) {
    try {
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('adminCode', '==', adminCode));
      const querySnapshot = await getDocs(q);
      
      if (excludeId) {
        return querySnapshot.docs.some(doc => doc.id !== excludeId);
      }
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('관리자 코드 중복 확인 실패:', error);
      throw error;
    }
  }


  // 관리자 세션 연결 해제
  async disconnectAdminSessions(adminCode) {
    try {
      // 현재 활성화된 모든 연결을 가져와서 해당 관리자와 관련된 세션 해제
      const connectionsRef = collection(db, 'connections');
      const querySnapshot = await getDocs(connectionsRef);
      
      const disconnectPromises = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // 관리자 코드가 일치하는 세션이 있으면 해제
        if (data.adminCode === adminCode || data.connectedAdminCode === adminCode) {
          disconnectPromises.push(deleteDoc(doc.ref));
        }
      });
      
      await Promise.all(disconnectPromises);
    } catch (error) {
      throw error;
    }
  }


}

export default new DataService();
