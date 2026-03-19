import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Monitor, Shield, FileText, Activity, Users, Clock,
  ArrowRight, Stethoscope, ClipboardList, BarChart3,
  Heart, AlertTriangle, CheckCircle, Eye, Layers,
  Bed, Network, BrainCircuit, History, Siren,
  FileCheck, Pill, BookOpen, TrendingUp, Target,
  ArrowUpCircle, Timer, Handshake, Database,
  Download, Quote, Microscope, Baby, Sparkles,
  FileWarning, Zap, Search, LayoutDashboard,
  ChevronDown, ChevronUp, GripVertical, Circle,
  MapPin, Home, Clipboard, Settings, LogOut,
  PanelLeftClose, MoreHorizontal, Pencil, Trash2,
  Menu, FileBarChart, Pill as PillIcon, Syringe,
  HeartPulse, ScrollText, UserCheck, ArrowUp
} from "lucide-react";
import { whitelabel } from "@/config/whitelabel";

const HAPVIDA_BLUE = "#013ba6";
const HAPVIDA_LIGHT = "#0152d4";
const HAPVIDA_GLOW = "#0168f0";

interface SlideProps {
  isActive: boolean;
}

// ─── HAPMAP LOGO COMPONENT ───────────────────────────────────────────────────
function HapMapLogo({ size = "text-6xl", className = "", variant = "dark" }: { size?: string; className?: string; variant?: "dark" | "light" }) {
  const mapGradient = variant === "dark"
    ? `linear-gradient(135deg, #99d6ff 0%, #e0f0ff 50%, #ffffff 100%)`
    : `linear-gradient(135deg, ${HAPVIDA_BLUE} 0%, ${HAPVIDA_LIGHT} 50%, #014fc2 100%)`;

  const mapFilter = variant === "dark"
    ? "drop-shadow(0 0 15px rgba(100, 180, 255, 0.3))"
    : "drop-shadow(0 0 10px rgba(1, 59, 166, 0.3))";

  return (
    <span className={`${size} tracking-tight ${className}`} style={{ lineHeight: 1 }}>
      <span className="font-black" style={{
        background: `linear-gradient(135deg, #4db8ff 0%, #0088ff 30%, ${HAPVIDA_LIGHT} 60%, #66c2ff 100%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: "drop-shadow(0 0 20px rgba(1, 82, 212, 0.4))",
      }}>Hap</span>
      <span className="font-light" style={{
        background: mapGradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: mapFilter,
      }}>Map</span>
    </span>
  );
}

// ─── SLIDE 1: COVER ──────────────────────────────────────────────────────────
function SlideCover({ isActive }: SlideProps) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 30% 20%, #0a2a6e 0%, #010d2e 50%, #000510 100%)` }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-20" style={{
          background: `radial-gradient(circle, ${HAPVIDA_LIGHT} 0%, transparent 70%)`,
          left: "20%", top: "10%",
        }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-15" style={{
          background: `radial-gradient(circle, ${HAPVIDA_GLOW} 0%, transparent 70%)`,
          right: "15%", bottom: "20%",
        }} />
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-10" style={{
          background: `radial-gradient(circle, #4db8ff 0%, transparent 70%)`,
          left: "50%", top: "60%",
        }} />
      </div>

      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={isActive ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 text-center space-y-8"
      >
        <div className="relative">
          <HapMapLogo size="text-8xl" variant="dark" />
          <div className="absolute inset-0 blur-3xl opacity-30" style={{
            background: `radial-gradient(circle, ${HAPVIDA_LIGHT} 0%, transparent 70%)`,
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="space-y-5"
        >
          <div className="h-px w-40 mx-auto" style={{
            background: `linear-gradient(90deg, transparent, ${HAPVIDA_LIGHT}, transparent)`,
          }} />
          <p className="text-2xl text-blue-200/80 font-light max-w-2xl mx-auto leading-relaxed tracking-wide">
            A ponte entre a emergência e a internação
          </p>
          <p className="text-sm text-blue-300/50 tracking-[0.3em] uppercase font-medium">
            Vigilância Clínica Inteligente
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="pt-8"
        >
          <img src={whitelabel.logos.networkFull} alt="Hapvida" className="h-14 bg-white/95 rounded-xl px-5 py-2.5 mx-auto shadow-lg shadow-blue-500/10" />
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : {}}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="absolute bottom-8 text-blue-400/40 text-xs tracking-widest z-10 uppercase"
      >
        Proposta de Valor para a Rede Hapvida NotreDame Intermédica
      </motion.p>
    </div>
  );
}

// ─── SLIDE 2: O GAP ──────────────────────────────────────────────────────────
function SlideGap({ isActive }: SlideProps) {
  const items = [
    { icon: Monitor, label: "SamWeb", desc: "Pacientes ambulatoriais e atendimentos", color: "#10b981" },
    { icon: AlertTriangle, label: "??? GAP ???", desc: "Leitos de observação sem vigilância sistematizada", color: "#ef4444" },
    { icon: Database, label: "Siga", desc: "Pacientes internados oficialmente", color: "#3b82f6" },
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>O Problema</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">O Gap da Vigilância</h2>
        <p className="text-xl text-gray-500 mt-3 max-w-3xl">
          Pacientes em leito de observação com potencial de internação, risco de óbito ou necessidade de cuidados clínicos intensivos — <strong className="text-gray-800">sem rastreabilidade sistematizada</strong>.
        </p>
      </motion.div>

      <div className="flex-1 flex items-center justify-center gap-6 mt-8">
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.3, duration: 0.6 }}
            className="flex flex-col items-center">
            <div className={`w-52 h-52 rounded-3xl flex flex-col items-center justify-center shadow-xl ${i === 1 ? 'border-4 border-dashed border-red-300 bg-red-50' : 'bg-white'}`}>
              <item.icon className="h-16 w-16 mb-4" style={{ color: item.color }} strokeWidth={1.5} />
              <p className="font-bold text-lg text-gray-800">{item.label}</p>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center max-w-[200px]">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.5 }}
        className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
        <Siren className="h-8 w-8 text-red-500 flex-shrink-0" />
        <p className="text-red-800 text-lg">
          <strong>Pacientes em observação</strong> — setores Azul, Amarelo e Sala Vermelha — carecem de controle estruturado de diagnóstico, condutas, tempo de permanência e desfecho clínico.
        </p>
      </motion.div>
    </div>
  );
}

