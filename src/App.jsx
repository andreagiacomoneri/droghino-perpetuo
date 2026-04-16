import { useState } from 'react'
import Dashboard from './components/dashboard/Dashboard.jsx'
import Session from './components/session/Session.jsx'
import History from './components/history/History.jsx'
import Stats from './components/stats/Stats.jsx'
import NavBar from './components/shared/NavBar.jsx'
import { useSession } from './hooks/useSession.js'
import { useAllData } from './hooks/useAllData.js'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const sessionData = useSession()
  const allData = useAllData()

  function handleTabChange(t) {
    setTab(t)
    // Refetch data when switching tabs to stay fresh
    if (t === 'dashboard' || t === 'history' || t === 'stats') {
      allData.refetch()
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {tab === 'dashboard' && <Dashboard sessionData={sessionData} allData={allData} onNavigate={handleTabChange} />}
        {tab === 'session'   && <Session   sessionData={sessionData} allData={allData} onSessionChange={() => { allData.refetch(); handleTabChange('dashboard') }} />}
        {tab === 'history'   && <History   allData={allData} />}
        {tab === 'stats'     && <Stats     allData={allData} />}
      </div>
      <NavBar tab={tab} setTab={handleTabChange} hasActiveSession={!!sessionData.activeSession} />
    </div>
  )
}
