import React, { useState, useEffect, useCallback } from 'react';
import { authService } from './services/authService';
import { api } from './services/api';
import { User, Contact, Campaign, Segment, MessageLog, AuditLog, UserRole } from './types';
import { Sidebar, ActiveView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastViewport } from './components/layout/ToastViewport';

// View components
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { ContactsView } from './components/views/ContactsView';
import { SegmentsView } from './components/views/SegmentsView';
import { CampaignsListView } from './components/views/CampaignsListView';
import { NewCampaignWizardView } from './components/views/NewCampaignWizardView';
import { CampaignDetailView } from './components/views/CampaignDetailView';
import { HistoryView } from './components/views/HistoryView';
import { ReportsView } from './components/views/ReportsView';
import { UsersManagementView } from './components/views/UsersManagementView';
import { SettingsView } from './components/views/SettingsView';
import { ProfileView } from './components/views/ProfileView';

// Modals
import { ContactDetailModal } from './components/views/ContactDetailModal';
import { ContactEditModal } from './components/views/ContactEditModal';
import { ImportCSVModal } from './components/views/ImportCSVModal';
import { showToast } from './services/toast';

export default function App() {
  const readLocation = (): { view: ActiveView; campaignId: string } => {
    const params = new URLSearchParams(window.location.search);
    const validViews: ActiveView[] = ['dashboard', 'contactos', 'segmentos', 'campanas', 'nueva_campana', 'campana_detalle', 'historial', 'reportes', 'usuarios', 'configuracion', 'perfil'];
    const requestedView = params.get('vista') as ActiveView | null;
    const view = requestedView && validViews.includes(requestedView) ? requestedView : 'dashboard';
    return { view, campaignId: params.get('campana') || '' };
  };
  const initialLocation = readLocation();

  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());

  // Active view state
  const [activeView, setActiveView] = useState<ActiveView>(initialLocation.view);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialLocation.campaignId);
  const [preselectedSegmentId, setPreselectedSegmentId] = useState<string | undefined>(undefined);

  // Mobile sidebar drawer state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Modals state
  const [selectedContactForDetail, setSelectedContactForDetail] = useState<Contact | null>(null);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState<Contact | null>(null);
  const [isCreatingNewContact, setIsCreatingNewContact] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Reactive data from storageService
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);

  // Discard only legacy demo/business records cached in this browser. Keep user/session keys.
  useEffect(() => {
    ['conecta_masivo_contacts','conecta_masivo_campaigns','conecta_masivo_messages','conecta_masivo_segments','conecta_masivo_settings','conecta_masivo_audit']
      .forEach(key => localStorage.removeItem(key));
  }, []);

  useEffect(() => {
    const restoreFromUrl = () => {
      const location = readLocation();
      setActiveView(location.view);
      setSelectedCampaignId(location.campaignId);
    };
    window.addEventListener('popstate', restoreFromUrl);
    return () => window.removeEventListener('popstate', restoreFromUrl);
  }, []);

  const refreshData = useCallback(async () => {
    if (!currentUser || !api.token()) return;
    try {
      const [apiContacts, apiCampaigns, apiSegments, apiMessages] = await Promise.all([api.contacts(), api.campaigns(), api.segments(), api.messages()]);
      setContacts(apiContacts); setCampaigns(apiCampaigns); setSegments(apiSegments); setMessageLogs(apiMessages);
    } catch (error) {
      console.warn('No se pudo sincronizar con la API de Conecta Masivo:', error);
      showToast(error instanceof Error ? error.message : 'No se pudieron cargar los datos.', 'error');
    }
  }, [currentUser]);

  useEffect(() => { void refreshData(); }, [refreshData]);

  const hasProcessingCampaign = campaigns.some(campaign => campaign.estado === 'enviando');
  useEffect(() => {
    if (!currentUser || !hasProcessingCampaign) return;
    let refreshInProgress = false;
    const pollCampaigns = async () => {
      if (refreshInProgress) return;
      refreshInProgress = true;
      try {
        setCampaigns(await api.campaigns());
      } catch (error) {
        console.warn('No se pudo actualizar el estado de las campañas:', error);
      } finally {
        refreshInProgress = false;
      }
    };
    const interval = window.setInterval(() => { void pollCampaigns(); }, 1500);
    return () => window.clearInterval(interval);
  }, [currentUser, hasProcessingCampaign]);

  // Navigation handler
  const handleNavigate = (view: ActiveView, extraId?: string) => {
    const params = new URLSearchParams();
    params.set('vista', view);
    if (view === 'campana_detalle' && extraId) {
      setSelectedCampaignId(extraId);
      params.set('campana', extraId);
    } else if (view === 'campana_detalle' && selectedCampaignId) {
      params.set('campana', selectedCampaignId);
    }
    setActiveView(view);
    window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start campaign directly with a segment pre-selected
  const handleStartCampaignWithSegment = (segmentId: string) => {
    setPreselectedSegmentId(segmentId);
    setActiveView('nueva_campana');
    window.history.pushState(null, '', `${window.location.pathname}?vista=nueva_campana`);
  };

  // Switch demo user role
  const handleSwitchUser = async (role: UserRole) => {
    const switched = await authService.switchRole(role);
    if (switched) {
      setCurrentUser(switched);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  // If not logged in, render the login view
  if (!currentUser) {
    return <><ToastViewport /><LoginView onLoginSuccess={() => setCurrentUser(authService.getCurrentUser())} /></>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F8FB] font-sans antialiased text-[#172033]">
      <ToastViewport />
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar
          currentView={activeView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:hidden transition-transform duration-200 ease-in-out ${
        mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          currentView={activeView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentView={activeView}
          onNavigate={handleNavigate}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          currentUser={currentUser}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && (
              <DashboardView
                contacts={contacts}
                campaigns={campaigns}
                messageLogs={messageLogs}
                onNavigate={handleNavigate}
                currentUser={currentUser}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                onOpenNewContactModal={() => setIsCreatingNewContact(true)}
              />
            )}

            {activeView === 'contactos' && (
              <ContactsView
                contacts={contacts}
                currentUser={currentUser}
                onOpenNewContact={() => setIsCreatingNewContact(true)}
                onOpenImport={() => setIsImportModalOpen(true)}
                onSelectContact={c => setSelectedContactForDetail(c)}
                onEditContact={c => setSelectedContactForEdit(c)}
                onDataChanged={refreshData}
              />
            )}

            {activeView === 'segmentos' && (
              <SegmentsView
                segments={segments}
                contacts={contacts}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onStartCampaignWithSegment={handleStartCampaignWithSegment}
                onDataChanged={refreshData}
              />
            )}

            {activeView === 'campanas' && (
              <CampaignsListView
                campaigns={campaigns}
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}

            {activeView === 'nueva_campana' && (
              <NewCampaignWizardView
                contacts={contacts}
                segments={segments}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                preselectedSegmentId={preselectedSegmentId}
                onDataChanged={refreshData}
              />
            )}

            {activeView === 'campana_detalle' && (
              <CampaignDetailView
                campaignId={selectedCampaignId || campaigns[0]?.id || ''}
                campaigns={campaigns}
                messageLogs={messageLogs}
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}

            {activeView === 'historial' && (
              <HistoryView
                messageLogs={messageLogs}
                campaigns={campaigns}
              />
            )}

            {activeView === 'reportes' && (
              <ReportsView
                contacts={contacts}
                messageLogs={messageLogs}
              />
            )}

            {activeView === 'usuarios' && (
              <UsersManagementView currentUser={currentUser} />
            )}

            {activeView === 'configuracion' && (
              <SettingsView currentUser={currentUser} />
            )}

            {activeView === 'perfil' && (
              <ProfileView
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {selectedContactForDetail && (
        <ContactDetailModal
          contact={selectedContactForDetail}
          onClose={() => setSelectedContactForDetail(null)}
          messageLogs={messageLogs}
        />
      )}

      {(selectedContactForEdit || isCreatingNewContact) && (
        <ContactEditModal
          contact={selectedContactForEdit}
          onClose={() => {
            setSelectedContactForEdit(null);
            setIsCreatingNewContact(false);
          }}
          onSaved={refreshData}
        />
      )}

      {isImportModalOpen && (
        <ImportCSVModal
          onClose={() => setIsImportModalOpen(false)}
          onImported={refreshData}
        />
      )}
    </div>
  );
}
