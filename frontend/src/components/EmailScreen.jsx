/**
 * Email screen — MIRA Commute Companion design (OnboardingEmail).
 * Back, email input with validation, info card, Continue.
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

function AlertCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const MIN_NAME_LENGTH = 2

function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function EmailScreen({ onContinue, onSkip, onBack, errorMessage }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [touched, setTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  const isValidName = displayName.trim().length >= MIN_NAME_LENGTH
  const isValidEmail = EMAIL_REGEX.test(email.trim())
  const isValidPassword = password.length >= MIN_PASSWORD_LENGTH
  const showNameError = nameTouched && !isValidName && displayName.length > 0
  const showEmailError = touched && !isValidEmail && email.length > 0
  const showPasswordError = passwordTouched && !isValidPassword && password.length > 0
  const canContinue = isValidName && isValidEmail && isValidPassword

  const handleContinue = () => {
    if (canContinue) {
      onContinue({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      })
    }
  }

  return (
    <div className="h-dvh min-h-dvh max-h-dvh overflow-hidden flex flex-col px-6 pt-14 pb-10 bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative">
      {/* Decorative blobs */}
      <div className="absolute top-32 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-[#E4F0FF]/35 to-[#C8DFFF]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-40 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-[#FFEDE4]/30 to-[#FFD9C8]/20 blur-3xl pointer-events-none" aria-hidden />

      {/* Header */}
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
        <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">Enter your email to save</h1>
        <p className="text-sm text-gray-500">
          We&apos;ll use this to save your preferences and sync across devices.
        </p>
      </div>

      {/* Name Input */}
      <div className="mb-4 relative z-10 shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <UserIcon className="w-[18px] h-[18px]" />
          </div>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            placeholder="Your name"
            className={`
              flex h-14 w-full rounded-2xl border bg-white pl-12 pr-4 py-3 text-[15px] font-medium
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm
              ${showNameError
                ? 'border-red-400 focus:ring-red-300'
                : isValidName && displayName.trim()
                  ? 'border-green-400 focus:ring-green-300'
                  : 'border-gray-200 focus:ring-[#FFD56B] focus:border-transparent'
              }
            `}
          />
        </div>
        {showNameError && (
          <p className="flex items-center gap-1.5 mt-2 text-sm text-red-500">
            <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
            Please enter your name
          </p>
        )}
      </div>

      {/* Email Input */}
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
              flex h-14 w-full rounded-2xl border bg-white pl-12 pr-12 py-3 text-[15px] font-medium
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm
              ${showEmailError
                ? 'border-red-400 focus:ring-red-300'
                : isValidEmail && email.trim()
                  ? 'border-green-400 focus:ring-green-300'
                  : 'border-gray-200 focus:ring-[#FFD56B] focus:border-transparent'
              }
            `}
          />
          {email.length > 0 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isValidEmail ? (
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                </div>
              ) : touched ? (
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircleIcon className="w-3.5 h-3.5 text-red-500" />
                </div>
              ) : null}
            </div>
          )}
        </div>
        {showEmailError && (
          <p className="flex items-center gap-1.5 mt-2 text-sm text-red-500">
            <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
            Please enter a valid email address
          </p>
        )}
      </div>

      {/* Password Input */}
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
            placeholder="Password (min 8 characters)"
            className={`
              flex h-14 w-full rounded-2xl border bg-white pl-12 pr-12 py-3 text-[15px] font-medium
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm
              ${showPasswordError
                ? 'border-red-400 focus:ring-red-300'
                : isValidPassword && password.length > 0
                  ? 'border-green-400 focus:ring-green-300'
                  : 'border-gray-200 focus:ring-[#FFD56B] focus:border-transparent'
              }
            `}
          />
          {password.length > 0 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isValidPassword ? (
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                </div>
              ) : passwordTouched ? (
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircleIcon className="w-3.5 h-3.5 text-red-500" />
                </div>
              ) : null}
            </div>
          )}
        </div>
        {showPasswordError && (
          <p className="flex items-center gap-1.5 mt-2 text-sm text-red-500">
            <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
            Password must be at least {MIN_PASSWORD_LENGTH} characters
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 relative z-10">
          {errorMessage}
        </div>
      )}

      {/* Info card */}
      <div className="mb-6 relative z-10 shrink-0">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-[#E4F0FF]/50 to-[#C8DFFF]/30 border border-[#C8DFFF]/50">
          <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
            <MailIcon className="w-4 h-4 text-[#0066B3]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1F1F1F] mb-1">Why we need your email</p>
            <p className="text-xs text-gray-600">
              Your email helps us save your learning progress, preferences, and favorite routes securely.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-6 shrink-0 relative z-10 mt-auto">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={`
            w-full h-14 px-8 py-4 rounded-full font-semibold text-base transition-all
            ${canContinue
              ? 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98]'
              : 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
            }
          `}
        >
          Continue
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-center text-gray-400 mt-3 hover:text-gray-600 transition-colors w-full"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
