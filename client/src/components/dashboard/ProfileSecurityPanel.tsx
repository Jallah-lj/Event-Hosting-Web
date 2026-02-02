import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, Key, Smartphone, Mail, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileSecurityPanel: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profile & Security</h2>
        </div>
        <Link
          to="/organizer/settings"
          className="text-sm font-semibold text-liberia-blue hover:text-blue-700 flex items-center gap-1"
        >
          Account Settings
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {/* Verification Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl flex items-center gap-3">
            <Mail className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-green-800 dark:text-green-400 uppercase tracking-wider">Email Verified</div>
              <div className="text-[10px] text-green-600 dark:text-green-500">Last verified: Jan 15, 2024</div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Phone Pending</div>
              <div className="text-[10px] text-amber-600 dark:text-amber-500">Required for payouts</div>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        {/* Security Quick Actions */}
        <div className="pt-4 space-y-3">
          <Link to="/organizer/settings" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Change Password</h3>
                <p className="text-[10px] text-gray-500">Last changed 3 months ago</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Auth</h3>
                <p className="text-[10px] text-gray-500">Currently disabled</p>
              </div>
            </div>
            <button className="text-[10px] font-bold text-liberia-blue hover:underline">Enable</button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-liberia-blue/5 dark:bg-liberia-blue/10 rounded-xl border border-liberia-blue/10 dark:border-liberia-blue/20">
        <h4 className="text-sm font-bold text-liberia-blue dark:text-blue-400 mb-1">Account Security Tip</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Enable Two-Factor Authentication (2FA) to add an extra layer of security to your organizer account and payout information.
        </p>
      </div>
    </div>
  );
};

export default ProfileSecurityPanel;