// ─── SLIDE 3: HAPMAP COMO PONTE ──────────────────────────────────────────────
function SlideBridge({ isActive }: SlideProps) {
  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: `linear-gradient(135deg, ${HAPVIDA_BLUE} 0%, #01297a 100%)` }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase text-blue-300">A Solução</p>
        <h2 className="text-5xl font-bold text-white mt-2 flex items-center gap-4">
          <HapMapLogo size="text-5xl" variant="dark" />
          <span className="text-white/60 font-light">— A Ponte</span>
        </h2>
      </motion.div>

      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-8 w-full max-w-5xl">
          <motion.div initial={{ opacity: 0, x: -60 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white/10 backdrop-blur rounded-2xl p-8 flex-1 text-center border border-white/20">
            <Monitor className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-bold text-xl">SamWeb</p>
            <p className="text-white/60 text-sm mt-2">Atendimento<br />ambulatorial</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0 }} animate={isActive ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.6, duration: 0.4 }}>
            <ArrowRight className="h-8 w-8 text-white/40" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-white rounded-3xl p-10 flex-[1.5] text-center shadow-2xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
              A Ponte
            </div>
            <HapMapLogo size="text-4xl" variant="light" className="justify-center flex" />
            <p className="text-gray-500 mt-4 text-sm leading-relaxed">
              Vigilância ativa de pacientes em observação com controle de diagnóstico, condutas, status de internação, tempo de permanência e desfecho clínico.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              {["Mapa de Leitos", "PSM", "Documentos", "Analytics", "IA", "Passagem de Plantão"].map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{tag}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0 }} animate={isActive ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1, duration: 0.4 }}>
            <ArrowRight className="h-8 w-8 text-white/40" />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 60 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.2, duration: 0.6 }}
            className="bg-white/10 backdrop-blur rounded-2xl p-8 flex-1 text-center border border-white/20">
            <Database className="h-12 w-12 text-sky-400 mx-auto mb-3" />
            <p className="text-white font-bold text-xl">Siga</p>
            <p className="text-white/60 text-sm mt-2">Internação<br />hospitalar</p>
          </motion.div>
        </div>
      </div>

      <motion.p initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.5 }}
        className="text-center text-white/70 text-lg">
        Acompanhamento de <strong className="text-white">ponta a ponta</strong> — da chegada à emergência até o desfecho final.
      </motion.p>
    </div>
  );
}

