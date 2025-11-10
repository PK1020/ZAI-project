import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import SeriesManager from './pages/SeriesManager.jsx'; // <-- 1. ZAIMPORTUJ NOWY KOMPONENT
import './App.css' // style działają tak samo w Vite

function App() {
    const { isAuthenticated, logout } = useAuth()

    return (
        <div>
            <nav className="navbar no-print">
                <Link to="/">Dashboard</Link>
                {isAuthenticated ? (
                    <>
                        <Link to="/profile">Zmień hasło</Link>
                        <Link to="/manage-series">Zarządzaj Seriami</Link> {/* TEN LINK */}
                        <button onClick={logout}>Wyloguj</button>
                    </>
                ) : (
                    <Link to="/login">Zaloguj</Link>
                )}
            </nav>

            <Routes>
                {/* Publiczne */}
                <Route path="/" element={<Dashboard />} />

                {/* Logowanie */}
                <Route path="/login" element={<Login />} />

                {/* Chronione */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/manage-series" element={<SeriesManager />} />
                </Route>
            </Routes>
        </div>
    )
}

export default App
