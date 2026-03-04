import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import ChatInterface from './components/ChatInterface';
import FormPanel from './components/FormPanel';
import CrisisIndicator from './components/CrisisIndicator';
import ShiftSummary from './components/ShiftSummary';
import MapView from './components/MapView';
import useParaHelper from './hooks/useParaHelper';
import { chatAPI } from './services/api';

const GUEST_PROFILE = {
  paramedic_id: 'guest',
  first_name: 'Guest',
  last_name: 'User',
  role: 'PCP',
  station: 'Demo',
  unit: 'N/A'
};

const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0a1628;
    color: #ffffff;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  input:focus { border-color: rgba(229, 62, 62, 0.5) !important; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;

export default function App() {
  const [profile] = useState(GUEST_PROFILE);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapDestination, setMapDestination] = useState(null);
  const [ready, setReady] = useState(false);

  const {
    messages, currentForms, guardrailResults, alerts,
    phase, mode, isPediatric, isLoading, sessionId,
    sendMessage, submitForm, initSession, loadChat, setCurrentForms
  } = useParaHelper({
    onChatResponse: (data) => {
      if (data?.map_destination) {
        setMapDestination(data.map_destination);
        setShowMap(true);
      }
    }
  });

  useEffect(() => {
    const boot = async () => {
      try {
        const { data } = await chatAPI.startSession();
        initSession(data.session_id, "Hey! Welcome to ParaHelper. I'm your AI shift companion. How can I help you today?");
      } catch (err) {
        console.error('Failed to start session:', err);
        initSession(null, "Couldn't connect to the server. Check that the backend is running and try refreshing.");
      }
      setReady(true);
    };
    boot();
  }, [initSession]);

  const handleNewSession = async () => {
    try {
      const { data } = await chatAPI.startSession();
      initSession(data.session_id, "Started a new shift. How can I help you?");
    } catch (err) {
      console.error('Failed to start new session:', err);
    }
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.appContainer}>
        <TopBar
          profile={profile}
          phase={phase}
          mode={mode}
          alerts={alerts}
          onShiftSummary={() => setShowShiftSummary(true)}
          onMap={() => setShowMap(true)}
          onNewSession={handleNewSession}
        />

        <CrisisIndicator mode={mode} isPediatric={isPediatric} alerts={alerts} />

        <div style={styles.mainContent}>
          <div style={styles.chatSection}>
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              onSendMessage={sendMessage}
              disabled={!ready}
            />
          </div>

          <div style={styles.formSection}>
            <FormPanel
              currentForms={currentForms}
              guardrailResults={guardrailResults}
              sessionId={sessionId}
              onFormSubmit={(formType) => {
                sendMessage(`The ${formType.replace(/_/g, ' ')} has been sent successfully.`, false);
              }}
              onOpenForm={(formType) => {
                const pname = profile ? `${profile.first_name} ${profile.last_name}` : null;
                const empId = profile?.paramedic_id === 'guest' ? 'GUEST' : (profile?.badge_number || null);
                const base = { paramedic_name: { value: pname, confidence: pname ? 'high' : null }, employee_id: { value: empId, confidence: empId ? 'high' : null }, date: { value: new Date().toISOString().slice(0, 10), confidence: 'high' }, unit_number: { value: profile?.unit || null, confidence: profile?.unit ? 'high' : null }, station_location: { value: profile?.station || null, confidence: profile?.station ? 'high' : null }, ambulance_unit: { value: profile?.unit || null, confidence: profile?.unit ? 'high' : null } };
                const vFields = { ...base, shift_time: { value: null, confidence: null }, engine_condition: { value: null, confidence: null }, fuel_level: { value: null, confidence: null }, tire_pressure: { value: null, confidence: null }, emergency_lights: { value: null, confidence: null }, siren_system: { value: null, confidence: null }, radio_communication: { value: null, confidence: null }, gps_navigation: { value: null, confidence: null }, ambulance_cleanliness: { value: null, confidence: null }, stretcher: { value: null, confidence: null }, oxygen_tank_level: { value: null, confidence: null }, suction_device: { value: null, confidence: null }, defibrillator: { value: null, confidence: null }, first_aid_kit: { value: null, confidence: null }, notes_issues: { value: null, confidence: null } };
                const eFields = { ...base, oxygen_masks: { value: null, confidence: null }, iv_kits: { value: null, confidence: null }, bandages: { value: null, confidence: null }, gloves: { value: null, confidence: null }, saline_bags: { value: null, confidence: null }, epinephrine: { value: null, confidence: null }, tourniquets: { value: null, confidence: null }, trauma_dressings: { value: null, confidence: null }, epinephrine_exp: { value: null, confidence: null }, saline_exp: { value: null, confidence: null }, notes_restock: { value: null, confidence: null } };
                const empty = formType === 'vehicle_inventory' ? { vehicle_inventory: { form_type: 'vehicle_inventory', fields: vFields } } : { equipment_inventory: { form_type: 'equipment_inventory', fields: eFields } };
                setCurrentForms(prev => ({ ...prev, ...empty }));
              }}
            />
          </div>
        </div>

        {showShiftSummary && (
          <ShiftSummary
            profile={profile}
            sessionId={sessionId}
            onClose={() => setShowShiftSummary(false)}
          />
        )}

        {showMap && (
          <MapView
            profile={profile}
            initialDestination={mapDestination}
            onClose={() => {
              setShowMap(false);
              setMapDestination(null);
            }}
          />
        )}
      </div>
    </>
  );
}

const styles = {
  appContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 100%)'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  chatSection: {
    flex: '6',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    minWidth: 0
  },
  formSection: {
    flex: '4',
    display: 'flex',
    flexDirection: 'column',
    minWidth: '320px',
    maxWidth: '500px'
  }
};
