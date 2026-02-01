import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, MapPin, Search, Filter, ArrowRight,
  Ticket as TicketIcon, Clock, TrendingUp, Sparkles,
  ChevronRight, Bookmark
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { Event, Ticket } from '../../types';
import eventsService from '../../services/eventsService';
import ticketsService from '../../services/ticketsService';
import { getErrorMessage } from '../../services/api';

const AttendeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Culture', 'Business', 'Music', 'Sports', 'Education'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, ticketsData] = await Promise.all([
        eventsService.getAll(),
        ticketsService.getMyTickets()
      ]);
      setEvents(eventsData.filter(e => e.status === 'APPROVED'));
      setMyTickets(ticketsData);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const myEventIds = useMemo(() => new Set(myTickets.map(t => t.eventId)), [myTickets]);

  // Find the next upcoming event the user is attending
  const nextUpEvent = useMemo(() => {
    if (myTickets.length === 0) return null;

    const upcoming = myTickets
      .map(t => t.event)
      .filter((e): e is Event => !!e && new Date(e.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return upcoming[0] || null;
  }, [myTickets]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-liberia-blue rounded-2xl p-8 text-white shadow-xl shadow-blue-900/20">
        <div className="relative z-10">
          <h1 className="text-3xl font-serif font-bold mb-2">
            Welcome back, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-blue-100 max-w-lg">
            You have {myTickets.length} active tickets. Ready to explore what's happening next in Liberia?
          </p>
        </div>

        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-liberia-red/20 rounded-full blur-2xl" />
        <Sparkles className="absolute top-8 right-12 w-12 h-12 text-blue-300 opacity-20" />
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <TicketIcon className="text-liberia-blue w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tickets</p>
            <p className="text-2xl font-bold dark:text-white">{myTickets.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <Calendar className="text-liberia-red w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Events</p>
            <p className="text-2xl font-bold dark:text-white">
              {myTickets.filter(t => t.event && new Date(t.event.date) > new Date()).length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <TrendingUp className="text-green-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Categories Explored</p>
            <p className="text-2xl font-bold dark:text-white">
              {new Set(myTickets.map(t => t.event?.category)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Next Up Spotlight */}
      {nextUpEvent && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-liberia-red" />
              Your Next Event
            </h2>
            <Link to="/tickets" className="text-liberia-blue text-sm font-medium hover:underline flex items-center">
              View all tickets <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/3 h-48 md:h-auto relative">
              <img
                src={nextUpEvent.imageUrl || `https://picsum.photos/seed/${nextUpEvent.id}/600/400`}
                alt={nextUpEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
              <div className="absolute bottom-4 left-4 md:hidden">
                <span className="bg-liberia-red text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  Happening Next
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
              <div className="hidden md:block mb-4">
                <span className="bg-red-50 dark:bg-red-900/30 text-liberia-red text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Upcoming: {new Date(nextUpEvent.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {nextUpEvent.title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-2 text-liberia-blue" />
                  <span className="text-sm">{new Date(nextUpEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-2 text-liberia-blue" />
                  <span className="text-sm truncate">{nextUpEvent.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button onClick={() => window.location.href = `/tickets`} className="px-6">
                  View Ticket <QrCode className="ml-2 w-4 h-4" />
                </Button>
                <Link to={`/events/${nextUpEvent.id}`}>
                  <Button variant="outline" className="px-6">
                    Event Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Events Feed */}
      <section className="pt-4 border-t dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex-1">
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Explore All Events</h2>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, location..."
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-liberia-blue focus:border-transparent transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${selectedCategory === category
                  ? 'bg-liberia-blue text-white shadow-lg shadow-blue-200 dark:shadow-none translate-y-[-2px]'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:border-blue-200'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No matching events</h3>
            <p className="text-gray-500 mb-6">Try clearing your search or exploring a different category</p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 dark:border-gray-700 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/400/250`}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                  <div className="absolute top-4 left-4 flex gap-2">
                    {myEventIds.has(event.id) && (
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center">
                        <Bookmark className="w-3 h-3 mr-1" /> GOING
                      </span>
                    )}
                    <span className="bg-white/90 backdrop-blur text-liberia-blue text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                      {event.category}
                    </span>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-liberia-blue text-white font-bold p-2 px-3 rounded-lg text-sm shadow-lg">
                    ${event.price}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-liberia-blue transition-colors leading-tight line-clamp-2">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2 text-liberia-red shrink-0" />
                      {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2 text-liberia-red shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold`}>
                          U{i}
                        </div>
                      ))}
                      <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 flex items-center justify-center text-[8px] font-medium text-gray-500">
                        +{event.attendeeCount}
                      </div>
                    </div>
                    <span className="text-liberia-blue text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform">
                      Details <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AttendeeDashboard;
