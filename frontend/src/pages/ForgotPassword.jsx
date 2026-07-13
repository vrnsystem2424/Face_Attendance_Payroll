import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  forgotPassword,
  verifyOTP,
  resetPassword,
  resetForgotPassword,
  clearForgotError,
} from '../redux/slices/authSlice';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    forgotLoading,
    forgotError,
    forgotMessage,
    otpSent,
    otpVerified,
    passwordReset,
  } = useSelector((state) => state.auth);

  // Step: 1=email, 2=otp, 3=newpassword, 4=success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Step progression
  useEffect(() => {
    if (otpSent && step === 1) setStep(2);
  }, [otpSent]);

  useEffect(() => {
    if (otpVerified && step === 2) setStep(3);
  }, [otpVerified]);

  useEffect(() => {
    if (passwordReset && step === 3) setStep(4);
  }, [passwordReset]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { dispatch(resetForgotPassword()); };
  }, []);

  // ── Handlers ──
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearForgotError());
    if (!email) { setLocalError('Email daalo'); return; }
    dispatch(forgotPassword(email));
    setResendTimer(60);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLocalError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) { setLocalError('6 digit OTP daalo'); return; }
    dispatch(verifyOTP({ email, otp: otpString }));
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (newPassword.length < 6) {
      setLocalError('Password kam se kam 6 characters ka hona chahiye');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Dono passwords match nahi kar rahe');
      return;
    }
    const otpString = otp.join('');
    dispatch(resetPassword({ email, otp: otpString, newPassword }));
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    dispatch(clearForgotError());
    dispatch(forgotPassword(email));
    setResendTimer(60);
  };

  // ── Step Labels ──
  const steps = ['Email', 'OTP', 'Password'];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      {/* BG Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#E8590C]/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#F4A261]/8 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[460px]">

          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-lg shadow-orange-200/50">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Reset Password</h1>
            <p className="mt-1 text-sm text-[#6B7280]">AttendEase Account Recovery</p>
          </div>

          {/* Card */}
          <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_-10px_rgba(26,26,46,0.12)]">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />

            {/* ── SUCCESS SCREEN ── */}
            {step === 4 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                  <svg className="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#1A1A2E]">Password Reset!</h2>
                <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">
                  {forgotMessage || 'Aapka password successfully reset ho gaya hai.'}
                </p>
                <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-700">
                    ✅ Ab aap naye password se login kar sakte hain
                  </p>
                </div>
                <button
                  onClick={() => {
                    dispatch(resetForgotPassword());
                    navigate('/login');
                  }}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Login Page par Jao →
                </button>
              </div>
            ) : (
              <div className="p-8">

                {/* Progress Steps */}
                <div className="mb-8 flex items-center justify-between">
                  {steps.map((label, i) => {
                    const stepNum = i + 1;
                    const isActive = step === stepNum;
                    const isDone = step > stepNum;
                    return (
                      <div key={i} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all
                            ${isDone ? 'bg-emerald-500 text-white' :
                              isActive ? 'bg-[#E8590C] text-white shadow-lg shadow-orange-200/50' :
                              'bg-gray-100 text-gray-400'}`}
                          >
                            {isDone ? (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : stepNum}
                          </div>
                          <span className={`mt-1 text-[10px] font-semibold uppercase tracking-wide
                            ${isActive ? 'text-[#E8590C]' : isDone ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {label}
                          </span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`mx-2 mb-4 h-0.5 flex-1 transition-all
                            ${step > stepNum ? 'bg-emerald-400' : 'bg-gray-200'}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Error */}
                {(forgotError || localError) && (
                  <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 animate-shake">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <p className="text-sm font-medium text-red-700">{forgotError || localError}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {forgotMessage && !forgotError && step < 4 && (
                  <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-emerald-700">{forgotMessage}</p>
                    </div>
                  </div>
                )}

                {/* ══ STEP 1: EMAIL ══ */}
                {step === 1 && (
                  <form onSubmit={handleSendOTP}>
                    <div className="mb-2">
                      <h2 className="text-xl font-bold text-[#1A1A2E]">Email Verify Karo</h2>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Registered email daalo — OTP bheja jayega
                      </p>
                    </div>

                    <div className="mt-6 mb-6">
                      <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                        Email Address <span className="text-[#E8590C]">*</span>
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF]">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91A2.25 2.25 0 012.25 6.993V6.75" />
                          </svg>
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus
                          placeholder="name@company.com"
                          className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {forgotLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          OTP bhej rahe hain...
                        </span>
                      ) : 'OTP Bhejo →'}
                    </button>
                  </form>
                )}

                {/* ══ STEP 2: OTP ══ */}
                {step === 2 && (
                  <form onSubmit={handleVerifyOTP}>
                    <div className="mb-2">
                      <h2 className="text-xl font-bold text-[#1A1A2E]">OTP Verify Karo</h2>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        6-digit OTP daalo jo{' '}
                        <span className="font-semibold text-[#E8590C]">{email}</span>
                        {' '}par bheja gaya
                      </p>
                    </div>

                    {/* OTP Input Boxes */}
                    <div className="mt-6 mb-2 flex items-center justify-center gap-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          className={`h-13 w-12 rounded-xl border-2 text-center text-xl font-bold text-[#1A1A2E] outline-none transition-all
                            ${digit ? 'border-[#E8590C] bg-[#FFF3E8]' : 'border-gray-200 bg-[#FAFAFA]'}
                            focus:border-[#E8590C] focus:bg-[#FFF8F3] focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]`}
                          style={{ height: '52px' }}
                        />
                      ))}
                    </div>

                    {/* Resend */}
                    <div className="mb-6 text-center">
                      {resendTimer > 0 ? (
                        <p className="text-xs text-[#9CA3AF]">
                          Resend OTP in{' '}
                          <span className="font-bold text-[#E8590C]">{resendTimer}s</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          className="text-xs font-semibold text-[#E8590C] hover:underline"
                        >
                          OTP nahi mila? Dobara bhejo
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading || otp.join('').length !== 6}
                      className="w-full rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verify ho raha hai...
                        </span>
                      ) : 'OTP Verify Karo →'}
                    </button>
                  </form>
                )}

                {/* ══ STEP 3: NEW PASSWORD ══ */}
                {step === 3 && (
                  <form onSubmit={handleResetPassword}>
                    <div className="mb-2">
                      <h2 className="text-xl font-bold text-[#1A1A2E]">Naya Password Set Karo</h2>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Strong password choose karo
                      </p>
                    </div>

                    <div className="mt-6 space-y-4 mb-6">
                      {/* New Password */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                          Naya Password <span className="text-[#E8590C]">*</span>
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF]">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          </span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            autoFocus
                            placeholder="Minimum 6 characters"
                            className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-12 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#9CA3AF] hover:text-[#E8590C]"
                          >
                            {showPassword ? (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {/* Password strength */}
                        {newPassword && (
                          <div className="mt-2 flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                                newPassword.length >= i * 3
                                  ? newPassword.length >= 10 ? 'bg-emerald-500'
                                    : newPassword.length >= 6 ? 'bg-amber-500'
                                    : 'bg-red-500'
                                  : 'bg-gray-200'
                              }`} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                          Password Confirm Karo <span className="text-[#E8590C]">*</span>
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF]">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Same password dobara daalo"
                            className={`w-full rounded-xl border py-3.5 pl-12 pr-12 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all
                              ${confirmPassword && confirmPassword !== newPassword
                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                : confirmPassword && confirmPassword === newPassword
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-gray-200 bg-[#FAFAFA] focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]'}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#9CA3AF] hover:text-[#E8590C]"
                          >
                            {showConfirm ? (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {confirmPassword && confirmPassword !== newPassword && (
                          <p className="mt-1 text-xs text-red-500">❌ Passwords match nahi kar rahe</p>
                        )}
                        {confirmPassword && confirmPassword === newPassword && (
                          <p className="mt-1 text-xs text-emerald-600">✅ Passwords match kar rahe hain</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading || !newPassword || !confirmPassword}
                      className="w-full rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Reset ho raha hai...
                        </span>
                      ) : '🔐 Password Reset Karo'}
                    </button>
                  </form>
                )}

                {/* Back to Login */}
                {step < 4 && (
                  <div className="mt-6 text-center">
                    <Link
                      to="/login"
                      className="text-sm font-medium text-[#9CA3AF] hover:text-[#E8590C] transition-colors"
                    >
                      ← Login par wapas jao
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default ForgotPassword;