import React, { useState } from 'react';

export default function AuthPage({ onEnter }) {
  const [mode, setMode] = useState('login');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const signup = mode === 'signup';

  function changeMode(next) {
    setMode(next);
    setPasswordVisible(false);
  }

  function submit(event) {
    event.preventDefault();
    onEnter();
  }

  return (
    <main className="auth-page">
      <header className="demo-header"><h1>weave<span className="brand-dot" aria-hidden="true">.</span></h1></header>
      <section className="auth-panel" aria-label="Accesso a WEAVE">
        <div className="module-selector auth-selector" role="group" aria-label="Accedi o registrati" style={{ '--selected': signup ? 1 : 0 }}>
          <span className="selector-pill" aria-hidden="true" />
          <button type="button" aria-pressed={!signup} onClick={() => changeMode('login')}><span className="auth-button-label">Accedi</span></button>
          <button type="button" aria-pressed={signup} onClick={() => changeMode('signup')}><span className="auth-button-label">Registrati</span></button>
        </div>

        <div className="auth-content" key={mode}>
          <h2 id="auth-title">{signup ? 'Un nuovo inizio.' : 'Bentornato.'}</h2>
          <p className="auth-intro">{signup ? 'Il tuo prossimo progetto inizia qui.' : 'Riprendiamo da dove nasce un’idea.'}</p>
          <form onSubmit={submit} aria-labelledby="auth-title">
            {signup && <label className="auth-field">Nome<input name="name" type="text" autoComplete="name" defaultValue="Alex Rossi" required maxLength={120} /></label>}
            <label className="auth-field">Email<input name="email" type="email" autoComplete="username" defaultValue="demo@weave.it" required maxLength={254} /></label>
            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className="password-input">
                <input id="auth-password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} defaultValue="weavedemo" required minLength={8} maxLength={128} />
                <button className="password-toggle" type="button" aria-label={passwordVisible ? 'Nascondi password' : 'Mostra password'} aria-pressed={passwordVisible} aria-controls="auth-password" onClick={() => setPasswordVisible(visible => !visible)}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{passwordVisible && <path d="m3 3 18 18" />}</svg>
                </button>
              </div>
            </div>
            <button className="auth-submit" type="submit">
              <span className="auth-button-label">{signup ? 'Crea account demo' : 'Entra in weave'}</span>
              <span className="auth-submit-arrow" aria-hidden="true"><svg viewBox="0 0 40 28" fill="none"><path d="M4 20C13 23 14 6 8 7C2 8 6 15 16 14H34" /><path d="m28 8 6 6-6 6" /></svg></span>
            </button>
          </form>
          <p className="auth-note">È una demo. Puoi usare i dati già compilati.</p>
        </div>
      </section>
    </main>
  );
}
