import { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import { useAuth } from './components/Auth/AuthContext';
import Navigation from './components/Layout/Navigation';
import Dashboard from './components/Dashboard/Dashboard';
import MemberList from './components/Members/MemberList';
import ContributionList from './components/Contributions/ContributionList';
import LoanList from './components/Loans/LoanList';
import Solidarity from './components/Solidarity/Solidarity';
import Statistics from './components/Statistics/Statistics';
import Reports from './components/Reports/Reports';
import Program from './components/Program/Program';
import { ToastProvider, useToast } from './components/UI/Toast';
import StorageService from './services/StorageService';
import MemberController from './controllers/MemberController';
import MigrationService from './services/MigrationService';
import api from './services/apiClient';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, isSecretaire, logout } = useAuth();
  const isSecretary = isSecretaire;
  const [settings, setSettings] = useState(() => StorageService.getSettings());
  const { showToast } = useToast();

  // Synchronise la liste des membres puis migre une fois pour toutes les
  // cotisations/prêts/aides qui ne vivaient jusqu'ici que dans le
  // navigateur du secrétaire, pour qu'elles deviennent visibles par tous.
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const apiMembers = await api.get('/members');
        MemberController.syncFromApi(apiMembers);
      } catch (err) {
        console.error('Échec de la synchronisation des membres', err);
      }
      try {
        const result = await MigrationService.migrateIfNeeded(isSecretary);
        if (result?.migrated) {
          showToast(`${result.migrated} élément(s) historique(s) synchronisé(s) avec le serveur.`, 'success', 6000);
        }
      } catch (err) {
        console.error('Échec de la migration des données locales', err);
      }
    })();
  }, [user, isSecretary, showToast]);

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
      case 'statistics':
        return <Statistics />;
      case 'reports':
        return <Reports />;
      case 'program':
        return <Program />;
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
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container-wide px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {renderContent()}
      </main>
      <Footer settings={settings} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;