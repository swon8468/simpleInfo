import { useState, useEffect } from 'react';
import { 
  Add, 
  Edit, 
  Delete, 
  Person, 
  Security, 
  AdminPanelSettings,
  CheckCircle,
  Cancel,
  Save,
  Warning
} from '@mui/icons-material';
import DataService from '../services/DataService';
import './AdminManagement.css';

function AdminManagement({ currentAdmin }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // 폼 데이터
  const [formData, setFormData] = useState({
    name: '',
    adminCode: '',
    permissions: [],
    level: '일반 관리자'
  });

  // 권한 옵션
  const permissionOptions = [
    { key: 'schedule', label: '학사일정 관리' },
    { key: 'meal', label: '급식 관리' },
    { key: 'announcement', label: '공지사항 관리' },
    { key: 'allergy', label: '알레르기 관리' },
    { key: 'campusLayout', label: '교실 배치 관리' },
    { key: 'mainNotice', label: '메인 공지사항 관리' },
    { key: 'patchnotes', label: '패치노트 관리' },
    { key: 'schoolBlocking', label: '학교 차단 관리' },
    { key: 'pins', label: 'PIN 관리' },
    { key: 'adminManagement', label: '관리자 관리' }
  ];

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const adminList = await DataService.getAdmins();
      setAdmins(adminList);
    } catch (error) {
      showMessage('관리자 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      adminCode: '',
      permissions: [],
      level: '일반 관리자'
    });
    setShowAddForm(false);
    setEditingAdmin(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permissionKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey]
    }));
  };

  const handleAddAdmin = async () => {
    try {
      if (!formData.name.trim() || !formData.adminCode.trim()) {
        showMessage('이름과 관리자 코드를 입력해주세요.', 'error');
        return;
      }

      if (formData.permissions.length === 0) {
        showMessage('최소 하나의 권한을 선택해주세요.', 'error');
        return;
      }

      await DataService.createAdmin(formData);
      showMessage('관리자가 성공적으로 생성되었습니다.');
      resetForm();
      loadAdmins();
    } catch (error) {
      showMessage(error.message || '관리자 생성에 실패했습니다.', 'error');
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      adminCode: admin.adminCode,
      permissions: admin.permissions || [],
      level: admin.level || '일반 관리자'
    });
    setShowAddForm(true);
  };

  const handleUpdateAdmin = async () => {
    try {
      if (!formData.name.trim()) {
        showMessage('이름을 입력해주세요.', 'error');
        return;
      }

      if (formData.permissions.length === 0) {
        showMessage('최소 하나의 권한을 선택해주세요.', 'error');
        return;
      }

      await DataService.updateAdmin(editingAdmin.id, formData);
      showMessage('관리자 정보가 성공적으로 수정되었습니다.');
      resetForm();
      loadAdmins();
    } catch (error) {
      showMessage(error.message || '관리자 수정에 실패했습니다.', 'error');
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (admin.id === currentAdmin?.id) {
      showMessage('자신의 계정은 삭제할 수 없습니다.', 'error');
      return;
    }

    if (window.confirm(`정말로 "${admin.name}" 관리자를 삭제하시겠습니까?`)) {
      try {
        await DataService.deleteAdmin(admin.id);
        showMessage('관리자가 성공적으로 삭제되었습니다.');
        loadAdmins();
      } catch (error) {
        showMessage('관리자 삭제에 실패했습니다.', 'error');
      }
    }
  };

  const canManageAdmins = currentAdmin?.level === '최고 관리자';

  return (
    <div className="admin-management">
      <div className="admin-management-header">
        <h2>
          <AdminPanelSettings sx={{ fontSize: 24, marginRight: 1 }} />
          관리자 관리
        </h2>
        {canManageAdmins && (
          <button 
            className="add-admin-btn"
            onClick={() => setShowAddForm(true)}
          >
            <Add sx={{ fontSize: 20, marginRight: 0.5 }} />
            관리자 추가
          </button>
        )}
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {messageType === 'error' ? <Warning sx={{ fontSize: 20, marginRight: 0.5 }} /> : <CheckCircle sx={{ fontSize: 20, marginRight: 0.5 }} />}
          {message}
        </div>
      )}

      {/* 관리자 추가/수정 폼 */}
      {showAddForm && (
        <div className="admin-form">
          <div className="form-header">
            <h3>
              {editingAdmin ? '관리자 수정' : '새 관리자 추가'}
            </h3>
            <button className="close-btn" onClick={resetForm}>
              <Cancel sx={{ fontSize: 20 }} />
            </button>
          </div>

          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="관리자 이름을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label>관리자 코드</label>
            <input
              type="text"
              name="adminCode"
              value={formData.adminCode}
              onChange={handleInputChange}
              placeholder="관리자 코드를 입력하세요"
              disabled={editingAdmin} // 수정 시에는 관리자 코드 변경 불가
            />
            {editingAdmin && (
              <small className="disabled-note">관리자 코드는 수정할 수 없습니다.</small>
            )}
          </div>

          <div className="form-group">
            <label>등급</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
            >
              <option value="일반 관리자">일반 관리자</option>
              <option value="최고 관리자">최고 관리자</option>
            </select>
          </div>

          <div className="form-group">
            <label>권한 설정</label>
            <div className="permissions-grid">
              {permissionOptions.map(option => (
                <label key={option.key} className="permission-item">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(option.key)}
                    onChange={() => handlePermissionChange(option.key)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="save-btn"
              onClick={editingAdmin ? handleUpdateAdmin : handleAddAdmin}
            >
              <Save sx={{ fontSize: 20, marginRight: 0.5 }} />
              {editingAdmin ? '수정' : '추가'}
            </button>
            <button className="cancel-btn" onClick={resetForm}>
              <Cancel sx={{ fontSize: 20, marginRight: 0.5 }} />
              취소
            </button>
          </div>
        </div>
      )}

      {/* 관리자 목록 */}
      <div className="admin-list">
        <h3>관리자 목록</h3>
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <div className="admin-table">
            <div className="table-header">
              <div>이름</div>
              <div>관리자 코드</div>
              <div>등급</div>
              <div>권한</div>
              <div>생성일</div>
              <div>작업</div>
            </div>
            {admins.map(admin => (
              <div key={admin.id} className="table-row">
                <div className="admin-name">
                  <Person sx={{ fontSize: 20, marginRight: 0.5 }} />
                  {admin.name}
                </div>
                <div className="admin-code">
                  <Security sx={{ fontSize: 20, marginRight: 0.5 }} />
                  {admin.adminCode}
                </div>
                <div className={`admin-level ${admin.level === '최고 관리자' ? 'super' : 'normal'}`}>
                  {admin.level}
                </div>
                <div className="admin-permissions">
                  {admin.permissions?.length || 0}개 권한
                </div>
                <div className="admin-date">
                  {admin.createdAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'}
                </div>
                <div className="admin-actions">
                  {canManageAdmins && admin.id !== currentAdmin?.id && (
                    <>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditAdmin(admin)}
                      >
                        <Edit sx={{ fontSize: 16 }} />
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteAdmin(admin)}
                      >
                        <Delete sx={{ fontSize: 16 }} />
                      </button>
                    </>
                  )}
                  {admin.id === currentAdmin?.id && (
                    <span className="current-admin">현재 관리자</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManagement;
