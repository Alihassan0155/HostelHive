import { createContext, useContext, useState, useEffect, useRef } from 'react';
import apiClient from '../config/axios.js';
import { auth } from '../config/firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const isCheckingAuth = useRef(false);
  const isLoggingIn = useRef(false);

  // REGISTER
  const register = async (userInfo) => {
    try {
      const response = await apiClient.post('/auth/register', userInfo);
      if (response.data) {
        setCurrentUser({ email: response.data.email, uid: response.data.uid });
        setUserData(response.data.userData);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // LOGIN
  const login = async (email, password) => {
    // Set flag to prevent auth state listener from interfering
    isLoggingIn.current = true;
    
    try {
      // First, sign in to Firebase on the frontend
      // This ensures auth.currentUser is set for the axios interceptor
      let firebaseUser;
      try {
        firebaseUser = await signInWithEmailAndPassword(auth, email, password);
      } catch (firebaseError) {
        console.error('Firebase sign-in error:', firebaseError);
        isLoggingIn.current = false;
        let errorMessage = 'Invalid email or password';
        if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/user-not-found') {
          errorMessage = 'Invalid email or password';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (firebaseError.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed attempts. Please try again later.';
        }
        throw new Error(errorMessage);
      }

      // Now get user data from backend using /auth/me
      // The axios interceptor will automatically add the Firebase token
      try {
        const response = await apiClient.get('/auth/me');
        
        if (response.data && response.data.userData) {
          const user = response.data.userData;
          
          // Set user data from backend response
          setUserData(user);
          setCurrentUser({ 
            email: user.email || firebaseUser.user.email, 
            uid: user.id || user._id || firebaseUser.user.uid 
          });

          // Clear login flag after successful login
          isLoggingIn.current = false;

          // Return user with role for component-level redirect
          return user;
        } else {
          throw new Error('Failed to get user data');
        }
      } catch (backendError) {
        console.error('Backend auth error:', backendError);
        // If backend call fails, sign out from Firebase and clear state
        await auth.signOut();
        setCurrentUser(null);
        setUserData(null);
        isLoggingIn.current = false;
        throw new Error('Failed to authenticate. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      // If login fails, make sure Firebase is signed out and state is cleared
      try {
        await auth.signOut();
      } catch (signOutError) {
        // Ignore sign out errors
      }
      // Clear state to prevent any redirects
      setCurrentUser(null);
      setUserData(null);
      isLoggingIn.current = false;
      
      // Re-throw the error with proper message
      if (error.message) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      // Sign out from Firebase first
      await auth.signOut();
      // Then call backend logout if needed
      try {
        await apiClient.post('/auth/logout');
      } catch (apiError) {
        // Backend logout is optional, continue even if it fails
        console.warn('Backend logout failed:', apiError);
      }
      setCurrentUser(null);
      setUserData(null);
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state and redirect
      setCurrentUser(null);
      setUserData(null);
      window.location.href = '/login';
    }
  };

  // GET CURRENT USER - Fixed version
  const getCurrentUser = async (firebaseUser) => {
    if (isCheckingAuth.current) return null;
    
    try {
      isCheckingAuth.current = true;
      const response = await apiClient.get('/auth/me');
      
      if (response.data && response.data.userData) {
        setUserData(response.data.userData);
        setCurrentUser({ 
          email: response.data.userData.email, 
          uid: response.data.userData.id || response.data.userData._id 
        });
        return response.data.userData;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      // If 401, clear Firebase auth state
      if (error.response?.status === 401 && firebaseUser) {
        try {
          await auth.signOut();
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }
      }
      setCurrentUser(null);
      setUserData(null);
      return null;
    } finally {
      isCheckingAuth.current = false;
    }
  };

  // Initialize auth with Firebase auth state listener
  useEffect(() => {
    if (isInitialized) return;

    console.log('Initializing auth...');
    setLoading(true);

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // CRITICAL: Don't update state if we're in the middle of a login attempt
        // The login function will handle setting the state after backend verification
        if (isLoggingIn.current) {
          console.log('Login in progress, skipping auth state update');
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        // Only check existing session if we're NOT on the login page
        // This prevents auto-login when user is trying to log in
        const isOnLoginPage = window.location.pathname === '/login';
        if (isOnLoginPage) {
          // On login page, don't auto-authenticate - wait for explicit login
          setCurrentUser(null);
          setUserData(null);
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        if (firebaseUser) {
          // Firebase user exists, fetch backend user data
          const backendUserData = await getCurrentUser(firebaseUser);
          if (!backendUserData) {
            // Backend auth failed, clear everything
            setCurrentUser(null);
            setUserData(null);
          }
        } else {
          // No Firebase user, clear all auth state
          setCurrentUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setCurrentUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [isInitialized]);

  const value = {
    currentUser,
    userData,
    loading,
    register,
    login,
    logout,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};