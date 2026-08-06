import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export function SignInPage() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = mode === 'signin' ? await signInWithEmail(email, password) : await signUpWithEmail(email, password);
    setBusy(false);
    if (error) setError(error);
    else navigate('/learn');
  }

  return (
    <div className="sign-in-page">
      <h1>{mode === 'signin' ? t('sign_in_title') : t('sign_up_title')}</h1>
      <form onSubmit={onSubmit}>
        <label>
          {t('sign_in_email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          {t('sign_in_password')}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{mode === 'signin' ? t('sign_in_title') : 'Sign up'}</button>
      </form>
      <button onClick={signInWithGoogle} className="google-btn">{t('sign_in_google')}</button>
      <button className="link-btn" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? t('sign_in_switch_to_signup') : t('sign_in_switch_to_signin')}
      </button>
    </div>
  );
}
