import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Briefcase, 
  PenTool, 
  User, 
  Send, 
  Building2, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Globe,
  CreditCard,
  Search,
  KeyRound,
  Inbox
} from 'lucide-react';
import { UserSession, Channel, RegisteredUser, AuthorRates } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  channels: Channel[];
  onRegister: (newSession: UserSession) => void;
  onLogin: (email: string, role: UserSession['role']) => void;
  onLogout: () => void;
  initialMode?: 'login' | 'register';
  defaultRole?: UserSession['role'];
}

type RegistrationStep = 'role_select' | 'fill_details' | 'verify_email' | 'success';

interface SimulatedEmailData {
  from: string;
  to: string;
  subject: string;
  code: string;
  directVerifyUrl: string;
  html?: string;
  sentAt: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  session,
  channels,
  onRegister,
  onLogin,
  onLogout,
  initialMode = 'register',
  defaultRole = '💼 Маркетолог'
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>(initialMode);
  const [regStep, setRegStep] = useState<RegistrationStep>('role_select');

  // Common Registration Fields
  const [selectedRole, setSelectedRole] = useState<UserSession['role']>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');

  // Marketer-Specific Fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [budgetTier, setBudgetTier] = useState('100 000 - 500 000 ₽');
  const [paymentMethod, setPaymentMethod] = useState('Безналичный расчет (ООО с НДС)');

  // Author-Specific Fields
  const [authorChannelQuery, setAuthorChannelQuery] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<number | undefined>(undefined);
  const [customChannelName, setCustomChannelName] = useState('');
  const [customDzenId, setCustomDzenId] = useState('');
  const [taxStatus, setTaxStatus] = useState<AuthorRates['tax_status']>('Самозанятый (НПД)');
  const [postPrice, setPostPrice] = useState<number>(30000);
  const [nativePrice, setNativePrice] = useState<number>(55000);
  const [videoPrice, setVideoPrice] = useState<number>(85000);

  // Email Confirmation State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [simulatedEmail, setSimulatedEmail] = useState<SimulatedEmailData | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successVerifiedUser, setSuccessVerifiedUser] = useState<RegisteredUser | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSimulatedInbox, setShowSimulatedInbox] = useState(true);

