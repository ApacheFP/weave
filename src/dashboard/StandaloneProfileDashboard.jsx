import React, { useState } from 'react';
import './standalone-profile.css';

export default function StandaloneProfileDashboard({ profile, onJoinDemoTeam, onSignOut }) {
  const [copiedField, setCopiedField] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const fullName = `${profile?.firstName || 'Alex'} ${profile?.lastName || 'Rossi'}`.trim();
  const nickname = profile?.nickname || 'alexrossi';
  const email = profile?.email || 'demo@weave.it';
  const role = profile?.role || 'Direzione Creativa & Design';
  const avatar = profile?.avatar || '/illustrations/profile-avatar.webp';
  const skills = profile?.skills || [];

  const shareText = `Profilo WEAVE: ${fullName} (@${nickname} · ${email}) — Specializzazione: ${role}. Aggiungimi al team di sviluppo dell'Atelier!`;

  function copyToClipboard(text, fieldName) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2500);
      }).catch(() => {
        fallbackCopy(text, fieldName);
      });
    } else {
      fallbackCopy(text, fieldName);
    }
  }

  function fallbackCopy(text, fieldName) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (e) {
      console.warn('Copia non riuscita:', e);
    }
  }

  function handleMainShare() {
    copyToClipboard(shareText, 'all');
    setShowShareModal(true);
  }

  return (
    <div className="dw-standalone-shell">
      {/* Intestazione minimale */}
      <header className="dw-standalone-topbar">
        <div className="dw-standalone-brand-wrap">
          <span className="dw-standalone-brand">WEAVE</span>
          <span className="dw-standalone-brand-badge">Profilo Professionale</span>
        </div>

        <div className="dw-standalone-user-controls">
          <div className="dw-standalone-user-pill">
            <img src={avatar} alt="" className="dw-standalone-user-avatar-mini" />
            <span className="dw-standalone-user-name">{fullName}</span>
            <span className="dw-standalone-user-handle">@{nickname}</span>
          </div>
          <button type="button" className="dw-standalone-signout-btn" onClick={onSignOut}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Esci</span>
          </button>
        </div>
      </header>

      {/* Contenuto principale focalizzato */}
      <main className="dw-standalone-main">
        <div className="dw-standalone-card">
          {/* Badge di stato superiore */}
          <div className="dw-standalone-status-bar">
            <span className="dw-standalone-status-dot" aria-hidden="true" />
            <span className="dw-standalone-status-text">Profilo attivo · In attesa di assegnazione all’Atelier</span>
          </div>

          {/* Profilo Header */}
          <div className="dw-standalone-profile-header">
            <div className="dw-standalone-avatar-wrap">
              <img src={avatar} alt={fullName} className="dw-standalone-avatar-img" />
            </div>
            <div className="dw-standalone-profile-meta">
              <h1 className="dw-standalone-title">{fullName}</h1>
              <div className="dw-standalone-handle">@{nickname}</div>
              <div className="dw-standalone-role-badge">{role}</div>
            </div>
          </div>

          {/* Testo esplicativo chiaro */}
          <div className="dw-standalone-notice">
            <p className="dw-standalone-notice-lead">
              Gli Atelier e le linee di produzione vengono creati e configurati dai produttori tessili sulla piattaforma WEAVE.
            </p>
            <p className="dw-standalone-notice-sub">
              Per iniziare a lavorare sui capi, cartamodelli e distinte base della capsule, condividi le tue informazioni con il responsabile di produzione o il brand per entrare a far parte del team di sviluppo.
            </p>
          </div>

          {/* Riquadro Dati Identificativi per il team */}
          <div className="dw-standalone-data-box">
            <div className="dw-standalone-data-row">
              <div className="dw-standalone-data-label">Nickname / Handle</div>
              <div className="dw-standalone-data-value">
                <code>@{nickname}</code>
                <button
                  type="button"
                  className="dw-standalone-copy-mini-btn"
                  onClick={() => copyToClipboard(`@${nickname}`, 'nickname')}
                  aria-label="Copia nickname"
                >
                  {copiedField === 'nickname' ? (
                    <span className="dw-copied-badge">Copiato ✓</span>
                  ) : (
                    <span>Copia handle</span>
                  )}
                </button>
              </div>
            </div>

            <div className="dw-standalone-data-row">
              <div className="dw-standalone-data-label">Email registrata</div>
              <div className="dw-standalone-data-value">
                <code>{email}</code>
                <button
                  type="button"
                  className="dw-standalone-copy-mini-btn"
                  onClick={() => copyToClipboard(email, 'email')}
                  aria-label="Copia email"
                >
                  {copiedField === 'email' ? (
                    <span className="dw-copied-badge">Copiato ✓</span>
                  ) : (
                    <span>Copia email</span>
                  )}
                </button>
              </div>
            </div>

            <div className="dw-standalone-data-row">
              <div className="dw-standalone-data-label">Specializzazione nella filiera</div>
              <div className="dw-standalone-data-value">
                <strong>{role}</strong>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="dw-standalone-data-row">
                <div className="dw-standalone-data-label">Competenze & Focus</div>
                <div className="dw-standalone-skills-wrap">
                  {skills.map(s => (
                    <span key={s} className="dw-standalone-skill-chip">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TASTO PRINCIPALE IN EVIDENZA: CONDIVIDI QUESTE INFORMAZIONI */}
          <div className="dw-standalone-action-section">
            <button
              type="button"
              className="dw-standalone-share-btn"
              onClick={handleMainShare}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Condividi queste informazioni</span>
            </button>

            {copiedField === 'all' && (
              <div className="dw-standalone-toast">
                <span>Informazioni copiate negli appunti! Incollale al responsabile o al produttore.</span>
              </div>
            )}
          </div>

          {/* Sezione discreta per la simulazione demo */}
          {onJoinDemoTeam && (
            <div className="dw-standalone-demo-box">
              <div className="dw-standalone-demo-text">
                <strong>Simulazione Demo WEAVE:</strong>
                <p>Vuoi testare la piattaforma completa con i capi, moduli e cartamodelli dell’Atelier?</p>
              </div>
              <button
                type="button"
                className="dw-standalone-join-btn"
                onClick={onJoinDemoTeam}
              >
                <span>Simula ingresso nel team (Atelier WEAVE) →</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal di Condivisione Dettagliata */}
      {showShareModal && (
        <div
          className="dw-standalone-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Condividi informazioni profilo"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="dw-standalone-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="dw-standalone-modal-head">
              <div>
                <h2>Condividi il tuo profilo</h2>
                <p>Invia questi dati al produttore o al brand manager per essere aggiunto al team di sviluppo.</p>
              </div>
              <button
                type="button"
                className="dw-standalone-modal-close"
                onClick={() => setShowShareModal(false)}
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>

            <div className="dw-standalone-modal-body">
              <label className="dw-standalone-modal-field">
                <span className="dw-standalone-modal-label">Messaggio preformattato per il responsabile</span>
                <textarea
                  className="dw-standalone-modal-textarea"
                  readOnly
                  rows={4}
                  value={shareText}
                />
              </label>

              <div className="dw-standalone-modal-buttons">
                <button
                  type="button"
                  className="dw-standalone-modal-copy-btn"
                  onClick={() => copyToClipboard(shareText, 'modal-all')}
                >
                  {copiedField === 'modal-all' ? 'Messaggio copiato ✓' : 'Copia messaggio completo'}
                </button>
                <button
                  type="button"
                  className="dw-standalone-modal-mini-copy"
                  onClick={() => copyToClipboard(`@${nickname}`, 'modal-nick')}
                >
                  {copiedField === 'modal-nick' ? 'Copiato ✓' : 'Copia solo @handle'}
                </button>
                <button
                  type="button"
                  className="dw-standalone-modal-mini-copy"
                  onClick={() => copyToClipboard(email, 'modal-email')}
                >
                  {copiedField === 'modal-email' ? 'Copiato ✓' : 'Copia solo email'}
                </button>
              </div>
            </div>

            <div className="dw-standalone-modal-foot">
              <button
                type="button"
                className="dw-standalone-modal-done-btn"
                onClick={() => setShowShareModal(false)}
              >
                Fatto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
