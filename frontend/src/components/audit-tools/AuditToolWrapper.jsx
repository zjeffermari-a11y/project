import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Save, FileText, Eye } from 'lucide-react';

/**
 * Shared wrapper for all DILG Audit Tool components.
 * Handles the header toolbar, print styles, and read-only mode for auditees.
 */
export default function AuditToolWrapper({
    toolTitle,
    toolCode,
    phase,
    engagementTitle,
    children,
    onSave,
    onExportExcel,
    onExportWord,
    isSaving,
    lastSaved,
    readOnly = false,
}) {
    const navigate = useNavigate();

    const handlePrint = () => {
        const original = document.title;
        document.title = `${toolCode}_${engagementTitle?.replace(/ /g, '_') || 'Document'}`;
        window.print();
        setTimeout(() => { document.title = original; }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-800 flex flex-col">
            <style>{`
                @media print {
                    @page { margin: 10mm; size: A4; }
                    .hide-on-print { display: none !important; }
                    body, main { background: white !important; }
                    .audit-tool-paper {
                        box-shadow: none !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        padding: 8mm !important;
                    }
                }
                .doc-input {
                    background: transparent;
                    border-bottom: 1px solid #000;
                    width: 100%;
                    outline: none;
                    font-family: serif;
                    font-size: 13px;
                    padding: 2px 4px;
                }
                .doc-input:not(:disabled):focus,
                .doc-input:not(:disabled):hover {
                    background-color: #f8fafc;
                    border-bottom: 2px solid #6366f1;
                }
                .doc-input:disabled { cursor: default; border-bottom-color: #e2e8f0; }
                .tbl-input {
                    width: 100%;
                    background: transparent;
                    outline: none;
                    font-family: serif;
                    font-size: 11px;
                    padding: 4px;
                    resize: vertical;
                    min-height: 40px;
                }
                .tbl-input:not(:disabled):focus { background-color: #eef2ff; }
                .tbl-input:disabled { cursor: default; resize: none; }
                .doc-checkbox { appearance: none; width: 14px; height: 14px; border: 1.5px solid #000; display: inline-block; position: relative; vertical-align: middle; cursor: pointer; }
                .doc-checkbox:checked::after { content: '✔'; position: absolute; top: -4px; left: 1px; font-size: 13px; color: #000; font-weight: bold; }
                .doc-checkbox:disabled { cursor: default; }
                .aap-table, .oac-table, .iom-table { width: 100%; border-collapse: collapse; font-family: serif; }
                .aap-table th, .aap-table td,
                .oac-table th, .oac-table td,
                .iom-table th, .iom-table td { border: 1px solid #000; padding: 4px 8px; vertical-align: top; font-size: 11px; }
                .aap-table th, .oac-table th, .iom-table th { text-align: center; font-weight: bold; font-size: 12px; font-style: italic; vertical-align: middle; }
                .cat-header { font-weight: bold; background-color: #f8fafc; font-size: 11px; text-transform: uppercase; }
                .section-title { font-weight: bold; font-style: italic; font-size: 13px; margin-top: 1.25rem; margin-bottom: 0.4rem; font-family: serif; }
            `}</style>

            {/* Header Toolbar */}
            <header className="hide-on-print bg-slate-900 border-b border-slate-700 px-6 py-4 sticky top-0 z-20 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            {phase} / Internal Working Paper
                        </p>
                        <h1 className="text-sm font-black text-white tracking-tight">
                            {toolCode} — <span className="text-indigo-300">{toolTitle}</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {readOnly && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/50 border border-amber-700 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-lg">
                            <Eye className="w-3.5 h-3.5" />
                            View Only
                        </span>
                    )}
                    {lastSaved && (
                        <span className="text-slate-500 text-[10px] font-bold italic pr-2">
                            Saved {lastSaved}
                        </span>
                    )}
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors border border-slate-600"
                    >
                        <Printer className="w-3.5 h-3.5" /> Print / PDF
                    </button>
                    {onExportWord && !readOnly && (
                        <button
                            onClick={onExportWord}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" /> Word
                        </button>
                    )}
                    {onExportExcel && !readOnly && (
                        <button
                            onClick={onExportExcel}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" /> Excel
                        </button>
                    )}
                    {onSave && !readOnly && (
                        <button
                            onClick={onSave}
                            disabled={isSaving}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-indigo-900/50"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>
            </header>

            {/* Document Area */}
            <main className="flex-1 overflow-auto p-8 custom-scrollbar" style={{ '--scrollbar-thumb': '#475569', '--scrollbar-track': '#1e293b' }}>
                {children}
            </main>
        </div>
    );
}
