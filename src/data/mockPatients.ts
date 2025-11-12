import { Patient } from "@/types/patient";

export const mockPatients: Patient[] = [
  // Sala Vermelha - Cuidados Especiais
  {
    id: "1",
    bedNumber: "V01",
    name: "Maria Silva Santos",
    age: 68,
    sector: "red",
    diagnoses: ["IAM", "Insuficiência Cardíaca"],
    medicalHistory: ["HAS", "DM tipo 2", "Dislipidemia"],
    relevantExams: ["Troponina elevada", "ECG com supradesnivelamento ST"],
    pendencies: ["Aguardar vaga UTI", "Trocar SNE"],
    schedule: ["Ecocardiograma 14h", "Reavaliação cardiologia"],
    admissionHistory: "Paciente deu entrada na emergência com dor torácica intensa há 2h, de início súbito, tipo aperto, irradiando para MSE. Nega dispneia. Apresenta sudorese fria. ECG com supradesnivelamento de ST em DII, DIII e aVF. Iniciado protocolo de IAM com AAS, clopidogrel e heparina. Paciente hemodinamicamente estável no momento.",
    admissionDate: "2025-11-12 08:30"
  },
  {
    id: "2",
    bedNumber: "V02",
    name: "João Oliveira Costa",
    age: 45,
    sector: "red",
    diagnoses: ["TCE grave", "Fratura de crânio"],
    medicalHistory: ["Etilismo crônico"],
    relevantExams: ["TC crânio: hematoma subdural", "Glasgow 10"],
    pendencies: ["TC controle 12h", "Avaliação neurocirurgia"],
    schedule: ["TC crânio controle 20h"],
    admissionHistory: "Paciente vítima de queda de altura (aproximadamente 3m). Encontrado no chão por vizinhos. SAMU acionado. Na chegada Glasgow 10, pupilas isocóricas e fotorreagentes. Ferimento corto-contuso em região temporal direita. Realizado TC de crânio evidenciando hematoma subdural à direita com desvio de linha média. Conduta expectante por neurocirurgia.",
    admissionDate: "2025-11-12 10:15"
  },
  {
    id: "3",
    bedNumber: "V03",
    name: "Ana Paula Ferreira",
    age: 72,
    sector: "red",
    diagnoses: ["Sepse", "Pneumonia grave"],
    medicalHistory: ["DPOC", "HAS"],
    relevantExams: ["Lactato 4.2", "RX tórax: consolidação bibasal"],
    pendencies: ["Hemocultura", "Cultura escarro"],
    schedule: ["Antibioticoterapia EV 6/6h", "Gasometria controle"],
    admissionHistory: "Paciente com quadro de febre há 3 dias (38.5°C), tosse produtiva, dispneia progressiva. Trazida por familiares. Apresenta-se taquidispneica, FR 28ipm, SpO2 88% em ar ambiente. Ausculta pulmonar com crepitações difusas. Iniciado oxigenioterapia, antibioticoterapia empírica e ressuscitação volêmica.",
    admissionDate: "2025-11-11 22:45"
  },

  // Observação Amarela
  {
    id: "4",
    bedNumber: "A01",
    name: "Carlos Eduardo Mendes",
    age: 55,
    sector: "yellow",
    diagnoses: ["Cólica renal", "Nefrolitíase"],
    medicalHistory: ["Litíase renal prévia"],
    relevantExams: ["USG: cálculo 8mm em ureter distal"],
    pendencies: ["Aguardar resposta urologia", "Controle da dor"],
    schedule: ["Reavaliação 6h"],
    admissionHistory: "Paciente com dor em flanco direito de forte intensidade, iniciada há 6h, em cólica, irradiando para região inguinal. Associado a náuseas e hematúria. Realizado analgesia com dipirona e tramadol com melhora parcial. USG evidenciou cálculo em ureter distal.",
    admissionDate: "2025-11-12 06:20"
  },
  {
    id: "5",
    bedNumber: "A02",
    name: "Beatriz Souza Lima",
    age: 32,
    sector: "yellow",
    diagnoses: ["Gastroenterite aguda"],
    medicalHistory: ["Saudável"],
    relevantExams: ["Função renal normal", "Eletrólitos normais"],
    pendencies: ["Hidratação venosa", "Controle de sintomas"],
    schedule: ["Reavaliação após 2L SF 0.9%"],
    admissionHistory: "Paciente relata quadro de diarreia líquida há 24h (>10 episódios), vômitos (5 episódios), dor abdominal difusa tipo cólica. Nega febre. Refere ter ingerido alimentos em restaurante há 2 dias. Exame físico com desidratação leve. Iniciado reposição hidroeletrolítica e sintomáticos.",
    admissionDate: "2025-11-12 11:00"
  },
  {
    id: "6",
    bedNumber: "A03",
    name: "Ricardo Santos Alves",
    age: 41,
    sector: "yellow",
    diagnoses: ["Crise hipertensiva"],
    medicalHistory: ["HAS mal controlada"],
    relevantExams: ["PA 200x120mmHg", "ECG sem alterações agudas"],
    pendencies: ["Controle pressórico", "Ajuste medicação"],
    schedule: ["Aferir PA 1/1h"],
    admissionHistory: "Paciente hipertenso com PA habitualmente controlada, apresentou cefaleia frontal intensa e epistaxe há 2h. Refere não ter tomado medicação anti-hipertensiva há 3 dias. PA de chegada 200x120mmHg. Iniciado captopril SL e clonidina. Sem sinais de lesão de órgão alvo.",
    admissionDate: "2025-11-12 13:40"
  },

  // Observação Azul
  {
    id: "7",
    bedNumber: "Z01",
    name: "Fernanda Costa Ribeiro",
    age: 28,
    sector: "blue",
    diagnoses: ["Dor abdominal em investigação"],
    medicalHistory: ["Saudável"],
    relevantExams: ["Hemograma normal", "USG abdome: sem alterações"],
    pendencies: ["Aguardar exames complementares"],
    schedule: ["Alta após resultado exames"],
    admissionHistory: "Paciente com dor em hipocôndrio direito há 12h, de moderada intensidade, constante. Nega febre, náuseas ou vômitos. Apetite preservado. Exame físico sem sinais de irritação peritoneal. Murphy negativo. Coletado exames laboratoriais e realizado USG de abdome sem alterações significativas.",
    admissionDate: "2025-11-12 14:20"
  },
  {
    id: "8",
    bedNumber: "Z02",
    name: "Paulo Henrique Dias",
    age: 19,
    sector: "blue",
    diagnoses: ["Entorse de tornozelo"],
    medicalHistory: ["Atleta - futebol"],
    relevantExams: ["RX tornozelo: sem fraturas"],
    pendencies: ["Imobilização", "Orientação ortopedia"],
    schedule: ["Retorno ortopedia 7 dias"],
    admissionHistory: "Paciente deu entrada após trauma em tornozelo esquerdo durante jogo de futebol. Refere dor e edema local. Dificuldade para deambular. Ao exame: edema e equimose em região lateral de tornozelo esquerdo, dor à palpação, sem deformidade aparente. RX sem sinais de fratura. Realizado imobilização com tala gessada.",
    admissionDate: "2025-11-12 15:50"
  },
  {
    id: "9",
    bedNumber: "Z03",
    name: "Mariana Almeida Pires",
    age: 35,
    sector: "blue",
    diagnoses: ["Cefaleia tensional"],
    medicalHistory: ["Enxaqueca"],
    relevantExams: ["Sem alterações"],
    pendencies: ["Controle da dor", "Orientação neuro"],
    schedule: ["Alta após melhora sintomática"],
    admissionHistory: "Paciente com cefaleia holocraniana em peso há 8h, de intensidade moderada. Refere estresse no trabalho. Nega febre, náuseas ou alterações visuais. Exame neurológico sem déficits. Sinais vitais estáveis. Realizado analgesia com dipirona e metoclopramida com boa resposta.",
    admissionDate: "2025-11-12 16:30"
  }
];
