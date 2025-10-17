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
  Warning,
  Check,
  Close,
  ArrowUpward,
  ArrowDownward
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
  const [codeCheckStatus, setCodeCheckStatus] = useState(''); // 'checking', 'available', 'duplicate'
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [hoveredAdmin, setHoveredAdmin] = useState(null);

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
    { key: 'adminManagement', label: '관리자 관리' },
    { key: 'systemManagement', label: '시스템 관리' }
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
    setCodeCheckStatus('');
  };

  // 관리자 코드 중복 확인
  const checkCodeDuplicate = async () => {
    if (!formData.adminCode.trim()) {
      setCodeCheckStatus('');
      return;
    }

    setCodeCheckStatus('checking');
    try {
      const exists = await DataService.checkAdminCodeExists(formData.adminCode, editingAdmin?.id);
      setCodeCheckStatus(exists ? 'duplicate' : 'available');
    } catch (error) {
      console.error('코드 중복 확인 실패:', error);
      setCodeCheckStatus('');
    }
  };

  // 정렬 함수
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬된 관리자 목록
  const sortedAdmins = [...admins].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'level') {
      // 등급 정렬: 최고 관리자 > 일반 관리자
      const levelOrder = { '최고 관리자': 2, '일반 관리자': 1 };
      aValue = levelOrder[aValue] || 0;
      bValue = levelOrder[bValue] || 0;
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // 필터링된 관리자 목록 (일반 관리자는 일반 관리자만 보기)
  const filteredAdmins = currentAdmin?.level === '최고 관리자' 
    ? sortedAdmins 
    : sortedAdmins.filter(admin => admin.level === '일반 관리자');

  // 관리자 수정/삭제 권한 체크
  const canEditAdmin = (admin) => {
    // 본인은 수정 가능
    if (admin.id === currentAdmin?.id) return true;
    
    // 최고 관리자는 다른 최고 관리자 수정 불가
    if (currentAdmin?.level === '최고 관리자' && admin.level === '최고 관리자') {
      return false;
    }
    
    // 최고 관리자는 일반 관리자 수정 가능
    if (currentAdmin?.level === '최고 관리자' && admin.level === '일반 관리자') {
      return true;
    }
    
    // 일반 관리자는 다른 관리자 수정 불가
    return false;
  };

  const canDeleteAdmin = (admin) => {
    // 본인은 삭제 불가
    if (admin.id === currentAdmin?.id) return false;
    
    // 최고 관리자는 다른 최고 관리자 삭제 불가
    if (currentAdmin?.level === '최고 관리자' && admin.level === '최고 관리자') {
      return false;
    }
    
    // 최고 관리자는 일반 관리자 삭제 가능
    if (currentAdmin?.level === '최고 관리자' && admin.level === '일반 관리자') {
      return true;
    }
    
    // 일반 관리자는 다른 관리자 삭제 불가
    return false;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // 최고 관리자로 변경 시 모든 권한 자동 부여
      if (name === 'level' && value === '최고 관리자') {
        newData.permissions = ['schedule', 'meal', 'announcement', 'allergy', 'campusLayout', 'mainNotice', 'patchnotes', 'schoolBlocking', 'pins', 'adminManagement', 'systemManagement'];
      }
      
      return newData;
    });
  };

  const handlePermissionChange = (permissionKey) => {
    // 일반 관리자일 때는 'adminManagement', 'systemManagement' 권한을 절대 부여할 수 없음
    if (formData.level !== '최고 관리자' && (permissionKey === 'adminManagement' || permissionKey === 'systemManagement')) {
      return; // 무시
    }
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

      // 일반 관리자는 최소 1개 권한 필요
      if (formData.level !== '최고 관리자' && formData.permissions.length === 0) {
        showMessage('최소 하나의 권한을 선택해주세요.', 'error');
        return;
      }

      // 일반 관리자일 경우 금지 권한 제거 후 저장
      const payload = { ...formData };
      if (payload.level !== '최고 관리자') {
        payload.permissions = (payload.permissions || []).filter((p) => p !== 'adminManagement' && p !== 'systemManagement');
      }

      await DataService.createAdmin(payload);
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

      // 최고 관리자 수정 시 이름만 변경 가능
      if (editingAdmin.level === '최고 관리자') {
        const updatePayload = {
          name: formData.name
        };
        
        await DataService.updateAdmin(editingAdmin.id, updatePayload);
        showMessage('관리자 이름이 성공적으로 수정되었습니다.');
        resetForm();
        loadAdmins();
        return;
      }

      // 일반 관리자는 최소 1개 권한 필요
      if (formData.level !== '최고 관리자' && formData.permissions.length === 0) {
        showMessage('최소 하나의 권한을 선택해주세요.', 'error');
        return;
      }

      // 관리자 정보 변경 전 원본 정보 저장
      const originalAdmin = editingAdmin;
      
      // 일반 관리자일 경우 금지 권한 제거 후 업데이트
      const updatePayload = { ...formData };
      if (updatePayload.level !== '최고 관리자') {
        updatePayload.permissions = (updatePayload.permissions || []).filter((p) => p !== 'adminManagement' && p !== 'systemManagement');
      }

      await DataService.updateAdmin(editingAdmin.id, updatePayload);
      
      // 관리자 정보가 변경된 경우 해당 관리자 연결 해제
      if (originalAdmin.adminCode !== formData.adminCode || 
          originalAdmin.name !== formData.name ||
          JSON.stringify(originalAdmin.permissions) !== JSON.stringify(updatePayload.permissions) ||
          originalAdmin.level !== updatePayload.level) {
        
        // 해당 관리자의 모든 세션 연결 해제
        await DataService.disconnectAdminSessions(formData.adminCode);
      }
      
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
            onClick={() => {
              // 수정 중이면 수정 폼을 닫고 새로 추가 폼을 열기
              if (editingAdmin) {
                setEditingAdmin(null);
                resetForm();
              }
              setShowAddForm(true);
            }}
          >
            <Add sx={{ fontSize: 20, marginRight: 0.5 }} />
            {editingAdmin ? '새 관리자 추가' : '관리자 추가'}
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
            <div className="code-input-container">
              <input
                type="text"
                name="adminCode"
                value={formData.adminCode}
                onChange={handleInputChange}
                placeholder="관리자 코드를 입력하세요"
                disabled={editingAdmin || codeCheckStatus === 'available' || (editingAdmin && editingAdmin.level === '최고 관리자')} // 수정 시 또는 중복 확인 완료 시 비활성화, 최고 관리자 수정 시 비활성화
              />
              {!editingAdmin && (
                <button 
                  type="button"
                  className={`check-btn ${codeCheckStatus}`}
                  onClick={checkCodeDuplicate}
                  disabled={!formData.adminCode.trim() || codeCheckStatus === 'checking'}
                >
                  {codeCheckStatus === 'checking' ? '확인중...' : 
                   codeCheckStatus === 'available' ? <Check sx={{ fontSize: 16 }} /> :
                   codeCheckStatus === 'duplicate' ? <Close sx={{ fontSize: 16 }} /> : '중복확인'}
                </button>
              )}
            </div>
            {editingAdmin && (
              <small className="disabled-note">관리자 코드는 수정할 수 없습니다.</small>
            )}
            {codeCheckStatus === 'available' && (
              <small className="success-note">사용 가능한 관리자 코드입니다.</small>
            )}
            {codeCheckStatus === 'duplicate' && (
              <small className="error-note">이미 존재하는 관리자 코드입니다.</small>
            )}
          </div>

          <div className="form-group">
            <label>등급</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              disabled={editingAdmin && editingAdmin.level === '최고 관리자'}
            >
              <option value="일반 관리자">일반 관리자</option>
              <option value="최고 관리자">최고 관리자</option>
            </select>
            {editingAdmin && editingAdmin.level === '최고 관리자' && (
              <small className="disabled-note">최고 관리자의 등급은 수정할 수 없습니다.</small>
            )}
          </div>

          <div className="form-group">
            <label>권한 설정</label>
            {editingAdmin && editingAdmin.level === '최고 관리자' ? (
              <div className="permissions-disabled">
                <div className="disabled-message">
                  <CheckCircle sx={{ fontSize: 20, marginRight: 0.5, color: '#4caf50' }} />
                  최고 관리자의 권한은 수정할 수 없습니다.
                </div>
                <div className="permissions-list">
                  {permissionOptions.map(option => (
                    <div key={option.key} className="permission-item-disabled">
                      <CheckCircle sx={{ fontSize: 16, marginRight: 0.5, color: '#4caf50' }} />
                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : formData.level === '최고 관리자' ? (
              <div className="permissions-disabled">
                <div className="disabled-message">
                  <CheckCircle sx={{ fontSize: 20, marginRight: 0.5, color: '#4caf50' }} />
                  최고 관리자는 모든 권한이 자동으로 부여됩니다.
                </div>
                <div className="permissions-list">
                  {permissionOptions.map(option => (
                    <div key={option.key} className="permission-item-disabled">
                      <CheckCircle sx={{ fontSize: 16, marginRight: 0.5, color: '#4caf50' }} />
                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="permissions-grid">
                {permissionOptions.map(option => {
                  const disabled = formData.level !== '최고 관리자' && (option.key === 'adminManagement' || option.key === 'systemManagement');
                  return (
                    <label key={option.key} className="permission-item" style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(option.key)}
                        onChange={() => handlePermissionChange(option.key)}
                        disabled={disabled}
                      />
                      <span>{option.label}{disabled ? ' (최고 관리자 전용)' : ''}</span>
                    </label>
                  );
                })}
              </div>
            )}
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
              <div 
                className="sortable-header"
                onClick={() => handleSort('name')}
              >
                이름
                {sortField === 'name' && (
                  sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 16 }} /> : <ArrowDownward sx={{ fontSize: 16 }} />
                )}
              </div>
              <div 
                className="sortable-header"
                onClick={() => handleSort('adminCode')}
              >
                관리자 코드
                {sortField === 'adminCode' && (
                  sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 16 }} /> : <ArrowDownward sx={{ fontSize: 16 }} />
                )}
              </div>
              <div 
                className="sortable-header"
                onClick={() => handleSort('level')}
              >
                등급
                {sortField === 'level' && (
                  sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 16 }} /> : <ArrowDownward sx={{ fontSize: 16 }} />
                )}
              </div>
              <div>권한</div>
              <div>생성일</div>
              <div>작업</div>
            </div>
            {filteredAdmins.map(admin => (
              <div key={admin.id} className="table-row">
                <div 
                  className="admin-name"
                  onMouseEnter={(e) => {
                    setHoveredAdmin(admin);
                    // 툴팁 위치 계산
                    const rect = e.target.getBoundingClientRect();
                    const tooltip = document.querySelector('.permissions-tooltip');
                    if (tooltip) {
                      const tooltipRect = tooltip.getBoundingClientRect();
                      const viewportWidth = window.innerWidth;
                      const viewportHeight = window.innerHeight;
                      
                      let left = rect.left;
                      let top = rect.bottom + 5;
                      
                      // 오른쪽으로 넘어가면 왼쪽으로 이동
                      if (left + tooltipRect.width > viewportWidth) {
                        left = rect.right - tooltipRect.width;
                      }
                      
                      // 아래로 넘어가면 위쪽으로 이동
                      if (top + tooltipRect.height > viewportHeight) {
                        top = rect.top - tooltipRect.height - 5;
                      }
                      
                      tooltip.style.left = `${left}px`;
                      tooltip.style.top = `${top}px`;
                    }
                  }}
                  onMouseLeave={() => setHoveredAdmin(null)}
                >
                  <Person sx={{ fontSize: 20, marginRight: 0.5 }} />
                  {admin.name}
                  {hoveredAdmin?.id === admin.id && (
                    <div className="permissions-tooltip">
                      <div className="tooltip-title">권한 목록</div>
                      <div className="tooltip-permissions">
                        {currentAdmin?.level === '최고 관리자' ? (
                          admin.permissions?.map(permission => {
                            const permissionLabel = permissionOptions.find(opt => opt.key === permission)?.label || permission;
                            return (
                              <div key={permission} className="tooltip-permission">
                                {permissionLabel}
                              </div>
                            );
                          })
                        ) : (
                          <div className="tooltip-permission">
                            권한 정보는 최고 관리자만 확인할 수 있습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="admin-code">
                  <Security sx={{ fontSize: 20, marginRight: 0.5 }} />
                  {currentAdmin?.level === '최고 관리자' ? admin.adminCode : '***'}
                </div>
                <div className={`admin-level ${admin.level === '최고 관리자' ? 'super' : 'normal'}`}>
                  {admin.level}
                </div>
                <div className="admin-permissions">
                  {currentAdmin?.level === '최고 관리자' ? `${admin.permissions?.length || 0}개 권한` : '***'}
                </div>
                <div className="admin-date">
                  {admin.createdAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'}
                </div>
                <div className="admin-actions">
                  {canEditAdmin(admin) && (
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditAdmin(admin)}
                    >
                      <Edit sx={{ fontSize: 16 }} />
                    </button>
                  )}
                  {canDeleteAdmin(admin) && (
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteAdmin(admin)}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </button>
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
