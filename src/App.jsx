import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MainScreen from './components/MainScreen';
import ControlMode from './components/ControlMode';
import OutputMode from './components/OutputMode';
import AdminPanel from './components/AdminPanel';
import SchoolBlockingScreen from './components/SchoolBlockingScreen';

function App() {
  // 개발과 프로덕션 모두에서 일관되게 basename 사용
  const basename = '/simpleInfo';
  
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
