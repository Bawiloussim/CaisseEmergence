import { useState } from 'react';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import { AppProvider } from './contexts/AppContext';
import { useAuth } from './components/Auth/AuthContext';
import Navigation from './components/Layout/Navigation';
import Dashboard from './components/Dashboard/Dashboard';
import MemberList from './components/Members/MemberList';
import ContributionList from './components/Contributions/ContributionList';
import LoanList from './components/Loans/LoanList';
import Solidarity from './components/Solidarity/Solidarity';
import Reports from './components/Reports/Reports';
import { ToastProvider, useToast } from './components/UI/Toast';
import StorageService from './services/StorageService';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, isSecretaire, logout } = useAuth();
  const isSecretary = isSecretaire;
  const [settings, setSettings] = useState(() => StorageService.getSettings());
  const { showToast } = useToast();

  const handleLogout = () => {
    showToast('Vous avez été déconnecté', 'info');
    logout();
  };

  const updateSettings = (newSettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
    showToast('Paramètres mis à jour', 'success');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <Dashboard isSecretary={isSecretary} />;
      case 'members':
        return <MemberList isSecretary={isSecretary} />;
      case 'contributions':
        return <ContributionList isSecretary={isSecretary} />;
      case 'loans':
        return <LoanList isSecretary={isSecretary} />;
      case 'solidarity':
        return <Solidarity isSecretary={isSecretary} />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard isSecretary={isSecretary} />;
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header 
        isSecretary={isSecretary} 
        user={user}
        onLogout={handleLogout}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} isSecretary={isSecretary} />
      <main className="container-wide px-6 py-8 flex-1">
        {renderContent()}
      </main>
      <Footer settings={settings} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
}

export default App;