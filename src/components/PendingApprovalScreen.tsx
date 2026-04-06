import { useEffect, useState } from "react";
import { whitelabel } from "@/config/whitelabel";
import { motion } from "framer-motion";
import { Shield, Clock, UserCheck, LogOut, Ban, UserPlus, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface PendingApprovalScreenProps {
  status?: "pending" | "suspended" | "rejected";
  isLegacyUser?: boolean;
}

export function PendingApprovalScreen({ status = "pending", isLegacyUser = false }: PendingApprovalScreenProps) {
  const { signOut, user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuário';

  const isBlocked = status === "suspended" || status === "rejected";
  const showLegacyMigrationMessage = isBlocked && isLegacyUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg w-full"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-1 mb-3">
              <span className="text-4xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Hap
              </span>
              <span className="text-4xl font-light text-white">Map</span>
              <span className="text-xs font-medium text-cyan-400 bg-cyan-400/20 px-2 py-0.5 rounded-full ml-2">
                2.0
              </span>
            </div>
            <p className="text-sm text-blue-200/80 italic">
              Tecnologia que valoriza seu tempo.<br />
              Inteligência que salva vidas.
            </p>
          </motion.div>

          {/* Status icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center border-2 ${
                isBlocked
                  ? "bg-gradient-to-br from-red-400/20 to-red-600/20 border-red-400/50"
                  : "bg-gradient-to-br from-amber-400/20 to-orange-500/20 border-amber-400/50"
              }`}>
                {isBlocked ? (
                  <Ban className="h-12 w-12 text-red-400" />
                ) : (
                  <Clock className="h-12 w-12 text-amber-400" />
                )}
              </div>
              <motion.div
                className={`absolute inset-0 rounded-full border-2 ${
                  isBlocked ? "border-red-400/30" : "border-amber-400/30"
                }`}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Welcome / blocked message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-2">
              {isBlocked ? (
                <>Acesso Bloqueado</>
              ) : (
                <>Olá, <span className="text-cyan-400">{username}</span>!</>
              )}
            </h2>
            <p className="text-white/70 text-sm">
              {isBlocked
                ? "Este usuário foi desativado pelo administrador"
                : "Seu cadastro foi recebido com sucesso"}
            </p>
          </motion.div>

          {/* Info box - different content based on status */}
          {isBlocked ? (
            <>
              {/* Legacy user migration message */}
              {showLegacyMigrationMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-red-300 font-semibold mb-1">
                        Usuário Generalista Desativado
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        Em conformidade com a <strong className="text-white">LGPD (Lei 13.709/2018)</strong> e a{" "}
                        <strong className="text-white">Resolução CFM 1.821/2007</strong>, os logins compartilhados 
                        (generalistas) foram <strong className="text-white">desativados permanentemente</strong> para 
                        garantir a <strong className="text-white">rastreabilidade individual</strong> de todas as ações 
                        realizadas no sistema.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Data protection explanation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mb-4"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-blue-300 font-semibold mb-1">
                      Por que essa mudança?
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Logins compartilhados impedem a identificação de quem acessou ou alterou dados de pacientes. 
                      O cadastro individual garante:
                    </p>
                    <ul className="mt-2 space-y-1 text-white/60 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span><strong className="text-white/80">Auditoria completa</strong> — cada ação fica vinculada ao profissional</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span><strong className="text-white/80">Segurança jurídica</strong> — conformidade com LGPD e CFM</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span><strong className="text-white/80">Proteção de dados</strong> — acesso restrito e personalizado</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* How to register */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 mb-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-emerald-300 font-semibold mb-1">
                      Como obter seu acesso individual
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed mb-3">
                      Siga os passos abaixo para criar sua conta pessoal:
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3 text-white/70 text-sm">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">1</div>
                        <span>Clique em <strong className="text-white">"Sair"</strong> abaixo e volte à tela de login</span>
                      </div>
                      <div className="flex items-start gap-3 text-white/70 text-sm">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">2</div>
                        <span>Clique em <strong className="text-white">"Criar Conta Individual"</strong></span>
                      </div>
                      <div className="flex items-start gap-3 text-white/70 text-sm">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">3</div>
                        <span>Preencha seus dados profissionais (nome, CRM/COREN/CREFITO, especialidade)</span>
                      </div>
                      <div className="flex items-start gap-3 text-white/70 text-sm">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">4</div>
                        <span>Crie um <strong className="text-white">login e senha pessoais</strong> (mín. 6 caracteres alfanuméricos)</span>
                      </div>
                      <div className="flex items-start gap-3 text-white/70 text-sm">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">5</div>
                        <span>Aguarde a <strong className="text-white">aprovação do Gestor/Coordenador</strong> — você receberá acesso em breve</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              {/* Pending approval - original content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-amber-300 font-semibold mb-1">
                      Aguardando Aprovação
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Seu acesso ao sistema está sendo analisado pelo <strong className="text-white">Coordenador/Administrador</strong>. 
                      Assim que for aprovado, você terá acesso completo aos dados e funcionalidades.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Instructions for pending */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-3 mb-8"
              >
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">1</div>
                  <span>Aguarde o contato do administrador</span>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">2</div>
                  <span>Após aprovação, faça login novamente</span>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">3</div>
                  <span>Acesse todas as funcionalidades do sistema</span>
                </div>
              </motion.div>
            </>
          )}

          {/* Logout button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={signOut}
              variant="outline"
              className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isBlocked ? "Sair e Criar Conta Individual" : "Sair e Tentar Novamente"}
            </Button>
          </motion.div>

          {/* Security badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-2 mt-6 text-white/40 text-xs"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Conforme Lei 13.709/2018 (LGPD) e Resolução CFM 1.821/2007</span>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center mt-6"
        >
          <p className="text-white/30 text-xs">
            {whitelabel.credits.developerLabel} <span className="text-cyan-400/60 font-medium">{whitelabel.credits.developerName}</span>
          </p>
          <p className="text-white/20 text-[10px] mt-1">
            {currentTime.toLocaleDateString('pt-BR')} • {currentTime.toLocaleTimeString('pt-BR')}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
