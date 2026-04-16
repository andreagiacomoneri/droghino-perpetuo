export default function NavBar({ tab, setTab, hasActiveSession }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: IconGrid },
    { id: 'session',   label: 'Session',   icon: IconClock },
    { id: 'history',   label: 'History',   icon: IconList  },
    { id: 'stats',     label: 'Stats',     icon: IconBar   },
  ]

  return (
    <nav style={{
      height: 72, background: 'var(--surface)', borderTop: '0.5px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 8px', flexShrink: 0,
    }}>
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, padding: '10px 4px', background: 'none', border: 'none',
            cursor: 'pointer', color: tab === id ? 'var(--text)' : 'var(--text-dim)',
            fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 500,
            position: 'relative', transition: 'color 0.15s',
          }}
        >
          <Icon size={22} />
          {id === 'session' && hasActiveSession && (
            <span style={{
              position: 'absolute', top: 8, right: 'calc(50% - 14px)',
              width: 6, height: 6, background: 'var(--cami)',
              borderRadius: '50%', animation: 'pulse 1.5s infinite',
            }} />
          )}
          {label}
        </button>
      ))}
    </nav>
  )
}

function IconGrid({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}
function IconClock({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
  )
}
function IconList({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>
  )
}
function IconBar({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  )
}
