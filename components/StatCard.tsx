import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  tooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, tooltip }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:scale-105 relative group">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
      {tooltip && (
          <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none left-1/2 -translate-x-1/2 z-10">
              {tooltip}
          </div>
      )}
    </div>
  );
};