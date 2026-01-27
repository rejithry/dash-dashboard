import { Routes, Route } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import Layout from './components/Layout/Layout';
import DashboardList from './components/Dashboard/DashboardList';
import DashboardView from './components/Dashboard/DashboardView';
import ConnectionList from './components/Connections/ConnectionList';

function App() {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-mesh-dark' : 'bg-mesh-light'}`}>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardList />} />
          <Route path="/dashboard/:id" element={<DashboardView />} />
          <Route path="/connections" element={<ConnectionList />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
