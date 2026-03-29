import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';

type AuthTab = 'login' | 'register';

function sanitize(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export default function Login() {
  const { isAuthenticated, role, login, loginWithGoogle, register } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [isLoading, setIsLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'prestataire') {
        navigate('/prestataire/dashboard', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      const error = await login(sanitize(loginEmail), loginPassword);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Connexion réussie.');
      }
    } catch {
      toast.error('Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!regFirstName || !regLastName || !regEmail || !regPassword) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsLoading(true);
    try {
      const error = await register(
        sanitize(regEmail),
        regPassword,
        sanitize(regFirstName),
        sanitize(regLastName),
        sanitize(regPhone),
      );
      if (error) {
        toast.error(error);
      } else {
        toast.success('Compte créé. Vérifiez votre e-mail pour confirmer.');
      }
    } catch {
      toast.error('Erreur lors de l\'inscription.');
    } finally {
      setIsLoading(false);
    }
  }

  const inputClasses =
    'w-full rounded-xl border border-rose-soft bg-white px-4 py-3 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200';

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
          Connexion
        </h1>

        <div className="mt-8 flex overflow-hidden rounded-xl border border-rose-soft">
          <button
            type="button"
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 ${
              activeTab === 'login'
                ? 'bg-primary text-white'
                : 'bg-white text-text-light hover:bg-nude'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Connexion
          </button>
          <button
            type="button"
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 ${
              activeTab === 'register'
                ? 'bg-primary text-white'
                : 'bg-white text-text-light hover:bg-nude'
            }`}
            onClick={() => setActiveTab('register')}
          >
            Inscription
          </button>
        </div>

        {/* Google SSO */}
        <button
          type="button"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            const error = await loginWithGoogle();
            if (error) toast.error(error);
            setIsLoading(false);
          }}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-rose-soft bg-white px-4 py-3 text-sm font-medium text-text shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuer avec Google
        </button>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-rose-soft" />
          <span className="text-xs font-medium text-text-light">ou par e-mail</span>
          <div className="h-px flex-1 bg-rose-soft" />
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-text">E-mail</label>
              <input id="login-email" type="email" required autoComplete="email" className={inputClasses} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-text">Mot de passe</label>
              <input id="login-password" type="password" required autoComplete="current-password" className={inputClasses} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={isLoading} className="mt-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:opacity-60">
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-8 flex flex-col gap-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-firstName" className="mb-1.5 block text-sm font-medium text-text">Prénom</label>
                <input id="reg-firstName" type="text" required autoComplete="given-name" className={inputClasses} value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="reg-lastName" className="mb-1.5 block text-sm font-medium text-text">Nom</label>
                <input id="reg-lastName" type="text" required autoComplete="family-name" className={inputClasses} value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-text">E-mail</label>
              <input id="reg-email" type="email" required autoComplete="email" className={inputClasses} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="reg-phone" className="mb-1.5 block text-sm font-medium text-text">Téléphone</label>
              <input id="reg-phone" type="tel" autoComplete="tel" className={inputClasses} placeholder="06 12 34 56 78" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
            </div>
            <div>
              <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-text">Mot de passe</label>
              <input id="reg-password" type="password" required autoComplete="new-password" className={inputClasses} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={isLoading} className="mt-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:opacity-60">
              {isLoading ? 'Inscription...' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
