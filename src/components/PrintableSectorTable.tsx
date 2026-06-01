import { Patient } from "@/types/patient";
import { formatAgeDisplay, getPatientAgeDisplay } from "@/utils/ageDisplay";

interface PrintableSectorTableProps {
  patients: Patient[];
  bedColor: string;
  isUti?: boolean;
  utiColorVariant?: 'blue' | 'yellow';
}

// Calculate days in UTI (mirror of UtiPatientCard logic)
function calculateDaysInUti(admissionDate: string[] | undefined): number {
  if (!admissionDate || admissionDate.length === 0) return 0;
  const dateStr = admissionDate[0];
  if (!dateStr) return 0;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (!isNaN(d.getTime())) {
        return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    return 0;
  }
  return Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
}

const cellStyle: React.CSSProperties = {
  padding: '4px 6px',
  fontSize: '8pt',
  color: '#1f2937',
  lineHeight: '1.4',
  verticalAlign: 'top',
  borderBottom: '1px solid #e5e7eb',
};

const headerCellStyle: React.CSSProperties = {
  padding: '4px 6px',
  fontSize: '6.5pt',
  fontWeight: 700,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  textAlign: 'left',
  backgroundColor: '#f1f5f9',
  borderBottom: '1px solid #cbd5e1',
};

function renderList(
  items: string[] | undefined,
  max?: number,
  highlights?: number[],
): JSX.Element {
  if (!items || items.length === 0) {
    return <span style={{ color: '#94a3b8' }}>—</span>;
  }
  const visible = max ? items.slice(0, max) : items;
  const hl = new Set(highlights ?? []);
  return (
    <>
      {visible.map((item, idx) => {
        const highlighted = hl.has(idx);
        return (
          <div
            key={idx}
            style={{
              marginBottom: '2px',
              fontWeight: highlighted ? 700 : 400,
              color: highlighted ? '#0f172a' : '#1f2937',
              backgroundColor: highlighted ? '#fef9c3' : 'transparent',
              padding: highlighted ? '1px 3px' : 0,
              borderRadius: highlighted ? '2px' : 0,
            }}
          >
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}.</span> {item}
          </div>
        );
      })}
      {max && items.length > max && (
        <div style={{ fontSize: '6.5pt', color: '#64748b', fontStyle: 'italic' }}>
          +{items.length - max} item(ns)
        </div>
      )}
    </>
  );
}

// Combine UTI daily conducts with schedule (programações), tagging schedule entries
function combineConductsAndSchedule(
  conducts: string[] | undefined,
  schedule: string[] | undefined,
): { items: string[]; highlights: number[] } {
  const c = conducts ?? [];
  const s = schedule ?? [];
  const items = [
    ...c,
    ...s.map((it) => `[PROG] ${it}`),
  ];
  return { items, highlights: [] };
}

export function PrintableSectorTable({
  patients,
  bedColor,
  isUti = false,
  utiColorVariant = 'blue',
}: PrintableSectorTableProps) {
  const visible = patients.filter(p => p.name);
  if (visible.length === 0) return null;

  const accent = isUti
    ? (utiColorVariant === 'blue' ? '#3b82f6' : '#64748b')
    : bedColor;

  const ITEM_LIMIT = isUti ? 6 : 4;

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        fontSize: '8pt',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <thead>
        <tr>
          <th style={{ ...headerCellStyle, width: '38px' }}>Leito</th>
          <th style={{ ...headerCellStyle, width: '20%' }}>Paciente</th>
          <th style={{ ...headerCellStyle, width: '22%' }}>Hipóteses</th>
          <th style={{ ...headerCellStyle, width: '16%' }}>Antecedentes</th>
          <th style={{ ...headerCellStyle, width: '22%' }}>
            {isUti ? 'Condutas + Programações' : 'Exames'}
          </th>
          <th style={{ ...headerCellStyle, width: '18%' }}>
            {isUti ? 'Pendências' : 'Programações / Pendências'}
          </th>
          {isUti && <th style={{ ...headerCellStyle, width: '38px', textAlign: 'center' }}>DIH</th>}
        </tr>
      </thead>
      <tbody>
        {visible.map((patient) => {
          const days = isUti ? calculateDaysInUti(patient.utiAdmissionDate) : 0;
          const longStay = isUti && days > 4;
          const conductsCombined = isUti
            ? combineConductsAndSchedule(patient.utiDailyConducts, patient.schedule)
            : null;
          const admissionReason = isUti && patient.utiAdmissionReason && patient.utiAdmissionReason[0]
            ? patient.utiAdmissionReason[0]
            : null;

          return (
            <tr key={patient.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              {/* Leito */}
              <td style={{ ...cellStyle, padding: '4px' }}>
                <div
                  style={{
                    backgroundColor: accent,
                    color: '#ffffff',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontSize: '7.5pt',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {patient.bedNumber}
                </div>
              </td>

              {/* Paciente — nome, idade e identificadores */}
              <td style={cellStyle}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '8.5pt', lineHeight: '1.25' }}>
                  {patient.name || 'SEM NOME'}
                </div>
                <div style={{ fontSize: '7pt', color: '#475569', marginTop: '1px' }}>
                  {formatAgeDisplay(patient.age)}
                </div>
                {patient.medicalRecordNumber && (
                  <div style={{ fontSize: '6.5pt', color: '#64748b', marginTop: '1px' }}>
                    <span style={{ fontWeight: 600 }}>PRT:</span> {patient.medicalRecordNumber}
                  </div>
                )}
                {patient.attendanceNumber && (
                  <div style={{ fontSize: '6.5pt', color: '#64748b' }}>
                    <span style={{ fontWeight: 600 }}>ATD:</span> {patient.attendanceNumber}
                  </div>
                )}
                {admissionReason && (
                  <div style={{ fontSize: '6.5pt', color: '#475569', marginTop: '2px', fontStyle: 'italic' }}>
                    {admissionReason}
                  </div>
                )}
              </td>

              {/* Hipóteses */}
              <td style={cellStyle}>
                {renderList(patient.diagnoses, ITEM_LIMIT, patient.highlightedDiagnoses)}
              </td>

              {/* Antecedentes */}
              <td style={cellStyle}>
                {renderList(patient.medicalHistory, ITEM_LIMIT, patient.highlightedMedicalHistory)}
              </td>

              {/* Plano Terapêutico (UTI: condutas+programações) ou Exames (geral) */}
              <td style={cellStyle}>
                {isUti && conductsCombined
                  ? renderList(conductsCombined.items, ITEM_LIMIT, patient.highlightedConducts)
                  : renderList(patient.relevantExams, ITEM_LIMIT)}
              </td>

              {/* Pendências (UTI) ou Programações / Pendências (geral) */}
              <td style={cellStyle}>
                {isUti
                  ? renderList(patient.pendencies, ITEM_LIMIT, patient.highlightedPendencies)
                  : renderList(patient.pendencies, ITEM_LIMIT, patient.highlightedPendencies)}
              </td>

              {/* DIH (somente UTI) */}
              {isUti && (
                <td
                  style={{
                    ...cellStyle,
                    textAlign: 'center',
                    fontWeight: 700,
                    color: longStay ? '#991b1b' : '#334155',
                    backgroundColor: longStay ? '#fef2f2' : 'transparent',
                  }}
                >
                  {days}d{longStay ? ' ⚠' : ''}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
