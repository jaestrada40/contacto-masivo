import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { api } from './services/api';
import { User, Contact, Campaign, Segment, MessageLog, AuditLog, UserRole } from './types';
import { Sidebar, ActiveView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

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

export default function App() {
  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());

  // Active view state
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [preselectedSegmentId, setPreselectedSegmentId] = useState<string | undefined>(undefined);

  // Mobile sidebar drawer state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Modals state
  const [selectedContactForDetail, setSelectedContactForDetail] = useState<Contact | null>(null);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState<Contact | null>(null);
  const [isCreatingNewContact, setIsCreatingNewContact] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Reactive data from storageService
  const [contacts, setContacts] = useState<Contact[]>(() => storageService.getContacts());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => storageService.getCampaigns());
  const [segments, setSegments] = useState<Segment[]>(() => storageService.getSegments());
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>(() => storageService.getMessageLogs());

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setContacts(storageService.getContacts());
      setCampaigns(storageService.getCampaigns());
      setSegments(storageService.getSegments());
      setMessageLogs(storageService.getMessageLogs());
      // Update current user in case of role switches or edits
      const updatedUser = authService.getCurrentUser();
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || !api.token()) return;
    Promise.all([api.contacts(), api.campaigns(), api.segments(), api.messages()])
      .then(([apiContacts, apiCampaigns, apiSegments, apiMessages]) => {
        setContacts(apiContacts);
        setCampaigns(apiCampaigns);
        setSegments(apiSegments);
        setMessageLogs(apiMessages);
      })
      .catch(error => console.warn('No se pudo sincronizar con la API de Conecta Masivo:', error));
  }, [currentUser]);

  // Navigation handler
  const handleNavigate = (view: ActiveView, extraId?: string) => {
    if (view === 'campana_detalle' && extraId) {
      setSelectedCampaignId(extraId);
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start campaign directly with a segment pre-selected
  const handleStartCampaignWithSegment = (segmentId: string) => {
    setPreselectedSegmentId(segmentId);
    setActiveView('nueva_campana');
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
    return <LoginView onLoginSuccess={() => setCurrentUser(authService.getCurrentUser())} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-900">
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
              />
            )}

            {activeView === 'segmentos' && (
              <SegmentsView
                segments={segments}
                contacts={contacts}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onStartCampaignWithSegment={handleStartCampaignWithSegment}
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
                campaigns={campaigns}
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
          currentUser={currentUser}
        />
      )}

      {isImportModalOpen && (
        <ImportCSVModal
          onClose={() => setIsImportModalOpen(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
