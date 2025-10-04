import { useState, useEffect } from 'react';
import DataService from '../services/DataService';
import NotificationService from '../services/NotificationService';
import './AdminPatchnotes.css';

function AdminPatchnotes() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [patchnotes, setPatchnotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPatchnote, setEditingPatchnote] = useState(null);
  
  const [patchnoteForm, setPatchnoteForm] = useState({
    version: '',
    date: new Date().toISOString().split('T')[0], // 오늘 날짜로 초기화
    title: '',
    content: '',
    type: 'major'
  });

  // 패치 노트 목록 가져오기
  const fetchPatchnotes = async () => {
    try {
      setLoading(true);
      const data = await DataService.getPatchnotes();
      setPatchnotes(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      setMessage('패치 노트 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatchnotes();
  }, []);

  // 다음 버전 자동 생성 함수
  const generateNextVersion = () => {
    if (patchnotes.length === 0) {
      return '1.0.0';
    }

    // 최신 패치노트의 버전을 추출
    const latestVersion = patchnotes[0].version;
    const versionMatch = latestVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
    
    if (!versionMatch) {
      // 버전 형식이 맞지 않으면 1.0.0으로 시작
      return '1.0.0';
    }

    const [, major, minor, patch] = versionMatch;
    const newPatch = parseInt(patch) + 1;
    
    return `${major}.${minor}.${newPatch}`;
  };

  // Patch 버전 업데이트 (예: 1.0.0 → 1.0.1)
  const updatePatchVersion = (currentVersion) => {
    const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!versionMatch) return null;
    
    const [, major, minor, patch] = versionMatch;
    const newPatch = parseInt(patch) + 1;
    return `${major}.${minor}.${newPatch}`;
  };

  // Minor 버전 업데이트 (예: 1.0.0 → 1.1.0)
  const updateMinorVersion = (currentVersion) => {
    const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!versionMatch) return null;
    
    const [, major, minor] = versionMatch;
    const newMinor = parseInt(minor) + 1;
    return `${major}.${newMinor}.0`;
  };

  // 폼 초기화 함수
  const resetForm = () => {
    setPatchnoteForm({
      version: '',
      date: new Date().toISOString().split('T')[0],
      title: '',
      content: '',
      type: 'minor' // 중요한 업데이트는 주로 minor로 시작
    });
    setEditingPatchnote(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!patchnoteForm.version.trim() || !patchnoteForm.title.trim() || !patchnoteForm.content.trim()) {
      setMessage('버전, 제목, 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (editingPatchnote) {
        await DataService.updatePatchnote(editingPatchnote.id, patchnoteForm);
        setMessage('패치 노트가 성공적으로 수정되었습니다.');
      } else {
        await DataService.createPatchnote(patchnoteForm);
        setMessage('패치 노트가 성공적으로 등록되었습니다.');
        
        // 활성 사용자에게 알림 발송
        try {
          await NotificationService.showPatchnoteNotification(patchnoteForm);
        } catch (error) {
          console.error('알림 발송 실패:', error);
        }
      }
      
      resetForm();
      setShowForm(false);
      fetchPatchnotes();
    } catch (error) {
      setMessage('패치 노트 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (patchnote) => {
    setEditingPatchnote(patchnote);
    setPatchnoteForm({
      version: patchnote.version,
      date: patchnote.date || new Date().toISOString().split('T')[0],
      title: patchnote.title,
      content: patchnote.content,
      type: patchnote.type || 'major'
    });
    setShowForm(true);
  };

  const handleDelete = async (patchnoteId) => {
    if (window.confirm('정말로 이 패치 노트를 삭제하시겠습니까?')) {
      setLoading(true);
      try {
        await DataService.deletePatchnote(patchnoteId);
        setMessage('패치 노트가 성공적으로 삭제되었습니다.');
        fetchPatchnotes();
      } catch (error) {
        setMessage('패치 노트 삭제에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  return (
    <div className="admin-patchnotes">
      <h2>패치 노트 관리</h2>
      
      {message && (
        <div className={`message ${message.includes('실패') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 추가 버튼 */}
      <div className="add-patchnote-section">
        <button 
          type="button" 
          className="add-patchnote-btn"
          onClick={() => {
            if (!showForm) {
              // 새로운 패치노트 작성 시 자동 버전 생성
              setPatchnoteForm(prev => ({
                ...prev,
                version: generateNextVersion(),
                date: new Date().toISOString().split('T')[0]
              }));
            }
            setShowForm(!showForm);
          }}
          disabled={loading}
        >
          {showForm ? '패치 노트 작성 취소' : '+ 패치 노트 추가'}
        </button>
      </div>

      {/* 패치 노트 작성 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="patchnote-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="version">버전 *</label>
              <div className="version-input-group">
                <input
                  type="text"
                  id="version"
                  value={patchnoteForm.version}
                  onChange={(e) => setPatchnoteForm(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="예: v1.0.0"
                  required
                />
                <div className="version-update-buttons">
                  <button 
                    type="button" 
                    className="version-update-btn minor"
                    onClick={() => {
                      const updatedVersion = updateMinorVersion(patchnoteForm.version);
                      if (updatedVersion) {
                        setPatchnoteForm(prev => ({ 
                          ...prev, 
                          version: updatedVersion,
                          type: 'minor'
                        }));
                      }
                    }}
                    title="Minor 업데이트 (예: 1.0.0 → 1.1.0)"
                  >
                    Minor+1
                  </button>
                  <button 
                    type="button" 
                    className="version-update-btn patch"
                    onClick={() => {
                      const updatedVersion = updatePatchVersion(patchnoteForm.version);
                      if (updatedVersion) {
                        setPatchnoteForm(prev => ({ 
                          ...prev, 
                          version: updatedVersion,
                          type: 'fix'
                        }));
                      }
                    }}
                    title="Patch 업데이트 (예: 1.0.0 → 1.0.1)"
                  >
                    Patch+1
                  </button>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="date">날짜 *</label>
              <input
                type="date"
                id="date"
                value={patchnoteForm.date}
                onChange={(e) => setPatchnoteForm(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="type">타입</label>
              <select
                id="type"
                value={patchnoteForm.type}
                onChange={(e) => setPatchnoteForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="major">Major (주요 변경)</option>
                <option value="minor">Minor (기능 변경)</option>
                <option value="security">Security (보안)</option>
                <option value="fix">Fix (버그 수정)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
              type="text"
              id="title"
              value={patchnoteForm.title}
              onChange={(e) => setPatchnoteForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="패치 노트 제목을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">내용 *</label>
            <textarea
              id="content"
              value={patchnoteForm.content}
              onChange={(e) => setPatchnoteForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="변경 사항을 줄바꿈으로 구분하여 입력하세요"
              rows="8"
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              className="cancel-btn"
              disabled={loading}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !patchnoteForm.version.trim() || !patchnoteForm.title.trim() || !patchnoteForm.content.trim()}
            >
              {loading ? '처리 중...' : (editingPatchnote ? '패치 노트 수정' : '패치 노트 등록')}
            </button>
          </div>
        </form>
      )}

      {/* 패치 노트 목록 */}
      <div className="patchnotes-list">
        <h3>패치 노트 목록</h3>
        {patchnotes.length === 0 ? (
          <p className="no-patchnotes">등록된 패치 노트가 없습니다.</p>
        ) : (
          <div className="patchnotes-container">
            {patchnotes.map((patchnote) => (
              <div key={patchnote.id} className="patchnote-card">
                <div className="patchnote-header">
                  <div className="patchnote-version">
                    <span className={`version-badge ${patchnote.type}`}>
                      {patchnote.version}
                    </span>
                    <span className="patchnote-type">
                      {patchnote.type === 'major' && '📦 주요 변경'}
                      {patchnote.type === 'minor' && '⚡ 기능 변경'}
                      {patchnote.type === 'security' && '🔒 보안'}
                      {patchnote.type === 'fix' && '🐛 버그 수정'}
                    </span>
                  </div>
                  <div className="patchnote-date">
                    {patchnote.date ? 
                      new Date(patchnote.date + 'T00:00:00').toLocaleDateString('ko-KR') :
                      new Date(patchnote.createdAt).toLocaleDateString('ko-KR')
                    }
                  </div>
                </div>
                <div className="patchnote-content">
                  <h4>{patchnote.title}</h4>
                  <div className="patchnote-details">
                    {patchnote.content.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
                <div className="patchnote-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(patchnote)}
                    disabled={loading}
                  >
                    수정
                  </button>
                  <button 
                    className="remove-btn"
                    onClick={() => handleDelete(patchnote.id)}
                    disabled={loading}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPatchnotes;
