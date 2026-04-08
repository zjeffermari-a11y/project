import { useState, useRef } from 'react';
import { Paperclip, X, File, Loader2, Download, Trash2 } from 'lucide-react';
import api from '../../api';

export default function MultiFileAttach({ files = [], onUpdate, engagementId, readOnly = false }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Filter out nulls or invalid entries
    const safeFiles = Array.isArray(files) ? files.filter(Boolean) : [];

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('engagement_id', engagementId);
        formData.append('document_type', 'Tool Attachment');
        formData.append('phase', 'execution');

        try {
            setUploading(true);
            const response = await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const newFile = {
                id: response.data.document.id,
                name: response.data.document.name,
                url: response.data.document.file_path, // Storage path
                size: (file.size / 1024).toFixed(1) + ' KB',
                uploaded_at: new Date().toISOString()
            };

            onUpdate([...safeFiles, newFile]);
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeFile = (id) => {
        if (confirm('Are you sure you want to remove this attachment from this row?')) {
            onUpdate(safeFiles.filter(f => f.id !== id));
        }
    };

    const getFileUrl = (path) => {
        if (path.startsWith('http')) return path;
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '');
        return `${baseUrl}/storage/${path}`;
    };

    return (
        <div className="mt-2 space-y-2">
            {/* File List */}
            <div className="flex flex-wrap gap-2">
                {safeFiles.map((file) => (
                    <div 
                        key={file.id} 
                        className="group flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-all"
                    >
                        <File className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                        <a 
                            href={getFileUrl(file.url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-slate-600 hover:text-indigo-600 truncate max-w-[120px]"
                            title={file.name}
                        >
                            {file.name}
                        </a>
                        {!readOnly && (
                            <button 
                                onClick={() => removeFile(file.id)}
                                className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Upload Button */}
            {!readOnly && (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 border-dashed rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all hover:bg-indigo-50/30 group"
                    >
                        {uploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Paperclip className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                        )}
                        {uploading ? 'Uploading...' : 'Attach Documents'}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                    />
                </div>
            )}
        </div>
    );
}
