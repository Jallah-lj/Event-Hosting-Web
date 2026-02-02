import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { DollarSign, Users, TrendingUp, ArrowUpRight } from 'lucide-react';

const mockData = [
  { name: 'Mon', revenue: 400, attendees: 24 },
  { name: 'Tue', revenue: 300, attendees: 18 },
  { name: 'Wed', revenue: 200, attendees: 12 },
  { name: 'Thu', revenue: 278, attendees: 20 },
  { name: 'Fri', revenue: 189, attendees: 15 },
  { name: 'Sat', revenue: 239, attendees: 22 },
  { name: 'Sun', revenue: 349, attendees: 28 },
];

const AnalyticsPanel: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analytics & Insights</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Performance overview for the last 7 days</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            +12.5%
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">$12,450.00</div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">+8% from last week</p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500 rounded-lg text-white">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Tickets Sold</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">842</div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">+15% from last week</p>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 rounded-lg text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Avg. Order</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">$14.78</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+2% from last week</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="h-64">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">Daily Registrations</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar dataKey="attendees" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
