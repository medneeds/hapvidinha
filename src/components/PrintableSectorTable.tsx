import { Patient } from "@/types/patient";
import { formatAgeDisplay } from "@/utils/ageDisplay";

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
  fontSize: '7.5pt',
  color: '#374151',
  lineHeight: '1.35',
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

function renderList(items: string[] | undefined, max?: number): JSX.Element {
  if (!items || items.length === 0) return <span style={{ color: '#cbd5e1' }}>—</span>;
  const visible = max ? items.slice(0, max) : items;
  return (
    <>
      {visible.map((item, idx) => (
        <div key={idx} style={{ marginBottom: '1px' }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}.</span> {item}
        </div>
      ))}
      {max && items.length > max && (
        <div style={{ fontSize: '6pt', color: '#94a3b8' }}>+{items.length - max}</div>
      )}
    </>
  );
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

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        fontSize: '7.5pt',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <thead>
        <tr>
          <th style={{ ...headerCellStyle, width: '38px' }}>Leito</th>
          <th style={{ ...headerCellStyle, width: '18%' }}>Paciente</th>
          <th style={{ ...headerCellStyle, width: '22%' }}>Hipóteses</th>
          <th style={{ ...headerCellStyle, width: '18%' }}>Antecedentes</th>
          <th style={{ ...headerCellStyle, width: '20%' }}>{isUti ? 'Plano Terapêutico' : 'Exames'}</th>
          <th style={{ ...headerCellStyle, width: '18%' }}>{isUti ? 'Pendências' : 'Programações'}</th>
          {isUti && <th style={{ ...headerCellStyle, width: '38px', textAlign: 'center' }}>DIH</th>}
        </tr>
      </thead>
      <tbody>
        {visible.map((patient) => {
          const days = isUti ? calculateDaysInUti(patient.utiAdmissionDate) : 0;
          const longStay = isUti && days > 4;
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

              {/* Paciente */}
              <td style={cellStyle}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '8pt' }}>
                  {patient.name || 'SEM NOME'}
                </div>
                <div style={{ fontSize: '6.5pt', color: '#64748b' }}>
                  {formatAgeDisplay(patient.age)}
                </div>
              </td>

              {/* Hipóteses */}
              <td style={cellStyle}>{renderList(patient.diagnoses, 4)}</td>

              {/* Antecedentes */}
              <td style={cellStyle}>{renderList(patient.medicalHistory, 4)}</td>

              {/* Plano Terapêutico (UTI) ou Exames (geral) */}
              <td style={cellStyle}>
                {isUti
                  ? renderList(patient.utiDailyConducts, 4)
                  : renderList(patient.relevantExams, 4)}
              </td>

              {/* Pendências */}
              <td style={cellStyle}>{renderList(patient.pendencies, 4)}</td>

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
