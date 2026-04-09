import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';

export default function UploadMovModal({ 
    isOpen, 
    onClose, 
    movId, 
    engId, 
    movName, 
    onUpload, 
    loading 
}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [managementComment, setManagementComment] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('engagement_id', engId);
        formData.append('document_type', movName || 'MOV Submission');
        formData.append('phase', 'execution');
        // Add comment to description or metadata if needed, though originally it wasn't used in the API call in the old dashboard
        // We'll just pass it to the callback

        onUpload({
            movId,
            engId,
            movName,
            formData,
            comment: managementComment
        });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Upload Requirement</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">MOV: {movName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl bg-white border border-slate-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Document</label>
                        <div className="relative group">
                            <input 
                                type="file" 
                                required 
                                onChange={e => setSelectedFile(e.target.files[0])} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 ${selectedFile ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 group-hover:border-indigo-300 group-hover:bg-slate-50'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {selectedFile ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black text-slate-700">{selectedFile ? selectedFile.name : 'Choose File or Drop'}</p>
                                    <p className="text-[9px] font-medium text-slate-400 mt-1">PDF, DOCX, XLSX allowed (Max 10MB)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Management Comment <span className="text-slate-300 normal-case tracking-normal">(optional)</span></label>
                        <textarea
                            value={managementComment}
                            onChange={e => setManagementComment(e.target.value)}
                            placeholder="Provide context or response to auditors..."
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={loading || !selectedFile} 
                            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-slate-900 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload className="w-4 h-4" />}
                            {loading ? 'Uploading...' : 'Submit MOV'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
