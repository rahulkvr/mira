/**
 * Profile tab — placeholder matching Commute Companion style.
 */
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function ProfileTab() {
  const { user, signOut } = useAuth()
  const [signOutError, setSignOutError] = useState(null)
  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || 'Profile'
  const email = user?.email

  const handleSignOut = async () => {
    setSignOutError(null)
    const { error } = await signOut()
    if (error) {
      setSignOutError(error.message || 'Could not sign out. Please try again.')
    }
  }

  return (
    <div className="min-h-screen px-5 pt-4 pb-6 bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFFDF9] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br from-[#E0F5ED]/40 to-[#B8E8D4]/30 blur-3xl pointer-events-none" aria-hidden />

      <div className="relative z-10 flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FFE9A8] to-[#FFD56B] flex items-center justify-center shadow-lg shrink-0">
          <UserIcon className="w-7 h-7 text-[#1F1F1F]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1F1F1F]">{displayName}</h1>
          <p className="text-sm text-gray-500">{email || 'Your preferences and stats'}</p>
        </div>
      </div>

      <div className="relative z-10 rounded-2xl bg-white/80 border border-gray-100 p-6 text-center text-gray-500">
        <p className="text-sm">Profile and settings coming soon.</p>
      </div>

      {signOutError && (
        <div className="relative z-10 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {signOutError}
        </div>
      )}

      <div className="relative z-10 mt-6">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full h-12 rounded-full font-semibold text-sm transition-all bg-white border border-gray-200 text-[#1F1F1F] hover:bg-gray-50 shadow-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
