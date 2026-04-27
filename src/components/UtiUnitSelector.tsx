import { Patient } from "@/types/patient";
import { Activity, ArrowRight, BedDouble, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface UtiUnitSelectorProps {
  patients: Patient[];
  onSelect: (unit: 'UTI 1' | 'UTI 2') => void;
}

export function UtiUnitSelector({ patients, onSelect }: UtiUnitSelectorProps) {
  // UTI 1 = sector 'blue' or 'red' | UTI 2 = sector 'yellow'
  const uti1 = patients.filter(p => p.sector === 'blue' || p.sector === 'red');
  const uti2 = patients.filter(p => p.sector === 'yellow');

  const occ = (list: Patient[]) => list.filter(p => p.name && !p.isVacant).length;

  const cards: Array<{
    unit: 'UTI 1' | 'UTI 2';
    title: string;
    subtitle: string;
    accent: string;
    badge: string;
    list: Patient[];
  }> = [
    {
      unit: 'UTI 1',
      title: 'Unidade de Terapia Intensiva 1',
      subtitle: 'Leitos U01 — U10',
      accent: 'border-l-blue-500/70',
      badge: 'bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      list: uti1,
    },
    {
      unit: 'UTI 2',
      title: 'Unidade de Terapia Intensiva 2',
      subtitle: 'Leitos U01 — U10',
      accent: 'border-l-slate-500/70',
      badge: 'bg-slate-100 text-slate-700 border-slate-300/60 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-600/50',
      list: uti2,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/70 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 mb-4">
            <Activity className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300">
              Setor UTI
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Selecione a unidade
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Escolha qual UTI você deseja visualizar e gerenciar agora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {cards.map((c) => {
            const occupied = occ(c.list);
            const total = c.list.length || 10;
            return (
              <button
                key={c.unit}
                onClick={() => onSelect(c.unit)}
                className={cn(
                  "group text-left rounded-2xl border bg-white dark:bg-slate-900/60",
                  "border-slate-200/80 dark:border-slate-700/60",
                  "border-l-2", c.accent,
                  "p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-200",
                  "hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      {c.unit}
                    </p>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                      {c.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {c.subtitle}
                    </p>
                  </div>
                  <div className={cn("p-2 rounded-lg border", c.badge)}>
                    <BedDouble className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Ocupados</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {occupied}/{total}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    Entrar
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-8">
          Você poderá alternar entre as unidades a qualquer momento pelo seletor no topo.
        </p>
      </div>
    </div>
  );
}
