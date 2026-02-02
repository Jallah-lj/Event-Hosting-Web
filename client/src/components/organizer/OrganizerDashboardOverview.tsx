// @components/organizer/OrganizerDashboardOverview.tsx
// Main dashboard overview component

import React, { useMemo } from 'react';
import { Event, Ticket } from '../../types';
import { DollarSign, Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardOverviewProps {
  events: Event[];
  tickets: Ticket[];
  currency: string;
}

const OrganizerDashboardOverview: React.FC<DashboardOverviewProps> = ({ events, tickets, currency }) => {
  const currencySymbol = currency === 'LRD' ? 'L$' : '$';

  const stats = useMemo(() => {
    const totalRevenue = tickets.reduce((sum, t) => sum + (t.pricePaid ?? 0), 0);
    const totalAttendees = tickets.length;
    const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length;
    const pastEvents = events.filter(e => new Date(e.date) <= new Date()).length;

    return {
      totalRevenue,
      totalAttendees,
      upcomingEvents,
      pastEvents,
      conversionRate: totalAttendees > 0 ? ((totalAttendees / (events.length * 100)) * 100).toFixed(1) : 0,
    };
  }, [events, tickets]);

  // Generate simple chart data
  const chartData = useMemo(() => {
    const last7Days: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days[key] = 0;
    }

    tickets.forEach(ticket => {
      const ticketDate = new Date(ticket.eventId).toLocaleDateString('en-US', { weekday: 'short' });
      if (last7Days[ticketDate] !== undefined) {
        last7Days[ticketDate] += ticket.pricePaid ?? 0;
      }
    });

    return Object.entries(last7Days).map(([day, revenue]) => ({
      day,
      revenue,
    }));
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {currencySymbol}{stats.totalRevenue.toLocaleString()}
              </h3>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12% from last month</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Attendees */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Attendees</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalAttendees}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Across all events</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Upcoming Events</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.upcomingEvents}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{stats.pastEvents} completed</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Conversion Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.conversionRate}%
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Of capacity filled</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="font-bold text-lg mb-6 dark:text-white">Revenue Trend (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `${currencySymbol}${value.toLocaleString()}`}
            />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alert Box */}
        {events.length === 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">No events yet</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">Create your first event to start selling tickets</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboardOverview;
