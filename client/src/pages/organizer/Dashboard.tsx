import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, ScanLine, Eye, Calendar, Edit2, DollarSign } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { Event } from '../../types';
import eventsService from '../../services/eventsService';
import { getErrorMessage } from '../../services/api';
import AnalyticsPanel from '../../components/dashboard/AnalyticsPanel';
import NotificationCenter from '../../components/dashboard/NotificationCenter';
import TeamManagementPanel from '../../components/dashboard/TeamManagementPanel';
import ProfileSecurityPanel from '../../components/dashboard/ProfileSecurityPanel';

const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const eventsData = await eventsService.getByOrganizer(user?.id || '');
      setEvents(eventsData);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/4" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-32 border border-gray-100 dark:border-gray-700" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700" />
          <div className="h-96 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Organizer Hub</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Hello {user?.name}, here's what's happening with your events.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/organizer/create">
            <Button size="lg" className="shadow-lg shadow-blue-500/20">
              <Plus className="w-5 h-5 mr-2" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Analytics and Primary Actions */}
        <div className="lg:col-span-8 space-y-6">

          {/* Analytics Panel */}
          <AnalyticsPanel />

          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/organizer/attendees"
              className="bg-white dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Users className="w-8 h-8 text-blue-700 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Attendee Center</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage registrations and exports</p>
                </div>
              </div>
            </Link>

            <Link
              to="/organizer/scanner"
              className="bg-white dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <ScanLine className="w-8 h-8 text-emerald-700 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Ticket Scanner</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Live QR check-in & validation</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Events List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-liberia-blue" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Events</h2>
              </div>
              <Link to="/organizer/create" className="text-liberia-blue text-sm font-bold hover:underline flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Event
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to start?</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Create your first event to start selling tickets and building your community.</p>
                <Link to="/organizer/create">
                  <Button size="lg">Create My First Event</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {events.map(event => (
                  <div key={event.id} className="p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    {/* Event Thumbnail */}
                    <div className="w-full md:w-24 h-24 rounded-2xl bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-600">
                      <img
                        src={event.imageUrl || `https://picsum.photos/seed/${event.id}/200/200`}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${event.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : event.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          }`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {event.attendeeCount || 0} Registered
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <DollarSign className="w-3.5 h-3.5" />
                          {((event.attendeeCount || 0) * (event.price || 0)).toLocaleString()} Earned
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700">
                      <Link to={`/events/${event.id}`} title="View Event">
                        <Button variant="ghost" size="sm" className="rounded-xl p-2">
                          <Eye className="w-5 h-5" />
                        </Button>
                      </Link>
                      <Link to={`/organizer/edit/${event.id}`} title="Edit Event">
                        <Button variant="ghost" size="sm" className="rounded-xl p-2">
                          <Edit2 className="w-5 h-5" />
                        </Button>
                      </Link>
                      <Link to={`/organizer/attendees/${event.id}`} title="Attendees">
                        <Button variant="ghost" size="sm" className="rounded-xl text-blue-600 p-2">
                          <Users className="w-5 h-5" />
                        </Button>
                      </Link>
                      {event.status === 'APPROVED' && (
                        <Link to={`/organizer/scanner/${event.id}`} title="Scan Tickets">
                          <Button variant="ghost" size="sm" className="rounded-xl text-emerald-600 p-2">
                            <ScanLine className="w-5 h-5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notifications and Secondary Panels */}
        <div className="lg:col-span-4 space-y-6">

          {/* Notification Center */}
          <NotificationCenter />

          {/* Team Management */}
          <TeamManagementPanel />

          {/* Profile & Security */}
          <ProfileSecurityPanel />

          {/* Help Card */}
          <div className="bg-gradient-to-br from-liberia-blue to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-xl font-bold mb-2">Need help, Chief?</h3>
            <p className="text-blue-100 text-sm mb-4">Our support team is always here for you. No wahala!</p>
            <Button variant="secondary" className="w-full bg-white text-liberia-blue hover:bg-blue-50 border-none font-bold">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
