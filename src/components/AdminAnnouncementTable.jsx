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
      setAnnouncements(data);
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
      <div className="table-header">
        <h2><Article sx={{ fontSize: 20, marginRight: 6 }} /> 공지사항 관리</h2>
        <button className="add-btn" onClick={handleAdd} disabled={loading}>
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

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>내용</th>
              <th>생성일</th>
              <th>조회수</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((announcement, index) => (
              <tr key={announcement.id}>
                <td>{index + 1}</td>
                <td>{announcement.title}</td>
                <td className="content-cell">
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {announcement.content}
                  </div>
                </td>
                <td>
                  {announcement.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </td>
                <td>{announcement.views || 0}</td>
                <td>
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEdit(announcement)}
                    disabled={loading}
                  >
                    <Edit sx={{ fontSize: 16, marginRight: 4 }} /> 수정
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(announcement.id)}
                    disabled={loading}
                  >
                    <Delete sx={{ fontSize: 16, marginRight: 4 }} /> 삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminAnnouncementTable;
