// @hooks/useOrganizerDashboardState.ts
// Custom hook to manage organizer dashboard state

import { useState, useCallback } from 'react';

export type ViewState = 'DASHBOARD' | 'CREATE' | 'EDIT' | 'ATTENDEES' | 'SCAN' | 'ATTENDEES_SELECT' | 'MARKETING' | 'BROADCAST' | 'FINANCE' | 'TEAM';
export type MarketingTab = 'PROMOS' | 'REFERRALS' | 'SOCIAL' | 'TRACKING';

export const useOrganizerDashboardState = () => {
  // View Management
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<any | null>(null);

  // Loading States
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Form State
  const [formErrors, setFormErrors] = useState<Map<string, string>>(new Map());

  // Marketing State
  const [marketingTab, setMarketingTab] = useState<MarketingTab>('PROMOS');
  const [pixels, setPixels] = useState({ facebook: '', google: '', tiktok: '', linkedin: '' });
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');

  // Social Asset State
  const [socialAssetFormat, setSocialAssetFormat] = useState<'SQUARE' | 'STORY'>('SQUARE');
  const [socialThemeIndex, setSocialThemeIndex] = useState(0);
  const [socialBgMode, setSocialBgMode] = useState<'THEME' | 'IMAGE'>('THEME');

  // Referral State
  const [referralCommission, setReferralCommission] = useState(10);

  // Promo State
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);

  // Modal States
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; eventId: string | null }>({
    isOpen: false,
    eventId: null,
  });

  // Pagination & Search
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Helper Functions
  const resetFormErrors = useCallback(() => {
    setFormErrors(new Map());
  }, []);

  const addFormError = useCallback((field: string, message: string) => {
    setFormErrors(prev => new Map(prev).set(field, message));
  }, []);

  const clearFormError = useCallback((field: string) => {
    setFormErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(field);
      return newErrors;
    });
  }, []);

  const hasFormErrors = useCallback(() => formErrors.size > 0, [formErrors]);

  const resetAllState = useCallback(() => {
    setCurrentView('DASHBOARD');
    setEditingEventId(null);
    setSelectedEventForAttendees(null);
    setFormErrors(new Map());
    setAttendeeSearch('');
    setCurrentPage(1);
  }, []);

  return {
    // View State
    currentView,
    setCurrentView,
    editingEventId,
    setEditingEventId,
    selectedEventForAttendees,
    setSelectedEventForAttendees,

    // Loading States
    isLoadingEvent,
    setIsLoadingEvent,
    isGeneratingContent,
    setIsGeneratingContent,
    isSending,
    setIsSending,

    // Form State
    formErrors,
    resetFormErrors,
    addFormError,
    clearFormError,
    hasFormErrors,

    // Marketing State
    marketingTab,
    setMarketingTab,
    pixels,
    setPixels,
    seoTitle,
    setSeoTitle,
    seoDesc,
    setSeoDesc,

    // Social Asset State
    socialAssetFormat,
    setSocialAssetFormat,
    socialThemeIndex,
    setSocialThemeIndex,
    socialBgMode,
    setSocialBgMode,

    // Referral State
    referralCommission,
    setReferralCommission,

    // Promo State
    isCreatingPromo,
    setIsCreatingPromo,

    // Modal States
    isWithdrawalModalOpen,
    setIsWithdrawalModalOpen,
    isInviteModalOpen,
    setIsInviteModalOpen,
    deleteConfirmation,
    setDeleteConfirmation,

    // Pagination & Search
    attendeeSearch,
    setAttendeeSearch,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,

    // Helper
    resetAllState,
  };
};
