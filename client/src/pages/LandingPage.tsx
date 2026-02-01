import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, ArrowRight, Search,
  Users, Zap, ShieldCheck, Mail, Ticket, Plus, Sparkles
} from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { Event, UserRole } from '../types';
import eventsService from '../services/eventsService';
import { getErrorMessage } from '../services/api';

const categories = ['All', 'Culture', 'Business', 'Music', 'Sports', 'Education', 'Technology', 'Food', 'Art'];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsService.getAll();
      setEvents(data.filter(e => e.status === 'APPROVED'));
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).slice(0, 6);
  }, [events, searchQuery, selectedCategory]);

  const handleDemoLogin = async (role: UserRole) => {
    try {
      await demoLogin(role);
      addToast(`Logged in as ${role}`, 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-4 md:p-6 bg-gradient-to-b from-black/20 to-transparent">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-lg font-serif font-bold text-liberia-blue text-sm md:text-base">
              LC
            </div>
            <span className="font-serif text-lg md:text-xl font-bold text-white hidden sm:block">LiberiaConnect</span>
          </div>
          <div className="flex space-x-2 md:space-x-4">
            <Link
              to="/auth/signin"
              className="text-white font-medium hover:text-blue-200 transition-colors text-sm md:text-base px-3 py-1 mt-1"
            >
              Sign In
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white hover:bg-white/20 shadow-lg text-xs md:text-sm font-bold"
              onClick={() => navigate('/auth/signup')}
            >
              Register
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-liberia-blue relative overflow-hidden text-white pt-32 pb-24 lg:pb-32 lg:pt-40">
        <div className="absolute inset-0 bg-liberia-red opacity-10 pattern-bg mix-blend-multiply"></div>
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-liberia-red/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-red-400" />
            Discover what's happening
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold tracking-tight mb-6 leading-tight">
            LiberiaConnect <span className="text-red-400 block sm:inline">Events</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-blue-100 max-w-2xl mb-12 mx-auto leading-relaxed">
            The premier platform for celebrating culture, fostering business, and building community across the nation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
            <Button size="lg" className="shadow-2xl shadow-blue-900/50 w-full sm:w-auto justify-center" onClick={() => {
              document.getElementById('upcoming-events')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Browse Events
            </Button>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto justify-center" onClick={() => navigate('/auth/signup')}>
              Create an Event
            </Button>
          </div>

          {/* Impact Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-white/10 w-full">
            <div>
              <div className="text-3xl font-bold">10k+</div>
              <div className="text-blue-200 text-sm">Tickets Sold</div>
            </div>
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-blue-200 text-sm">Events Hosted</div>
            </div>
            <div>
              <div className="text-3xl font-bold">50+</div>
              <div className="text-blue-200 text-sm">Organizers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">15+</div>
              <div className="text-blue-200 text-sm">Counties Reached</div>
            </div>
          </div>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, location or description..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-0 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-liberia-blue"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat
                  ? 'bg-liberia-blue text-white shadow-md'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Public Events Grid */}
      <section id="upcoming-events" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-8 md:mb-12 gap-4">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Discover what's happening in Liberia</p>
          </div>
          <Link to="/auth/signup" className="hidden md:flex items-center text-liberia-red font-bold hover:text-red-800 transition-colors">
            Explore all <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No events found</h3>
            <p className="text-gray-500">Try adjusting your search or category filters</p>
            <Button variant="ghost" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredEvents.map(event => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="h-56 bg-gray-200 relative overflow-hidden">
                  <img
                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/400/250`}
                    alt={event.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold text-liberia-blue shadow-lg">
                    Starts from ${event.price}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="p-6 flex-1 flex flex-col relative">
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-liberia-blue dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                      {event.category}
                    </span>
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2 group-hover:text-liberia-blue transition-colors leading-tight">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="space-y-2 mb-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center mr-3">
                        <Calendar className="w-4 h-4 text-liberia-red" />
                      </div>
                      {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-3">
                        <MapPin className="w-4 h-4 text-liberia-blue" />
                      </div>
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="w-full py-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center font-bold text-sm text-gray-900 dark:text-white group-hover:bg-liberia-blue group-hover:text-white group-hover:border-liberia-blue transition-all duration-300">
                      Get Tickets
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Button size="lg" variant="outline" className="px-12 rounded-2xl group" onClick={() => navigate('/auth/signup')}>
            View All Upcoming Events <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Get started with LiberiaConnect in just a few clicks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connection lines (desktop only) */}
            <div className="hidden md:block absolute top-1/4 left-1/4 right-1/4 h-0.5 bg-gray-100 dark:bg-gray-800 -z-10" />

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 text-xl font-bold">1</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h3>
              <p className="text-gray-500 dark:text-gray-400">Sign up as an attendee to browse or an organizer to host.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20 text-xl font-bold">2</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Find or Host</h3>
              <p className="text-gray-500 dark:text-gray-400">Discover incredible events or set up your own with AI tools.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20 text-xl font-bold">3</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Build Community</h3>
              <p className="text-gray-500 dark:text-gray-400">Attend, scan tickets, and celebrate the best of Liberia together.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 md:py-28 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-6">Built for the modern Liberian community</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Whether you're organizing a grand cultural festival in Monrovia or a local business seminar, we provide the tools you need to succeed.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Zap, title: 'AI-Powered Content', desc: 'Generate event descriptions and marketing copy instantly.', color: 'text-yellow-500', bg: 'bg-yellow-100' },
                  { icon: ShieldCheck, title: 'Secure Ticketing', desc: 'Encrypted QR codes prevent fraud and duplicate entries.', color: 'text-green-500', bg: 'bg-green-100' },
                  { icon: Users, title: 'Role-Based Access', desc: 'Dedicated portals for Attendees, Organizers, and Admins.', color: 'text-blue-500', bg: 'bg-blue-100' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl shrink-0 flex items-center justify-center`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-liberia-blue rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1540575861501-7ad058de399a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                  alt="Events Community"
                  className="w-full h-full object-cover opacity-80 mix-blend-overlay"
                />
              </div>
              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">Active Now</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">1,234 users are currently browsing events in Harper and Monrovia.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organize CTA */}
      <section className="py-20 md:py-24 bg-liberia-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-16 border border-white/20 text-center text-white">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Are you an event organizer?</h2>
            <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join dozens of successful organizers who trust LiberiaConnect to manage their ticket sales, attendees, and scanning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-liberia-blue hover:bg-blue-50 px-8" onClick={() => navigate('/auth/signup')}>
                <Plus className="w-5 h-5 mr-2" />
                Start Organizing
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-xl mx-auto">
            <Mail className="w-12 h-12 text-liberia-blue mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Stay in the loop</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Get the latest events and cultural highlights sent straight to your inbox.</p>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => {
              e.preventDefault();
              addToast('Thanks for subscribing!', 'success');
            }}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-liberia-blue"
                required
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-liberia-red rounded-full flex items-center justify-center font-serif font-bold text-white border-2 border-white">
                  LC
                </div>
                <span className="font-serif text-xl font-bold text-white">LiberiaConnect</span>
              </div>
              <p className="max-w-xs leading-relaxed">
                Empowering the Liberian community through events, technology, and shared experiences.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-sm">
                <li><Link to="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/auth/signup" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Browse Events</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Demo Shortcuts</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => handleDemoLogin(UserRole.ADMIN)} className="hover:text-white transition-colors">Admin Portal</button></li>
                <li><button onClick={() => handleDemoLogin(UserRole.ORGANIZER)} className="hover:text-white transition-colors">Organizer Portal</button></li>
                <li><button onClick={() => handleDemoLogin(UserRole.ATTENDEE)} className="hover:text-white transition-colors">Attendee Portal</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-xs">
            <p>© 2026 LiberiaConnect. All rights reserved. Built with pride in Liberia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
