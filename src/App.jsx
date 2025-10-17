import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import MainScreen from './components/MainScreen';
import ControlMode from './components/ControlMode';
import OutputMode from './components/OutputMode';
import AdminPanel from './components/AdminPanel';
import SchoolBlockingScreen from './components/SchoolBlockingScreen';
import NotFound from './components/NotFound';

function RootRouter() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const adminMode = params.get('admin') === 'true';
  return adminMode ? <AdminPanel /> : <MainScreen />;
}

function App() {
  // Vite가 제공하는 BASE_URL을 사용하여 개발('/')과 배포('/simpleInfo/') 모두 지원
  const basename = import.meta.env.BASE_URL;
  
  return (
    <Router basename={basename}>
      <div className="app">
        <SchoolBlockingScreen />
        <Routes>
          <Route path="/" element={<RootRouter />} />
          <Route path="/control/*" element={<ControlMode />} />
          <Route path="/output/*" element={<OutputMode />} />
          <Route path="/admin" element={<MainScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
