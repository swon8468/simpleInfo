import { Routes, Route, useNavigate } from 'react-router-dom';
import ControlConnection from './ControlConnection';
import ControlMain from './ControlMain';
import ControlSchedule from './ControlSchedule';
import ControlMeal from './ControlMeal';
import ControlRoadmap from './ControlRoadmap';
import ControlAnnouncement from './ControlAnnouncement';
import ControlConnectionInfo from './ControlConnectionInfo';

function ControlMode() {
  return (
    <Routes>
      <Route path="/" element={<ControlConnection />} />
      <Route path="/main" element={<ControlMain />} />
      <Route path="/schedule" element={<ControlSchedule />} />
      <Route path="/meal" element={<ControlMeal />} />
      <Route path="/roadmap" element={<ControlRoadmap />} />
      <Route path="/announcement" element={<ControlAnnouncement />} />
      <Route path="/connection-info" element={<ControlConnectionInfo />} />
    </Routes>
  );
}

export default ControlMode;
