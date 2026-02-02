import React, { useState, useRef } from 'react';
import {
  User, Lock, Bell, Monitor, Upload, CreditCard, Shield, Trash2, Download, Moon, Sun, Phone, Calendar, Globe, Loader2, X, Eye, EyeOff
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import usersService from '../../services/usersService';
import authService from '../../services/authService';
import api, { getErrorMessage } from '../../services/api';
import { UserPreferences } from '../../types';

const AttendeeSettings_IMPROVED: React.FC = () => {
  const { user, preferences, updateUser, updatePreferences } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profilePicture || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profilePicture ? 
    (user.profilePicture.startsWith('/') ? `http://localhost:5000${user.profilePicture}` : user.profilePicture) 
    : null);
  const [dragActive, setDragActive] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'strong'>('weak');

  // States
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  // Preferences
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences || {
    textSize: 'Standard',
    currency: 'USD',
    language: 'English (Liberia)',
    autoCalendar: true,
    dataSaver: false,
    notifications: {
      email: true,
      sms: false,
      promotional: true,
      eventReminders: true
    },
    privacy: {
      profileVisible: true,
      showAttendance: true
    }
  });

  // Password strength calculator
  const calculatePasswordStrength = (pwd: string) => {
    if (pwd.length < 8) return 'weak';
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*]/.test(pwd);
    
    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (strength >= 4) return 'strong';
    if (strength >= 2) return 'fair';
    return 'weak';
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  // Avatar handlers
  const handleAvatarUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Please upload an image file (JPEG, PNG, GIF, or WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be less than 5MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAvatarUrl(response.data.avatarUrl);
      if (user) {
        updateUser({ ...user, profilePicture: response.data.avatarUrl });
      }
      addToast('Profile photo uploaded successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      setAvatarPreview(user?.profilePicture ? 
        (user.profilePicture.startsWith('/') ? `http://localhost:5000${user.profilePicture}` : user.profilePicture) 
        : null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleAvatarUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleAvatarUpload(e.target.files[0]);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await api.delete('/upload/avatar');
      setAvatarUrl('');
      setAvatarPreview(null);
      if (user) {
        updateUser({ ...user, profilePicture: undefined });
      }
      addToast('Profile photo removed', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { user: updatedUser } = await usersService.update(user.id, { name, email, phone });
      updateUser(updatedUser);
      addToast('Profile updated successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      await authService.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password updated successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await usersService.updatePreferences(user.id, localPrefs);
      updatePreferences(localPrefs);
      addToast('Preferences saved', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-liberia-blue" />
          Profile Information
        </h2>

        <div className="space-y-4">
          {/* Avatar Upload - Enhanced */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Profile Photo
            </label>
            
            <div
              ref={dragZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed transition-colors ${
                dragActive
                  ? 'border-liberia-blue bg-liberia-blue/5'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {avatarPreview ? (
                <div className="p-4">
                  <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 w-32 h-32 mx-auto">
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded transition-colors disabled:opacity-50"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    Click or drag another image to replace
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Drag and drop your photo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    or click to browse
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </div>

            {uploadingAvatar && (
              <div className="mt-2 flex items-center gap-2 text-sm text-liberia-blue">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Supported: JPG, PNG, GIF, WebP • Max 5MB • Displayed on your tickets
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+231 XXX XXX XXX"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Required for SMS notifications</p>
          </div>

          <Button onClick={handleSaveProfile} isLoading={saving} className="w-full">
            Save Profile Changes
          </Button>
        </div>
      </section>

      {/* Password Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-liberia-blue" />
          Change Password
        </h2>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => handleNewPasswordChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === 'strong'
                          ? 'w-full bg-green-500'
                          : passwordStrength === 'fair'
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-1/3 bg-red-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium capitalize">{passwordStrength}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use uppercase, lowercase, numbers, and special characters
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          <Button onClick={handleChangePassword} isLoading={saving} className="w-full">
            Update Password
          </Button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-liberia-blue" />
          Notification Preferences
        </h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="font-medium text-gray-900 dark:text-white">Email notifications</span>
            <input
              type="checkbox"
              checked={localPrefs.notifications?.email ?? true}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                notifications: { ...localPrefs.notifications, email: e.target.checked }
              })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="font-medium text-gray-900 dark:text-white">Event reminders</span>
            <input
              type="checkbox"
              checked={localPrefs.notifications?.eventReminders ?? true}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                notifications: { ...localPrefs.notifications, eventReminders: e.target.checked }
              })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="font-medium text-gray-900 dark:text-white">Promotional emails</span>
            <input
              type="checkbox"
              checked={localPrefs.notifications?.promotional ?? true}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                notifications: { ...localPrefs.notifications, promotional: e.target.checked }
              })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>
        </div>

        <Button onClick={handleSavePreferences} isLoading={saving} className="w-full mt-4">
          Save Preferences
        </Button>
      </section>

      {/* Display Settings */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Monitor className="w-5 h-5 mr-2 text-liberia-blue" />
          Display Settings
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
            <div className="flex items-center gap-2">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span className="font-medium text-gray-900 dark:text-white">Dark Mode</span>
            </div>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={() => {
                const newMode = !isDarkMode;
                setIsDarkMode(newMode);
                if (newMode) {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                }
              }}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>
        </div>
      </section>
    </div>
  );
};

export default AttendeeSettings_IMPROVED;
