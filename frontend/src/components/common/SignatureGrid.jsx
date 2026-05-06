import SignOffButton from './SignOffButton';

/**
 * Standardized Signature Grid for Audit Tools
 * Features:
 * - "Click to sign" premium workflow
 * - Supports 1-4 columns
 * - Standardized labels for Audit (Prepared, Reviewed, Approved)
 * - Integrated name/title fields
 */
export default function SignatureGrid({ 
    documentId, 
    history = [], 
    onSigned, 
    readOnly = false,
    signatories = [
        { label: 'PREPARED BY:', stage: 'Prepared', nameField: 'preparedBy', titleField: 'preparedTitle', role: 'Audit Team Member' },
        { label: 'REVIEWED BY:', stage: 'Reviewed', nameField: 'reviewedBy', titleField: 'reviewedTitle', role: 'Audit Team Leader' },
        { label: 'APPROVED BY:', stage: 'Approved', nameField: 'approvedBy', titleField: 'approvedTitle', role: 'Director III / IV' }
    ],
    formData = {},
    setFormData,
    className = "",
    cols = 3
}) {
    const gridColsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4'
    }[cols] || 'grid-cols-3';

    const updateField = (field, value) => {
        if (setFormData) {
            setFormData(field, value);
        }
    };


    return (
        <div className={`grid ${gridColsClass} gap-8 mt-16 pt-12 border-t-2 border-slate-100 ${className}`}>
            {signatories.map((sig, idx) => (
                <div key={idx} className="flex flex-col group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 transition-colors group-hover:text-indigo-600">
                        {sig.label}
                    </p>
                    
                    <div className="mb-6">
                        <SignOffButton 
                            documentId={documentId}
                            stage={sig.stage}
                            history={history}
                            onSuccess={onSigned}
                            disabled={readOnly}
                            className="w-full shadow-sm hover:shadow-indigo-500/10"
                        />
                    </div>

                    <div className="space-y-1">
                        <input 
                            type="text" 
                            className="w-full font-serif text-sm font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 uppercase placeholder:text-slate-300"
                            value={formData[sig.nameField] || ''}
                            onChange={e => updateField(sig.nameField, e.target.value)}
                            disabled={readOnly}
                            placeholder="Enter Name..."
                        />
                        <div className="h-0.5 w-full bg-slate-200 group-hover:bg-indigo-500 transition-all duration-300" />
                        <div className="flex flex-col">
                            <input 
                                type="text" 
                                className="w-full font-sans text-[10px] font-bold text-slate-500 bg-transparent border-none p-0 focus:ring-0 uppercase placeholder:text-slate-300 mt-1"
                                value={formData[sig.titleField] || ''}
                                onChange={e => updateField(sig.titleField, e.target.value)}
                                disabled={readOnly}
                                placeholder="Position/Title"
                            />
                            {sig.role && (
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                    {sig.role}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

