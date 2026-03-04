import { useState, useMemo } from "react";
import { Search, Scissors, ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, Copy, ChevronDown, ChevronRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

type UrgencyLevel = "must" | "conditional" | "excluded";

interface SurgicalCode {
  code: string;
  procedure: string;
  condition?: string;
  exclusionReason?: string;
}

interface SurgicalSection {
  title: string;
  level: UrgencyLevel;
  icon?: string;
  codes: SurgicalCode[];
  criteria?: string[];
  note?: string;
}

interface SurgicalCategory {
  id: string;
  title: string;
  emoji: string;
  sections: SurgicalSection[];
  contractClause?: string;
}

const levelConfig: Record<UrgencyLevel, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof ShieldCheck }> = {
  must: {
    label: "DEVE ENTRAR",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    icon: ShieldCheck,
  },
  conditional: {
    label: "CONDICIONAL",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    icon: ShieldAlert,
  },
  excluded: {
    label: "NÃO DEVE ENTRAR",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    icon: ShieldX,
  },
};

const surgicalData: SurgicalCategory[] = [
  {
    id: "geral",
    title: "CIRURGIA GERAL – ROL CONTRATUAL (CBHPM)",
    emoji: "🏥",
    sections: [
      {
        title: "ABDOME AGUDO INFECCIOSO / INFLAMATÓRIO",
        level: "must",
        codes: [
          { code: "3.10.03.079", procedure: "Apendicectomia (via convencional)" },
          { code: "3.10.03.583", procedure: "Apendicectomia por videolaparoscopia" },
          { code: "3.10.05.101", procedure: "Colecistectomia (via convencional) por colecistite aguda" },
          { code: "3.10.05.470", procedure: "Colecistectomia por videolaparoscopia (colecistite aguda)" },
        ],
      },
      {
        title: "HÉRNIAS COMPLICADAS (URGÊNCIA INEQUÍVOCA)",
        level: "must",
        codes: [
          { code: "3.10.09.07-7", procedure: "Herniorrafia estrangulada com ressecção intestinal" },
          { code: "3.10.09.31-0", procedure: "Herniorrafia estrangulada por videolaparoscopia" },
          { code: "3.10.09.06-9", procedure: "Hérnia inguinal encarcerada em RN ou lactente" },
        ],
        note: "Vedada para hérnias redutíveis ou eletivas",
      },
      {
        title: "ABDOME AGUDO OBSTRUTIVO / PERFURATIVO / SÉPTICO",
        level: "must",
        codes: [
          { code: "3.10.09.174", procedure: "Laparotomia exploradora (obstrução, perfuração, abscesso)" },
          { code: "3.10.03.192", procedure: "Colectomia (via convencional) em urgência" },
          { code: "3.10.03.648", procedure: "Colectomia por videolaparoscopia em urgência" },
        ],
      },
      {
        title: "INFECÇÃO PROFUNDA / SEPSE CIRÚRGICA",
        level: "must",
        codes: [
          { code: "3.10.09.01-8", procedure: "Drenagem cirúrgica de abscesso perineal" },
          { code: "3.10.04.024", procedure: "Drenagem de abscesso isquiorretal" },
          { code: "3.01.01.280", procedure: "Desbridamento cirúrgico profundo (infecção grave / necrosante)" },
        ],
      },
      {
        title: "DRENAGENS E ACESSOS",
        level: "conditional",
        codes: [
          { code: "30101002", procedure: "Drenagem de abscesso", condition: "Abscesso profundo, sepse ou falha clínica" },
          { code: "3.10.02.056", procedure: "Gastrostomia", condition: "Impossibilidade imediata de via oral + risco nutricional" },
          { code: "4.08.13.231", procedure: "Cateter venoso central / portocath", condition: "Choque, sepse ou falha de acesso periférico" },
        ],
        note: "Não caracterizam urgência isoladamente: Dor, Comodidade, Logística",
      },
      {
        title: "ATOS AMBULATORIAIS / ASSISTENCIAIS",
        level: "excluded",
        codes: [
          { code: "30101001", procedure: "Sutura simples", exclusionReason: "Ato ambulatorial" },
          { code: "30101003", procedure: "Curativo cirúrgico complexo", exclusionReason: "Enfermaria / cuidado continuado" },
          { code: "30101006", procedure: "Curativos seriados", exclusionReason: "Assistencial" },
          { code: "30101005", procedure: "Retirada de corpo estranho superficial", exclusionReason: "Baixa complexidade" },
        ],
      },
      {
        title: "PQA DISFARÇADO",
        level: "excluded",
        codes: [
          { code: "30101004", procedure: "Desbridamento superficial", exclusionReason: "Uso indevido recorrente" },
          { code: "3.10.02.056", procedure: "Gastrostomia eletiva", exclusionReason: "Planejável" },
          { code: "4.08.13.231", procedure: "Portocath eletivo", exclusionReason: "Programável" },
        ],
        note: '"Aproveitar internação" → Prática vedada',
      },
    ],
    contractClause: "Somente serão remunerados como urgência os procedimentos constantes do rol principal, quando caracterizado risco clínico imediato, não passível de postergação, devidamente documentado em prontuário. Procedimentos listados no anexo de exclusão não serão considerados cirurgias de urgência para fins de pagamento à equipe.",
  },
  {
    id: "trauma-abdominal",
    title: "TRAUMA ABDOMINAL",
    emoji: "🔴",
    sections: [
      {
        title: "LAPAROTOMIA E CIRURGIAS DE SALVAMENTO",
        level: "must",
        codes: [
          { code: "3.10.09.174", procedure: "Laparotomia exploradora por trauma abdominal" },
          { code: "3.10.01.010", procedure: "Laparotomia para controle de hemorragia" },
          { code: "3.10.03.192", procedure: "Colectomia em trauma abdominal" },
          { code: "3.10.03.180", procedure: "Enterectomia / ressecção de intestino delgado" },
          { code: "3.10.03.205", procedure: "Esplenectomia por trauma" },
          { code: "3.10.03.214", procedure: "Hepatorrafia / cirurgia hepática por trauma" },
          { code: "3.10.03.221", procedure: "Nefrectomia por trauma abdominal" },
          { code: "3.10.03.233", procedure: "Pancreatectomia parcial por trauma" },
        ],
        criteria: ["Sangramento ativo", "Perfuração visceral", "Instabilidade hemodinâmica", "Peritonite traumática"],
      },
      {
        title: "CONTROLE DE DANOS / INFECÇÃO PÓS-TRAUMA",
        level: "must",
        codes: [
          { code: "3.01.01.280", procedure: "Desbridamento cirúrgico profundo" },
          { code: "3.10.09.201", procedure: "Drenagem de abscesso intra-abdominal pós-trauma" },
        ],
      },
    ],
  },
  {
    id: "trauma-toracico",
    title: "TRAUMA TORÁCICO",
    emoji: "🫁",
    sections: [
      {
        title: "EMERGÊNCIAS TORÁCICAS CLÁSSICAS",
        level: "must",
        codes: [
          { code: "3.10.07.010", procedure: "Toracotomia exploradora" },
          { code: "3.10.07.021", procedure: "Toracotomia para controle de hemorragia" },
          { code: "3.10.07.035", procedure: "Sutura pulmonar por trauma" },
          { code: "3.10.07.047", procedure: "Lobectomia pulmonar por trauma" },
          { code: "3.10.07.060", procedure: "Drenagem torácica aberta (hemotórax / pneumotórax maciço)" },
          { code: "3.10.07.072", procedure: "Pericardiotomia de urgência" },
          { code: "3.10.07.081", procedure: "Reparação de ferimento cardíaco" },
        ],
        criteria: ["Choque", "Insuficiência respiratória", "Tamponamento cardíaco"],
      },
      {
        title: "PROCEDIMENTOS CONDICIONAIS",
        level: "conditional",
        codes: [
          { code: "3.10.07.090", procedure: "Drenagem torácica fechada", condition: "Somente se instabilidade ou grande débito" },
          { code: "3.10.07.101", procedure: "Videotoracoscopia", condition: "Trauma complicado não controlado clinicamente" },
        ],
      },
    ],
  },
  {
    id: "trauma-cervical",
    title: "TRAUMA EM REGIÃO CERVICAL",
    emoji: "🦴",
    sections: [
      {
        title: "URGÊNCIAS CERVICAIS",
        level: "must",
        codes: [
          { code: "3.10.08.010", procedure: "Exploração cirúrgica de ferimento cervical" },
          { code: "3.10.08.022", procedure: "Cervicotomia exploradora" },
          { code: "3.10.08.034", procedure: "Reparação de lesão vascular cervical" },
          { code: "3.10.08.046", procedure: "Traqueostomia de urgência" },
          { code: "3.10.08.058", procedure: "Cricotireoidostomia" },
        ],
        criteria: ["Comprometimento de via aérea", "Sangramento ativo", "Lesão vascular", "Enfisema subcutâneo progressivo"],
      },
      {
        title: "COM RESTRIÇÃO",
        level: "conditional",
        codes: [
          { code: "3.10.08.070", procedure: "Revisão cirúrgica de ferida cervical", condition: "Apenas se sangramento ativo" },
          { code: "3.10.07.090", procedure: "Drenagem torácica simples", condition: "Não pagar se profilática" },
          { code: "3.01.01.280", procedure: "Desbridamento", condition: "Apenas se profundo ou necrosante" },
        ],
      },
      {
        title: "NÃO DEVEM ENTRAR",
        level: "excluded",
        codes: [
          { code: "-", procedure: "Exploração superficial de ferida", exclusionReason: "Ato ambulatorial" },
          { code: "-", procedure: "Sutura simples de parede torácica", exclusionReason: "Pronto-socorro" },
          { code: "-", procedure: "Curativos seriados", exclusionReason: "Assistencial" },
          { code: "-", procedure: "Drenagem torácica preventiva", exclusionReason: "Uso indevido" },
          { code: "-", procedure: "Traqueostomia eletiva", exclusionReason: "Programável" },
        ],
      },
    ],
  },
];

