import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MainScreen from './components/MainScreen';
import ControlMode from './components/ControlMode';
import OutputMode from './components/OutputMode';
import AdminPanel from './components/AdminPanel';

function App() {
  // 현재 URL을 기반으로 basename 결정
  const getBasename = () => {
    if (process.env.NODE_ENV === 'production') {
      return '/simpleInfo';
    }
    
    // 로컬 개발 환경에서도 /simpleInfo 경로 지원
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/simpleInfo')) {
      return '/simpleInfo';
    }
    
    return '';
  };
  
  const basename = getBasename();
  
  return (
    <Router basename={basename}>
      <div className="app">
        <Routes>
          <Route path="/" element={<MainScreen />} />
          <Route path="/control/*" element={<ControlMode />} />
          <Route path="/output/*" element={<OutputMode />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
