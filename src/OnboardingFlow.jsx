import React, { useState } from 'react';
import './onboarding.css';

const AVATAR_PRESETS = [
  { id: 'default', src: '/illustrations/profile-avatar.webp', label: 'Ritratto' },
  { id: 'fashion1', src: '/illustrations/module-01.webp', label: 'Bozzetto' },
  { id: 'fashion2', src: '/illustrations/module-02.webp', label: 'Tecnico' },
  { id: 'filo', src: '/mascot-filo.png', label: 'Filo' },
];

const ROLES = [
  {
    id: 'creative',
    title: 'Direzione Creativa & Design',
    desc: 'Concept, moodboard, palette colori e silhouette della capsule.',
  },
  {
    id: 'pattern',
    title: 'Modellistica & Sviluppo Taglie',
    desc: 'Costruzione cartamodelli, schede misure e fitting sartoriale.',
  },
  {
    id: 'materials',
    title: 'Materiali & Sostenibilità',
    desc: 'Fibre nobili, distinte base BOM e Passaporto Digitale (DPP).',
  },
  {
    id: 'production',
    title: 'Produzione & Supply Chain',
    desc: 'Pianificazione lotti, ordini fornitori, controllo qualità e consegne.',
  },
];

const SKILL_OPTIONS = [
  'Capsule Collection',
  'Maglieria Calata',
  'Capospalla Sartoriale',
  'Made in Italy',
  'Passaporto Digitale (DPP)',
  'Zero Waste & Fitting',
  'Disegno Vettoriale',
  'Costi & Marginalità',
];

const STEP_TITLES = {
  1: 'Identità & Profilo',
  2: 'Specializzazione',
  3: 'Team & Atelier',
  4: 'Tutto pronto',
};