const mandatoryCriteria = [
  "Abdome agudo", "Sepse", "Perfuração", "Obstrução",
  "Encarceramento ou estrangulamento", "Falha de tratamento clínico",
  "Risco iminente de morte", "Risco de perda funcional",
];

export default function SurgicalCodesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["geral"]));

  const toggleCategory = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Código copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return surgicalData;
    const term = searchTerm.toUpperCase();
    return surgicalData
      .map((cat) => ({
        ...cat,
        sections: cat.sections
          .map((sec) => ({
            ...sec,
            codes: sec.codes.filter(
              (c) =>
                c.code.toUpperCase().includes(term) ||
                c.procedure.toUpperCase().includes(term) ||
                (c.condition && c.condition.toUpperCase().includes(term))
            ),
          }))
          .filter((sec) => sec.codes.length > 0),
      }))
      .filter((cat) => cat.sections.length > 0);
  }, [searchTerm]);

  const totalCodes = surgicalData.reduce(
    (acc, cat) => acc + cat.sections.reduce((a, s) => a + s.codes.length, 0),
    0
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/10 flex items-center justify-center">
            <Scissors className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">
              Procedimentos Cirúrgicos
            </h1>
            <p className="text-muted-foreground text-xs uppercase">
              ROL CONTRATUAL CBHPM • {totalCodes} códigos catalogados
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Critério Geral */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Critério Geral Obrigatório para Urgência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {mandatoryCriteria.map((c) => (
              <Badge key={c} variant="outline" className="text-xs font-medium border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
                {c}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar código, procedimento ou condição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 uppercase"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(levelConfig) as [UrgencyLevel, typeof levelConfig.must][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </div>
          );
        })}
      </div>

      {/* Categories */}
      <ScrollArea className="h-auto">
        <div className="space-y-4">
          {filteredData.length === 0 && (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center text-muted-foreground">
                <Search className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-semibold uppercase">Nenhum procedimento encontrado</p>
                <p className="text-xs">Tente outro termo de busca</p>
              </CardContent>
            </Card>
          )}

          {filteredData.map((category) => (
            <Collapsible
              key={category.id}
              open={openSections.has(category.id) || !!searchTerm}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base md:text-lg uppercase flex items-center gap-2">
                        <span className="text-xl">{category.emoji}</span>
                        {category.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {category.sections.reduce((a, s) => a + s.codes.length, 0)} códigos
                        </Badge>
                        {openSections.has(category.id) || searchTerm ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {category.sections.map((section, sIdx) => {
                      const cfg = levelConfig[section.level];
                      const SectionIcon = cfg.icon;

                      return (
                        <div key={sIdx} className={`rounded-lg border ${cfg.borderColor} ${cfg.bgColor} overflow-hidden`}>
                          {/* Section Header */}
                          <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <SectionIcon className={`h-4 w-4 ${cfg.color}`} />
                              <span className={`text-sm font-bold uppercase ${cfg.color}`}>
                                {section.title}
                              </span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] ${cfg.color} ${cfg.borderColor}`}>
                              {cfg.label}
                            </Badge>
                          </div>

                          {/* Criteria */}
                          {section.criteria && section.criteria.length > 0 && (
                            <div className="px-4 pb-2">
                              <div className="flex flex-wrap gap-1.5">
                                {section.criteria.map((c) => (
                                  <Badge key={c} variant="outline" className={`text-[10px] ${cfg.borderColor} ${cfg.color}`}>
                                    📌 {c}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Codes Table */}
                          <div className="bg-background/60">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-t border-b border-border/50">
                                  <th className="text-left px-4 py-2 font-bold text-xs uppercase text-muted-foreground w-36">Código</th>
                                  <th className="text-left px-4 py-2 font-bold text-xs uppercase text-muted-foreground">Procedimento</th>
                                  {section.level === "conditional" && (
                                    <th className="text-left px-4 py-2 font-bold text-xs uppercase text-muted-foreground w-64">Condição</th>
                                  )}
                                  {section.level === "excluded" && (
                                    <th className="text-left px-4 py-2 font-bold text-xs uppercase text-muted-foreground w-48">Motivo</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {section.codes.map((code, cIdx) => (
                                  <tr key={cIdx} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-2.5">
                                      <button
                                        onClick={() => code.code !== "-" && handleCopy(code.code)}
                                        className="font-mono text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1 group"
                                        title={code.code !== "-" ? "Clique para copiar" : ""}
                                        disabled={code.code === "-"}
                                      >
                                        {code.code}
                                        {code.code !== "-" && (
                                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                      </button>
                                    </td>
                                    <td className="px-4 py-2.5 font-medium text-foreground">
                                      {code.procedure}
                                    </td>
                                    {section.level === "conditional" && (
                                      <td className="px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400 italic">
                                        {code.condition}
                                      </td>
                                    )}
                                    {section.level === "excluded" && (
                                      <td className="px-4 py-2.5">
                                        <Badge variant="destructive" className="text-[10px] font-normal">
                                          {code.exclusionReason}
                                        </Badge>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Note */}
                          {section.note && (
                            <div className="px-4 py-2 border-t border-border/30">
                              <p className={`text-xs flex items-center gap-1.5 ${cfg.color}`}>
                                <Info className="h-3 w-3 flex-shrink-0" />
                                {section.note}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Contract Clause */}
                    {category.contractClause && (
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" />
                          Cláusula Contratual Recomendada
                        </p>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          "{category.contractClause}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
