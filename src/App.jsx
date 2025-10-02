import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MainScreen from './components/MainScreen';
import ControlMode from './components/ControlMode';
import OutputMode from './components/OutputMode';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <Router>
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