export default function OnboardingFlow({ onComplete, onCancel }) {
  // Modalità: 'post-login' | 'invite-link'
  const [mode, setMode] = useState('post-login');
  // Passi: 1 (Profilo), 2 (Ruolo), 3 (Atelier/Team), 4 (Completato)
  const [step, setStep] = useState(1);

  // Campi del profilo: iniziano vuoti così a sinistra si vede il profilo che si costruisce man mano
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState([]);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSize, setWorkspaceSize] = useState('2-10');
  const [notifyTeam, setNotifyTeam] = useState(true);

  // Credenziali preimpostate per la demo
  const email = mode === 'invite-link' ? 'alex.rossi@invito-weave.it' : 'demo@weave.it';
  const passwordMasked = '••••••••';

  // Helper rapido per compilare con dati di test
  function handleAutofillDemo() {
    setFirstName('Alex');
    setLastName('Rossi');
    setNickname('alexrossi');
    setAvatar('/illustrations/profile-avatar.webp');
    if (!role) setRole('creative');
    if (skills.length === 0) setSkills(['Capsule Collection', 'Made in Italy']);
    if (mode === 'invite-link') {
      setWorkspaceName('Atelier WEAVE');
    } else {
      setWorkspaceName('');
    }
  }

  // Upload foto personalizzata
  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  // Toggle competenze
  function toggleSkill(skill) {
    setSkills(current =>
      current.includes(skill)
        ? current.filter(item => item !== skill)
        : [...current, skill]
    );
  }

  // Cambio modalità
  function switchMode(nextMode) {
    setMode(nextMode);
    if (nextMode === 'invite-link') {
      setWorkspaceName('Atelier WEAVE');
    } else {
      setWorkspaceName('');
    }
  }

  const selectedRoleObj = ROLES.find(r => r.id === role);
  const fullName = `${firstName} ${lastName}`.trim();

  // Suggerimento di Filo
  function getFiloTip() {
    if (step === 1) {
      if (fullName) return `Nome registrato: ${fullName}. Scegli il tuo handle per l'Atelier.`;
      return 'Inserisci nome e cognome per iniziare a comporre la tua identità.';
    }
    if (step === 2) {
      if (selectedRoleObj) return `Ruolo selezionato: ${selectedRoleObj.title}.`;
      return 'Seleziona la tua area operativa principale nella filiera tessile.';
    }
    if (step === 3) {
      if (mode === 'invite-link') return 'Invito collegato alla Capsule FW27 di Marta Barbieri.';
      return 'Gli Atelier sono creati dai produttori: il profilo è pronto per entrare in un team.';
    }
    return 'Profilo completato. Puoi entrare direttamente nella dashboard.';
  }

  // Finalizzazione
  function handleFinish() {
    onComplete({
      firstName: firstName.trim() || 'Alex',
      lastName: lastName.trim() || 'Rossi',
      nickname: nickname.trim() || 'alexrossi',
      email,
      avatar: avatar || '/illustrations/profile-avatar.webp',
      role: selectedRoleObj?.title || 'Direzione Creativa & Design',
      skills: skills.length > 0 ? skills : ['Capsule Collection'],
      workspaceName: mode === 'invite-link' ? 'Atelier WEAVE' : null,
      hasAtelier: mode === 'invite-link',
      mode,
    });
  }

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-label="Onboarding WEAVE">
      {/* Barra superiore */}
      <header className="onboarding-top-bar">
        <div className="onb-top-left">
          <span className="onb-brand">weave</span>
          <span className="onb-top-badge">Onboarding</span>
        </div>

        <div className="onb-top-center">
          <div className="onb-mode-segmented" role="radiogroup" aria-label="Modalità onboarding">
            <button
              type="button"
              className={`onb-mode-btn ${mode === 'post-login' ? 'is-active' : ''}`}
              role="radio"
              aria-checked={mode === 'post-login'}
              onClick={() => switchMode('post-login')}
            >
              Post-Login
            </button>
            <button
              type="button"
              className={`onb-mode-btn ${mode === 'invite-link' ? 'is-active' : ''}`}
              role="radio"
              aria-checked={mode === 'invite-link'}
              onClick={() => switchMode('invite-link')}
            >
              Link d’Invito
            </button>
          </div>
        </div>

        <div className="onb-top-right">
          <button type="button" className="onb-exit-btn" onClick={onCancel} aria-label="Esci dall'onboarding e torna al login">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            <span className="onb-exit-text">Torna al login</span>
          </button>
        </div>
      </header>

      {/* Selettore modalità per mobile (sotto la barra) */}
      <div className="onb-mobile-mode-bar">
        <div className="onb-mode-segmented" role="radiogroup" aria-label="Modalità onboarding">
          <button
            type="button"
            className={`onb-mode-btn ${mode === 'post-login' ? 'is-active' : ''}`}
            role="radio"
            aria-checked={mode === 'post-login'}
            onClick={() => switchMode('post-login')}
          >
            Post-Login
          </button>
          <button
            type="button"
            className={`onb-mode-btn ${mode === 'invite-link' ? 'is-active' : ''}`}
            role="radio"
            aria-checked={mode === 'invite-link'}
            onClick={() => switchMode('invite-link')}
          >
            Link d’Invito
          </button>
        </div>
      </div>

      {/* Contenitore principale */}
      <div className="onboarding-container">
        <div className="onb-unified-card">
          {/* ========================================================
              METÀ SINISTRA (SOLO DESKTOP): ANTEPRIMA PROFILO IN COSTRUZIONE
             ======================================================== */}
          <aside className="onb-preview-pane" aria-label="Anteprima profilo">
            <div>
              {/* Intestazione riquadro profilo */}
              <div className="onb-preview-top">
                <span className="onb-preview-label">Il tuo profilo</span>
                <span className="onb-preview-tag">
                  {mode === 'post-login' ? 'Profilo Personale' : 'Invito di Marta'}
                </span>
              </div>

              {/* Avatar e Nome che si buildano piano piano */}
              <div className="onb-preview-hero">
                <div className={`onb-preview-avatar ${avatar ? 'has-image' : ''}`}>
                  {avatar ? (
                    <img src={avatar} alt="Foto profilo" />
                  ) : (
                    <div className="onb-preview-avatar-placeholder" title="Foto non ancora inserita">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="onb-preview-names">
                  <div className={`onb-preview-name-text ${fullName ? '' : 'empty'}`}>
                    {fullName || 'Nome e cognome'}
                  </div>
                  <span className={`onb-preview-handle-text ${nickname ? '' : 'empty'}`}>
                    {nickname ? `@${nickname}` : '@handle'}
                  </span>
                </div>
              </div>

              {/* Slot progressivi che si sbloccano man mano */}
              <div className="onb-preview-fields">
                {/* 1. Ruolo */}
                <div className={`onb-preview-slot ${selectedRoleObj ? 'is-filled' : ''}`}>
                  <span className="onb-slot-title">Ruolo nella filiera</span>
                  <div className={`onb-slot-value ${selectedRoleObj ? '' : 'empty'}`}>
                    {selectedRoleObj ? selectedRoleObj.title : 'In attesa di selezione (Passo 2)'}
                  </div>
                </div>

                {/* 2. Atelier */}
                <div className={`onb-preview-slot ${step >= 3 ? 'is-filled' : ''}`}>
                  <span className="onb-slot-title">
                    {mode === 'invite-link' ? 'Atelier di destinazione' : 'Stato Atelier'}
                  </span>
                  <div className={`onb-slot-value ${step >= 3 ? '' : 'empty'}`}>
                    {mode === 'invite-link'
                      ? 'Atelier WEAVE · Team Marta Barbieri'
                      : (step >= 3 ? 'In attesa di invito da un produttore' : 'In attesa di configurazione (Passo 3)')}
                  </div>
                </div>

                {/* 3. Competenze selezionate */}
                {skills.length > 0 && (
                  <div className="onb-preview-slot is-filled">
                    <span className="onb-slot-title">Competenze selezionate</span>
                    <div className="onb-preview-skills-list">
                      {skills.map(s => (
                        <span key={s} className="onb-preview-skill-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Credenziali demo */}
                <div className="onb-preview-credentials">
                  <span>Account: {email}</span>
                  <span>Password: {passwordMasked} (impostata)</span>
                </div>
              </div>
            </div>

            {/* Suggerimento discreto di Filo in fondo all'anteprima */}
            <div className="onb-preview-footer">
              <img src="/mascot-filo.png" alt="Filo" className="onb-preview-filo-icon" />
              <span className="onb-preview-tip-text">{getFiloTip()}</span>
            </div>
          </aside>

          {/* ========================================================
              METÀ DESTRA (FORM SU DESKTOP / WIZARD SU MOBILE)
             ======================================================== */}
          <main className="onb-form-pane">
            {/* Stepper Progress Bar nativo per Mobile (visibile solo sotto 860px) */}
            <div className="onb-mobile-wizard-header" aria-label={`Passo ${step} di 4: ${STEP_TITLES[step]}`}>
              <div className="onb-mobile-progress-track">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`onb-mobile-segment ${step >= num ? 'is-active' : ''} ${step === num ? 'is-current' : ''}`}
                    onClick={() => setStep(num)}
                    aria-label={`Passo ${num}: ${STEP_TITLES[num]}`}
                  />
                ))}
              </div>
              <div className="onb-mobile-header-meta">
                <div className="onb-mobile-step-indicator">
                  <span className="onb-mobile-step-num">Passo {step}/4</span>
                  <span className="onb-mobile-step-dot">·</span>
                  <span className="onb-mobile-step-name">{STEP_TITLES[step]}</span>
                </div>
                {!fullName && step === 1 && (
                  <button type="button" className="onb-mobile-autofill-btn" onClick={handleAutofillDemo}>
                    Compila demo
                  </button>
                )}
              </div>
            </div>

            {/* Stepper bar per Desktop */}
            <div className="onb-stepper-row">
              <div className="onb-stepper-steps">
                {[
                  { num: 1, label: 'Profilo' },
                  { num: 2, label: 'Ruolo' },
                  { num: 3, label: mode === 'invite-link' ? 'Atelier' : 'Team' },
                  { num: 4, label: 'Fine' },
                ].map(s => {
                  const active = step === s.num;
                  const done = step > s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      className={`onb-step-btn ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
                      onClick={() => setStep(s.num)}
                    >
                      <span>{done ? '✓' : s.num}</span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="onb-stepper-actions">
                {!fullName && (
                  <button type="button" className="onb-autofill-link" onClick={handleAutofillDemo}>
                    Compila dati demo
                  </button>
                )}
                <span className="onb-step-counter-text">Passo {step}/4</span>
              </div>
            </div>

            {/* PASSO 1: PROFILO */}
            {step === 1 && (
              <div key="step-1">
                <div className="onb-step-header">
                  <h2>Crea il tuo profilo</h2>
                  <p>
                    {mode === 'post-login' ? (
                      <>
                        <span className="onb-desc-desktop">
                          Inserisci i tuoi dati personali. L’anteprima a sinistra si aggiornerà in tempo reale.
                        </span>
                        <span className="onb-desc-mobile">
                          Inserisci i tuoi dati personali per configurare la tua identità su WEAVE.
                        </span>
                      </>
                    ) : (
                      'Verifica la tua identità per accedere allo spazio di lavoro condiviso.'
                    )}
                  </p>
                </div>

                <div className="onb-input-row">
                  <label className="onb-form-field">
                    <span className="onb-form-label">Nome</span>
                    <input
                      className="onb-text-input"
                      type="text"
                      value={firstName}
                      placeholder="Es. Alex"
                      autoComplete="given-name"
                      maxLength={80}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </label>

                  <label className="onb-form-field">
                    <span className="onb-form-label">Cognome</span>
                    <input
                      className="onb-text-input"
                      type="text"
                      value={lastName}
                      placeholder="Es. Rossi"
                      autoComplete="family-name"
                      maxLength={80}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </label>
                </div>

                <label className="onb-form-field">
                  <span className="onb-form-label">Nickname / Handle</span>
                  <div className="onb-prefix-wrap">
                    <span className="onb-prefix-at">@</span>
                    <input
                      className="onb-text-input"
                      type="text"
                      value={nickname}
                      placeholder="alexrossi"
                      maxLength={32}
                      onChange={e => setNickname(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase())}
                    />
                  </div>
                </label>

                {/* Scelta avatar */}
                <div className="onb-avatar-box">
                  <span className="onb-avatar-box-label">Foto profilo o avatar</span>
                  <div className="onb-avatar-thumbs">
                    {AVATAR_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`onb-avatar-thumb ${avatar === preset.src ? 'is-active' : ''}`}
                        onClick={() => setAvatar(preset.src)}
                        title={preset.label}
                      >
                        <img src={preset.src} alt={preset.label} />
                      </button>
                    ))}

                    <label className="onb-avatar-upload-label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" x2="12" y1="3" y2="15"/>
                      </svg>
                      <span>Carica foto</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>

                {/* Nota credenziali demo */}
                <div className="onb-creds-note">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>
                    Credenziali collegate alla demo: <strong>{email}</strong> · password presettata.
                  </span>
                </div>

                <div className="onb-form-actions onb-step1-actions">
                  <span className="onb-step1-hint" style={{ fontSize: '12px', color: '#888' }}>
                    Compila i campi per aggiornare l'anteprima
                  </span>
                  <button type="button" className="onb-next-btn onb-step1-next" onClick={() => setStep(2)}>
                    <span>Continua: Ruolo</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 2: RUOLO E COMPETENZE */}
            {step === 2 && (
              <div key="step-2">
                <div className="onb-step-header">
                  <h2>Specializzazione nella filiera</h2>
                  <p>Indica la tua area di competenza per definire il tuo ruolo.</p>
                </div>

                <div className="onb-roles-container" role="radiogroup" aria-label="Ruolo">
                  {ROLES.map(r => (
                    <div
                      key={r.id}
                      className={`onb-role-option ${role === r.id ? 'is-active' : ''}`}
                      role="radio"
                      aria-checked={role === r.id}
                      tabIndex={0}
                      onClick={() => setRole(r.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setRole(r.id); }}
                    >
                      <div className="onb-role-option-title">{r.title}</div>
                      <p className="onb-role-option-desc">{r.desc}</p>
                    </div>
                  ))}
                </div>

                <span className="onb-form-label">Competenze e focus tessili (facoltativo)</span>
                <div className="onb-skills-list">
                  {SKILL_OPTIONS.map(skill => {
                    const active = skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        className={`onb-skill-chip-btn ${active ? 'is-active' : ''}`}
                        onClick={() => toggleSkill(skill)}
                        aria-pressed={active}
                      >
                        {active ? '✓ ' : '+ '}
                        {skill}
                      </button>
                    );
                  })}
                </div>

                <div className="onb-form-actions">
                  <button type="button" className="onb-prev-btn" onClick={() => setStep(1)}>
                    ← Indietro
                  </button>
                  <button type="button" className="onb-next-btn" onClick={() => setStep(3)}>
                    <span>{mode === 'invite-link' ? 'Continua: Atelier' : 'Continua: Team'}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 3: TEAM / INVITO */}
            {step === 3 && (
              <div key="step-3">
                {mode === 'post-login' ? (
                  <>
                    <div className="onb-step-header">
                      <h2>In attesa di assegnazione all’Atelier</h2>
                      <p>Gli Atelier e le linee di produzione vengono configurati direttamente dai produttori.</p>
                    </div>

                    <div className="onb-invite-info-card">
                      <div className="onb-invite-info-header">
                        <strong>Accesso al team di sviluppo</strong>
                        <span className="onb-invite-info-stamp">Nessun Atelier associato</span>
                      </div>
                      <div className="onb-invite-info-body">
                        In WEAVE, le collezioni e gli spazi di lavoro sono gestiti direttamente dai produttori tessili. Come professionista della filiera, il tuo profilo personale sarà pronto per essere invitato a collaborare sui progetti.
                      </div>
                      <div className="onb-colleagues-stack" style={{ marginTop: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#242424' }}>Dati per farti aggiungere al team:</span>
                        <span>Handle: <code>@{nickname || 'handle'}</code></span>
                        <span>Email: <code>{email}</code></span>
                        <span>Ruolo: <code>{selectedRoleObj?.title || 'Non ancora selezionato'}</code></span>
                      </div>
                    </div>

                    <div className="onb-step-note">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>Completando il profilo, nella dashboard troverai il tasto <strong>"Condividi queste informazioni"</strong> per farti aggiungere dal responsabile di produzione.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="onb-step-header">
                      <h2>Invito da Marta Barbieri</h2>
                      <p>Sei stato invitato a collaborare alla capsule collection Autunno/Inverno 2027.</p>
                    </div>

                    <div className="onb-invite-info-card">
                      <div className="onb-invite-info-header">
                        <strong>Atelier WEAVE · Maglia Luce FW27</strong>
                        <span className="onb-invite-info-stamp">Invito Attivo</span>
                      </div>
                      <div className="onb-invite-info-body">
                        Marta Barbieri (Head of Design) ti ha assegnato l’accesso alla collezione per la revisione tecnica dei capi.
                      </div>
                      <div className="onb-colleagues-stack">
                        <span>Membri attivi: Marta Barbieri, Luca Moretti, Elena Ferri</span>
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#555', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={notifyTeam}
                        onChange={e => setNotifyTeam(e.target.checked)}
                      />
                      <span>Invia una notifica di benvenuto a Marta e al team all’ingresso</span>
                    </label>
                  </>
                )}

                <div className="onb-form-actions">
                  <button type="button" className="onb-prev-btn" onClick={() => setStep(2)}>
                    ← Indietro
                  </button>
                  <button type="button" className="onb-next-btn" onClick={() => setStep(4)}>
                    <span>Riepilogo finale</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 4: COMPLETATO */}
            {step === 4 && (
              <div className="onb-complete-container" key="step-4">
                <div className="onb-complete-mascot-wrap" aria-hidden="true">
                  <picture>
                    <source srcSet="/filo-saluta.gif" type="image/gif" media="(prefers-reduced-motion: no-preference)" />
                    <img src="/mascot-filo.png" alt="Filo ti saluta" className="onb-complete-mascot" />
                  </picture>
                </div>

                <h2>Configurazione completata</h2>
                <p>
                  {mode === 'post-login'
                    ? `Il profilo di ${fullName || 'Alex Rossi'} è pronto. Non hai ancora un Atelier associato: potrai condividere il tuo identificativo dalla dashboard per entrare a far parte di un team di sviluppo.`
                    : `Invito accettato per ${fullName || 'Alex Rossi'}. Sei pronto a collaborare con Marta e il team sulla capsule FW27.`}
                </p>

                <div className="onb-summary-card">
                  <div className="onb-summary-prop">
                    <span>Stilista</span>
                    <strong>{fullName || 'Alex Rossi'}</strong>
                  </div>
                  <div className="onb-summary-prop">
                    <span>Handle</span>
                    <strong>@{nickname || 'alexrossi'}</strong>
                  </div>
                  <div className="onb-summary-prop">
                    <span>Ruolo</span>
                    <strong>{selectedRoleObj?.title || 'Direzione Creativa'}</strong>
                  </div>
                  <div className="onb-summary-prop">
                    <span>Stato Atelier</span>
                    <strong>
                      {mode === 'invite-link' ? 'Atelier WEAVE · Team Marta Barbieri' : 'In attesa di associazione a un team'}
                    </strong>
                  </div>
                </div>

                <div className="onb-form-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <button type="button" className="onb-prev-btn" onClick={() => setStep(3)}>
                    ← Modifica
                  </button>
                  <button
                    type="button"
                    className="onb-next-btn"
                    style={{ minHeight: '44px', padding: '0 26px', fontSize: '13.5px' }}
                    onClick={handleFinish}
                  >
                    <span>Entra nella dashboard</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
