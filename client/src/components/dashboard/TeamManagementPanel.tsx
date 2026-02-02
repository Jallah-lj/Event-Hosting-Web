import React from 'react';
import { Users, UserPlus, Shield, ScanLine, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const mockTeam = [
  { id: '1', name: 'Jules Kamara', role: 'Owner', email: 'jules@example.com' },
  { id: '2', name: 'Sia Tolbert', role: 'Scanner', email: 'sia@example.com' },
  { id: '3', name: 'Moses Blah', role: 'Moderator', email: 'moses@example.com' },
];

const TeamManagementPanel: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Team Management</h2>
        </div>
        <Link
          to="/organizer/team"
          className="text-sm font-semibold text-liberia-blue hover:text-blue-700 flex items-center gap-1"
        >
          Manage Team
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {mockTeam.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                member.role === 'Owner'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : member.role === 'Scanner'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {member.role}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t dark:border-gray-700">
        <Link to="/organizer/team">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:text-liberia-blue hover:border-liberia-blue dark:hover:text-blue-400 dark:hover:border-blue-400 transition-all text-sm font-medium">
            <UserPlus className="w-4 h-4" />
            Invite New Member
          </button>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center">
          <div className="text-xs text-gray-500 mb-1">Active Roles</div>
          <div className="flex justify-center -space-x-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800 flex items-center justify-center" title="Admin">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 flex items-center justify-center" title="Scanner">
              <ScanLine className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center">
          <div className="text-xs text-gray-500 mb-1">Total Members</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">3 / 10</div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPanel;