// ─── SLIDE 4: MAPA DE PACIENTES ──────────────────────────────────────────────
function SlidePatientMap({ isActive }: SlideProps) {
  const sectors = [
    { name: "Sala de Cuidados Especiais", color: "#ef4444", icon: Siren, beds: "Pacientes críticos", desc: "Monitorização contínua com status clínico em tempo real" },
    { name: "Observação Amarela", color: "#f59e0b", icon: AlertTriangle, beds: "Pacientes semi-críticos", desc: "Controle de condutas, pendências e programações" },
    { name: "Observação Azul", color: "#3b82f6", icon: Bed, beds: "Pacientes estáveis", desc: "Acompanhamento de permanência e desfecho" },
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Funcionalidade Principal</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Mapa de Pacientes em Tempo Real</h2>
        <p className="text-xl text-gray-500 mt-3">Cada paciente é um card completo com diagnóstico, condutas, antecedentes e status de internação.</p>
      </motion.div>

      <div className="flex-1 grid grid-cols-2 gap-5 mt-8">
        {sectors.map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0, scale: 0.9 }} animate={isActive ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            className="bg-white rounded-2xl p-5 shadow-lg border-l-4 flex items-start gap-4" style={{ borderLeftColor: s.color }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon className="h-6 w-6" style={{ color: s.color }} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{s.name}</h3>
              <p className="text-sm font-medium mt-0.5" style={{ color: s.color }}>{s.beds}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
            </div>
          </motion.div>
        ))}
        {/* Fora das Alas */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={isActive ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.75, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 shadow-lg border-l-4 border-l-gray-500 flex items-start gap-4 col-span-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100">
            <MapPin className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Fora das Alas — Sob Vigilância</h3>
            <p className="text-sm font-medium mt-0.5 text-amber-600">Pacientes que merecem atenção mesmo sem leito alocado</p>
            <p className="text-sm text-gray-500 mt-0.5">Casos em acompanhamento ativo que não estão fisicamente em leito, mas permanecem sob monitoramento clínico contínuo.</p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1, duration: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 flex items-center gap-6 mt-4 border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Emergência Adulto</p>
            <p className="text-sm text-gray-500">Vigilância completa em todas as alas</p>
          </div>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Baby className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Emergência Pediátrica</p>
            <p className="text-sm text-gray-500">Mesmos benefícios aplicados à pediatria</p>
          </div>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <div className="flex items-center gap-3 ml-auto">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <p className="text-sm font-medium text-gray-700">Resultados comprovados em ambos os cenários</p>
        </div>
      </motion.div>

      <div className="flex gap-4 mt-3">
        {[
          { icon: Eye, text: "Visibilidade total do censo" },
          { icon: Clock, text: "Tempo de permanência por setor" },
          { icon: Layers, text: "Drag & drop para reorganização" },
          { icon: Target, text: "Categorização por perfil clínico" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm flex-1">
            <item.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DEMO: MOCKUP PATIENT ROW ────────────────────────────────────────────────
function MockPatientRow({ bed, sector, diagnoses, pendencies, psmIcon, psmColor, delay, isActive, collapsed = false }: {
  bed: string; sector: string; diagnoses: string[]; pendencies: string[];
  psmIcon?: React.ReactNode; psmColor?: string; delay: number; isActive: boolean; collapsed?: boolean;
}) {
  const sectorColors: Record<string, string> = {
    red: "#ef4444", yellow: "#f59e0b", blue: "#3b82f6",
  };
  const borderColor = sectorColors[sector] || "#3b82f6";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isActive ? { opacity: 1, x: 0 } : {}}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-lg shadow-sm border overflow-hidden"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <GripVertical className="h-3.5 w-3.5 text-gray-300" />
        <div className="w-9 h-7 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: borderColor }}>
          {bed}
        </div>
        {psmIcon && <div className="flex-shrink-0">{psmIcon}</div>}
        <div className="text-xs font-semibold text-gray-800 w-20">Paciente ••••</div>
        {collapsed ? (
          <div className="flex-1 flex items-center justify-end gap-2">
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </div>
        ) : (
          <>
            <div className="flex-1 flex gap-4 text-[10px]">
              <div className="flex-1">
                <p className="text-gray-400 font-medium mb-0.5">Hipóteses/Diagnósticos</p>
                {diagnoses.map((d, i) => (
                  <p key={i} className="text-gray-700 leading-tight">• {d}</p>
                ))}
              </div>
              <div className="flex-1">
                <p className="text-gray-400 font-medium mb-0.5">Programações/Pendências</p>
                {pendencies.map((p, i) => (
                  <p key={i} className={`leading-tight ${p.startsWith("IR PARA") ? "text-blue-600 font-bold" : p.includes("AGUARDANDO") ? "text-amber-600 font-semibold" : p.includes("PSM FAVORÁVEL") ? "text-emerald-600 font-semibold" : "text-gray-700"}`}>
                    • {p}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Pencil className="h-3 w-3 text-gray-300" />
              <MoreHorizontal className="h-3 w-3 text-gray-300" />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── SLIDE 5: DEMO - VISÃO GERAL LEITOS RETRAÍDOS ───────────────────────────
function SlideDemoCollapsed({ isActive }: SlideProps) {
  const sectors = [
    { name: "Sala de Cuidados Especiais", color: "#ef4444", beds: [
      { bed: "V01", sector: "red" }, { bed: "V02", sector: "red" },
    ]},
    { name: "Observação Amarela", color: "#f59e0b", beds: [
      { bed: "A01", sector: "yellow" }, { bed: "A02", sector: "yellow" },
      { bed: "A03", sector: "yellow" }, { bed: "A04", sector: "yellow" },
    ]},
    { name: "Observação Azul", color: "#3b82f6", beds: [
      { bed: "Z01", sector: "blue" }, { bed: "Z02", sector: "blue" }, { bed: "Z03", sector: "blue" },
    ]},
  ];

  const outsideBeds = [
    { bed: "EXT1", sector: "yellow" },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #e8edf5 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-3 mb-1">
          <LayoutDashboard className="h-5 w-5" style={{ color: HAPVIDA_BLUE }} />
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Interface do HapMap</p>
        </div>
        <h2 className="text-4xl font-bold text-gray-900">Visão Compacta — Leitos Retraídos</h2>
        <p className="text-lg text-gray-500 mt-2">Vista panorâmica de todos os leitos ocupados, permitindo scan rápido do censo completo.</p>
      </motion.div>

      <div className="flex-1 flex gap-6 mt-6">
        {/* Sidebar mockup */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3, duration: 0.5 }}
          className="w-48 bg-white rounded-2xl shadow-lg border border-gray-200 p-3 flex flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <HapMapLogo size="text-lg" variant="light" />
          </div>
          {[
            { icon: LayoutDashboard, label: "Mapa de Leitos", active: true },
            { icon: FileText, label: "Documentos" },
            { icon: Clipboard, label: "Passagem de Plantão" },
            { icon: History, label: "Movimentações" },
            { icon: ScrollText, label: "Evoluções Clínicas" },
            { icon: BarChart3, label: "Relatório Clínico" },
            { icon: Microscope, label: "Examinus AI" },
            { icon: BrainCircuit, label: "Clinicus AI" },
            { icon: Pill, label: "Alto Custo" },
            { icon: Syringe, label: "Hemoderivados" },
            { icon: HeartPulse, label: "Protocolo Sepse" },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] ${item.active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-500'}`}>
              <item.icon className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
          <div className="mt-auto pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1 text-[9px] text-gray-400">
              <UserCheck className="h-3 w-3" />
              <span>Dr. ••••••</span>
            </div>
          </div>
        </motion.div>

        {/* Main content - collapsed beds */}
        <div className="flex-1 space-y-3 overflow-hidden">
          {sectors.map((sector, si) => (
            <motion.div key={si} initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 + si * 0.15, duration: 0.4 }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                <span className="font-bold text-sm text-gray-800">{sector.name}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{sector.beds.length} pacientes</span>
              </div>
              <div className="space-y-0.5">
                {sector.beds.map((bed, bi) => (
                  <MockPatientRow
                    key={bed.bed}
                    bed={bed.bed}
                    sector={bed.sector}
                    diagnoses={[]}
                    pendencies={[]}
                    delay={0.6 + si * 0.15 + bi * 0.04}
                    isActive={isActive}
                    collapsed={true}
                  />
                ))}
              </div>
            </motion.div>
          ))}

          {/* Fora das Alas */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.1, duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="font-bold text-sm text-gray-800">Fora das Alas</span>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">⚠ sob vigilância</span>
            </div>
            <div className="space-y-0.5">
              {outsideBeds.map((bed, bi) => (
                <MockPatientRow
                  key={bed.bed}
                  bed={bed.bed}
                  sector={bed.sector}
                  diagnoses={[]}
                  pendencies={[]}
                  delay={1.2 + bi * 0.05}
                  isActive={isActive}
                  collapsed={true}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.5 }}
        className="mt-3 bg-blue-50 rounded-xl p-3 flex items-center gap-3 border border-blue-100">
        <Eye className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-900">
          <strong>Visão retraída:</strong> Cada leito ocupa uma única linha — ideal para visão panorâmica durante rounds e passagens de plantão. Pacientes fora das alas também ficam sob vigilância ativa.
        </p>
      </motion.div>
    </div>
  );
}

// ─── SLIDE 6: DEMO - LEITOS EXPANDIDOS COM DIAGNÓSTICOS ──────────────────────
function SlideDemoExpanded({ isActive }: SlideProps) {
  const patients = [
    {
      bed: "A01", sector: "blue",
      diagnoses: ["Pneumonia comunitária (J18.9)", "HAS descompensada"],
      pendencies: ["SOLICITADA INTERNAÇÃO EM ENFERMARIA (AGUARDANDO PSM)", "Reavaliação de antibioticoterapia em 48h", "Aguardando resultado de hemocultura"],
      psmIcon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
    },
    {
      bed: "A03", sector: "blue",
      diagnoses: ["ICC descompensada (I50.0)", "DRC estágio III"],
      pendencies: ["IR PARA LEITO DE ENFERMARIA", "Reposição hidroeletrolítica K+ 3.1", "Controle de diurese 6/6h"],
      psmIcon: <ArrowUp className="h-3.5 w-3.5 text-blue-500" />,
    },
    {
      bed: "AM2", sector: "yellow",
      diagnoses: ["Abdome agudo inflamatório", "Suspeita de apendicite aguda"],
      pendencies: ["IR PARA O CENTRO CIRÚRGICO", "USG abdome total — resultado pendente", "Avaliação cirurgia geral — Dr. em deslocamento"],
      psmIcon: <ArrowUp className="h-3.5 w-3.5 text-blue-500" />,
    },
    {
      bed: "V01", sector: "red",
      diagnoses: ["AVC isquêmico (I63)", "Fibrilação atrial de alta resposta"],
      pendencies: ["IR PARA LEITO DE UTI", "Trombólise realizada — monitorar NIHSS", "TC controle em 24h"],
      psmIcon: <ArrowUp className="h-3.5 w-3.5 text-blue-500" />,
    },
    {
      bed: "AM1", sector: "yellow",
      diagnoses: ["Surto psicótico agudo (F23)", "Ideação suicida estruturada"],
      pendencies: ["IR PARA O INSTITUTO VOLTA VIDA (IVV)", "Contenção química — Haloperidol 5mg IM", "PSM FAVORÁVEL — aguardando vaga psiquiátrica"],
      psmIcon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
    },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f0f4fa 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-3 mb-1">
          <Layers className="h-5 w-5" style={{ color: HAPVIDA_BLUE }} />
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Interface do HapMap</p>
        </div>
        <h2 className="text-4xl font-bold text-gray-900">Visão Expandida — Detalhes Clínicos</h2>
        <p className="text-lg text-gray-500 mt-2">Diagnósticos, condutas, status de PSM e pendências — tudo visível em cada leito.</p>
      </motion.div>

      <div className="flex-1 space-y-2 mt-5 overflow-hidden">
        {patients.map((p, i) => (
          <MockPatientRow
            key={p.bed}
            bed={p.bed}
            sector={p.sector}
            diagnoses={p.diagnoses}
            pendencies={p.pendencies}
            psmIcon={p.psmIcon}
            delay={0.3 + i * 0.15}
            isActive={isActive}
          />
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.3 }}
        className="mt-3 grid grid-cols-4 gap-3">
        {[
          { icon: Clock, text: "Aguardando PSM", color: "#f59e0b", bg: "#fef3c7" },
          { icon: CheckCircle, text: "PSM Favorável", color: "#10b981", bg: "#d1fae5" },
          { icon: ArrowUp, text: "IR PARA (destino)", color: "#3b82f6", bg: "#dbeafe" },
          { icon: AlertTriangle, text: "PSM Desfavorável", color: "#ef4444", bg: "#fee2e2" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: s.bg }}>
            <s.icon className="h-4 w-4" style={{ color: s.color }} />
            <span className="text-xs font-semibold" style={{ color: s.color }}>{s.text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── SLIDE 7: DEMO - STATUS PSM E FLUXO DE INTERNAÇÃO ────────────────────────
function SlideDemoPSM({ isActive }: SlideProps) {
  const scenarios = [
    {
      title: "Internação em UTI",
      steps: [
        { text: "SOLICITADA INTERNAÇÃO EM UTI (AGUARDANDO PSM)", icon: Clock, color: "#f59e0b" },
        { text: "SOLICITADA INTERNAÇÃO EM UTI (PSM FAVORÁVEL)", icon: CheckCircle, color: "#10b981" },
        { text: "IR PARA LEITO DE UTI", icon: ArrowUp, color: "#3b82f6" },
      ],
    },
    {
      title: "Internação em Enfermaria",
      steps: [
        { text: "SOLICITADA INTERNAÇÃO EM ENFERMARIA (AGUARDANDO PSM)", icon: Clock, color: "#f59e0b" },
        { text: "SOLICITADA INTERNAÇÃO EM ENFERMARIA (PSM FAVORÁVEL)", icon: CheckCircle, color: "#10b981" },
        { text: "IR PARA ENFERMARIA", icon: ArrowUp, color: "#3b82f6" },
      ],
    },
    {
      title: "Internação Psiquiátrica",
      steps: [
        { text: "SOLICITADA INTERNAÇÃO PSIQUIÁTRICA (AGUARDANDO PSM)", icon: Clock, color: "#f59e0b" },
        { text: "SOLICITADA INTERNAÇÃO PSIQUIÁTRICA (PSM FAVORÁVEL)", icon: CheckCircle, color: "#10b981" },
        { text: "IR PARA O INSTITUTO VOLTA VIDA (IVV)", icon: ArrowUp, color: "#3b82f6" },
      ],
    },
    {
      title: "Centro Cirúrgico",
      steps: [
        { text: "SOLICITADA INTERNAÇÃO CIRÚRGICA (AGUARDANDO PSM)", icon: Clock, color: "#f59e0b" },
        { text: "SOLICITADA INTERNAÇÃO CIRÚRGICA (PSM FAVORÁVEL)", icon: CheckCircle, color: "#10b981" },
        { text: "IR PARA O CENTRO CIRÚRGICO", icon: ArrowUp, color: "#3b82f6" },
      ],
    },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: "linear-gradient(180deg, #fafbff 0%, #eef2ff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-3 mb-1">
          <ArrowUpCircle className="h-5 w-5" style={{ color: HAPVIDA_BLUE }} />
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Demonstrativo de Fluxo</p>
        </div>
        <h2 className="text-4xl font-bold text-gray-900">Ciclo PSM — Transformação Semântica</h2>
        <p className="text-lg text-gray-500 mt-2">O texto se transforma automaticamente conforme o status avança, indicando claramente o destino do paciente.</p>
      </motion.div>

      <div className="flex-1 grid grid-cols-2 gap-4 mt-6">
        {scenarios.map((sc, si) => (
          <motion.div key={si} initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + si * 0.15, duration: 0.5 }}
            className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" style={{ color: HAPVIDA_BLUE }} />
              {sc.title}
            </h4>
            <div className="space-y-2">
              {sc.steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.5 + si * 0.15 + i * 0.12, duration: 0.3 }}
                  className="flex items-start gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: `${step.color}10` }}>
                  <step.icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: step.color }} />
                  <span className="text-[10px] font-medium leading-tight" style={{ color: step.color }}>{step.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.3 }}
        className="mt-3 bg-amber-50 rounded-xl p-3 flex items-center gap-3 border border-amber-200">
        <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-900">
          <strong>Automação semântica:</strong> O médico clica no ícone de status e o sistema automaticamente atualiza a frase para refletir o destino auditado do paciente.
        </p>
      </motion.div>
    </div>
  );
}

// ─── SLIDE 8: DEMO - CONDUTAS E ACOMPANHAMENTO ──────────────────────────────
function SlideDemoConducts({ isActive }: SlideProps) {
  const cases = [
    {
      bed: "A02", sector: "blue", title: "Paciente Clínico — Enfermaria",
      conducts: ["Reposição hidroeletrolítica: SF 0.9% 1000mL + KCl 10% 20mL EV 8/8h", "Dieta hipossódica liberada", "Captopril 25mg VO 8/8h", "Controle pressórico de 4/4h", "Reavaliação clínica no próximo plantão"],
    },
    {
      bed: "V02", sector: "red", title: "Paciente Crítico — UTI",
      conducts: ["Monitorização contínua + oximetria", "Noradrenalina 0.1mcg/kg/min — titular conforme PAM", "IOT + VM: modo PCV, FiO2 60%, PEEP 10", "Colher gasometria arterial de 6/6h", "Solicitar vaga UTI — PRIORIDADE"],
    },
    {
      bed: "AM3", sector: "yellow", title: "Paciente Psiquiátrico — IVV",
      conducts: ["Contenção mecânica 4 pontos — reavaliar em 2h", "Haloperidol 5mg + Prometazina 50mg IM", "Vigilância contínua — risco de autoextermínio", "Contato com família para informação clínica", "Aguardando vaga IVV — PSM favorável emitido"],
    },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-3 mb-1">
          <ClipboardList className="h-5 w-5" style={{ color: HAPVIDA_BLUE }} />
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Plano Terapêutico</p>
        </div>
        <h2 className="text-4xl font-bold text-gray-900">Condutas & Acompanhamento em Tempo Real</h2>
        <p className="text-lg text-gray-500 mt-2">Cada conduta é registrada, rastreada e auditável — com histórico completo de alterações.</p>
      </motion.div>

      <div className="flex-1 grid grid-cols-3 gap-5 mt-6">
        {cases.map((c, ci) => {
          const sectorColors: Record<string, string> = { red: "#ef4444", yellow: "#f59e0b", blue: "#3b82f6" };
          const color = sectorColors[c.sector];
          return (
            <motion.div key={ci} initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + ci * 0.2, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border overflow-hidden flex flex-col" style={{ borderTopWidth: 3, borderTopColor: color }}>
              <div className="p-4 flex items-center gap-2 border-b border-gray-100">
                <div className="w-8 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: color }}>
                  {c.bed}
                </div>
                <span className="text-xs font-bold text-gray-800">{c.title}</span>
              </div>
              <div className="p-4 flex-1 space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Plano Terapêutico / Condutas</p>
                {c.conducts.map((cond, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.5 + ci * 0.2 + i * 0.08, duration: 0.3 }}
                    className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                    <p className="text-[11px] text-gray-700 leading-tight">{cond}</p>
                  </motion.div>
                ))}
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                <History className="h-3 w-3 text-gray-400" />
                <span className="text-[9px] text-gray-400">Última atualização: há 15 min — Dr. ••••</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.3 }}
        className="mt-3 bg-emerald-50 rounded-xl p-3 flex items-center gap-3 border border-emerald-200">
        <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <p className="text-sm text-emerald-900">
          <strong>Auditabilidade:</strong> Cada alteração em conduta gera um registro no histórico com identificação do profissional, data, hora e campo modificado.
        </p>
      </motion.div>
    </div>
  );
}

// ─── SLIDE 9: DEMO - SIDEBAR & NAVEGAÇÃO ─────────────────────────────────────
function SlideDemoSidebar({ isActive }: SlideProps) {
  const sections = [
    {
      title: "Vigilância Clínica",
      items: [
        { icon: LayoutDashboard, label: "Mapa de Leitos", desc: "Dashboard principal com mapa interativo de todos os pacientes em observação" },
        { icon: Clipboard, label: "Passagem de Plantão", desc: "Registro formal de transição com snapshot do censo e notas" },
        { icon: Network, label: "Movimentações", desc: "Registro de altas, transferências, óbitos e internações" },
        { icon: ScrollText, label: "Evoluções Clínicas", desc: "Registro cronológico com autoria identificada" },
      ],
    },
    {
      title: "Inteligência & Documentos",
      items: [
        { icon: BarChart3, label: "Relatório Clínico", desc: "Analytics com gráficos de movimentação e sugestões de gestão" },
        { icon: BrainCircuit, label: "Clinicus AI", desc: "Suporte à decisão clínica com inteligência artificial" },
        { icon: Microscope, label: "Examinus AI", desc: "Registro e interpretação de exames laboratoriais" },
        { icon: FileText, label: "Documentos da Rede", desc: "Repositório completo de fichas, protocolos e guias" },
      ],
    },
    {
      title: "Protocolos Especializados",
      items: [
        { icon: HeartPulse, label: "Protocolo Sepse", desc: "Abertura e acompanhamento do pacote 1h" },
        { icon: Pill, label: "Medicações de Alto Custo", desc: "Fichas padronizadas para solicitação" },
        { icon: Syringe, label: "Hemoderivados", desc: "Solicitações e termos de hemoconcentrados" },
        { icon: FileCheck, label: "OPME & Procedimentos", desc: "Fichas para procedimentos cirúrgicos" },
      ],
    },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-3 mb-1">
          <Menu className="h-5 w-5 text-blue-400" />
          <p className="text-sm font-semibold tracking-widest uppercase text-blue-400">Navegação Completa</p>
        </div>
        <h2 className="text-4xl font-bold text-white">Tudo ao Alcance — Sidebar do HapMap</h2>
        <p className="text-lg text-gray-400 mt-2">Todas as ferramentas clínicas e administrativas organizadas em uma navegação intuitiva.</p>
      </motion.div>

      <div className="flex-1 grid grid-cols-3 gap-6 mt-8">
        {sections.map((section, si) => (
          <motion.div key={si} initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + si * 0.2, duration: 0.5 }}
            className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
            <h3 className="font-bold text-white text-lg mb-4">{section.title}</h3>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.5 + si * 0.2 + i * 0.1, duration: 0.3 }}
                  className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${HAPVIDA_LIGHT}20` }}>
                    <item.icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">{item.label}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5 leading-tight">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.5 }}
        className="mt-3 bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/10">
        <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0" />
        <p className="text-sm text-gray-300">
          <strong className="text-white">Acesso baseado em perfil:</strong> Cada profissional visualiza apenas os módulos compatíveis com sua função — médico líder, porta, prescritor, enfermagem ou visitante.
        </p>
      </motion.div>
    </div>
  );
}

// ─── SLIDE 10: FLUXO DE INTERNAÇÃO, PSM e CARÊNCIAS ─────────────────────────
function SlideInternmentPSM({ isActive }: SlideProps) {
  const psmSteps = [
    { icon: Clock, label: "Aguardando PSM", color: "#f59e0b", bg: "#fef3c7" },
    { icon: CheckCircle, label: "PSM Favorável", color: "#10b981", bg: "#d1fae5" },
    { icon: ArrowUpCircle, label: "IR PARA Leito", color: "#3b82f6", bg: "#dbeafe" },
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #fafbff 0%, #eef2ff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Controle de Internação</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Solicitação, PSM & Carências</h2>
        <p className="text-xl text-gray-500 mt-3">Rastreabilidade completa do fluxo de internação — da solicitação ao leito.</p>
      </motion.div>

      <div className="flex-1 flex flex-col justify-center gap-6 mt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Ciclo de Status PSM</h3>
          <div className="flex items-center justify-between gap-4">
            {psmSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: step.bg }}>
                    <step.icon className="h-8 w-8" style={{ color: step.color }} />
                  </div>
                  <p className="font-semibold text-sm text-gray-800 text-center">{step.label}</p>
                </div>
                {i < psmSteps.length - 1 && <ArrowRight className="h-6 w-6 text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            O texto se transforma automaticamente: <em>"Solicitada Internação em UTI"</em> → <strong>"IR PARA LEITO DE UTI"</strong>
          </p>
        </motion.div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: ClipboardList, title: "Solicitação Padronizada", desc: "Template institucional completo com HDA, exames e plano terapêutico" },
            { icon: History, title: "Histórico de Solicitações", desc: "Registro auditável de todas as solicitações por período" },
            { icon: Handshake, title: "Fluxo Porta ↔ Líder", desc: "Solicitação de leito com aprovação e notificação em tempo real" },
            { icon: FileWarning, title: "Carências Contratuais", desc: "Rastreamento de eventuais carências à solicitação de internação para vigilância proativa", color: "#ef4444" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.7 + i * 0.12, duration: 0.5 }}
              className={`bg-white rounded-xl p-5 shadow-md ${i === 3 ? 'border-2 border-red-200 bg-red-50/50' : ''}`}>
              <item.icon className="h-7 w-7 mb-2" style={{ color: (item as any).color || HAPVIDA_BLUE }} />
              <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1.5">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 11: DOCUMENTOS INSTITUCIONAIS ─────────────────────────────────────
function SlideDocuments({ isActive }: SlideProps) {
  const docCategories = [
    { icon: Siren, title: "Protocolo Sepse", desc: "Abertura e acompanhamento do pacote 1h com checklist completo", color: "#ef4444" },
    { icon: Pill, title: "Alto Custo", desc: "10 fichas de medicações como Alteplase, Micafungina, Imunoglobulina", color: "#8b5cf6" },
    { icon: Heart, title: "Hemoderivados", desc: "Solicitações, termos e SADTs de hemoconcentrados", color: "#ef4444" },
    { icon: FileCheck, title: "OPME", desc: "15 fichas padronizadas para procedimentos cirúrgicos e intervencionistas", color: "#f59e0b" },
    { icon: BookOpen, title: "SADT & Regulações", desc: "Guias Hapvida para solicitações ambulatoriais e regulação SUS", color: "#3b82f6" },
    { icon: Stethoscope, title: "Tomografias", desc: "Questionários por região, termos de consentimento e fichas de acompanhamento", color: "#10b981" },
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Repositório Integrado</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Documentos da Rede</h2>
        <p className="text-xl text-gray-500 mt-3">Todos os documentos institucionais em um único lugar — acesso rápido sem sair do mapa.</p>
      </motion.div>

      <div className="flex-1 grid grid-cols-3 gap-5 mt-10">
        {docCategories.map((doc, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${doc.color}15` }}>
              <doc.icon className="h-6 w-6" style={{ color: doc.color }} />
            </div>
            <h3 className="font-bold text-gray-800">{doc.title}</h3>
            <p className="text-sm text-gray-500 mt-2 flex-1">{doc.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.2 }}
        className="bg-blue-50 rounded-2xl p-5 flex items-center gap-4 mt-4 border border-blue-100">
        <FileText className="h-7 w-7 text-blue-600 flex-shrink-0" />
        <p className="text-blue-900">
          <strong>+40 documentos</strong> padronizados da rede, incluindo códigos de procedimentos, cuidados paliativos, controle glicêmico e priorização cirúrgica.
        </p>
      </motion.div>
    </div>
  );
}

// ─── SLIDE 12: RESPONSABILIDADE MÉDICA ───────────────────────────────────────
function SlideMedicalTeam({ isActive }: SlideProps) {
  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #fafbff 0%, #eff6ff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Governança Clínica</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Responsabilidade Médica</h2>
        <p className="text-xl text-gray-500 mt-3">Modelo estruturado que garante que nenhum paciente fique desassistido.</p>
      </motion.div>

      <div className="flex-1 flex items-center gap-8 mt-6">
        <div className="flex-1 space-y-4">
          {[
            { icon: Shield, title: "Médico Líder", desc: "Coordena o cuidado, supervisiona condutas e define plano terapêutico para todos os pacientes do setor.", color: "#013ba6" },
            { icon: Stethoscope, title: "Médico da Porta", desc: "Responsável pela admissão, primeiro atendimento e solicitações iniciais de internação.", color: "#0ea5e9" },
            { icon: Users, title: "Seguimento Conjunto", desc: "Especialidades simultâneas — cirurgia, traumatologia, psiquiatria — registradas e rastreadas no card.", color: "#8b5cf6" },
          ].map((role, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -40 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4 + i * 0.2, duration: 0.5 }}
              className="bg-white rounded-2xl p-5 shadow-md flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${role.color}15` }}>
                <role.icon className="h-6 w-6" style={{ color: role.color }} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{role.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{role.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1, duration: 0.6 }}
          className="flex-1 rounded-3xl p-8 text-white" style={{ background: `linear-gradient(135deg, ${HAPVIDA_BLUE}, ${HAPVIDA_LIGHT})` }}>
          <h3 className="text-2xl font-bold mb-5">Impacto Direto</h3>
          <div className="space-y-4">
            {[
              "Cada paciente tem responsável identificado",
              "Transição de turno com passagem estruturada",
              "Rastreabilidade de quem alterou cada conduta",
              "Indicadores de pacientes em observação por responsável",
              "Notificações de solicitação de leito em tempo real",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <p className="text-white/90">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── SLIDE 13: EXAMINUS AI ───────────────────────────────────────────────────
function SlideExaminus({ isActive }: SlideProps) {
  const benefits = [
    { icon: Zap, title: "Velocidade", desc: "Registro de exames em segundos ao invés de minutos — basta colar o texto bruto." },
    { icon: Search, title: "Rastreamento Inteligente", desc: "Identifica automaticamente exames críticos: anemia, disfunção renal, alterações hepáticas." },
    { icon: Microscope, title: "Formatação Automática", desc: "Transforma textos desorganizados em dados estruturados e legíveis no card do paciente." },
    { icon: Target, title: "Foco no que Importa", desc: "Filtro de resultados relevantes permite visualização condensada dos achados clínicos." },
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase text-emerald-400">Inteligência Artificial</p>
        <h2 className="text-5xl font-bold text-white mt-2 flex items-center gap-4">
          <Microscope className="h-12 w-12 text-emerald-400" />
          Examinus AI
        </h2>
        <p className="text-xl text-gray-400 mt-3">Agilidade no registro e interpretação de exames laboratoriais com inteligência artificial.</p>
      </motion.div>

      <div className="flex-1 flex items-center gap-10 mt-8">
        <div className="flex-1 grid grid-cols-2 gap-5">
          {benefits.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <b.icon className="h-8 w-8 text-emerald-400 mb-3" />
              <h3 className="font-bold text-white text-lg">{b.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{b.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.8, duration: 0.6 }}
          className="flex-1 bg-white/5 backdrop-blur rounded-3xl p-8 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">Fluxo de Trabalho</h3>
          <div className="space-y-5">
            {[
              { step: "1", text: "Médico cola o texto bruto dos exames" },
              { step: "2", text: "IA identifica e formata automaticamente cada resultado" },
              { step: "3", text: "Revisão pré-importação com filtro de resultados críticos" },
              { step: "4", text: "Aprovação e integração automática ao card do paciente" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1 + i * 0.15, duration: 0.4 }}
                className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 font-bold">{item.step}</span>
                </div>
                <p className="text-gray-300">{item.text}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
            <p className="text-emerald-300 text-sm">
              <strong>Resultado:</strong> O médico ganha tempo significativo e mantém registros completos e padronizados.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── SLIDE 14: ANALYTICS E IA ────────────────────────────────────────────────
function SlideAnalytics({ isActive }: SlideProps) {
  const movementData = [
    { month: "Janeiro", altas: 142, transferencias: 38, obitos: 12, internacoes: 87 },
    { month: "Fevereiro", altas: 156, transferencias: 45, obitos: 9, internacoes: 94 },
  ];

  const managementSuggestions = [
    "Aumento de 9.8% nas altas → otimizar protocolos de desospitalização",
    "Redução de 25% nos óbitos → manter vigilância ativa contínua",
    "Crescimento de transferências UTI → revisar critérios de admissão precoce",
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #fafafa 0%, #f5f3ff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Inteligência de Dados</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Analytics & Relatório Clínico</h2>
        <p className="text-xl text-gray-500 mt-3">Dados que se transformam em decisões clínicas e estratégicas.</p>
      </motion.div>

      <div className="flex-1 flex gap-6 mt-8">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4, duration: 0.6 }}
          className="flex-1 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Movimentações — Jan/Fev 2025</h3>
          <div className="flex items-end gap-6 justify-center h-48 mb-4">
            {movementData.map((m, mi) => (
              <div key={mi} className="flex flex-col items-center gap-1">
                <div className="flex items-end gap-1.5">
                  {[
                    { val: m.altas, max: 160, color: "#10b981", label: "Altas" },
                    { val: m.transferencias, max: 160, color: "#3b82f6", label: "Transf." },
                    { val: m.obitos, max: 160, color: "#ef4444", label: "Óbitos" },
                    { val: m.internacoes, max: 160, color: "#8b5cf6", label: "Intern." },
                  ].map((bar, bi) => (
                    <motion.div key={bi} initial={{ height: 0 }} animate={isActive ? { height: (bar.val / bar.max) * 140 } : {}}
                      transition={{ delay: 0.6 + mi * 0.3 + bi * 0.1, duration: 0.5 }}
                      className="w-8 rounded-t-md relative group" style={{ backgroundColor: bar.color }}>
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">{bar.val}</span>
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-600 mt-2">{m.month}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 text-xs">
            {[
              { color: "#10b981", label: "Altas" },
              { color: "#3b82f6", label: "Transferências" },
              { color: "#ef4444", label: "Óbitos" },
              { color: "#8b5cf6", label: "Internações" },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: BarChart3, title: "Dashboard Analítico", desc: "KPIs em tempo real de todo o cenário clínico" },
              { icon: BrainCircuit, title: "Clinicus AI", desc: "Suporte à decisão clínica com IA" },
              { icon: TrendingUp, title: "Relatório Clínico", desc: "Análise sindrômica, recorrência e gravidade" },
              { icon: Timer, title: "DHD & Permanência", desc: "Dose/Habitante/Dia e tempo em observação" },
            ].map((feat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={isActive ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
                className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                <feat.icon className="h-7 w-7 mb-2" style={{ color: HAPVIDA_BLUE }} />
                <h4 className="font-bold text-sm text-gray-800">{feat.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{feat.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1, duration: 0.5 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 flex-1">
            <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5" /> Sugestões de Gestão (geradas por IA)
            </h4>
            <div className="space-y-2.5">
              {managementSuggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">{s}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 15: RASTREABILIDADE ───────────────────────────────────────────────
function SlideTraceability({ isActive }: SlideProps) {
  const trails = [
    { icon: History, title: "Versionamento", desc: "Snapshots completos do mapa de pacientes com restauração a qualquer ponto.", color: "#6366f1" },
    { icon: Handshake, title: "Passagem de Plantão", desc: "Registro formal com snapshot do censo, tipo de turno e notas de transição.", color: "#0ea5e9" },
    { icon: FileCheck, title: "Histórico de Condutas", desc: "Log detalhado de cada alteração por campo, com identificação do profissional.", color: "#10b981" },
    { icon: Shield, title: "Logs de Auditoria", desc: "Registro de todas as ações em conformidade com CFM e LGPD.", color: "#f59e0b" },
    { icon: Network, title: "Movimentações", desc: "Registro de altas, transferências, óbitos e internações com snapshot.", color: "#8b5cf6" },
    { icon: ClipboardList, title: "Evoluções Médicas", desc: "Registro cronológico de evoluções por paciente com autoria identificada.", color: "#ef4444" },
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #ffffff 0%, #fefce8 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Conformidade & Segurança</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Rastreabilidade Completa</h2>
        <p className="text-xl text-gray-500 mt-3">Cada ação é registrada, cada decisão é auditável, cada paciente é rastreável.</p>
      </motion.div>

      <div className="flex-1 grid grid-cols-3 gap-5 mt-10">
        {trails.map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${t.color}15` }}>
              <t.icon className="h-6 w-6" style={{ color: t.color }} />
            </div>
            <h3 className="font-bold text-gray-800">{t.title}</h3>
            <p className="text-sm text-gray-500 mt-2">{t.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.2 }}
        className="bg-amber-50 rounded-2xl p-5 flex items-center gap-4 mt-4 border border-amber-200">
        <Shield className="h-7 w-7 text-amber-600 flex-shrink-0" />
        <p className="text-amber-900">
          Em conformidade com <strong>Lei 13.709/2018 (LGPD)</strong> e <strong>CFM 1.821/2007</strong> — criptografia, controle de acesso por perfil e retenção auditada.
        </p>
      </motion.div>
    </div>
  );
}

// ─── SLIDE 16: DEPOIMENTOS MÉDICOS ───────────────────────────────────────────
function SlideTestimonials({ isActive }: SlideProps) {
  const testimonials = [
    {
      quote: "O HapMap mudou completamente a minha rotina. Antes eu não tinha controle real sobre os pacientes em observação. Agora sei exatamente o que está acontecendo com cada um deles a qualquer momento.",
      role: "Médica Plantonista — Emergência Adulto",
    },
    {
      quote: "A velocidade de registro é impressionante. Em poucos cliques eu tenho o diagnóstico, pendências e condutas organizadas. Isso me dá muito mais tempo pra focar no paciente.",
      role: "Médico da Porta — Emergência",
    },
    {
      quote: "Estar 100% ciente de tudo que acontece na emergência, principalmente com pacientes em leito aguardando definição ou transferência, é algo que antes era impossível sem essa ferramenta.",
      role: "Médico Líder — Coordenação Clínica",
    },
    {
      quote: "Na pediatria, o HapMap fez com que o nosso raciocínio clínico ficasse totalmente direcionado para os pacientes que estamos visualizando em tempo real, alocados nas alas. A clareza que isso traz é extraordinária.",
      role: "Médica Plantonista — Emergência Pediátrica",
    },
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>O que Dizem os Médicos</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Depoimentos da Linha de Frente</h2>
        <p className="text-xl text-gray-500 mt-3">Relatos reais de profissionais que utilizam o HapMap diariamente.</p>
      </motion.div>

      <div className="flex-1 grid grid-cols-2 gap-6 mt-10">
        {testimonials.map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }}
            className="bg-white rounded-2xl p-7 shadow-lg border border-gray-100 flex flex-col relative">
            <Quote className="h-8 w-8 text-blue-100 absolute top-5 right-5" />
            <p className="text-gray-700 leading-relaxed flex-1 italic text-[15px]">"{t.quote}"</p>
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${HAPVIDA_BLUE}, ${HAPVIDA_LIGHT})` }}>
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Depoimento Anônimo</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── SLIDE 17: ENCERRAMENTO ──────────────────────────────────────────────────
function SlideClosing({ isActive }: SlideProps) {
  const impacts = [
    { icon: TrendingUp, text: "Redução de mortalidade por vigilância ativa" },
    { icon: Target, text: "Maior assertividade nas condutas clínicas" },
    { icon: Eye, text: "Visibilidade total do paciente em observação" },
    { icon: Clock, text: "Controle de tempo de permanência" },
    { icon: Shield, text: "Conformidade regulatória e auditabilidade" },
    { icon: Network, text: "Integração entre emergência e internação" },
  ];

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 30%, #0a2a6e 0%, #010d2e 50%, #000510 100%)` }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-15" style={{
          background: `radial-gradient(circle, ${HAPVIDA_LIGHT} 0%, transparent 70%)`,
          left: "30%", top: "20%",
        }} />
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-10" style={{
          background: `radial-gradient(circle, #4db8ff 0%, transparent 70%)`,
          right: "20%", bottom: "30%",
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isActive ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-4xl space-y-8"
      >
        <HapMapLogo size="text-7xl" variant="dark" />

        <h2 className="text-5xl font-bold text-white">
          Vigilância que salva vidas.
        </h2>
        <p className="text-xl text-blue-200/60 leading-relaxed">
          O HapMap preenche o gap entre o atendimento ambulatorial e a internação,<br />
          garantindo que cada paciente em observação seja monitorado de ponta a ponta.
        </p>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {impacts.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
              className="bg-white/5 backdrop-blur rounded-xl p-4 flex items-center gap-3 border border-white/10">
              <item.icon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <span className="text-white/90 text-sm text-left">{item.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.5 }}
          className="pt-6 space-y-3">
          <p className="text-blue-400/40 text-sm">{whitelabel.platform.slogan}</p>
          <img src={whitelabel.logos.networkFull} alt="Hapvida" className="h-12 mx-auto bg-white/95 rounded-lg px-4 py-2" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── MAIN PRESENTATION COMPONENT ─────────────────────────────────────────────

const slides = [
  SlideCover,           // 1 - Capa
  SlideGap,             // 2 - O Gap
  SlideBridge,          // 3 - HapMap como Ponte
  SlidePatientMap,      // 4 - Mapa de Pacientes
  SlideDemoCollapsed,   // 5 - DEMO: Visão compacta
  SlideDemoExpanded,    // 6 - DEMO: Visão expandida
  SlideDemoPSM,         // 7 - DEMO: Ciclo PSM
  SlideDemoConducts,    // 8 - DEMO: Condutas
  SlideDemoSidebar,     // 9 - DEMO: Sidebar/Navegação
  SlideInternmentPSM,   // 10 - Internação & Carências
  SlideDocuments,       // 11 - Documentos
  SlideMedicalTeam,     // 12 - Responsabilidade Médica
  SlideExaminus,        // 13 - Examinus AI
  SlideAnalytics,       // 14 - Analytics
  SlideTraceability,    // 15 - Rastreabilidade
  SlideTestimonials,    // 16 - Depoimentos
  SlideClosing,         // 17 - Encerramento
];

export default function PresentationPage() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

  const goNext = useCallback(() => setCurrent(c => Math.min(c + 1, slides.length - 1)), []);
  const goPrev = useCallback(() => setCurrent(c => Math.max(c - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "Escape" && isFullscreen) exitFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Touch swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartRef.current = null;
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const CurrentSlide = slides[current];

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body > *:not(#presentation-root) { display: none !important; }
          #presentation-root { position: fixed; inset: 0; }
          #presentation-root .presentation-controls,
          #presentation-root .presentation-nav-btn,
          #presentation-root .presentation-bottom-bar { display: none !important; }
          #presentation-root .presentation-slide-area {
            position: fixed; inset: 0; background: white;
          }
        }
      `}</style>

      <div id="presentation-root" className="h-screen w-screen bg-black flex flex-col overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide area */}
        <div className="presentation-slide-area flex-1 relative overflow-hidden" ref={containerRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <CurrentSlide isActive={true} />
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          {current > 0 && (
            <button onClick={goPrev}
              className="presentation-nav-btn absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 sm:p-3 transition-all z-20 backdrop-blur">
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}
          {current < slides.length - 1 && (
            <button onClick={goNext}
              className="presentation-nav-btn absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 sm:p-3 transition-all z-20 backdrop-blur">
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}
        </div>

        {/* Bottom bar */}
        <div className="presentation-bottom-bar h-10 sm:h-12 bg-gray-950 flex items-center justify-between px-3 sm:px-6 border-t border-white/10">
          <span className="text-white/50 text-xs sm:text-sm hidden sm:inline">HapMap — Proposta de Valor</span>

          <div className="flex items-center gap-1 sm:gap-1.5 overflow-hidden max-w-[50%] sm:max-w-none">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`h-1.5 sm:h-2 rounded-full transition-all flex-shrink-0 ${i === current ? 'w-4 sm:w-6 bg-white' : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/50'}`} />
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={handleDownloadPDF}
              className="flex items-center gap-1 sm:gap-1.5 text-white/50 hover:text-white transition-colors text-xs sm:text-sm">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <span className="text-white/50 text-xs sm:text-sm">{current + 1}/{slides.length}</span>
            <button onClick={toggleFullscreen} className="text-white/50 hover:text-white transition-colors hidden sm:block">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
