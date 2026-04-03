import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { sanitize } from '@/utils/sanitize';

type AuthTab = 'login' | 'register';

export default function Login() {
  const { isAuthenticated, role, login, register } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'prestataire') {
        navigate('/prestataire/dashboard', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  function switchTab(tab: AuthTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setFormKey((k) => k + 1);
  }

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

    if (regPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.');
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
          {activeTab === 'login' ? 'Se connecter' : 'Créer un compte'}
        </h1>
        <p className="mt-2 text-center text-sm text-text-light">
          {activeTab === 'login'
            ? 'Accédez à votre espace pour gérer vos rendez-vous.'
            : 'Inscrivez-vous pour réserver et suivre vos séances.'}
        </p>

        {/* Tabs */}
        <div className="relative mt-8 flex gap-3">
          <button
            type="button"
            className={`flex-1 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-400 ${
              activeTab === 'login'
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                : 'border border-rose-soft bg-white text-text-light shadow-sm hover:border-primary-light hover:shadow-md'
            }`}
            onClick={() => switchTab('login')}
          >
            Se connecter
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-400 ${
              activeTab === 'register'
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                : 'border border-rose-soft bg-white text-text-light shadow-sm hover:border-primary-light hover:shadow-md'
            }`}
            onClick={() => switchTab('register')}
          >
            S&apos;inscrire
          </button>
        </div>

        {/* Forms with transition */}
        <div key={formKey} className="auth-form-enter mt-8">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-text">E-mail</label>
                <input id="login-email" type="email" required autoComplete="email" className={inputClasses} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-text">Mot de passe</label>
                <div className="relative">
                  <input id="login-password" type={showLoginPassword ? 'text' : 'password'} required autoComplete="current-password" className={inputClasses} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowLoginPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-light transition-colors hover:text-primary-dark" aria-label={showLoginPassword ? 'Masquer' : 'Afficher'}>
                    {showLoginPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="mt-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:opacity-60">
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>

              <p className="mt-2 text-center text-sm text-text-light">
                Pas encore de compte&nbsp;?{' '}
                <button type="button" onClick={() => switchTab('register')} className="font-semibold text-primary-dark underline underline-offset-2 transition-colors hover:text-primary">
                  S&apos;inscrire
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
                <div className="relative">
                  <input id="reg-password" type={showRegPassword ? 'text' : 'password'} required autoComplete="new-password" className={inputClasses} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowRegPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-light transition-colors hover:text-primary-dark" aria-label={showRegPassword ? 'Masquer' : 'Afficher'}>
                    {showRegPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="mt-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg disabled:opacity-60">
                {isLoading ? 'Inscription...' : 'Créer mon compte'}
              </button>

              <p className="mt-2 text-center text-sm text-text-light">
                Déjà un compte&nbsp;?{' '}
                <button type="button" onClick={() => switchTab('login')} className="font-semibold text-primary-dark underline underline-offset-2 transition-colors hover:text-primary">
                  Se connecter
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
