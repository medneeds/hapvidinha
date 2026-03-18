import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Monitor, Shield, FileText, Activity, Users, Clock,
  ArrowRight, Stethoscope, ClipboardList, BarChart3,
  Heart, AlertTriangle, CheckCircle, Eye, Layers,
  Bed, Network, BrainCircuit, History, Siren,
  FileCheck, Pill, BookOpen, TrendingUp, Target,
  ArrowUpCircle, Timer, Handshake, Database
} from "lucide-react";
import { whitelabel } from "@/config/whitelabel";

// ─── SLIDE DATA ──────────────────────────────────────────────────────────────

const HAPVIDA_BLUE = "#013ba6";
const HAPVIDA_LIGHT = "#0152d4";

interface SlideProps {
  isActive: boolean;
}

// ─── SLIDE 1: COVER ──────────────────────────────────────────────────────────
function SlideCover({ isActive }: SlideProps) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${HAPVIDA_BLUE} 0%, ${HAPVIDA_LIGHT} 50%, #0168f0 100%)` }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 300 + 50}px`,
              height: `${Math.random() * 300 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3,
            }} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isActive ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center space-y-8"
      >
        <img src={whitelabel.logos.platform} alt="HapMap" className="h-28 mx-auto drop-shadow-2xl" />
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white tracking-tight">
            {whitelabel.platform.fullName}
          </h1>
          <div className="h-1 w-32 bg-white/40 mx-auto rounded-full" />
          <p className="text-2xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
            A ponte entre a emergência e a internação
          </p>
        </div>
        <div className="flex items-center gap-3 justify-center mt-12">
          <img src={whitelabel.logos.networkFull} alt="Hapvida" className="h-14 bg-white/95 rounded-lg px-4 py-2" />
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : {}}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 text-white/60 text-sm z-10"
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
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.3, duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className={`w-52 h-52 rounded-3xl flex flex-col items-center justify-center shadow-xl ${i === 1 ? 'border-4 border-dashed border-red-300 bg-red-50' : 'bg-white'}`}>
              <item.icon className="h-16 w-16 mb-4" style={{ color: item.color }} strokeWidth={1.5} />
              <p className="font-bold text-lg text-gray-800">{item.label}</p>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center max-w-[200px]">{item.desc}</p>
            {i < 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={isActive ? { opacity: 1 } : {}}
                transition={{ delay: 0.8 + i * 0.3 }}
                className="absolute"
                style={{ left: `${28 + i * 28}%`, top: '50%' }}
              >
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : {}}
        transition={{ delay: 1.5 }}
        className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4"
      >
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
        <h2 className="text-5xl font-bold text-white mt-2">HapMap: A Ponte</h2>
      </motion.div>

      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-8 w-full max-w-5xl">
          {/* SamWeb */}
          <motion.div initial={{ opacity: 0, x: -60 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white/10 backdrop-blur rounded-2xl p-8 flex-1 text-center border border-white/20">
            <Monitor className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-bold text-xl">SamWeb</p>
            <p className="text-white/60 text-sm mt-2">Atendimento<br />ambulatorial</p>
          </motion.div>

          {/* Arrow */}
          <motion.div initial={{ opacity: 0, scale: 0 }} animate={isActive ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.6, duration: 0.4 }}>
            <ArrowRight className="h-8 w-8 text-white/40" />
          </motion.div>

          {/* HapMap */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-white rounded-3xl p-10 flex-[1.5] text-center shadow-2xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
              A Ponte
            </div>
            <img src={whitelabel.logos.platform} alt="HapMap" className="h-16 mx-auto mb-4" />
            <p className="font-bold text-2xl text-gray-900">HapMap 2.0</p>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              Vigilância ativa de pacientes em observação com controle de diagnóstico, condutas, status de internação, tempo de permanência e desfecho clínico.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              {["Mapa de Leitos", "PSM", "Documentos", "Analytics", "IA", "Passagem de Plantão"].map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{tag}</span>
              ))}
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div initial={{ opacity: 0, scale: 0 }} animate={isActive ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1, duration: 0.4 }}>
            <ArrowRight className="h-8 w-8 text-white/40" />
          </motion.div>

          {/* Siga */}
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
    { name: "Sala Vermelha", color: "#ef4444", icon: Siren, beds: "Pacientes críticos", desc: "Monitorização contínua com status clínico em tempo real" },
    { name: "Ala Amarela", color: "#f59e0b", icon: AlertTriangle, beds: "Pacientes semi-críticos", desc: "Controle de condutas, pendências e programações" },
    { name: "Ala Azul", color: "#3b82f6", icon: Bed, beds: "Pacientes estáveis", desc: "Acompanhamento de permanência e desfecho" },
    { name: "UTI", color: "#8b5cf6", icon: Activity, beds: "Cuidados intensivos", desc: "Dispositivos, culturas, previsão de alta" },
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Funcionalidade Principal</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Mapa de Pacientes em Tempo Real</h2>
        <p className="text-xl text-gray-500 mt-3">Cada paciente é um card completo com diagnóstico, condutas, antecedentes e status de internação.</p>
      </motion.div>

      <div className="flex-1 grid grid-cols-2 gap-6 mt-10">
        {sectors.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isActive ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg border-l-4 flex items-start gap-5"
            style={{ borderLeftColor: s.color }}
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon className="h-7 w-7" style={{ color: s.color }} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{s.name}</h3>
              <p className="text-sm font-medium mt-1" style={{ color: s.color }}>{s.beds}</p>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.2 }}
        className="flex gap-4 mt-4">
        {[
          { icon: Eye, text: "Visibilidade total do censo" },
          { icon: Clock, text: "Tempo de permanência por setor" },
          { icon: Layers, text: "Drag & drop para reorganização" },
          { icon: Target, text: "Categorização por perfil clínico" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm flex-1">
            <item.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium">{item.text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── SLIDE 5: FLUXO DE INTERNAÇÃO E PSM ──────────────────────────────────────
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
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Solicitação & Status PSM</h2>
        <p className="text-xl text-gray-500 mt-3">Rastreabilidade completa do fluxo de internação — da solicitação ao leito.</p>
      </motion.div>

      <div className="flex-1 flex flex-col justify-center gap-10 mt-6">
        {/* PSM cycle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="font-bold text-lg text-gray-800 mb-6">Ciclo de Status PSM</h3>
          <div className="flex items-center justify-between gap-4">
            {psmSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: step.bg }}>
                    <step.icon className="h-10 w-10" style={{ color: step.color }} />
                  </div>
                  <p className="font-semibold text-sm text-gray-800 text-center">{step.label}</p>
                </div>
                {i < psmSteps.length - 1 && <ArrowRight className="h-6 w-6 text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-6 text-center">
            O texto da pendência se transforma automaticamente: <em>"Solicitada Internação em UTI"</em> → <strong>"IR PARA LEITO DE UTI"</strong>
          </p>
        </motion.div>

        {/* Features row */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: ClipboardList, title: "Solicitação Padronizada", desc: "Template institucional completo com HDA, exames e plano terapêutico" },
            { icon: History, title: "Histórico de Solicitações", desc: "Registro auditável de todas as solicitações por período e paciente" },
            { icon: Handshake, title: "Fluxo Porta ↔ Líder", desc: "Solicitação de leito com aprovação, discussão e notificação em tempo real" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-md">
              <item.icon className="h-8 w-8 mb-3" style={{ color: HAPVIDA_BLUE }} />
              <h4 className="font-bold text-gray-800">{item.title}</h4>
              <p className="text-sm text-gray-500 mt-2">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 6: DOCUMENTOS INSTITUCIONAIS ──────────────────────────────────────
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
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col"
          >
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

// ─── SLIDE 7: RESPONSABILIDADE MÉDICA ────────────────────────────────────────
function SlideMedicalTeam({ isActive }: SlideProps) {
  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #fafbff 0%, #eff6ff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Governança Clínica</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Responsabilidade Médica</h2>
        <p className="text-xl text-gray-500 mt-3">Modelo estruturado de acompanhamento que garante que nenhum paciente fique desassistido.</p>
      </motion.div>

      <div className="flex-1 flex items-center gap-8 mt-8">
        {/* Left: Medical roles */}
        <div className="flex-1 space-y-5">
          {[
            { icon: Shield, title: "Médico Líder", desc: "Coordena o cuidado, supervisiona condutas e define plano terapêutico para todos os pacientes do setor.", color: "#013ba6" },
            { icon: Stethoscope, title: "Médico da Porta", desc: "Responsável pela admissão, primeiro atendimento e solicitações iniciais de internação.", color: "#0ea5e9" },
            { icon: Users, title: "Seguimento Conjunto", desc: "Especialidades simultâneas — cirurgia, traumatologia, psiquiatria — registradas e rastreadas no card.", color: "#8b5cf6" },
          ].map((role, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -40 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4 + i * 0.2, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-md flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${role.color}15` }}>
                <role.icon className="h-7 w-7" style={{ color: role.color }} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{role.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{role.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right: Benefits */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={isActive ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1, duration: 0.6 }}
          className="flex-1 rounded-3xl p-10 text-white" style={{ background: `linear-gradient(135deg, ${HAPVIDA_BLUE}, ${HAPVIDA_LIGHT})` }}>
          <h3 className="text-2xl font-bold mb-6">Impacto Direto</h3>
          <div className="space-y-5">
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

// ─── SLIDE 8: ANALYTICS E IA ─────────────────────────────────────────────────
function SlideAnalytics({ isActive }: SlideProps) {
  const features = [
    { icon: BarChart3, title: "Dashboard Analítico", desc: "KPIs em tempo real: internações, altas, óbitos, transferências e tempo de permanência por setor." },
    { icon: BrainCircuit, title: "IA Integrada", desc: "Clinikus AI para suporte à decisão clínica e Examinus AI para análise de exames laboratoriais." },
    { icon: TrendingUp, title: "Relatório Clínico", desc: "Análise de recorrência, gravidade clínica e diagnósticos sindrômicos para decisão estratégica." },
    { icon: Timer, title: "DHD & Permanência", desc: "Dose/Habitante/Dia com controle de medicações e acompanhamento de tempo em observação." },
  ];

  return (
    <div className="h-full w-full flex flex-col p-16" style={{ background: "linear-gradient(180deg, #fafafa 0%, #f5f3ff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: HAPVIDA_BLUE }}>Inteligência de Dados</p>
        <h2 className="text-5xl font-bold text-gray-900 mt-2">Analytics & IA</h2>
        <p className="text-xl text-gray-500 mt-3">Dados que se transformam em decisões clínicas e estratégicas para a rede.</p>
      </motion.div>

      <div className="flex-1 grid grid-cols-2 gap-6 mt-10">
        {features.map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isActive ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
          >
            <feat.icon className="h-10 w-10 mb-4" style={{ color: HAPVIDA_BLUE }} />
            <h3 className="font-bold text-xl text-gray-900">{feat.title}</h3>
            <p className="text-gray-500 mt-3 leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 1.2 }}
        className="grid grid-cols-4 gap-4 mt-6">
        {[
          { label: "Protocolos Terapêuticos", value: "13" },
          { label: "Categorias de Documento", value: "12+" },
          { label: "Tipos de Movimento", value: "8" },
          { label: "Roles de Acesso", value: "9" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-3xl font-bold" style={{ color: HAPVIDA_BLUE }}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── SLIDE 9: RASTREABILIDADE ────────────────────────────────────────────────
function SlideTraceability({ isActive }: SlideProps) {
  const trails = [
    { icon: History, title: "Versionamento", desc: "Snapshots completos do mapa de pacientes com restauração a qualquer ponto.", color: "#6366f1" },
    { icon: Handshake, title: "Passagem de Plantão", desc: "Registro formal com snapshot do censo, tipo de turno e notas de transição.", color: "#0ea5e9" },
    { icon: FileCheck, title: "Histórico de Condutas", desc: "Log detalhado de cada alteração por campo, com identificação do profissional.", color: "#10b981" },
    { icon: Shield, title: "Logs de Auditoria", desc: "Registro de todas as ações no sistema em conformidade com CFM e LGPD.", color: "#f59e0b" },
    { icon: Network, title: "Movimentações", desc: "Registro de altas, transferências, óbitos e internações com snapshot do paciente.", color: "#8b5cf6" },
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
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
          >
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
          Em conformidade com <strong>Lei 13.709/2018 (LGPD)</strong> e <strong>CFM 1.821/2007</strong> — criptografia, controle de acesso por perfil e retenção auditada de dados.
        </p>
      </motion.div>
    </div>
  );
}

// ─── SLIDE 10: ENCERRAMENTO ──────────────────────────────────────────────────
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
      style={{ background: `linear-gradient(135deg, ${HAPVIDA_BLUE} 0%, #01297a 50%, #010d2e 100%)` }}>
      <div className="absolute inset-0 opacity-5">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 200 + 30}px`,
              height: `${Math.random() * 200 + 30}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4,
            }} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isActive ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-4xl space-y-10"
      >
        <img src={whitelabel.logos.platform} alt="HapMap" className="h-20 mx-auto drop-shadow-2xl" />
        <h2 className="text-5xl font-bold text-white">
          Vigilância que salva vidas.
        </h2>
        <p className="text-xl text-white/70 leading-relaxed">
          O HapMap preenche o gap entre o atendimento ambulatorial e a internação,<br />
          garantindo que cada paciente em observação seja monitorado de ponta a ponta.
        </p>

        <div className="grid grid-cols-3 gap-4 mt-8">
          {impacts.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isActive ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
              className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-3 border border-white/10"
            >
              <item.icon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <span className="text-white/90 text-sm text-left">{item.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : {}}
          transition={{ delay: 1.5 }}
          className="pt-8 space-y-3"
        >
          <p className="text-white/50 text-sm">{whitelabel.platform.slogan}</p>
          <img src={whitelabel.logos.networkFull} alt="Hapvida" className="h-12 mx-auto bg-white/95 rounded-lg px-4 py-2" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── MAIN PRESENTATION COMPONENT ─────────────────────────────────────────────

const slides = [
  SlideCover,
  SlideGap,
  SlideBridge,
  SlidePatientMap,
  SlideInternmentPSM,
  SlideDocuments,
  SlideMedicalTeam,
  SlideAnalytics,
  SlideTraceability,
  SlideClosing,
];

export default function PresentationPage() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goNext = useCallback(() => setCurrent(c => Math.min(c + 1, slides.length - 1)), []);
  const goPrev = useCallback(() => setCurrent(c => Math.max(c - 1, 0)), []);

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

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
  };

  const CurrentSlide = slides[current];

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden select-none">
      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
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

        {/* Navigation arrows */}
        {current > 0 && (
          <button onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 transition-all z-20 backdrop-blur">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {current < slides.length - 1 && (
          <button onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 transition-all z-20 backdrop-blur">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="h-12 bg-gray-950 flex items-center justify-between px-6 border-t border-white/10">
        <span className="text-white/50 text-sm">{whitelabel.platform.fullName} — Proposta de Valor</span>

        {/* Slide dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`} />
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm">{current + 1} / {slides.length}</span>
          <button onClick={toggleFullscreen} className="text-white/50 hover:text-white transition-colors">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
