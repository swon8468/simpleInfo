import { useState, useEffect } from 'react';
import DataService from '../services/DataService';
import NotificationService from '../services/NotificationService';
import './AdminTable.css';
import { Add, Edit, Delete, Save, Cancel, Article } from '@mui/icons-material';

function AdminAnnouncementTable() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await DataService.getAnnouncements();
      // 최신순으로 정렬 (createdAt 기준 내림차순)
      const sortedData = data.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setAnnouncements(sortedData);
    } catch (error) {
      showMessage('공지사항 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAdd = () => {
    setEditingId('new');
    setFormData({ title: '', content: '' });
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setLoading(true);
      try {
        await DataService.deleteAnnouncement(id);
        showMessage('공지사항이 삭제되었습니다.');
        loadAnnouncements();
      } catch (error) {
        showMessage('삭제 실패');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showMessage('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (editingId === 'new') {
        await DataService.addAnnouncement(formData.title, formData.content);
        showMessage('공지사항이 추가되었습니다.');
      } else {
        await DataService.updateAnnouncement(editingId, formData.title, formData.content);
        showMessage('공지사항이 수정되었습니다.');
      }
      setEditingId(null);
      setFormData({ title: '', content: '' });
      loadAnnouncements();
    } catch (error) {
      showMessage('저장 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: '', content: '' });
  };

  return (
    <div className="admin-table-container">
      <div className="announcement-header">
        <h2><Article sx={{ fontSize: 20, marginRight: 6 }} /> 공지사항 관리</h2>
        <button className="add-announcement-btn" onClick={handleAdd} disabled={loading}>
          <Add sx={{ fontSize: 18, marginRight: 4 }} /> 추가
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      {editingId && (
        <div className="edit-form">
          <h3>{editingId === 'new' ? '새 공지사항 추가' : '공지사항 수정'}</h3>
          <div className="form-group">
            <label>제목:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="제목을 입력하세요"
            />
          </div>
          <div className="form-group">
            <label>내용:</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="내용을 입력하세요"
              rows="4"
            />
          </div>
          <div className="form-actions">
            <button className="save-btn" onClick={handleSave} disabled={loading}>
              <Save sx={{ fontSize: 16, marginRight: 4 }} /> {loading ? '저장 중...' : '저장'}
            </button>
            <button className="cancel-btn" onClick={handleCancel} disabled={loading}>
              <Cancel sx={{ fontSize: 16, marginRight: 4 }} /> 취소
            </button>
          </div>
        </div>
      )}

      <div className="announcement-list">
        {announcements.map((announcement, index) => (
          <div key={announcement.id} className="announcement-card">
            <div className="announcement-card-header">
              <div className="announcement-number">{index + 1}</div>
              <div className="announcement-title">{announcement.title}</div>
              <div className="announcement-actions">
                <button 
                  className="edit-announcement-btn" 
                  onClick={() => handleEdit(announcement)}
                  disabled={loading}
                  title="수정"
                >
                  <Edit sx={{ fontSize: 16 }} />
                </button>
                <button 
                  className="delete-announcement-btn" 
                  onClick={() => handleDelete(announcement.id)}
                  disabled={loading}
                  title="삭제"
                >
                  <Delete sx={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
            <div className="announcement-card-content">
              <p className="announcement-content-text" style={{ whiteSpace: 'pre-line' }}>
                {announcement.content}
              </p>
            </div>
            <div className="announcement-card-footer">
              <span className="announcement-date">
                등록일: {announcement.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
              </span>
              <span className="announcement-views">
                조회수: {announcement.views || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminAnnouncementTable;
