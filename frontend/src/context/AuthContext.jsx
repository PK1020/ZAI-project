import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'; // 1. Dodano useEffect i useCallback
import axios from 'axios';

//const API_URL = ''; // Używamy proxy Vite
const API_URL = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // 2. Zdefiniuj 'logout' za pomocą 'useCallback', aby była stabilna
    // Ta funkcja będzie używana przez interceptor
    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
    }, [setToken, setUser]); // Zależności: funkcje ustawiające stan

    // Efekt do ustawiania tokenu w axiosie (bez zmian)
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ id: payload.userId, username: payload.username });
            } catch (e) {
                console.error("Błąd dekodowania tokenu", e);
                logout(); // Użyj nowej funkcji logout, jeśli token jest zły
            }
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
        }
    }, [token, logout]); // Dodano 'logout' jako zależność

    // 3. NOWY EFEKT: Konfiguracja Interceptora (Strażnika)
    useEffect(() => {
        // Ustawiamy interceptor na odpowiedzi (response)
        const interceptorId = axios.interceptors.response.use(
            (response) => {
                // Jeśli odpowiedź jest poprawna (2xx), po prostu ją zwróć
                return response;
            },
            (error) => {
                // Jeśli wystąpił błąd
                // Sprawdź, czy to błąd 401 lub 403
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.error("Wykryto nieważną sesję (401/403). Wylogowywanie.");

                    // Użyj funkcji logout zdefiniowanej wyżej
                    logout();

                    // Wymuś przekierowanie do logowania
                    window.location.href = '/login';
                }

                // Zwróć błąd, aby formularz (np. save) nadal mógł go złapać
                return Promise.reject(error);
            }
        );

        // Funkcja czyszcząca: usuń interceptor, gdy komponent AuthProvider
        // jest usuwany (np. przy odświeżaniu)
        return () => {
            axios.interceptors.response.eject(interceptorId);
        };
    }, [logout]); // Zależność od stabilnej funkcji 'logout'

    const login = async (username, password) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { username, password });
            setToken(res.data.token);
            setUser(res.data.user);
            return true;
        } catch (error) {
            console.error('Błąd logowania:', error.response?.data || error.message);
            return false;
        }
    };
    
    // 🔹 NOWA FUNKCJA – dodaj ją pod login
    const register = async (username, password) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, { username, password });
            // możesz ewentualnie automatycznie logować, ale na razie wystarczy:
            return { success: true, message: res.data.message };
        } catch (error) {
            console.error('Błąd rejestracji:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Błąd podczas tworzenia użytkownika',
            };
        }
    };

    const changePassword = async (oldPassword, newPassword) => {
        try {
            await axios.put(`${API_URL}/auth/change-password`, { oldPassword, newPassword });
            return { success: true, message: 'Hasło zmienione!' };
        } catch (error) {
            return { success: false, message: error.response.data.error || 'Błąd serwera' };
        }
    };

    const authContextValue = {
        user,
        token,
        login,
        logout,
        changePassword,
        register,            // 🔹 NOWA LINIA
        isAuthenticated: !!token,
    };

    return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};