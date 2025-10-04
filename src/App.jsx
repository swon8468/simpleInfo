import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MainScreen from './components/MainScreen';
import ControlMode from './components/ControlMode';
import OutputMode from './components/OutputMode';
import AdminPanel from './components/AdminPanel_debug';
import SchoolBlockingScreen from './components/SchoolBlockingScreen';

function App() {
  // 개발 환경에서는 basename을 사용하지 않음
  const basename = process.env.NODE_ENV === 'production' ? '/simpleInfo' : '';
  
  return (
    <Router basename={basename}>
      <div className="app">
        <SchoolBlockingScreen />
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
