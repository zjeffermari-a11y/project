import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const MovTable = ({ movs, onAddMov, onUpdateMov, onDeleteMov, isAuditor, isAuditee }) => {
  const [newMov, setNewMov] = useState({ requirement_name: '', drive_link: '', auditee_id: '' });

  const handleAdd = () => {
    if (!newMov.requirement_name) return;
    onAddMov(newMov);
    setNewMov({ requirement_name: '', drive_link: '', auditee_id: '' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'submitted': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'returned': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const responseOptions = {
    col2: ["Available", "Not Available", "N/A"],
    col3: ["Complete", "Incomplete", "N/A"],
    col4: ["Compliant", "Non-Compliant", "N/A"]
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Requirement Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Auditor Drive Link</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Availability</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Completeness</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movs.map((mov) => (
              <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900">{mov.requirement_name}</div>
                </td>
                <td className="px-6 py-4">
                  {mov.drive_link ? (
                    <a 
                      href={mov.drive_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm"
                    >
                      View Template <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs italic">No link provided</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <select
                    disabled={!isAuditee}
                    value={mov.auditee_response_1 || ''}
                    onChange={(e) => onUpdateMov(mov.id, { auditee_response_1: e.target.value })}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">Select...</option>
                    {responseOptions.col2.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    disabled={!isAuditee}
                    value={mov.auditee_response_2 || ''}
                    onChange={(e) => onUpdateMov(mov.id, { auditee_response_2: e.target.value })}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">Select...</option>
                    {responseOptions.col3.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    disabled={!isAuditee}
                    value={mov.auditee_response_3 || ''}
                    onChange={(e) => onUpdateMov(mov.id, { auditee_response_3: e.target.value })}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">Select...</option>
                    {responseOptions.col4.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(mov.status)}
                    <span className="text-xs font-medium capitalize text-slate-600">{mov.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {isAuditor && (
                      <button 
                        onClick={() => onDeleteMov(mov.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {isAuditor && (
              <tr className="bg-slate-50/50">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="New requirement..."
                    value={newMov.requirement_name}
                    onChange={(e) => setNewMov({ ...newMov, requirement_name: e.target.value })}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="url"
                    placeholder="Drive link (optional)"
                    value={newMov.drive_link}
                    onChange={(e) => setNewMov({ ...newMov, drive_link: e.target.value })}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </td>
                <td colSpan={4} className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Add auditor/auditee selection here if needed</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MovTable;
