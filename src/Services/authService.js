import { authAPI } from './api';

export const signUpWithEmailPassword = async (email, password, role, displayName) => {
  try {
    // Generate a unique username from email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const username = `${baseUsername}${timestamp}`;
    
    const data = await authAPI.register({
      email,
      password,
      password2: password,
      role: role || 'student',
      display_name: displayName || '',
      username: username,
    });
    return data.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

export const signInWithEmailPassword = async (email, password) => {
  try {
    const data = await authAPI.login(email, password);
    return data.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  // Google OAuth can be implemented later with Django Social Auth
  throw new Error("Google login not yet implemented with Django backend");
};

export const saveUserRole = async (user, role) => {
  // Role is now saved during registration, but we can update profile if needed
  try {
    await authAPI.updateProfile({ role });
    console.log("User role saved successfully");
  } catch (error) {
    console.error("Error saving user role: ", error);
  }
};

export const logOut = async () => {
  try {
    authAPI.logout();
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    return await authAPI.getCurrentUser();
  } catch (error) {
    console.error("Error getting current user:", error);
    throw error;
  }
};

export const updateUserProfile = async (updates) => {
  try {
    return await authAPI.updateProfile(updates);
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};