  // Login simple form
  const [loginEmail, setLoginEmail] = useState('alex.marketer@media.ru');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginRole, setLoginRole] = useState<UserSession['role']>('💼 Маркетолог');

  // Refs for OTP inputs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setRegStep('role_select');
      setSelectedRole(defaultRole);
      setErrorMessage(null);
      setOtpDigits(['', '', '', '', '', '']);
    }
  }, [isOpen, initialMode, defaultRole]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Search filtered channels
  const matchedChannels = channels.filter(c => 
    authorChannelQuery.trim().length > 1 &&
    (c.name.toLowerCase().includes(authorChannelQuery.toLowerCase()) || 
     c.dzen_id.toLowerCase().includes(authorChannelQuery.toLowerCase()))
  ).slice(0, 5);

  // Step 1 -> Step 2
  const handleSelectRoleAndProceed = (role: UserSession['role']) => {
    setSelectedRole(role);
    setRegStep('fill_details');
    setErrorMessage(null);
  };

  // Step 2 Submit: Call backend /api/v1/auth/register and generate confirmation email
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Пожалуйста, введите корректный адрес электронной почты');
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage('Пожалуйста, укажите ваше имя или название проекта');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedChannel = channels.find(c => c.id === selectedChannelId);
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        name: fullName.trim(),
        role: selectedRole,
        telegram: telegramHandle.trim() ? (telegramHandle.startsWith('@') ? telegramHandle : `@${telegramHandle}`) : undefined,
        // Marketer fields
        company: selectedRole === '💼 Маркетолог' ? companyName || 'Рекламное агентство' : undefined,
        website: selectedRole === '💼 Маркетолог' ? companyWebsite : undefined,
        budgetTier: selectedRole === '💼 Маркетолог' ? budgetTier : undefined,
        paymentMethod: selectedRole === '💼 Маркетолог' ? paymentMethod : undefined,
        // Author fields
        channelId: selectedChannelId,
        dzenId: selectedChannel?.dzen_id || customDzenId || undefined,
        channelName: selectedChannel?.name || customChannelName || authorChannelQuery || undefined,
        taxStatus: selectedRole === '✍️ Автор канала' ? taxStatus : undefined,
        rates: selectedRole === '✍️ Автор канала' ? {
          post_price: postPrice,
          native_price: nativePrice,
          video_price: videoPrice,
          tax_status: taxStatus,
          is_custom_set: true
        } : undefined
      };

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.canLogin) {
          setErrorMessage(data.error);
          return;
        }
        throw new Error(data.error || 'Ошибка при отправке запроса на регистрацию');
      }

      // Received verification details
      setSimulatedEmail(data.simulatedEmail);
      setRegStep('verify_email');
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);

      // Focus first OTP input after DOM render
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setErrorMessage(err.message || 'Произошла ошибка при регистрации');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Handle OTP code changes
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Handle paste of full 6 digits
    if (cleaned.length >= 6) {
      const newDigits = cleaned.slice(0, 6).split('');
      setOtpDigits(newDigits);
      otpInputRefs.current[5]?.focus();
      handleVerifyCode(newDigits.join(''));
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1); // last entered char
    setOtpDigits(newDigits);

    // Auto move to next input
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits are entered
    if (newDigits.every(d => d !== '') && newDigits.join('').length === 6) {
      handleVerifyCode(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP code with backend
  const handleVerifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      setErrorMessage('Пожалуйста, введите полный 6-значный код из письма');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Неверный код подтверждения');
      }

      setSuccessVerifiedUser(data.user);
      setRegStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка проверки кода');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct 1-click verification from simulated email link
  const handleDirectVerify = async () => {
    if (!simulatedEmail?.code) return;
    setOtpDigits(simulatedEmail.code.split(''));
    await handleVerifyCode(simulatedEmail.code);
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось отправить код повторно');
      }

      setSimulatedEmail(data.simulatedEmail);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка отправки повторного кода');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete registration flow
  const handleCompleteRegistration = () => {
    const activeUser = successVerifiedUser;
    const finalSession: UserSession = {
      email: activeUser?.email || email,
      name: activeUser?.name || fullName,
      companyOrBlog: activeUser?.company || (selectedRole === '💼 Маркетолог' ? companyName : customChannelName),
      phoneOrTg: activeUser?.telegram || telegramHandle,
      role: selectedRole,
      isAuthenticated: true,
      emailVerified: true,
      authorChannelId: selectedRole === '✍️ Автор канала' ? (activeUser?.channelId || selectedChannelId || 1) : undefined,
      verificationCode: 'DZEN-' + Math.floor(100000 + Math.random() * 900000),
      isChannelClaimed: true,
      registeredUser: activeUser || undefined
    };

    onRegister(finalSession);
    onClose();
  };

  // Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, role: loginRole })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      onLogin(loginEmail, loginRole);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка авторизации');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySimulatedCode = () => {
    if (!simulatedEmail?.code) return;
    navigator.clipboard.writeText(simulatedEmail.code);
    setCopiedCode(true);
    setOtpDigits(simulatedEmail.code.split(''));
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-xl shadow-2xl relative max-h-[94vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Dzen Analytics Platform</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'register' 
                ? 'Полноценная регистрация с подтверждением по почте' 
                : 'Вход в личный кабинет рекламодателя и автора'}
            </p>
          </div>
        </div>

        {/* Global Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-in shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* If user is already authenticated */}
        {session.isAuthenticated ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Вы авторизованы в системе</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                  Email подтвержден ✓
                </span>
              </div>
              <div className="text-slate-300">
                Email: <span className="font-semibold text-white">{session.email}</span>
              </div>
              {session.name && (
                <div className="text-slate-300 mt-0.5">
                  Имя / Организация: <span className="font-semibold text-white">{session.name}</span>
                </div>
              )}
              <div className="text-slate-300 mt-0.5">
                Текущая роль: <span className="font-semibold text-indigo-300">{session.role}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onLogout();
                  setActiveTab('register');
                  setRegStep('role_select');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
              >
                Сменить аккаунт / Выйти
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-600/30"
              >
                Продолжить работу
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Tabs: Register / Login (Only show if not in middle of verification) */}
            {regStep !== 'verify_email' && regStep !== 'success' && (
              <div className="flex rounded-2xl bg-slate-950 p-1 mb-5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'register'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Создать аккаунт (Регистрация)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'login'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Вход в кабинет
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* REGISTRATION FLOW */}
            {/* ========================================================================= */}
            {activeTab === 'register' && (
              <div>
                
                {/* Step Progress Breadcrumb */}
                <div className="flex items-center justify-between mb-5 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      regStep === 'role_select' ? 'bg-indigo-600 text-white ring-2 ring-indigo-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      1
                    </div>
                    <span className={`text-[11px] font-semibold ${regStep === 'role_select' ? 'text-white' : 'text-slate-500'}`}>
                      Выбор роли
                    </span>
                  </div>

                  <div className="w-6 h-0.5 bg-slate-800" />

                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      regStep === 'fill_details' ? 'bg-indigo-600 text-white ring-2 ring-indigo-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      2
                    </div>
                    <span className={`text-[11px] font-semibold ${regStep === 'fill_details' ? 'text-white' : 'text-slate-500'}`}>
                      Анкета
                    </span>
                  </div>

                  <div className="w-6 h-0.5 bg-slate-800" />

                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      regStep === 'verify_email' || regStep === 'success' ? 'bg-indigo-600 text-white ring-2 ring-indigo-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      3
                    </div>
                    <span className={`text-[11px] font-semibold ${regStep === 'verify_email' || regStep === 'success' ? 'text-white' : 'text-slate-500'}`}>
                      Почта
                    </span>
                  </div>
                </div>

                {/* ----------------------------------------------------------------------- */}
                {/* STEP 1: ROLE SELECTION */}
                {/* ----------------------------------------------------------------------- */}
                {regStep === 'role_select' && (
                  <div className="space-y-4 text-xs animate-in fade-in">
                    <p className="text-slate-300 font-semibold mb-2">
                      Выберите, в качестве кого вы регистрируетесь:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      
                      {/* Marketer Card */}
                      <button
                        type="button"
                        onClick={() => handleSelectRoleAndProceed('💼 Маркетолог')}
                        className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-indigo-500 hover:bg-indigo-500/10 text-left transition-all group flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div className="font-bold text-white text-sm mb-1 group-hover:text-indigo-300 transition-colors">
                            💼 Маркетолог / Рекламодатель
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Для брендов, агентств и медиабаеров. Подбор блогеров с высоким виральным индексом (VI), расчет медиаплана, CRM сделок и закрывающие документы.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-indigo-400 font-bold text-[11px]">
                          <span>Выбрать кабинет маркетолога</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>

                      {/* Author Card */}
                      <button
                        type="button"
                        onClick={() => handleSelectRoleAndProceed('✍️ Автор канала')}
                        className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-pink-500 hover:bg-pink-500/10 text-left transition-all group flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-pink-600 group-hover:text-white transition-all">
                            <PenTool className="w-5 h-5" />
                          </div>
                          <div className="font-bold text-white text-sm mb-1 group-hover:text-pink-300 transition-colors">
                            ✍️ Автор канала в Дзене
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Для создателей контента и блогеров. Привязка Дзен-канала, управление прайс-листом (посты, статьи, видео), получение прямых заказов от брендов.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-pink-400 font-bold text-[11px]">
                          <span>Выбрать кабинет автора</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>

                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 mt-4">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>После регистрации вам придет письмо с 6-значным кодом для безопасной активации аккаунта.</span>
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------------------------------- */}
                {/* STEP 2: ROLE-SPECIFIC REGISTRATION DETAILS */}
                {/* ----------------------------------------------------------------------- */}
                {regStep === 'fill_details' && (
                  <form onSubmit={handleDetailsSubmit} className="space-y-4 text-xs animate-in fade-in">
                    
                    {/* Role indicator banner */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${selectedRole === '💼 Маркетолог' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-pink-600/20 text-pink-400'}`}>
                          {selectedRole === '💼 Маркетолог' ? <Briefcase className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Выбранная роль:</div>
                          <div className="font-bold text-white">{selectedRole}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRegStep('role_select')}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Изменить
                      </button>
                    </div>

                    {/* Common User Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold mb-1 block">
                          {selectedRole === '💼 Маркетолог' ? 'ФИО / Должность:' : 'Имя автора / Псевдоним:'}
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={selectedRole === '💼 Маркетолог' ? 'Алексей Смирнов, Media Buyer' : 'Михаил Иванов (Блогер)'}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold mb-1 block">
                          Рабочий Email <span className="text-indigo-400">(для кода подтверждения)</span>:
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@yandex.ru или name@company.ru"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold mb-1 block">Пароль:</label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Минимум 6 символов"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold mb-1 block">Telegram (@username для связи):</label>
                        <div className="relative">
                          <Send className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={telegramHandle}
                            onChange={(e) => setTelegramHandle(e.target.value)}
                            placeholder="@username"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ------------------------------------------------------------- */}
                    {/* MARKETER SPECIFIC FIELDS */}
                    {/* ------------------------------------------------------------- */}
                    {selectedRole === '💼 Маркетолог' && (
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold">
                          <Building2 className="w-4 h-4" />
                          <span>Профиль рекламодателя / агентства:</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-400 font-medium mb-1 block">Компания / Агентство / Бренд:</label>
                            <input
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="ООO РекламаПро или бренд"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-slate-400 font-medium mb-1 block">Сайт или проект (опционально):</label>
                            <input
                              type="text"
                              value={companyWebsite}
                              onChange={(e) => setCompanyWebsite(e.target.value)}
                              placeholder="https://company.ru"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-400 font-medium mb-1 block">Рекламный бюджет (в месяц):</label>
                            <select
                              value={budgetTier}
                              onChange={(e) => setBudgetTier(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-indigo-500"
                            >
                              <option value="до 100 000 ₽">до 100 000 ₽</option>
                              <option value="100 000 - 500 000 ₽">100 000 - 500 000 ₽</option>
                              <option value="500 000 - 1 500 000 ₽">500 000 - 1 500 000 ₽</option>
                              <option value="от 1 500 000 ₽">от 1 500 000 ₽</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-slate-400 font-medium mb-1 block">Форма расчетов / закрывающие:</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-indigo-500"
                            >
                              <option value="Безналичный расчет (ООО с НДС)">Безналичный расчет (ООО с НДС)</option>
                              <option value="УСН (ИП без НДС)">УСН (ИП без НДС)</option>
                              <option value="Самозанятый / Банковская карта">Самозанятый / Банковская карта</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ------------------------------------------------------------- */}
                    {/* AUTHOR SPECIFIC FIELDS */}
                    {/* ------------------------------------------------------------- */}
                    {selectedRole === '✍️ Автор канала' && (
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-pink-300 font-bold">
                            <PenTool className="w-4 h-4" />
                            <span>Привязка канала в Дзене & Прайс-лист:</span>
                          </div>
                          <span className="text-[10px] text-pink-400">для рекламодателей</span>
                        </div>

                        {/* Search in database or specify URL */}
                        <div>
                          <label className="text-slate-400 font-medium mb-1 block">
                            Найдите ваш канал в каталоге или введите ссылку dzen.ru/id:
                          </label>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={authorChannelQuery}
                              onChange={(e) => {
                                setAuthorChannelQuery(e.target.value);
                                setSelectedChannelId(undefined);
                                setCustomDzenId(e.target.value.replace(/https?:\/\/dzen\.ru\//, ''));
                              }}
                              placeholder="Например: Технологии Будущего или dzen.ru/tech_future"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Matching dropdown */}
                          {matchedChannels.length > 0 && !selectedChannelId && (
                            <div className="mt-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                              {matchedChannels.map(ch => (
                                <button
                                  key={ch.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedChannelId(ch.id);
                                    setCustomChannelName(ch.name);
                                    setCustomDzenId(ch.dzen_id);
                                    setAuthorChannelQuery(`${ch.name} (@${ch.dzen_id})`);
                                    if (ch.rates) {
                                      setPostPrice(ch.rates.post_price || 30000);
                                      setNativePrice(ch.rates.native_price || 55000);
                                      setVideoPrice(ch.rates.video_price || 85000);
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between text-xs transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-600/30 flex items-center justify-center font-bold text-[10px] text-indigo-300">
                                      {ch.name[0]}
                                    </div>
                                    <span className="text-white font-medium">{ch.name}</span>
                                  </div>
                                  <span className="text-slate-400 text-[10px]">@{ch.dzen_id} • {ch.subscribers_count.toLocaleString('ru-RU')} сабов</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {selectedChannelId && (
                            <div className="mt-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-1.5 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Канал выбран из базы и будет привязан к вашему кабинету!</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-slate-400 font-medium mb-1 block">Налоговый статус автора:</label>
                            <select
                              value={taxStatus}
                              onChange={(e) => setTaxStatus(e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="Самозанятый (НПД)">Самозанятый (НПД)</option>
                              <option value="ИП (УСН 6%)">ИП (УСН 6%)</option>
                              <option value="ООО / С НДС">ООО / С НДС</option>
                              <option value="Физлицо">Физлицо</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-slate-400 font-medium mb-1 block">Стоимость нативной статьи (₽):</label>
                            <input
                              type="number"
                              step="1000"
                              value={nativePrice}
                              onChange={(e) => setNativePrice(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep('role_select')}
                        className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Назад</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Отправка кода...</span>
                          </>
                        ) : (
                          <>
                            <span>Получить код на Email</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* ----------------------------------------------------------------------- */}
                {/* STEP 3: EMAIL CONFIRMATION (ПОДТВЕРЖДЕНИЕ ЧЕРЕЗ ПОЧТУ) */}
                {/* ----------------------------------------------------------------------- */}
                {regStep === 'verify_email' && (
                  <div className="space-y-4 text-xs animate-in fade-in">
                    
                    {/* Top Email Status Banner */}
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
                        <Mail className="w-6 h-6 animate-bounce" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Проверьте вашу электронную почту</h4>
                      <p className="text-xs text-slate-300 max-w-sm mx-auto">
                        Мы отправили 6-значный проверочный код безопасности на адрес:
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-indigo-500/40 text-indigo-300 font-bold font-mono text-xs">
                        <span>{email}</span>
                      </div>
                    </div>

                    {/* 6-Digit OTP Box Input */}
                    <div className="space-y-2 text-center py-2">
                      <label className="text-slate-300 font-bold block text-xs">
                        Введите 6-значный код подтверждения:
                      </label>
                      <div className="flex justify-center gap-2 sm:gap-2.5">
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => { otpInputRefs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 rounded-2xl text-white focus:outline-none shadow-lg transition-all focus:ring-2 focus:ring-indigo-500/30"
                          />
                        ))}
                      </div>
                    </div>

                    {/* SIMULATED INBOX / EMAIL PREVIEW BOX */}
                    {simulatedEmail && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                            <Inbox className="w-4 h-4 text-indigo-400" />
                            <span>Входящее письмо (Dzen Analytics Mailbox):</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{simulatedEmail.sentAt}</span>
                        </div>

                        <div className="space-y-1.5 text-[11px]">
                          <div className="text-slate-400">
                            От: <strong className="text-slate-200">{simulatedEmail.from}</strong>
                          </div>
                          <div className="text-slate-400 truncate">
                            Тема: <strong className="text-white">{simulatedEmail.subject}</strong>
                          </div>
                        </div>

                        {/* Direct Actions from the Email */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="text-xs text-slate-300">Код:</div>
                            <div className="px-3 py-1 rounded-lg bg-indigo-950 border border-indigo-500 font-mono text-base font-black text-indigo-300 tracking-wider">
                              {simulatedEmail.code}
                            </div>
                            <button
                              type="button"
                              onClick={handleCopySimulatedCode}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Скопировать и вставить код"
                            >
                              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleDirectVerify}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Подтвердить в 1 клик</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Resend Code & Change Email Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setRegStep('fill_details');
                          setErrorMessage(null);
                        }}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Изменить email</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || isSubmitting}
                        className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                        <span>
                          {resendCooldown > 0 
                            ? `Повтор через ${resendCooldown}с` 
                            : 'Отправить код еще раз'}
                        </span>
                      </button>
                    </div>

                    {/* Submit Confirmation Button */}
                    <button
                      type="button"
                      onClick={() => handleVerifyCode()}
                      disabled={isSubmitting || otpDigits.some(d => !d)}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Проверка кода...</span>
                        </>
                      ) : (
                        <>
                          <span>Подтвердить и войти</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>

                  </div>
                )}

                {/* ----------------------------------------------------------------------- */}
                {/* STEP 4: SUCCESS / ONBOARDING COMPLETION */}
                {/* ----------------------------------------------------------------------- */}
                {regStep === 'success' && (
                  <div className="space-y-5 text-center py-4 animate-in zoom-in-95">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 border border-emerald-500/30">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">Регистрация успешно завершена!</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Адрес электронной почты <strong className="text-emerald-300">{email}</strong> подтвержден.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                      <div className="text-slate-400 flex items-center justify-between">
                        <span>Профиль:</span>
                        <strong className="text-white">{fullName}</strong>
                      </div>
                      <div className="text-slate-400 flex items-center justify-between">
                        <span>Роль в системе:</span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold">
                          {selectedRole}
                        </span>
                      </div>
                      {selectedRole === '💼 Маркетолог' && (
                        <div className="text-slate-400 flex items-center justify-between">
                          <span>Организация:</span>
                          <strong className="text-white">{companyName || 'Рекламное агентство'}</strong>
                        </div>
                      )}
                      {selectedRole === '✍️ Автор канала' && (
                        <div className="text-slate-400 flex items-center justify-between">
                          <span>Привязанный блог:</span>
                          <strong className="text-white">{customChannelName || authorChannelQuery || 'Дзен канал'}</strong>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCompleteRegistration}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2"
                    >
                      <span>
                        {selectedRole === '✍️ Автор канала' 
                          ? 'Перейти в Кабинет Автора' 
                          : 'Перейти к Каталогу и CRM'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* ========================================================================= */}
            {/* LOGIN FORM */}
            {/* ========================================================================= */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs animate-in fade-in">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Email / Логин:</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@yandex.ru или alex.marketer@media.ru"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Пароль:</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Войти как:</label>
                  <select
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="💼 Маркетолог">💼 Маркетолог (Рекламодатель)</option>
                    <option value="✍️ Автор канала">✍️ Автор канала (Дзен-Студия)</option>
                    <option value="🛠️ Администратор">🛠️ Администратор платформы</option>
                    <option value="🌐 Каталог">🌐 Обычный пользователь (Каталог)</option>
                  </select>
                </div>

                {/* Yandex OAuth alternative */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLogin('dzen.creator@yandex.ru', '✍️ Автор канала');
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/30 mb-2"
                  >
                    <span className="font-black text-sm">Я</span>
                    <span>Быстрый вход через Yandex ID (Автор)</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Войти по логину и паролю
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
