import React, { useState, useRef, useEffect } from 'react';
import {
  User, Upload, Lock, Bell, CreditCard, Settings, LogOut, Loader2, X, Eye, EyeOff,
  Globe, DollarSign, Zap, FileText, Shield, MoreVertical, Edit, Trash2, Plus, AlertCircle, CheckCircle
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { useNavigate } from 'react-router-dom';
import usersService from '../../services/usersService';
import authService from '../../services/authService';
import api, { getErrorMessage } from '../../services/api';

const OrganizerSettings_IMPROVED: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoUploadRef = useRef<HTMLInputElement>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'password' | 'notifications' | 'payout' | 'defaults'>('profile');

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profilePicture || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profilePicture ? 
    (user.profilePicture.startsWith('/') ? `http://localhost:5000${user.profilePicture}` : user.profilePicture) 
    : null);
  const [dragActive, setDragActive] = useState(false);

  // Organization state
  const [orgName, setOrgName] = useState(user?.organizationName || '');
  const [orgDescription, setOrgDescription] = useState(user?.organizationDescription || '');
  const [orgWebsite, setOrgWebsite] = useState(user?.organizationWebsite || '');
  const [orgLogo, setOrgLogo] = useState<string | null>(user?.organizationLogo || null);
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(user?.organizationLogo ? 
    (user.organizationLogo.startsWith('/') ? `http://localhost:5000${user.organizationLogo}` : user.organizationLogo) 
    : null);
  const [dragActiveOrg, setDragActiveOrg] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'strong'>('weak');

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);

  // Payout state
  const [payoutMethods, setPayoutMethods] = useState<any[]>([
    { id: 1, type: 'bank_transfer', bankName: 'First International Bank', accountNumber: '****5678', status: 'verified' },
    { id: 2, type: 'mobile_money', provider: 'Orange Money', number: '****9876', status: 'pending' }
  ]);
  const [showAddPayout, setShowAddPayout] = useState(false);
  const [newPayoutType, setNewPayoutType] = useState('bank_transfer');
  const [payoutData, setPayoutData] = useState<any>({});

  // Event defaults
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [defaultCapacity, setDefaultCapacity] = useState(500);
  const [autoApproveTickets, setAutoApproveTickets] = useState(false);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  // Avatar upload handlers
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
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAvatarUrl(response.data.avatarUrl);
      if (user) {
        updateUser({ ...user, profilePicture: response.data.avatarUrl });
      }
      addToast('Profile photo updated', 'success');
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

  // Logo upload handlers
  const handleLogoUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Please upload an image file (JPEG, PNG, SVG, or WebP)', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('Logo must be less than 2MB', 'error');
      return;
    }

    setUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOrgLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('logo', file);
      formData.append('orgId', user?.id || '');

      const response = await api.post('/upload/organization-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setOrgLogo(response.data.logoUrl);
      if (user) {
        updateUser({ ...user, organizationLogo: response.data.logoUrl });
      }
      addToast('Organization logo updated', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      setOrgLogoPreview(user?.organizationLogo ? 
        (user.organizationLogo.startsWith('/') ? `http://localhost:5000${user.organizationLogo}` : user.organizationLogo) 
        : null);
    } finally {
      setUploadingLogo(false);
      if (logoUploadRef.current) logoUploadRef.current.value = '';
    }
  };

  // Drag handlers
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

  const handleLogoDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveOrg(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveOrg(false);
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveOrg(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleLogoUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleAvatarUpload(e.target.files[0]);
    }
  };

  const handleLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleLogoUpload(e.target.files[0]);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { user: updatedUser } = await usersService.update(user.id, { name, email });
      updateUser(updatedUser);
      addToast('Profile updated successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { user: updatedUser } = await usersService.update(user.id, {
        organizationName: orgName,
        organizationDescription: orgDescription,
        organizationWebsite: orgWebsite,
      });
      updateUser(updatedUser);
      addToast('Organization info updated', 'success');
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

  const handleDeletePayoutMethod = (id: number) => {
    setPayoutMethods(payoutMethods.filter(m => m.id !== id));
    addToast('Payout method removed', 'success');
  };

  const handleAddPayoutMethod = () => {
    const newMethod = {
      id: Date.now(),
      type: newPayoutType,
      ...payoutData,
      status: 'pending'
    };
    setPayoutMethods([...payoutMethods, newMethod]);
    setShowAddPayout(false);
    setPayoutData({});
    addToast('Payout method added. Pending verification.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your organizer account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto gap-8">
          {(['profile', 'organization', 'password', 'notifications', 'payout', 'defaults'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-liberia-blue text-liberia-blue'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-liberia-blue" />
              Personal Profile
            </h3>

            {/* Avatar Upload */}
            <div className="mb-6">
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
                        onClick={() => {
                          setAvatarPreview(null);
                          setAvatarUrl('');
                        }}
                        disabled={uploadingAvatar}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                      Drag or click to replace
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
                Max 5MB • Displayed on tickets and receipts
              </p>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
              />
            </div>

            <Button onClick={handleSaveProfile} isLoading={saving} className="w-full">
              Save Changes
            </Button>
          </div>
        </section>
      )}

      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-liberia-blue" />
              Organization Details
            </h3>

            {/* Organization Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Organization Logo
              </label>
              
              <div
                onDragEnter={handleLogoDragEnter}
                onDragLeave={handleLogoDragLeave}
                onDragOver={handleLogoDragOver}
                onDrop={handleLogoDrop}
                className={`rounded-lg border-2 border-dashed transition-colors ${
                  dragActiveOrg
                    ? 'border-liberia-blue bg-liberia-blue/5'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {orgLogoPreview ? (
                  <div className="p-4">
                    <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 w-40 h-20 mx-auto">
                      <img
                        src={orgLogoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setOrgLogoPreview(null);
                          setOrgLogo(null);
                        }}
                        disabled={uploadingLogo}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                      Drag or click to replace
                    </p>
                  </div>
                ) : (
                  <div className="p-8 text-center cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Drag and drop your logo
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      or click to browse
                    </p>
                  </div>
                )}

                <input
                  ref={logoUploadRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoInputChange}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </div>

              {uploadingLogo && (
                <div className="mt-2 flex items-center gap-2 text-sm text-liberia-blue">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Max 2MB • PNG, JPG, or SVG • Displayed on all your events
              </p>
            </div>

            {/* Organization Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Organization Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                About Your Organization
              </label>
              <textarea
                value={orgDescription}
                onChange={(e) => setOrgDescription(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Tell attendees about your organization..."
              />
              <p className="text-xs text-gray-500 mt-1">{orgDescription.length}/500 characters</p>
            </div>

            {/* Website */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={orgWebsite}
                onChange={(e) => setOrgWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
              />
            </div>

            <Button onClick={handleSaveOrganization} isLoading={saving} className="w-full">
              Save Organization
            </Button>
          </div>
        </section>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-liberia-blue" />
              Change Password
            </h3>

            {/* Current Password */}
            <div className="mb-4">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-4">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

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
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
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
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-liberia-blue" />
            Notification Preferences
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="font-medium text-gray-900 dark:text-white">Email notifications</span>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-5 h-5 text-liberia-blue rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="font-medium text-gray-900 dark:text-white">Event reminders</span>
              <input
                type="checkbox"
                checked={eventReminders}
                onChange={(e) => setEventReminders(e.target.checked)}
                className="w-5 h-5 text-liberia-blue rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="font-medium text-gray-900 dark:text-white">Promotional emails</span>
              <input
                type="checkbox"
                checked={promotionalEmails}
                onChange={(e) => setPromotionalEmails(e.target.checked)}
                className="w-5 h-5 text-liberia-blue rounded"
              />
            </label>
          </div>

          <Button onClick={() => addToast('Preferences saved', 'success')} className="w-full mt-4">
            Save Preferences
          </Button>
        </section>
      )}

      {/* Payout Tab */}
      {activeTab === 'payout' && (
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-liberia-blue" />
              Payout Methods
            </h3>

            {/* Payout Methods List */}
            <div className="space-y-3 mb-6">
              {payoutMethods.map((method) => (
                <div key={method.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      method.type === 'bank_transfer' 
                        ? 'bg-blue-100 dark:bg-blue-900/20' 
                        : 'bg-purple-100 dark:bg-purple-900/20'
                    }`}>
                      {method.type === 'bank_transfer' ? (
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {method.type === 'bank_transfer' ? `Bank Transfer - ${method.bankName}` : `${method.provider} - ${method.number}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Account: {method.accountNumber || method.number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                      method.status === 'verified'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700'
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700'
                    }`}>
                      {method.status === 'verified' ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </>
                      )}
                    </span>
                    <button
                      onClick={() => handleDeletePayoutMethod(method.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!showAddPayout ? (
              <Button
                onClick={() => setShowAddPayout(true)}
                variant="secondary"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payout Method
              </Button>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payout Type
                  </label>
                  <select
                    value={newPayoutType}
                    onChange={(e) => setNewPayoutType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-600"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                {newPayoutType === 'bank_transfer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="E.g., First International Bank"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Account Number
                      </label>
                      <input type="text" placeholder="1234567890" className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-600" />
                    </div>
                  </>
                )}

                {newPayoutType === 'mobile_money' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Provider
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-600">
                        <option>Orange Money</option>
                        <option>M-Money</option>
                        <option>Lonestar Cell</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <input type="tel" placeholder="+231 XX XXX XXXX" className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-600" />
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleAddPayoutMethod} className="flex-1">
                    Add Method
                  </Button>
                  <button
                    onClick={() => setShowAddPayout(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Event Defaults Tab */}
      {activeTab === 'defaults' && (
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-liberia-blue" />
              Event Creation Defaults
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Currency
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700"
                >
                  <option>USD - US Dollar</option>
                  <option>LRD - Liberian Dollar</option>
                  <option>EUR - Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Event Capacity
                </label>
                <input
                  type="number"
                  value={defaultCapacity}
                  onChange={(e) => setDefaultCapacity(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700"
                />
              </div>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                <span className="font-medium text-gray-900 dark:text-white">Auto-approve ticket requests</span>
                <input
                  type="checkbox"
                  checked={autoApproveTickets}
                  onChange={(e) => setAutoApproveTickets(e.target.checked)}
                  className="w-5 h-5 text-liberia-blue rounded"
                />
              </label>
            </div>

            <Button onClick={() => addToast('Defaults saved', 'success')} className="w-full mt-4">
              Save Defaults
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default OrganizerSettings_IMPROVED;
