import { Routes, Route } from 'react-router-dom';
import OutputLoading from './OutputLoading';
import OutputMain from './OutputMain';
import OutputSchedule from './OutputSchedule';
import OutputMeal from './OutputMeal';
import OutputRoadmap from './OutputRoadmap';
import OutputAnnouncement from './OutputAnnouncement';

function OutputMode() {
  return (
    <Routes>
      <Route path="/" element={<OutputLoading />} />
      <Route path="/main" element={<OutputMain />} />
      <Route path="/schedule" element={<OutputSchedule />} />
      <Route path="/meal" element={<OutputMeal />} />
      <Route path="/roadmap" element={<OutputRoadmap />} />
      <Route path="/announcement" element={<OutputAnnouncement />} />
    </Routes>
  );
}

export default OutputMode;
