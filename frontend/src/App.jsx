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
import Chat from './components/Chat/Chat';
import { ChatProvider, useChat } from './components/Chat/ChatContext';
import { ToastProvider, useToast } from './components/UI/Toast';
import StorageService from './services/StorageService';
import MemberController from './controllers/MemberController';
import ContributionController from './controllers/ContributionController';
import MigrationService from './services/MigrationService';
import api from './services/apiClient';

const PENDING_PROOF_POLL_MS = 30000;

function AppContent() {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, isSecretaire, accountRole, canValidateContribution, logout } = useAuth();
  const isSecretary = isSecretaire;
  const [settings, setSettings] = useState(() => StorageService.getSettings());
  const { showToast }           = useToast();
  const { unreadCount: unreadChatCount } = useChat();

  const [pendingProofCount,       setPendingProofCount]       = useState(0);
  const [birthdaysToday,          setBirthdaysToday]          = useState([]);
  const [birthdayBannerDismissed, setBirthdayBannerDismissed] = useState(false);

  /* ── Anniversaires du jour ── */
  useEffect(() => {
    if (!user) return;
    MemberController.getTodaysBirthdays()
      .then(setBirthdaysToday)
      .catch(err => console.error('Échec de la récupération des anniversaires du jour', err));
  }, [user]);

  /* ── Badge cotisations en attente de validation ── */
  useEffect(() => {
    if (!user || !canValidateContribution) return;

    const load = async () => {
      try {
        const contributions = await ContributionController.getAllContributions();
        setPendingProofCount(
          contributions.filter(
            c => c.status === 'pending' && c.proofImage && !c.validations?.[accountRole]?.validated
          ).length
        );
      } catch (err) {
        console.error('Échec du comptage des preuves en attente', err);
      }
    };

    load();
    const id = setInterval(load, PENDING_PROOF_POLL_MS);
    return () => clearInterval(id);
  }, [user, accountRole, canValidateContribution]);

  /* ── Synchronisation membres + migration locale ── */
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
    switch (activeTab) {
      case 'dashboard':     return <Dashboard isSecretary={isSecretary} onNavigateToProgram={() => setActiveTab('program')} />;
      case 'members':       return <MemberList isSecretary={isSecretary} />;
      case 'contributions': return <ContributionList isSecretary={isSecretary} />;
      case 'loans':         return <LoanList isSecretary={isSecretary} />;
      case 'solidarity':    return <Solidarity isSecretary={isSecretary} />;
      case 'statistics':    return <Statistics />;
      case 'reports':       return <Reports />;
      case 'program':       return <Program isSecretary={isSecretary} />;
      case 'chat':          return <Chat />;
      default:              return <Dashboard isSecretary={isSecretary} onNavigateToProgram={() => setActiveTab('program')} />;
    }
  };

  return (
    /*
     * Layout global :
     *   [Sidebar fixe 240px] [Colonne principale flex-1]
     *                            ├── TopBar (sticky)
     *                            └── main (scrollable)
     */
    <div className="flex h-screen overflow-hidden bg-cream">

      {/* ── Sidebar (desktop fixe + mobile tiroir) ── */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadChatCount={unreadChatCount}
        pendingContributionCount={pendingProofCount}
        user={user}
        settings={settings}
        onLogout={handleLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* ── Colonne droite (décalée de 240px sur desktop) ── */}
      <div className="flex flex-col flex-1 overflow-hidden md:ml-60">

        {/* Top bar + bannière anniversaire */}
        <Header
          isSecretary={isSecretary}
          user={user}
          onLogout={handleLogout}
          settings={settings}
          onUpdateSettings={updateSettings}
          activeTab={activeTab}
          onMenuToggle={() => setSidebarOpen(v => !v)}
          birthdaysToday={birthdaysToday}
          birthdayBannerDismissed={birthdayBannerDismissed}
          onDismissBirthday={() => setBirthdayBannerDismissed(true)}
        />

        {/* Contenu scrollable */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {renderContent()}
        </main>

        <Footer settings={settings} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </ToastProvider>
  );
}

export default App;
