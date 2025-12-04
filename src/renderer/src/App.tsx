import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Splash from '@renderer/pages/splash'
import Main from '@renderer/pages/main'
import '@renderer/assets/common.scss'
import { NotifyProvider } from './contexts/NotifyContext'

function App(): React.JSX.Element {
  return (
    <NotifyProvider>
      <Router>
        <Routes>
          <Route index element={<Splash />} />
          <Route path="/main" element={<Main />} />
        </Routes>
      </Router>
    </NotifyProvider>
  )
}

export default App
