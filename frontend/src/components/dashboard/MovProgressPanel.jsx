import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const MovProgressPanel = ({ engagements }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">MOV Progress</h3>
      <div className="space-y-4">
        {engagements && engagements.length > 0 ? (
          engagements.map((engagement) => {
            const movs = engagement.movs || [];
            const total = movs.length;
            const approved = movs.filter(m => m.status === 'approved').length;
            const submitted = movs.filter(m => m.status === 'submitted').length;
            const returned = movs.filter(m => m.status === 'returned').length;
            
            const progress = total > 0 ? Math.round((approved / total) * 100) : 0;

            return (
              <div key={engagement.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-700">{engagement.title}</span>
                  <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>{approved} Approved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span>{submitted} Submitted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span>{returned} Returned</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="font-medium">Total: {total}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">
            No engagements available to track progress.
          </div>
        )}
      </div>
    </div>
  );
};

export default MovProgressPanel;
