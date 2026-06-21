import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import JobDetail from './pages/JobDetail'
import Apply from './pages/Apply'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import BottomNav from './components/BottomNav'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/job/:id" element={<JobDetail />} />
            <Route path="/apply/:id" element={<Apply />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
