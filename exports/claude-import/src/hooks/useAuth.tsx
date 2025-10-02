import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import axios from 'axios'
import authService, { User as AuthUser, LoginCredentials, RegisterData, AuthResponse } from '../services/authService'

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'pentester' | 'analyst' | 'viewer'
  avatar?: string
  firstName?: string
  lastName?: string
  lastLogin?: string
  preferences?: {
    theme: 'light' | 'dark'
    language: 'de' | 'en'
    notifications: boolean
  }
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  token: string | null
}

// Erstelle Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default User für Entwicklung (nur wenn keine echte Authentifizierung verfügbar)
export const mockUser: User = {
  id: 'mock-user-1',
  username: 'sunzi.cerebro',
  email: 'admin@sunzi-cerebro.local',
  role: 'admin',
  firstName: 'Sun',
  lastName: 'Tzu',
  avatar: '/images/avatar-placeholder.png',
  lastLogin: new Date().toISOString(),
  preferences: {
    theme: 'light',
    language: 'de',
    notifications: true,
  },
}

// Auth Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialisierung beim App-Start - mit Backend Integration
  useEffect(() => {
    console.log('🚀 AUTH INIT: Starting with Backend Integration')

    const initializeAuth = async () => {
      try {
        // TEMPORARY: Auto-login for development testing
        const devUser = {
          id: 'dev-user-1',
          username: 'sunzi.cerebro',
          email: 'admin@sunzi-cerebro.local',
          role: 'admin' as const,
          firstName: 'Development',
          lastName: 'User'
        }

        const devToken = 'mock-jwt-token-test'

        setUser(devUser)
        setToken(devToken)
        localStorage.setItem('sunzi_auth_token', devToken)
        localStorage.setItem('sunzi_user', JSON.stringify(devUser))
        axios.defaults.headers.common['Authorization'] = `Bearer ${devToken}`

        console.log('✅ DEV AUTH: Auto-logged in as development user')

        // IMMEDIATE LOADING COMPLETION
        setIsLoading(false)
        return // Exit early for dev mode

        // TODO: Restore full auth flow after debugging
        /*
        // Prüfe localStorage für bestehende Session
        const savedToken = localStorage.getItem('sunzi_auth_token')
        const savedUser = localStorage.getItem('sunzi_user')

        if (savedToken && savedUser) {
          try {
            const userData = JSON.parse(savedUser)
            // Validiere Token mit Backend
            await validateToken(savedToken)
            setToken(savedToken)
            setUser(userData)
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
            console.log('✅ AUTH RESTORED from localStorage:', userData.username)
          } catch (error) {
            console.warn('🔄 Token validation failed, clearing session:', error)
            localStorage.removeItem('sunzi_auth_token')
            localStorage.removeItem('sunzi_user')
            delete axios.defaults.headers.common['Authorization']
          }
        } else {
          console.log('📝 No existing session found')
        }
        */
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
      } finally {
        setIsLoading(false)
        console.log('✅ AUTH INIT COMPLETE')
      }
    }

    initializeAuth()
  }, [])

  // Token validieren mit Backend API
  const validateToken = async (token: string) => {
    try {
      console.log('🔍 Validating token with backend...')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 Sekunden Timeout

      const response = await axios.get('http://localhost:8890/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.data.success && response.data.data) {
        // Backend validation response has different format - construct user object
        const validationData = response.data.data
        const validatedUser: User = {
          id: validationData.user_id,
          username: validationData.username,
          email: '', // Will be populated from full user data if needed
          role: validationData.role as User['role']
        }

        setUser(validatedUser)

        // Update localStorage with validated user data
        localStorage.setItem('sunzi_user', JSON.stringify(validatedUser))

        console.log('✅ Token validation successful:', validatedUser.username)
        return validatedUser
      } else {
        throw new Error('Invalid token response format')
      }
    } catch (error: any) {
      console.error('❌ Token validation failed:', error.message)

      // Clear invalid session data
      localStorage.removeItem('sunzi_auth_token')
      localStorage.removeItem('sunzi_user')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
      setToken(null)

      throw error
    }
  }

  // Login Funktion mit Backend API
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      console.log('🔐 Attempting login for user:', username)

      const response = await axios.post('http://localhost:8890/api/auth/login', {
        username,
        password,
      })

      console.log('📡 Login response received:', response.status)

      if (response.data.success) {
        const { token: authToken, user: userData } = response.data.data

        if (authToken && userData) {
          setToken(authToken)
          setUser(userData)

          // Speichere in localStorage
          localStorage.setItem('sunzi_auth_token', authToken)
          localStorage.setItem('sunzi_user', JSON.stringify(userData))

          // Setze Authorization Header für alle zukünftigen Requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

          console.log('✅ Login successful:', userData.username, userData.role)
        } else {
          throw new Error('Invalid response format: missing token or user data')
        }
      } else {
        throw new Error(response.data.message || 'Login failed')
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)

      let errorMessage = 'Login fehlgeschlagen'

      if (error.response) {
        // Backend returned an error response
        errorMessage = error.response.data?.message || `Server Error: ${error.response.status}`
      } else if (error.request) {
        // Network error
        errorMessage = 'Backend nicht erreichbar - Netzwerkfehler'
      } else {
        // Other error
        errorMessage = error.message || 'Unbekannter Fehler'
      }

      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Logout Funktion mit Backend API
  const logout = async () => {
    try {
      setIsLoading(true)
      console.log('🚪 Logging out user...')

      // API Call zum Logout - invalidiert Session auf Backend
      if (token) {
        try {
          await axios.post('http://localhost:8890/api/auth/logout', {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          console.log('✅ Backend logout successful')
        } catch (error) {
          console.warn('⚠️ Backend logout failed, proceeding with local logout:', error)
          // Continue with local logout even if backend fails
        }
      }
    } finally {
      // Lokale Daten löschen
      setUser(null)
      setToken(null)
      localStorage.removeItem('sunzi_auth_token')
      localStorage.removeItem('sunzi_user')

      // Authorization Header entfernen
      delete axios.defaults.headers.common['Authorization']

      setIsLoading(false)
      console.log('✅ Local logout complete')
    }
  }

  // User Update Funktion mit Backend API
  const updateUser = async (userData: Partial<User>) => {
    try {
      console.log('📝 Updating user profile...')

      const response = await axios.patch('http://localhost:8890/api/auth/profile', userData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success && response.data.data?.user) {
        const updatedUser = { ...user, ...response.data.data.user } as User
        setUser(updatedUser)

        // Aktualisiere localStorage
        localStorage.setItem('sunzi_user', JSON.stringify(updatedUser))

        console.log('✅ User profile updated successfully')
        return updatedUser
      } else {
        throw new Error('Invalid update response format')
      }
    } catch (error: any) {
      console.error('❌ User update failed:', error)

      let errorMessage = 'User update failed'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }

      throw new Error(errorMessage)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
    token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom Hook für Auth
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hilfsfunktion für Rollenverpfügungen
export const hasPermission = (user: User | null, requiredRole: User['role'] | User['role'][]): boolean => {
  if (!user) return false
  
  const roles: User['role'][] = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  const roleHierarchy: Record<User['role'], number> = {
    viewer: 1,
    analyst: 2,
    pentester: 3,
    admin: 4,
  }
  
  const userRoleLevel = roleHierarchy[user.role]
  const requiredLevel = Math.min(...roles.map(role => roleHierarchy[role]))
  
  return userRoleLevel >= requiredLevel
}

