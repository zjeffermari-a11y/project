import SignatureGrid from './SignatureGrid';
import MultiFileAttach from '../audit-tools/MultiFileAttach';

/**
 * Standard Footer for Audit Tools
 * Combines "Click to sign" (SignatureGrid) and "Supporting Evidence" (MultiFileAttach).
 */
export default function StandardAuditFooter({ 
    documentId, 
    history = [], 
    onSigned, 
    readOnly = false,
    formData = {},
    setFormData,
    signatories,
    sections, // New prop for multiple signature sections
    cols,
    className = ""
}) {
    const handleUpload = (newFiles) => {
        const current = formData.attachments || [];
        setFormData('attachments', [...current, ...newFiles]);
    };

    const handleRemove = (index) => {
        const current = formData.attachments || [];
        setFormData('attachments', current.filter((_, i) => i !== index));
    };

    const renderSignatureSection = (items, label, sectionCols, sectionIdx = 0, labelClass = "bg-indigo-900") => (
        <div key={sectionIdx} className={sectionIdx > 0 && !sections ? "mt-12 pt-12 border-t border-slate-100" : ""}>
            {label && (
                <div className="flex items-center gap-3 mb-8">
                    <div className={`${labelClass} text-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-sm`}>
                        {label}
                    </div>
                </div>
            )}
            <SignatureGrid 
                documentId={documentId}
                history={history}
                onSigned={onSigned}
                readOnly={readOnly}
                formData={formData}
                setFormData={setFormData}
                signatories={items}
                cols={sectionCols || cols}
            />
        </div>
    );

    return (
        <div className={`mt-16 no-print ${className}`}>
            {/* Signature Section(s) */}
            {(signatories || sections) && (
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Digital Sign-offs</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Authenticated digital signatures for internal control</p>
                        </div>
                    </div>
                    
                    {sections ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {sections.map((sec, idx) => (
                                <div key={idx}>
                                    {renderSignatureSection(sec.signatories, sec.label, sec.cols || 1, idx, sec.labelClass)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        renderSignatureSection(signatories, null, cols)
                    )}
                </div>
            )}

            {/* Supporting Documents Section */}
            <div className="pt-12 border-t-2 border-slate-100 font-sans">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Supporting Evidence</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Upload relevant annexes or reference documentation</p>
                    </div>
                </div>
                
                <MultiFileAttach
                    files={formData.attachments || []}
                    onUpload={handleUpload}
                    onRemove={handleRemove}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
}
