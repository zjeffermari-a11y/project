import api from '../api';
import { formatRef } from '../utils/formatters';

export default function GenerateDocument() {
    const { id, doc } = useParams();
    const navigate = useNavigate();
    const [engagement, setEngagement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmitForReview = async () => {
        if (!engagement) return;
        setSubmitting(true);
        try {
            // Capture the current inputs from the rendered form
            const inputs = Array.from(document.querySelectorAll('#generated-document input, #generated-document textarea'));
            const summaryValues = inputs.slice(0, 5).map(inp => inp.value).join(' | ');
            
            // Create a minimal text blob representing the draft
            const blob = new Blob(
                [`DRAFT ${doc.toUpperCase()} – ${engagement.title}\nValues: ${summaryValues}`],
                { type: 'text/plain' }
            );
            const file = new File([blob], `DRAFT_${doc.toUpperCase()}_${engagement.title.replace(/ /g,'_')}.txt`, { type: 'text/plain' });
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('engagement_id', engagement.id);
            formData.append('document_type', doc === 'anm' ? 'Audit Notification Memorandum (ANM)' : 'Audit Work Program (AWP)');
            formData.append('phase', 'planning');
            
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSubmitted(true);
            alert('Draft submitted for review! The reviewer can now sign off in the Workspace.');
        } catch (err) {
            alert('Submission failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchEng = async () => {
            try {
                const res = await api.get('/engagements');
                const curr = res.data.find(e => e.id.toString() === id.toString());
                setEngagement(curr);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEng();
    }, [id]);

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `${doc?.toUpperCase()}_${engagement?.title?.replace(/ /g, '_') || 'Document'}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    };

    const exportToExcel = async () => {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('AWP', {
            pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
            views: [{ showGridLines: false }]
        });

        sheet.columns = [
            { width: 8 },  // A
            { width: 45 }, // B
            { width: 12 }, // C
            { width: 12 }, // D
            { width: 12 }, // E
            { width: 15 }, // F
            { width: 12 }, // G
            { width: 12 }, // H
            { width: 15 }, // I
            { width: 20 }  // J
        ];

        const borderAll = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        const fontBoldCenter = { name: 'Times New Roman', size: 10, bold: true };
        const fontNormal = { name: 'Times New Roman', size: 10 };
        const bgAmber = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFFEF3C7'} };

        sheet.mergeCells('B2:J2');
        sheet.getCell('B2').value = 'DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT';
        sheet.getCell('B2').font = { name: 'Times New Roman', size: 10, italic: false };
        sheet.getCell('B2').alignment = { vertical: 'middle', horizontal: 'left' };

        sheet.mergeCells('B3:J3');
        sheet.getCell('B3').value = 'AUDIT WORK PROGRAM';
        sheet.getCell('B3').font = { name: 'Times New Roman', size: 18, bold: true };

        sheet.mergeCells('B4:J4');
        sheet.getCell('B4').value = 'FM-QP-DILG-IAS-33-05 | Rev01 | 10.10.22';
        sheet.getCell('B4').font = { name: 'Times New Roman', size: 8, italic: true };

        const inputs = Array.from(document.querySelectorAll('#generated-document input, #generated-document textarea'));

        sheet.getCell('A6').value = 'AWP Reference No.'; sheet.getCell('A6').font = fontBoldCenter;
        sheet.mergeCells('B6:J6'); sheet.getCell('B6').value = `: ${inputs[0]?.value}`;
        
        sheet.getCell('A7').value = 'Audit Engagement No.'; sheet.getCell('A7').font = fontBoldCenter;
        sheet.mergeCells('B7:J7'); sheet.getCell('B7').value = `: ${inputs[1]?.value}`;

        sheet.getCell('A8').value = 'Audit Engagement Title'; sheet.getCell('A8').font = fontBoldCenter;
        sheet.mergeCells('B8:J8'); sheet.getCell('B8').value = `: ${inputs[2]?.value}`;

        sheet.getCell('A9').value = 'Audit Duration'; sheet.getCell('A9').font = fontBoldCenter;
        sheet.mergeCells('B9:J9'); sheet.getCell('B9').value = `: ${inputs[3]?.value}`;

        sheet.getCell('A10').value = 'Agency/Office'; sheet.getCell('A10').font = fontBoldCenter;
        sheet.mergeCells('B10:J10'); sheet.getCell('B10').value = `: ${inputs[4]?.value}`;

        sheet.getCell('A12').value = 'Audit Engagement Type'; sheet.getCell('A12').font = fontBoldCenter;
        sheet.mergeCells('B12:J12');
        const getCheck = (idx) => inputs[idx]?.checked ? '☑' : '☐';
        sheet.getCell('B12').value = `: ${getCheck(5)} Compliance    ${getCheck(6)} Management    ${getCheck(7)} Operations    ${getCheck(8)} Follow-up`;

        sheet.getCell('A14').value = 'Audit Objective'; sheet.getCell('A14').font = fontBoldCenter;
        sheet.mergeCells('B14:J14'); sheet.getCell('B14').value = `: ${inputs[9]?.value}`;

        sheet.getCell('A16').value = 'Team Leader'; sheet.getCell('A16').font = fontBoldCenter;
        sheet.mergeCells('B16:J16'); sheet.getCell('B16').value = `: ${inputs[10]?.value}`;

        const headerRow1 = sheet.getRow(18);
        const headerRow2 = sheet.getRow(19);
        headerRow1.height = 30;
        
        sheet.mergeCells('A18:A19'); sheet.getCell('A18').value = 'Item No.';
        sheet.mergeCells('B18:B19'); sheet.getCell('B18').value = 'Activities/Procedures';
        sheet.mergeCells('C18:C19'); sheet.getCell('C18').value = 'Days Required';
        sheet.mergeCells('D18:E18'); sheet.getCell('D18').value = 'Target';
        sheet.getCell('D19').value = 'Output'; sheet.getCell('E19').value = 'Date';
        sheet.mergeCells('F18:F19'); sheet.getCell('F18').value = 'Responsible Personnel';
        sheet.mergeCells('G18:H18'); sheet.getCell('G18').value = 'Actual';
        sheet.getCell('G19').value = 'Output'; sheet.getCell('H19').value = 'Date';
        sheet.mergeCells('I18:I19'); sheet.getCell('I18').value = 'Accomplished by';
        sheet.mergeCells('J18:J19'); sheet.getCell('J18').value = 'Remarks';

        ['A18','B18','C18','D18','E18','F18','G18','H18','I18','J18','D19','E19','G19','H19'].forEach(cell => {
            const c = sheet.getCell(cell);
            c.font = fontBoldCenter;
            c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            c.border = borderAll;
            c.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFFFFBEB'} };
        });

        let r = 20;
        let inputIdx = 11;

        const addPhase = (title) => {
            sheet.mergeCells(`A${r}:J${r}`);
            const c = sheet.getCell(`A${r}`);
            c.value = title;
            c.font = fontBoldCenter;
            c.fill = bgAmber;
            c.border = borderAll;
            c.alignment = { vertical: 'middle', horizontal: 'left' };
            r++;
        };

        const addRow = () => {
            const row = sheet.getRow(r);
            for(let i=1; i<=10; i++) {
                const c = row.getCell(i);
                c.value = inputs[inputIdx++]?.value || '';
                c.font = fontNormal;
                c.border = borderAll;
                c.alignment = { vertical: 'middle', horizontal: i===2 ? 'left' : 'center', wrapText: true };
            }
            r++;
        };

        // Track rows where Days Required (column C, index 3) are entered for formula summation
        const phaseDataRows = [];

        const addPhaseWithData = (title) => {
            // Phase header
            sheet.mergeCells(`A${r}:J${r}`);
            const c = sheet.getCell(`A${r}`);
            c.value = title;
            c.font = fontBoldCenter;
            c.fill = bgAmber;
            c.border = borderAll;
            c.alignment = { vertical: 'middle', horizontal: 'left' };
            r++;

            // Data row
            const dataRow = sheet.getRow(r);
            const dataRowNum = r;
            for (let i = 1; i <= 10; i++) {
                const cell = dataRow.getCell(i);
                if (i === 3) {
                    // Days Required: read value but also store as number for formula
                    const rawVal = inputs[inputIdx]?.value || '';
                    cell.value = rawVal ? (isNaN(rawVal) ? rawVal : Number(rawVal)) : '';
                } else {
                    cell.value = inputs[inputIdx]?.value || '';
                }
                inputIdx++;
                cell.font = fontNormal;
                cell.border = borderAll;
                cell.alignment = { vertical: 'middle', horizontal: i === 2 ? 'left' : 'center', wrapText: true };
            }
            phaseDataRows.push(dataRowNum);
            r++;
        };

        addPhaseWithData('AUDIT PLANNING');
        addPhaseWithData('AUDIT EXECUTION');
        addPhaseWithData('AUDIT REPORTING');
        addPhaseWithData('AUDIT FOLLOW-UP');

        // TOTAL row with SUM formula for Days Required column
        sheet.mergeCells(`A${r}:B${r}`);
        const totalCell = sheet.getCell(`A${r}`);
        totalCell.value = 'TOTAL DAYS';
        totalCell.font = { name: 'Times New Roman', size: 10, bold: true };
        totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        totalCell.border = borderAll;
        totalCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const sumRefs = phaseDataRows.map(rowNum => `C${rowNum}`).join('+');
        const sumCell = sheet.getCell(`C${r}`);
        sumCell.value = { formula: `${sumRefs}`, result: undefined };
        sumCell.font = { name: 'Times New Roman', size: 10, bold: true };
        sumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        sumCell.border = borderAll;
        sumCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Empty merged cells for the rest of the total row
        ['D','E','F','G','H','I','J'].forEach(col => {
            const c = sheet.getCell(`${col}${r}`);
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
            c.border = borderAll;
        });
        r++;

        r += 3;
        sheet.getCell(`B${r}`).value = 'Prepared by:';
        sheet.getCell(`E${r}`).value = 'Reviewed by:';
        sheet.getCell(`H${r}`).value = 'Approved by:';

        sheet.mergeCells(`B${r+3}:D${r+3}`);
        sheet.getCell(`B${r+3}`).value = inputs[inputIdx++]?.value || ''; 
        sheet.getCell(`B${r+3}`).font = fontBoldCenter; 
        sheet.getCell(`B${r+3}`).border = { bottom: {style:'thin'} };
        sheet.getCell(`B${r+3}`).alignment = { horizontal: 'center' };

        sheet.mergeCells(`E${r+3}:G${r+3}`);
        sheet.getCell(`E${r+3}`).value = inputs[inputIdx++]?.value || ''; 
        sheet.getCell(`E${r+3}`).font = fontBoldCenter;
        sheet.getCell(`E${r+3}`).border = { bottom: {style:'thin'} };
        sheet.getCell(`E${r+3}`).alignment = { horizontal: 'center' };

        sheet.mergeCells(`H${r+3}:J${r+3}`);
        sheet.getCell(`H${r+3}`).value = inputs[inputIdx++]?.value || ''; 
        sheet.getCell(`H${r+3}`).font = fontBoldCenter;
        sheet.getCell(`H${r+3}`).border = { bottom: {style:'thin'} };
        sheet.getCell(`H${r+3}`).alignment = { horizontal: 'center' };

        sheet.mergeCells(`B${r+4}:D${r+4}`);
        sheet.getCell(`B${r+4}`).value = "Auditor's Name over Signature/Date";
        sheet.getCell(`B${r+4}`).font = { name:'Times New Roman', size:8, italic:true };
        sheet.getCell(`B${r+4}`).alignment = { horizontal: 'center', vertical: 'top' };

        sheet.mergeCells(`E${r+4}:G${r+4}`);
        sheet.getCell(`E${r+4}`).value = "Team Leader's Name over Signature/Date";
        sheet.getCell(`E${r+4}`).font = { name:'Times New Roman', size:8, italic:true, bold:true };
        sheet.getCell(`E${r+4}`).alignment = { horizontal: 'center', vertical: 'top' };

        sheet.mergeCells(`H${r+4}:J${r+4}`);
        sheet.getCell(`H${r+4}`).value = "Director's Name over Signature/Date";
        sheet.getCell(`H${r+4}`).font = { name:'Times New Roman', size:8, italic:true, bold:true };
        sheet.getCell(`H${r+4}`).alignment = { horizontal: 'center', vertical: 'top' };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `AWP_${engagement?.title?.replace(/ /g, '_') || 'Matrix'}.xlsx`;
        link.click();
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400">Loading Generated Blueprint...</div>;
    if (!engagement) return <div className="p-10 text-center font-bold text-rose-500">Engagement not found.</div>;


    // Helper to safely extract Auditee Name
    const auditeeName = engagement.movs?.[0]?.auditee?.agency_name || 'Assigned Office';

    const renderANM = () => (
        <div id="generated-document" className="bg-white shadow-2xl w-[794px] min-h-[1123px] px-20 py-16 relative flex flex-col font-serif mx-auto my-10">
            <style>{`
                .doc-input { background: transparent; border-bottom: 1px solid transparent; width: 100%; outline: none; transition: border-color 0.2s; }
                .doc-input:focus, .doc-input:hover { border-bottom: 1px solid #94a3b8; }
                .doc-textarea { width: 100%; background: transparent; border: 1px dashed transparent; outline: none; resize: vertical; min-height: 80px; padding: 4px; transition: all 0.2s; }
                .doc-textarea:focus, .doc-textarea:hover { border: 1px dashed #cbd5e1; background: #f8fafc; }
            `}</style>
            
            <div className="flex justify-center items-center gap-4 mb-1">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg" className="h-16 w-16" alt="DILG Seal" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Bagong_Pilipinas_logo.svg" className="h-16 w-16 object-contain" alt="Bagong Pilipinas" />
            </div>
            
            <div className="text-center mb-6">
                <p className="text-[9px] font-serif leading-none mb-0.5">Republic of the Philippines</p>
                <p className="text-xs font-bold font-serif leading-none tracking-wide mb-1">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                <p className="text-[9px] font-serif leading-none text-gray-800 mb-0.5">DILG-NAPOLCOM Center, EDSA cor. Quezon Avenue, West Triangle, Quezon City</p>
                <p className="text-[9px] text-blue-600 font-serif leading-none">www.dilg.gov.ph</p>
            </div>

            <div className="mb-5">
                <h1 className="text-sm font-bold font-serif leading-tight">AUDIT NOTIFICATION MEMORANDUM</h1>
                <p className="text-[11px] font-serif text-gray-800">(ANM Reference No. <input type="text" defaultValue={formatRef('ANM', engagement.ae_number)} className="bg-transparent border-none outline-none w-32 font-serif" />)</p>
            </div>

            <div className="grid grid-cols-[85px_15px_1fr] gap-y-2 mb-5 text-[13px] font-serif items-center leading-tight">
                <div className="font-bold">TO/FOR</div><div className="text-center font-bold">:</div>
                <div><input type="text" defaultValue={auditeeName} className="doc-input font-bold py-0.5" /></div>

                <div className="font-bold">THRU</div><div className="text-center font-bold">:</div>
                <div><input type="text" placeholder="(if applicable)" className="doc-input py-0.5" /></div>

                <div className="font-bold">ATTENTION</div><div className="text-center font-bold">:</div>
                <div><input type="text" placeholder="(if applicable)" className="doc-input py-0.5" /></div>

                <div className="font-bold">SUBJECT</div><div className="text-center font-bold">:</div>
                <div><input type="text" defaultValue={engagement.title} className="bg-transparent border-none outline-none w-full font-bold py-0.5 text-black" /></div>

                <div className="font-bold">DATE</div><div className="text-center font-bold">:</div>
                <div><input type="date" defaultValue={engagement.start_date || new Date().toISOString().split('T')[0]} className="doc-input font-bold w-auto py-0.5" /></div>
            </div>

            <hr className="border-black border-[1.5px] mb-6" />

            <div className="space-y-4 text-[13px] font-serif text-justify leading-relaxed flex-1">
                <div><textarea className="doc-textarea" defaultValue={engagement.description || "(Context and Authority)"}></textarea></div>
                <div><textarea className="doc-textarea" placeholder="(Audit Objectives)"></textarea></div>
                <div><textarea className="doc-textarea" placeholder="(Schedule of Initial Meeting)"></textarea></div>
                <div><textarea className="doc-textarea" placeholder="(Deadline of submission of Initial Documents requested)"></textarea></div>

                <div className="pt-10">
                    <input type="text" defaultValue="MARY ROSE VILCHEZ-MARIANO" className="doc-input w-72 font-bold font-serif text-[13px] uppercase mb-0.5 text-black" />
                    <p className="text-[13px] font-bold font-serif leading-none mt-1">Director, Internal Audit Service</p>
                </div>
            </div>

            <div className="mt-auto pt-8 mb-0 text-center flex flex-col items-center">
                <p className="text-red-600 font-bold text-[11px] tracking-wide font-serif">"Matino, Mahusay at Maaasahan"</p>
                <p className="text-red-600 text-[9px] font-serif">Trunkline No. (02) 8876 3454</p>
            </div>
        </div>
    );

    const renderAWP = () => (
        <div id="generated-document" className="bg-white shadow-2xl w-[1200px] min-h-[1500px] px-12 py-12 relative flex flex-col font-serif mx-auto my-10 overflow-x-auto">
            <style>{`
                .doc-input { background: transparent; border-bottom: 1px solid #000; width: 100%; outline: none; font-family: serif; font-size: 13px; padding: 2px 4px; }
                .tbl-input { width: 100%; background: transparent; outline: none; font-family: serif; font-size: 12px; padding: 4px; text-align: center; }
                .awp-table, .awp-table th, .awp-table td { border: 1px solid #000; border-collapse: collapse; }
                .doc-checkbox { appearance: none; width: 12px; height: 12px; border: 1px solid #000; display: inline-block; position: relative; vertical-align: middle; margin-right: 4px; }
                .doc-checkbox:checked::after { content: '✔'; position: absolute; top: -4px; left: 1px; font-size: 12px; color: #000; }
            `}</style>
            
            <table className="w-full mb-8">
                <tbody>
                    <tr>
                        <td className="w-24 align-middle">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg" className="h-20 w-20" alt="Seal" />
                        </td>
                        <td className="align-middle text-left">
                            <p className="text-xs font-serif text-gray-700">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                            <h1 className="text-2xl font-black font-serif tracking-wide leading-tight">AUDIT WORK PROGRAM</h1>
                            <p className="text-[10px] font-serif text-gray-500 italic">FM-QP-DILG-IAS-33-05 | Rev01 | 10.10.22</p>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="text-xs font-bold items-center max-w-3xl mb-6 text-left">
                <tbody>
                    <tr><td className="w-[180px] py-1">AWP Reference No.</td><td className="w-4 py-1">:</td><td><input type="text" defaultValue={formatRef('AWP', engagement.ae_number)} className="bg-transparent border-none outline-none w-full font-bold text-black" /></td></tr>
                    <tr><td className="py-1">Audit Engagement No.</td><td className="py-1">:</td><td><input type="text" defaultValue={engagement.ae_number || 'AE-202X-XXX'} className="bg-transparent border-none outline-none w-full font-bold text-black" /></td></tr>
                    <tr><td className="py-1">Audit Engagement Title</td><td className="py-1">:</td><td><input type="text" defaultValue={engagement.title} className="bg-transparent border-none outline-none w-full font-bold text-black" /></td></tr>
                    <tr><td className="py-1">Audit Duration</td><td className="py-1">:</td><td><input type="text" defaultValue={`${engagement.start_date || 'TBD'} - ${engagement.end_date || 'TBD'}`} className="bg-transparent border-none outline-none w-full font-bold text-black" /></td></tr>
                    <tr><td className="py-1">Agency/Office</td><td className="py-1">:</td><td><input type="text" defaultValue={auditeeName} className="bg-transparent border-none outline-none w-full font-bold text-black" /></td></tr>
                </tbody>
            </table>

            <table className="text-xs font-bold items-center mb-2 text-left">
                <tbody>
                    <tr>
                        <td className="w-[180px] py-1">Audit Engagement Type</td><td className="w-4 py-1">:</td>
                        <td className="pr-4"><label className="flex items-center"><input type="checkbox" className="doc-checkbox" /> Compliance</label></td>
                        <td className="pr-4"><label className="flex items-center"><input type="checkbox" className="doc-checkbox" /> Management</label></td>
                        <td className="pr-4"><label className="flex items-center"><input type="checkbox" className="doc-checkbox" defaultChecked /> Operations</label></td>
                        <td className="pr-4"><label className="flex items-center"><input type="checkbox" className="doc-checkbox" /> Follow-up</label></td>
                    </tr>
                </tbody>
            </table>

            <table className="text-xs font-bold items-center max-w-4xl mt-4 mb-8 text-left">
                <tbody>
                    <tr><td className="w-[180px] py-1">Audit Objective</td><td className="w-4 py-1">:</td><td><input type="text" defaultValue={engagement.description || "To evaluate protocols."} className="bg-transparent border-none outline-none w-full font-bold text-black" /></td></tr>
                    <tr><td className="w-[180px] pt-4">Team Leader</td><td className="w-4 pt-4">:</td><td className="pt-4"><input type="text" defaultValue="Lead Auditor" className="bg-transparent border-none outline-none w-full font-bold text-black" /></td></tr>
                </tbody>
            </table>

            <div className="mb-4 flex-1">
                <table className="awp-table w-full text-center text-xs">
                    <thead className="bg-amber-50/30">
                        <tr>
                            <th rowSpan="2" className="w-12 py-2">Item No.</th>
                            <th rowSpan="2" className="w-64">Activities/Procedures</th>
                            <th rowSpan="2" className="w-24 px-2">Days Required</th>
                            <th colSpan="2" className="py-1 border-b border-black">Target</th>
                            <th rowSpan="2" className="w-32 px-2">Responsible Personnel</th>
                            <th colSpan="2" className="py-1 border-b border-black">Actual</th>
                            <th rowSpan="2" className="w-32">Accomplished by</th>
                            <th rowSpan="2" className="w-48 px-2">Remarks</th>
                        </tr>
                        <tr>
                            <th className="w-24 py-1 border-r border-black">Output</th>
                            <th className="w-24 border-r border-black">Date</th>
                            <th className="w-24 py-1 border-r border-black">Output</th>
                            <th className="w-24 border-r border-black">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-amber-100/50"><td colSpan="10" className="text-left font-bold py-1 px-2 uppercase tracking-widest border-b border-black">Audit Planning</td></tr>
                        <tr>
                            <td><input type="text" className="tbl-input font-bold" defaultValue="1" /></td>
                            <td><textarea className="tbl-input resize-none h-12 text-left" defaultValue="Determine Scope and Materiality"></textarea></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black border-l"><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black"><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black border-l"><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black"><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input text-blue-600 underline" /></td>
                        </tr>

                        <tr className="bg-amber-100/50"><td colSpan="10" className="text-left font-bold py-1 px-2 uppercase tracking-widest border-b border-black">Audit Execution</td></tr>
                        <tr>
                            <td><input type="text" className="tbl-input font-bold" defaultValue="2" /></td>
                            <td><textarea className="tbl-input resize-none h-12 text-left" defaultValue="Conduct Fieldwork and Testing"></textarea></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black border-l"><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black"><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black border-l"><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black"><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input text-blue-600 underline" /></td>
                        </tr>

                        <tr className="bg-amber-100/50"><td colSpan="10" className="text-left font-bold py-1 px-2 uppercase tracking-widest border-b border-black">Audit Reporting</td></tr>
                        <tr>
                            <td><input type="text" className="tbl-input font-bold" defaultValue="3" /></td>
                            <td><textarea className="tbl-input resize-none h-12 text-left" defaultValue="Draft and Finalize Audit Report"></textarea></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black border-l"><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black"><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black border-l"><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black"><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input text-blue-600 underline" /></td>
                        </tr>

                        <tr className="bg-amber-100/50"><td colSpan="10" className="text-left font-bold py-1 px-2 uppercase tracking-widest border-b border-black">Audit Follow-up</td></tr>
                        <tr>
                            <td><input type="text" className="tbl-input font-bold" defaultValue="4" /></td>
                            <td><textarea className="tbl-input resize-none h-12 text-left" defaultValue="Monitor Implementation of Recommendations"></textarea></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black border-l"><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black"><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black border-l"><input type="text" className="tbl-input" /></td>
                            <td className="border-r border-black"><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input" /></td>
                            <td><input type="text" className="tbl-input text-blue-600 underline" /></td>
                        </tr>
                    </tbody>
                </table>
                <p className="text-[10px] font-bold italic mt-1">Note: Editable table representation.</p>
            </div>

            <table className="w-full mt-12 text-xs font-bold text-black mb-16 text-center">
                <tbody>
                    <tr>
                        <td className="w-1/3 px-10 align-top">
                            <p className="mb-6 italic text-left">Prepared by:</p>
                            <input type="text" defaultValue="Lead Auditor Name" className="w-full bg-transparent outline-none border-b border-black text-center font-bold" />
                            <p className="text-[10px] font-normal italic mt-0.5">Auditor's Name over Signature/Date</p>
                        </td>
                        <td className="w-1/3 px-10 align-top">
                            <p className="mb-6 italic text-left">Reviewed by:</p>
                            <input type="text" className="w-full bg-transparent outline-none border-b border-black text-center font-bold" />
                            <p className="text-[10px] font-bold italic mt-0.5">Team Leader's Name over Signature/Date</p>
                        </td>
                        <td className="w-1/3 px-10 align-top">
                            <p className="mb-6 italic text-left">Approved by:</p>
                            <input type="text" className="w-full bg-transparent outline-none border-b border-black text-center font-bold" />
                            <p className="text-[10px] font-bold italic mt-0.5">Director's Name over Signature/Date</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="h-screen bg-slate-900 flex flex-col">
            <style>{`
                @media print { 
                    @page { margin: 0; size: A4 portrait; }
                    .hide-on-print { display: none !important; } 
                    body { background: white !important; }
                    main { background: white !important; padding: 0 !important; overflow: visible !important; }
                    #generated-document { margin: 0 !important; box-shadow: none !important; width: 100% !important; max-width: none !important; min-height: auto !important; }
                }
            `}</style>
            
            <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex justify-between items-center text-white z-20 sticky top-0 shadow-2xl hide-on-print">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5"/></button>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Document Generator</p>
                        <h1 className="text-sm font-black tracking-tight">{doc.toUpperCase()} : {engagement.title}</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors border border-slate-700 shadow-sm"><Printer className="w-4 h-4" /> Print / PDF</button>
                    {doc === 'awp' && (
                        <button onClick={exportToExcel} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm"><Download className="w-4 h-4" /> Export Excel</button>
                    )}
                    <button onClick={handleSubmitForReview} disabled={submitting || submitted} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm ${submitted ? 'bg-emerald-700 text-white cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                        <Save className="w-4 h-4" /> {submitting ? 'Submitting...' : submitted ? 'Submitted ✓' : 'Submit for Review'}
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-auto bg-slate-800 p-8 custom-scrollbar">
                {doc === 'anm' ? renderANM() : renderAWP()}
            </main>
        </div>
    );
}
