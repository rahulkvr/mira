/**
 * Sign in screen — for returning users. Email + password, Sign in / Back.
 */
import { useState } from 'react'

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function MailIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignInScreen({ onSignIn, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  const isValidEmail = EMAIL_REGEX.test(email.trim())
  const isValidPassword = password.length >= 1
  const showEmailError = touched && !isValidEmail && email.length > 0
  const canSubmit = isValidEmail && isValidPassword

  const handleSubmit = () => {
    if (canSubmit) onSignIn(email.trim(), password)
  }

  return (
    <div className="h-dvh min-h-dvh max-h-dvh overflow-hidden flex flex-col px-6 pt-14 pb-10 bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative">
      <div className="absolute top-32 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-[#E4F0FF]/35 to-[#C8DFFF]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-40 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-[#FFEDE4]/30 to-[#FFD9C8]/20 blur-3xl pointer-events-none" aria-hidden />

      <div className="mb-8 relative z-10 shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-[#1F1F1F] transition-colors"
          >
            <ChevronLeftIcon className="w-[18px] h-[18px]" />
            Back
          </button>
        )}
        <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">Sign in</h1>
        <p className="text-sm text-gray-500">
          Enter your email and password to continue.
        </p>
      </div>

      <div className="mb-4 relative z-10 shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <MailIcon className="w-[18px] h-[18px]" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="your@email.com"
            className={`
              flex h-14 w-full rounded-2xl border bg-white pl-12 pr-4 py-3 text-[15px] font-medium
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm
              ${showEmailError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-[#FFD56B] focus:border-transparent'}
            `}
          />
        </div>
        {showEmailError && (
          <p className="flex items-center gap-1.5 mt-2 text-sm text-red-500">Please enter a valid email address</p>
        )}
      </div>

      <div className="mb-6 relative z-10 shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <LockIcon className="w-[18px] h-[18px]" />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            placeholder="Password"
            className="flex h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 py-3 text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD56B] focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      <div className="pt-6 shrink-0 relative z-10 mt-auto">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`
            w-full h-14 px-8 py-4 rounded-full font-semibold text-base transition-all
            ${canSubmit
              ? 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98]'
              : 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
            }
          `}
        >
          Sign in
        </button>
      </div>
    </div>
  )
}
