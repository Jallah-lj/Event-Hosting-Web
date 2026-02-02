// @views/OrganizerPanel_REFACTORED.tsx
// Improved and refactored organizer dashboard with proper component separation
// This replaces the monolithic OrganizerPanel.tsx (1401 lines)

import React, { useState, useEffect } from 'react';
import { Event, Ticket, PromoCode, Referral, Broadcast, TeamMember, Transaction } from '../types';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import {
  LayoutDashboard, Users, Tag, Megaphone, Wallet, Plus, Download, Loader2
} from 'lucide-react';
import { useOrganizerDashboardState } from '../hooks/useOrganizerDashboardState';
import EventForm from '../components/organizer/EventForm';
import OrganizerDashboardOverview from '../components/organizer/OrganizerDashboardOverview';

interface OrganizerPanelProps {
  events: Event[];
  tickets: Ticket[];
  organizerId: string;
  onCreateEvent: (event: any) => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  onViewEvent: (id: string) => void;
  activeTab?: 'DASHBOARD' | 'CREATE' | 'ATTENDEES_SELECT';
  onNavigate?: (view: any) => void;
  currency?: string;
  onVerifyTicket?: (ticketId: string) => void;
  onUndoCheckIn?: (ticketId: string) => void;
  onUpdateTicket?: (ticketId: string, updates: Partial<Ticket>) => void;
  promos?: PromoCode[];
  onUpdatePromos?: (promos: PromoCode[]) => void;
  referrals?: Referral[];
  onUpdateReferrals?: (referrals: Referral[]) => void;
  broadcasts?: Broadcast[];
  onUpdateBroadcasts?: (broadcasts: Broadcast[]) => void;
  teamMembers?: TeamMember[];
  onUpdateTeamMembers?: (teamMembers: TeamMember[]) => void;
  transactions?: Transaction[];
}

export const OrganizerPanel: React.FC<OrganizerPanelProps> = ({
  events,
  tickets,
  organizerId,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  activeTab = 'DASHBOARD',
  currency = 'USD',
  promos = [],
  referrals = [],
  broadcasts = [],
  teamMembers = [],
  transactions = [],
}) => {
  const { addToast } = useToast();
  const state = useOrganizerDashboardState();

  // Track editing state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter user's events
  const myEvents = events.filter(e => e.organizerId === organizerId);

  // Initialize view on mount or when activeTab changes
  useEffect(() => {
    if (activeTab === 'CREATE') {
      state.setCurrentView('CREATE');
      setEditingEventId(null);
    } else if (activeTab === 'ATTENDEES_SELECT') {
      state.setCurrentView('ATTENDEES_SELECT');
    } else {
      state.setCurrentView('DASHBOARD');
    }
  }, [activeTab]);

  // Handle event form submission
  const handleEventSubmit = async (eventData: any) => {
    if (!eventData.title?.trim()) {
      addToast('Event title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEventId) {
        const eventToUpdate = myEvents.find(e => e.id === editingEventId);
        if (eventToUpdate) {
          onUpdateEvent({ ...eventToUpdate, ...eventData });
          addToast('Event updated successfully', 'success');
        }
      } else {
        onCreateEvent(eventData);
        addToast('Event created successfully', 'success');
      }
      state.setCurrentView('DASHBOARD');
      setEditingEventId(null);
    } catch (error) {
      addToast('Failed to save event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEventId(event.id);
    state.setCurrentView('EDIT');
  };

  const handleDeleteEvent = (eventId: string) => {
    state.setDeleteConfirmation({ isOpen: true, eventId });
  };

  const confirmDelete = () => {
    if (state.deleteConfirmation.eventId) {
      try {
        onDeleteEvent(state.deleteConfirmation.eventId);
        addToast('Event deleted successfully', 'success');
        state.setDeleteConfirmation({ isOpen: false, eventId: null });
      } catch (error) {
        addToast('Failed to delete event', 'error');
      }
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        events: myEvents,
        tickets: tickets.filter(t => myEvents.some(e => e.id === t.eventId)),
        exportDate: new Date().toISOString(),
      };
      const csv = JSON.stringify(data, null, 2);
      const blob = new Blob([csv], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `organizer-data-${Date.now()}.json`;
      a.click();
      addToast('Data exported successfully', 'success');
    } catch (error) {
      addToast('Failed to export data', 'error');
    }
  };

  // Tab Navigation
  const tabs = [
    { id: 'DASHBOARD', label: 'Overview', icon: LayoutDashboard },
    { id: 'ATTENDEES_SELECT', label: 'Attendees', icon: Users },
    { id: 'MARKETING', label: 'Marketing', icon: Tag },
    { id: 'BROADCAST', label: 'Broadcasts', icon: Megaphone },
    { id: 'FINANCE', label: 'Finance', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizer Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your events and track performance</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            {state.currentView !== 'CREATE' && (
              <Button onClick={() => state.setCurrentView('CREATE')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {state.currentView !== 'CREATE' && state.currentView !== 'EDIT' && (
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-6 flex overflow-x-auto gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => state.setCurrentView(tab.id as any)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                  state.currentView === tab.id
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Overview */}
        {state.currentView === 'DASHBOARD' && (
          <OrganizerDashboardOverview events={myEvents} tickets={tickets} currency={currency} />
        )}

        {/* Create/Edit Event */}
        {(state.currentView === 'CREATE' || state.currentView === 'EDIT') && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.currentView === 'CREATE' ? 'Create New Event' : 'Edit Event'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Fill in the details to publish your event</p>
            </div>
            <EventForm
              event={editingEventId ? myEvents.find(e => e.id === editingEventId) : null}
              onSubmit={handleEventSubmit}
              onCancel={() => {
                state.setCurrentView('DASHBOARD');
                setEditingEventId(null);
              }}
              isLoading={isSubmitting}
            />
          </div>
        )}

        {/* Events List */}
        {state.currentView === 'DASHBOARD' && (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg dark:text-white">Your Events</h3>
            </div>
            {myEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>No events yet. Create your first event to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">Attendees</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {myEvents.map(event => (
                      <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{event.title}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                          {new Date(event.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {tickets.filter(t => t.eventId === event.id).length}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEvent(event)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Placeholder sections for other tabs */}
        {state.currentView === 'ATTENDEES_SELECT' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">Attendees section coming soon...</p>
          </div>
        )}

        {state.currentView === 'MARKETING' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">Marketing tools coming soon...</p>
          </div>
        )}

        {state.currentView === 'BROADCAST' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">Broadcast tools coming soon...</p>
          </div>
        )}

        {state.currentView === 'FINANCE' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">Finance dashboard coming soon...</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {state.deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Delete Event?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => state.setDeleteConfirmation({ isOpen: false, eventId: null })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerPanel;
