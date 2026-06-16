import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { saveReportToFirestore, getReportsFromFirestore, updateReportStatusInFirestore, deleteReportFromFirestore } from "./services/firebaseService";

// Ensure reports directory exists
const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const WHATSAPP_CONFIG_FILE = path.join(DATA_DIR, "whatsapp_config.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_WHATSAPP_CONFIG = {
  enabled: true,
  phone: "+258869894030",
  apikey: "",
  telegramEnabled: false,
  telegramBotToken: "",
  telegramChatId: "",
  sheetsEnabled: true,
  sheetsUrl: "https://script.google.com/macros/s/AKfycbyTU4WSJDkZuw61z1aKTTgVs0Y7gIwjK5puNgldil7euSN76e-4wVsIjZvJ_8zg8S1w/exec",
  airtableEnabled: false,
  airtableApiKey: "",
  airtableBaseId: "",
  airtableTableName: "Denuncias"
};

function readWhatsAppConfig() {
  try {
    if (!fs.existsSync(WHATSAPP_CONFIG_FILE)) {
      fs.writeFileSync(WHATSAPP_CONFIG_FILE, JSON.stringify(DEFAULT_WHATSAPP_CONFIG, null, 2), "utf8");
      return DEFAULT_WHATSAPP_CONFIG;
    }
    const data = fs.readFileSync(WHATSAPP_CONFIG_FILE, "utf8");
    const parsed = JSON.parse(data);
    // Fill in default properties for backwards compatibility
    // Force Google Sheets integration to be active and utilize the internal URL as requested
    return {
      enabled: parsed.enabled !== undefined ? parsed.enabled : DEFAULT_WHATSAPP_CONFIG.enabled,
      phone: parsed.phone || DEFAULT_WHATSAPP_CONFIG.phone,
      apikey: parsed.apikey || "",
      telegramEnabled: parsed.telegramEnabled !== undefined ? parsed.telegramEnabled : DEFAULT_WHATSAPP_CONFIG.telegramEnabled,
      telegramBotToken: parsed.telegramBotToken || "",
      telegramChatId: parsed.telegramChatId || "",
      sheetsEnabled: true,
      sheetsUrl: DEFAULT_WHATSAPP_CONFIG.sheetsUrl,
      airtableEnabled: parsed.airtableEnabled !== undefined ? parsed.airtableEnabled : DEFAULT_WHATSAPP_CONFIG.airtableEnabled,
      airtableApiKey: parsed.airtableApiKey || "",
      airtableBaseId: parsed.airtableBaseId || "",
      airtableTableName: parsed.airtableTableName || DEFAULT_WHATSAPP_CONFIG.airtableTableName
    };
  } catch (error) {
    console.error("Erro ao ler ficheiro de config do WhatsApp:", error);
    return DEFAULT_WHATSAPP_CONFIG;
  }
}

function writeWhatsAppConfig(config: any) {
  try {
    fs.writeFileSync(WHATSAPP_CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch (error) {
    console.error("Erro ao gravar ficheiro de config do WhatsApp:", error);
  }
}

function sendTelegramNotification(report: any, config: any) {
  try {
    const { telegramEnabled, telegramBotToken, telegramChatId } = config;
    if (!telegramEnabled || !telegramBotToken || !telegramChatId) {
      return;
    }

    const ts = new Date(report.created_at).toLocaleString("pt-MZ", { timeZone: "Africa/Maputo" });
    const textMsg = `🚨 *Nova Denúncia Registada (Apoio MZ)* 🚨

*Cód. Utente:* ${report.user_code}
*Tipo:* ${report.tipo}
*Local:* ${report.local}
*Quando:* ${report.quando}
*Testemunhas:* ${report.testemunhas}

*Descrição:*
${report.descricao}

*Data (Maputo):* ${ts}
_Mensagem confidencial enviada automaticamente pelo sistema._`;

    const targetUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const bodyArgs = {
      chat_id: telegramChatId,
      text: textMsg,
      parse_mode: "Markdown"
    };

    console.log(`[Telegram API] A enviar notificação para o chat ${telegramChatId}...`);

    fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyArgs)
    })
      .then(async (res) => {
        const textRes = await res.text();
        if (res.ok) {
          console.log(`[Telegram API] Notificação enviada com sucesso ao Telegram.`);
        } else {
          console.error(`[Telegram API] Falha no Telegram. HTTP ${res.status}: ${textRes}`);
        }
      })
      .catch((err) => {
        console.error("[Telegram API] Erro ao conectar com a API do Telegram:", err);
      });
  } catch (err) {
    console.error("[Telegram API] Erro de processamento interno:", err);
  }
}

function sendGoogleSheetsNotification(report: any, config: any) {
  try {
    const { sheetsEnabled, sheetsUrl } = config;
    if (!sheetsEnabled || !sheetsUrl) {
      return;
    }

    console.log(`[Google Sheets API] A enviar denúncia para a folha de cálculo no Google Sheets...`);
    
    fetch(sheetsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report)
    })
      .then(async (res) => {
        const textRes = await res.text();
        if (res.ok) {
          console.log(`[Google Sheets API] Denúncia guardada no Google Sheets com sucesso.`);
        } else {
          console.error(`[Google Sheets API] Falha no Google Sheets. HTTP ${res.status}: ${textRes}`);
        }
      })
      .catch((err) => {
        console.error("[Google Sheets API] Erro ao conectar ao Webhook do Google Sheets:", err);
      });
  } catch (err) {
    console.error("[Google Sheets API] Erro de processamento interno:", err);
  }
}

function sendAirtableNotification(report: any, config: any) {
  try {
    const { airtableEnabled, airtableApiKey, airtableBaseId, airtableTableName } = config;
    if (!airtableEnabled || !airtableApiKey || !airtableBaseId) {
      return;
    }

    const tableName = airtableTableName || "Denuncias";
    const targetUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(tableName)}`;
    
    console.log(`[Airtable API] A enviar denúncia para a tabela "${tableName}" no Airtable...`);

    const fields = {
      "ID de Denúncia": report.id || "",
      "Código do Utente": report.user_code || "",
      "Tipo de Incidente": report.tipo || "",
      "Localização": report.local || "",
      "Quando Ocorreu": report.quando || "",
      "Testemunhas": report.testemunhas || "",
      "Descrição Detalhada": report.descricao || "",
      "Data de Registo": report.created_at ? new Date(report.created_at).toLocaleString("pt-MZ", { timeZone: "Africa/Maputo" }) : "",
      "Status Atual": report.status || "Recebido"
    };

    const bodyArgs = {
      records: [
        {
          fields: fields
        }
      ]
    };

    fetch(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${airtableApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyArgs)
    })
      .then(async (res) => {
        const textRes = await res.text();
        if (res.ok) {
          console.log(`[Airtable API] Denúncia guardada no Airtable com sucesso.`);
        } else {
          console.error(`[Airtable API] Falha no Airtable. HTTP ${res.status}: ${textRes}`);
        }
      })
      .catch((err) => {
        console.error("[Airtable API] Erro ao conectar à API do Airtable:", err);
      });
  } catch (err) {
    console.error("[Airtable API] Erro de processamento interno:", err);
  }
}

function sendWhatsAppNotification(report: any) {
  try {
    const config = readWhatsAppConfig();
    
    // First, try Telegram if enabled
    if (config.telegramEnabled) {
      sendTelegramNotification(report, config);
    }

    // Try Google Sheets if enabled
    if (config.sheetsEnabled) {
      sendGoogleSheetsNotification(report, config);
    }

    // Try Airtable if enabled
    if (config.airtableEnabled) {
      sendAirtableNotification(report, config);
    }

    if (!config.enabled || !config.phone) {
      return;
    }

    const { apikey, phone } = config;
    if (!apikey) {
      console.warn(`[WhatsApp API] Notificação pendente. CallMeBot API Key ausente na configuração do número ${phone}. Configure-a via painel administrativo.`);
      return;
    }

    // Format a highly clear notification message
    const ts = new Date(report.created_at).toLocaleString("pt-MZ", { timeZone: "Africa/Maputo" });
    const textMsg = `🚨 *Nova Denúncia Registada (Apoio MZ)* 🚨

*Cód. Utente:* ${report.user_code}
*Tipo:* ${report.tipo}
*Local:* ${report.local}
*Quando:* ${report.quando}
*Testemunhas:* ${report.testemunhas}

*Descrição:*
${report.descricao}

*Data (Maputo):* ${ts}
_Mensagem confidencial enviada automaticamente pelo sistema._`;

    const cleanPhone = phone.trim().replace(/[^0-9]/g, "");
    // CallMeBot Webhook PHP api URL
    const targetUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(textMsg)}&apikey=${encodeURIComponent(apikey)}`;

    console.log(`[WhatsApp API] A tentar despachar notificação para o número ${phone}...`);
    
    // Call as fire-and-forget in the background using global fetch
    fetch(targetUrl)
      .then(async (response) => {
        const textRes = await response.text();
        if (response.ok) {
          console.log(`[WhatsApp API] Notificação despachada com sucesso: ${textRes}`);
        } else {
          console.error(`[WhatsApp API] Falha ao despachar via CallMeBot. Erro HTTP ${response.status}: ${textRes}`);
        }
      })
      .catch((err) => {
        console.error("[WhatsApp API] Erro ao contactar o servidor do CallMeBot:", err);
      });
  } catch (err) {
    console.error("[WhatsApp API] Erro excecional ao estruturar mensagem:", err);
  }
}

// Default mock reports so the admin dashboard isn't completely empty upon launch
const DEFAULT_REPORTS = [
  {
    id: "report-1716301201000",
    tipo: "Violência doméstica",
    local: "Bairro de Albasine, Maputo",
    quando: "Anteontem à noite",
    testemunhas: "Vizinhos do quarteirão",
    descricao: "Relato de agressões físicas verbais recorrentes vindas da casa ao lado. Gritos de pedido de socorro ouvidos frequentemente pela vizinhança na Av. das Mahotas.",
    status: "Em Investigação",
    user_code: "U-K8L2M4N6",
    created_at: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: "report-1716301202000",
    tipo: "Trabalho infantil",
    local: "Zona do Mercado grossista, Matola",
    quando: "Dias de semana, horário escolar",
    testemunhas: "Transeuntes do mercado",
    descricao: "Duas crianças com menos de 12 anos estão constantemente a carregar fardos pesados e a vender produtos em horário em que deviam estar na escola primária local.",
    status: "Recebido",
    user_code: "U-B3D5F7H9",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: "report-1716301203000",
    tipo: "Abuso contra idosos",
    local: "Distrito de Manhiça",
    quando: "Semanas recentes",
    testemunhas: "Familiares afastados",
    descricao: "Idoso abandonado e privado de alimentação adequada por partes de cuidadores diretos, além de usurpação de reforma mensal.",
    status: "Resolvido",
    user_code: "U-P1R3S5T7",
    created_at: new Date(Date.now() - 72 * 3600000).toISOString()
  }
];

function readReports() {
  try {
    if (!fs.existsSync(REPORTS_FILE)) {
      fs.writeFileSync(REPORTS_FILE, JSON.stringify(DEFAULT_REPORTS, null, 2), "utf8");
      return DEFAULT_REPORTS;
    }
    const data = fs.readFileSync(REPORTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler ficheiro de denúncias:", error);
    return [];
  }
}

function writeReports(reports: any[]) {
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf8");
  } catch (error) {
    console.error("Erro ao gravar ficheiro de denúncias:", error);
  }
}

async function fetchReportsList(): Promise<any[]> {
  try {
    const firestoreReports = await getReportsFromFirestore();
    if (firestoreReports !== null) {
      return firestoreReports;
    }
  } catch (err) {
    console.error("[Reports Sync] Erro ao obter dados do Firestore:", err);
  }
  return readReports(); // fallback
}

// Lazy initializer for Google Gen AI
function getFallbackResponse(message: string): string {
  const textLower = (message || "").toLowerCase();
  
  if (textLower.includes("perigo") || textLower.includes("emergencia") || textLower.includes("morrer") || textLower.includes("me ajude") || textLower.includes("socorro") || textLower.includes("policia") || textLower.includes("ameaca")) {
    return "🚨 *ATENÇÃO - PERIGO IMEDIATO* 🚨\n\nSe a sua segurança ou integridade física está em risco agora, por favor liga imediatamente para a **Linha Geral da Polícia de Moçambique: 112** ou dirige-te à esquadra mais próxima com a máxima urgência!\n\nPodes também ligar para a **Linha de Apoio à Criança e Violência Baseada no Género (LAC): +258 82 333 4440 ou 116** para apoio especializado.\n\nSe preferires relatar a situação de forma segura e anónima para acompanhamento, podes usar o nosso formulário no menu superior clicando em '🚨 Denunciar'. Estamos contigo.";
  }
  
  if (textLower.includes("violencia") || textLower.includes("bater") || textLower.includes("espos") || textLower.includes("marido") || textLower.includes("agred") || textLower.includes("abuso") || textLower.includes("bale") || textLower.includes("sofrer") || textLower.includes("pan") || textLower.includes("murro")) {
    return "Sinto muito que estejas a vivenciar ou a testemunhar esta situação. Sabe que a violência doméstica e abusos de direitos são crimes puníveis por lei em Moçambique. Não tens de carregar este peso sozinho/a.\n\nRecomendamos fortemente:\n1. **Fazer uma Denúncia Anónima:** Clica em '🚨 Denunciar' no menu superior. É 100% confidencial, não guarda o teu nome ou IP, e permite que a nossa equipa analise o teu caso com segurança.\n2. **Contactar Linhas de Apoio:** Telefona para a LAC (+258 82 333 4440 ou Linha 116) que presta acolhimento e aconselhamento jurídico gratuito para Moçambique.\n\nQueres conversar sobre como podes te proteger ou como funciona o processo de apoio?";
  }
  
  if (textLower.includes("denuncia") || textLower.includes("anoni") || textLower.includes("como funciona") || textLower.includes("funciona a denuncia")) {
    return "🔒 **Como Funciona a Denúncia Anónima no Apoio MZ:**\n\nAs denúncias feitas aqui são tratadas com o mais alto nível de sigilo e privacidade:\n- **Sem Registo de Identidade:** Não precisas de fornecer o teu nome, e-mail, telefone ou qualquer dado pessoal.\n- **Segurança de Conexão:** Não gravamos o teu endereço IP e as mensagens são transmitidas com encriptação segura.\n- **Código do Utente:** Ao submeteres a denúncia, recebes um código anónimo exclusivo. Guarda este código de forma segura para poderes consultar atualizações sobre o estado da tua denúncia ou trocar mensagens confidenciais com os administradores no menu 'Consultar Denúncia'.\n\nQueres iniciar uma denúncia agora? Podes clicar no botão '🚨 Fazer Denúncia Anónima' no topo da página.";
  }
  
  if (textLower.includes("receita") || textLower.includes("arroz") || textLower.includes("cozinhar") || textLower.includes("comida") || textLower.includes("comer") || textLower.includes("culinaria")) {
    return "Fico feliz em ajudar com dicas de culinária! Para preparar um delicioso arroz solto ao estilo tradicional moçambicano:\n\n1. Lave bem o arroz (cerca de 1 chávena) em água fria para retirar o excesso de amido.\n2. Numa panela, aqueça um fio de óleo e refogue cebola picadinha e um dente de alho esmagado até dourarem.\n3. Adicione o arroz lavado e mexa bem por cerca de 1 minuto para fritar levemente os grãos.\n4. Adicione 2 chávenas de água a ferver e sal a gosto.\n5. Deixe cozer em lume brando-médio com a panela semitapada até que o nível da água desça abaixo do arroz.\n6. Tape completamente a panela, reduza o lume para o mínimo e aguarde mais 5 a 8 minutos. Sirva soltinho e aromático!\n\nSe precisares de outras receitas ou se tiveres outras perguntas, estou aqui para ti!";
  }
  
  if (textLower.includes("como") || textLower.includes("quem") || textLower.includes("onde") || textLower.includes("quais") || textLower.includes("o que") || textLower.includes("programar") || textLower.includes("typescript") || textLower.includes("computador") || textLower.includes("tecnologia") || textLower.includes("site") || textLower.includes("javascript")) {
    return "Como seu Assistente Comunitário Inteligente, posso ajudar a responder a dúvidas de todos os âmbitos, incluindo tecnologia e conhecimento geral! \n\nO TypeScript, por exemplo, é uma linguagem de programação incrível de código aberto desenvolvida pela Microsoft. É uma extensão superpoderosa do JavaScript que adiciona tipagem estática opcional, ajudando programadores a detetar erros muito mais cedo no processo de escrita de código, antes mesmo do programa rodar!\n\nGostaria de saber mais sobre algum conceito de programação, como aprender a criar websites ou outra dúvida tecnológica? Pergunte-me qualquer detalhe e terei todo o gosto em explicar!";
  }

  return "Olá! Sou o Assistente Comunitário Inteligente da Plataforma de Apoio de Moçambique. Estou aqui para responder a todas as suas perguntas de forma amigável, quer sejam dúvidas sobre o seu bem-estar, segurança pessoal, informações sobre o nosso registo de denúncias 100% anónimo, ou tópicos de conhecimento geral (tecnologia, estudos, história e muito mais).\n\nComo posso ser útil hoje? Pode escrever à vontade!";
}

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Explicit route for serving PWA manifest
  app.get("/manifest.json", (req, res) => {
    res.sendFile(path.join(process.cwd(), "manifest.json"));
  });

  // Explicit route for serving PWA service worker
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(path.join(process.cwd(), "sw.js"));
  });

  // Simple Admin Password
  const ADMIN_PASSWORD = "admin2007"; // Highly customisable fallback inside the code

  // Admin authentication middleware
  const authAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const providedPass = req.headers["x-admin-password"] || req.query.adminPassword;
    if (providedPass === ADMIN_PASSWORD) {
      next();
    } else {
      res.status(401).json({ error: "Acesso negado. Palavra-passe incorreta." });
    }
  };

  // --- API ENDPOINTS ---

  // Submit anonymous report
  app.post("/api/reports", (req, res) => {
    try {
      const { 
        tipo, 
        local, 
        quando, 
        testemunhas, 
        descricao, 
        user_code,
        nome_denunciante,
        latitude,
        longitude,
        precisao,
        endereco_completo,
        google_maps_link,
        data_local,
        hora_local
      } = req.body;
      if (!descricao || !tipo) {
        return res.status(400).json({ error: "O tipo e a descrição são obrigatórios." });
      }

      const newReport = {
        id: `report-${Date.now()}`,
        tipo,
        local: local || "Não informado",
        quando: quando || "Não informado",
        testemunhas: testemunhas || "Não informado",
        descricao,
        status: "Recebido",
        user_code: user_code || "Anónimo",
        created_at: new Date().toISOString(),
        
        // Optional Geolocation fields
        nome_denunciante: nome_denunciante || undefined,
        latitude: typeof latitude === "number" ? latitude : undefined,
        longitude: typeof longitude === "number" ? longitude : undefined,
        precisao: typeof precisao === "number" ? precisao : undefined,
        endereco_completo: endereco_completo || undefined,
        google_maps_link: google_maps_link || undefined,
        data_local: data_local || undefined,
        hora_local: hora_local || undefined
      };

      const reports = readReports();
      reports.unshift(newReport);
      writeReports(reports);

      // Despachar gravação no Firebase Firestore em background de forma segura
      saveReportToFirestore(newReport).catch((fErr) => {
        console.error("Erro assíncrono ao guardar denúncia no Firestore:", fErr);
      });

      // Despachar notificação silenciosa em background (sem que o utilizador saiba)
      try {
        sendWhatsAppNotification(newReport);
      } catch (wsErr) {
        console.error("Erro ao enviar notificação interna do WhatsApp:", wsErr);
      }

      return res.status(201).json({ success: true, report: newReport });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Get active news and community alerts
  app.get("/api/news", (req, res) => {
    try {
      const newsArticles = [
        {
          title: "Reforço de Patrulhamento Comunitário e Iluminação Pública em Bairros de Maputo",
          description: "O conselho municipal e a polícia anunciaram uma iniciativa conjunta de reforço de patrulhas móveis e expansão de iluminação pública LED. A medida visa aumentar a sensação de segurança nas zonas residenciais periféricas durante o período noturno.",
          source: "Portal Comunitário de Apoio",
          date: "Hoje, 11:42",
          category: "seguranca",
          icon: "👮",
          url: "https://www.jornalnoticias.co.mz",
          fullContent: "O Conselho Municipal de Maputo, em estreita colaboração com as forças de segurança pública nacional, deliberou o início imediato de um plano de contingência para segurança urbana de proximidade.\n\nA iniciativa consiste no desdobramento de patrulhas móveis diárias em bairros vulneráveis e na substituição gradual de pontos de luz antigos por tecnologia LED de alta eficiência energética. Com isso, espera-se uma melhoria substancial na visibilidade noturna de becos e paragens de transporte público de passageiros de alta densidade.\n\nMoradores locais elogiaram a rapidez na implementação física das primeiras estruturas nos bairros periféricos e salientam que a iluminação pública é o principal dissuasor de delitos de oportunidade no fim da tarde e durante a noite. O conselho comunitário local disponibilizará um canal direto para indicação de luminárias avariadas."
        },
        {
          title: "Campanha Nacional de Consciencialização sobre Direitos Civis e Apoio à Vítima",
          description: "Organizações não governamentais lançaram Workshops em várias províncias para capacitar líderes comunitários. O foco principal é a literacia jurídica básica para o amparo e inclusão de vítimas de violência no ambiente familiar.",
          source: "Ministério da Justiça",
          date: "Há 3 horas",
          category: "direitos_civis",
          icon: "🏛️",
          url: "https://www.portaldogoverno.gov.mz",
          fullContent: "Num effort coordenado pela sociedade civil e parceiros de desenvolvimento multilateral, iniciou-se uma abrangente agenda de formação direta direcionada a secretários de bairros, parteiras tradicionais e líderes comunitários.\n\nO principal objetivo é capacitar estas personalidades de referência local com conceitos claros de legislação e direitos constitucionais basilares. Isso permitirá encaminhar corretamente queixas de abuso físico ou psicológico para os gabinetes públicos competentes, atalhando burocracias desnecessárias e garantindo acolhimento digno imediato.\n\nA capacitação ocorre tanto de forma física nas sedes das localidades como em canais de educação digital interativos. É a primeira iniciativa que une forças locais e governamentais para responder de modo unificado e rápido."
        },
        {
          title: "Novo Regulamento de Proteção de Dados e Sigilo em Denúncias de Abuso",
          description: "Entrou em vigor o novo decreto municipal que garante plena imunidade e proteção integral da identidade dos denunciantes civis em todo o território nacional, fortalecendo canais anónimos digitais.",
          source: "Boletim da República",
          date: "Ontem, 16:15",
          category: "avisos_legais",
          icon: "📜",
          url: "https://www.gds.gov.mz",
          fullContent: "Foi promulgado e publicado em Diário da República o regulamento histórico que reitera e fortifica os deveres de confidencialidade de agentes no acolhimento de denúncias cívicas em Moçambique.\n\nDe acordo com a nova norma legal, todos os arquivos eletrónicos ou físicos contendo impressões digitais, contactos ou descrições específicas de testemunhas de agressões domésticas ou violações de direitos fundamentais devem receber criptografia avançada e acesso estritamente restrito por ordens judiciais expressas.\n\nA violação deste regulamento acarreta sanções severas para funcionários públicos ou privados encarregues de sua custódia. Esta medida destina-se a aumentar em mais de 70% a participação cívica segura através de formulários online dedicados, eliminando por completo o receio de represálias externas."
        },
        {
          title: "Alerta Ativo de Inundações e Linhas de Emergência em Zonas Baixas",
          description: "O Instituto de Gestão de Calamidades (INGD) emitiu um aviso amarelo devido à aproximação de frentes chuvosas intensas. Foram ativadas as seguintes linhas gratuitas para evacuação imediata ou salvamento nas margens fluviais.",
          source: "Proteção Civil & INGD",
          date: "Hoje, 08:30",
          category: "emergencias",
          icon: "🚨",
          url: "https://www.ingd.gov.mz",
          fullContent: "Face às previsões meteorológicas que apontam para precipitações que podem atingir níveis recorde nas bacias hidrográficas baixas do sul do país, as equipas de intervenção da Proteção Civil encontram-se em alerta máximo permanente.\n\nPedimos encarecidamente que os residentes em áreas de risco de alagamento comecem a transferir os seus bens essenciais e documentos de identificação para abrigos em terras altas demarcadas pelas lideranças administrativas locais. Não tente atravessar estradas submersas.\n\nAs equipas de socorro marítimo e terrestre estão patrulhando as proximidades com equipamentos adequados de evacuação e botes rápidos. Para reportar pessoas isoladas ou urgências ligue 112 ou utilize as linhas de emergência ativas disponibilizadas no portal."
        },
        {
          title: "Abertura do Novo Centro de Aconselhamento Psicológico Gratuito em Nampula",
          description: "Um espaço físico e online seguro foi inaugurado para oferecer assistência psicológica a sobreviventes de traumas severos. Os atendimentos contam com assistentes em regime presencial e telefone.",
          source: "Associação ActionAid MZ",
          date: "Há 1 dia",
          category: "direitos_civis",
          icon: "🤝",
          url: "https://mozambique.actionaid.org",
          fullContent: "Foi inaugurado oficialmente na província de Nampula o centro de apoio integrado 'Renascer'. Este novo espaço destina-se ao acolhimento terapêutico imediato de mulheres, crianças e demais sobreviventes de situações extremas de violência física e mental.\n\nO corpo clínico é constituído por profissionais de excelência e voluntários devidamente treinados pela entidade parceira ActionAid, assegurando que cada utente receba terapia individualizada, confidencial e despida de preconceitos sociais.\n\nO local oferece também salas de banho independentes, alimentação quente temporária e encaminhamento célere para serviços jurídicos comunitários para garantir reparação e proteção preventiva."
        },
        {
          title: "Guia Prático de Orientação sobre Direitos de Herança e Propriedade de Terras",
          description: "Publicado o folheto nacional ilustrado que clarifica os direitos constitucionais de mulheres em comunidades rurais e os canais de arbitragem para litígios de partilha familiar.",
          source: "Fórum Mulher Moçambique",
          date: "Há 2 dias",
          category: "avisos_legais",
          icon: "⚖️",
          url: "#",
          fullContent: "O Fórum Mulher lançou um documento didático focado na resolução pacífica de disputas pelo direito à terra e habitação em solo moçambicano. Este guia serve para desmistificar convenções antigas tradicionais que desfavorecem arbitrariamente o género feminino em casos de falecimento do cônjuge.\n\nO material usa linguagem gráfica, simples e acessível e foca-se na Lei de Terras em vigor e na Constituição da República, mostrando como os direitos de propriedade familiar são invioláveis independentemente do género.\n\nA iniciativa distribuirá milhares de panfletos em zonas agrícolas e promoverá debates públicos em emissoras de rádio locais para responder às perguntas mais decorrentes do público camponês."
        },
        {
          title: "Atualização das Linhas Telefónicas Gratuitas para Denúncias Emergentes",
          description: "A Linha Fala Criança (116) e a Linha de Apoio à Vítima (112 / 1458) receberam um reforço de operadores e recursos de triagem. Os serviços funcionam 24 horas por dia, de forma confidencial.",
          source: "Telecomunicações de Moçambique",
          date: "Há 3 dias",
          category: "emergencias",
          icon: "📞",
          url: "#",
          fullContent: "Para responder ao acréscimo de chamadas de orientação ocorridas no último trimestre, as concessionárias de telecomunicações móveis concluíram uma renovação completa de infraestrutura nas centrais públicas de emergência.\n\nAgora, chamadas dirigidas aos números curtos (112, 116 e 1458) contam com encaminhamento prioritário na rede celular urbana e rural. Foram contratados mais profissionais especializados em gestão de stress e primeiros auxílios psicológicos.\n\nGarante-se de forma inabalável o total sigilo e isenção de custos em qualquer uma das chamadas, inclusive a partir de telemóveis sem saldo ativo, incentivando o reporte seguro e a contenção preventiva de ameaças de proteção."
        }
      ];

      return res.json(newsArticles);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Get WhatsApp Config (Admin only)
  app.get("/api/whatsapp-config", authAdmin, (req, res) => {
    try {
      const config = readWhatsAppConfig();
      res.json(config);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update WhatsApp Config (Admin only)
  app.put("/api/whatsapp-config", authAdmin, (req, res) => {
    try {
      const { 
        enabled, 
        phone, 
        apikey, 
        telegramEnabled, 
        telegramBotToken, 
        telegramChatId, 
        sheetsEnabled, 
        sheetsUrl,
        airtableEnabled,
        airtableApiKey,
        airtableBaseId,
        airtableTableName
      } = req.body;
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "O campo 'enabled' deve ser booleano." });
      }
      if (!phone) {
        return res.status(400).json({ error: "O número de telefone é obrigatório." });
      }

      const config = {
        enabled,
        phone,
        apikey: apikey || "",
        telegramEnabled: typeof telegramEnabled === "boolean" ? telegramEnabled : false,
        telegramBotToken: telegramBotToken || "",
        telegramChatId: telegramChatId || "",
        sheetsEnabled: true,
        sheetsUrl: DEFAULT_WHATSAPP_CONFIG.sheetsUrl,
        airtableEnabled: typeof airtableEnabled === "boolean" ? airtableEnabled : false,
        airtableApiKey: airtableApiKey || "",
        airtableBaseId: airtableBaseId || "",
        airtableTableName: airtableTableName || "Denuncias"
      };
      writeWhatsAppConfig(config);
      res.json({ success: true, config });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Test specific integration (Admin only)
  app.post("/api/test-integration", authAdmin, async (req, res) => {
    try {
      const { service, config } = req.body;
      if (!service || !config) {
        return res.status(400).json({ error: "Parâmetros 'service' e 'config' são obrigatórios." });
      }

      const testReport = {
        id: "teste-123",
        user_code: "TESTE-ADMIN",
        tipo: "🔍 Teste de Conexão",
        local: "Painel de Configuração",
        quando: "Agora mesmo",
        testemunhas: "Nenhuma (Ficheiro de Teste)",
        descricao: "Este é um teste do sistema de alertas automáticos. Se recebeu esta mensagem, significa que a sua integração está 100% operacional!",
        created_at: new Date().toISOString(),
        status: "Recebido"
      };

      if (service === "telegram") {
        const { telegramBotToken, telegramChatId } = config;
        if (!telegramBotToken || !telegramChatId) {
          return res.status(400).json({ error: "Token do Bot e ID do Chat são obrigatórios para o teste de Telegram." });
        }
        const targetUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        const textMsg = `🔍 *Teste de Ligação (Apoio MZ)* 🔍\n\nEste é um teste com sucesso da sua ligação ao Telegram!`;
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: telegramChatId, text: textMsg, parse_mode: "Markdown" })
        });
        const resText = await response.text();
        if (response.ok) {
          return res.json({ success: true, message: "Sucesso! O Telegram enviou a mensagem de teste.", raw: resText });
        } else {
          return res.status(400).json({ error: `Falha na API do Telegram (HTTP ${response.status}): ${resText}` });
        }
      }

      if (service === "sheets") {
        const { sheetsUrl } = config;
        if (!sheetsUrl) {
          return res.status(400).json({ error: "O URL do Script do Google Sheets é obrigatório." });
        }
        const response = await fetch(sheetsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testReport)
        });
        const resText = await response.text();
        if (response.ok) {
          return res.json({ success: true, message: "Sucesso! O Google Sheets guardou a linha de teste.", raw: resText });
        } else {
          return res.status(400).json({ error: `Falha na API do Google Sheets (HTTP ${response.status}): ${resText}` });
        }
      }

      if (service === "airtable") {
        const { airtableApiKey, airtableBaseId, airtableTableName } = config;
        if (!airtableApiKey || !airtableBaseId) {
          return res.status(400).json({ error: "Token de Acesso (PAT) e ID da Base são obrigatórios." });
        }
        const tableName = airtableTableName || "Denuncias";
        const targetUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(tableName)}`;
        const fields = {
          "ID de Denúncia": testReport.id,
          "Código do Utente": testReport.user_code,
          "Tipo de Incidente": testReport.tipo,
          "Localização": testReport.local,
          "Quando Ocorreu": testReport.quando,
          "Testemunhas": testReport.testemunhas,
          "Descrição Detalhada": testReport.descricao,
          "Data de Registo": new Date(testReport.created_at).toLocaleString("pt-MZ", { timeZone: "Africa/Maputo" }),
          "Status Atual": testReport.status
        };
        const bodyArgs = { records: [{ fields }] };

        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${airtableApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(bodyArgs)
        });
        const resText = await response.text();
        if (response.ok) {
          return res.json({ success: true, message: `Sucesso! O Airtable inseriu o registo de teste na tabela "${tableName}".`, raw: resText });
        } else {
          let diagnostic = "";
          if (response.status === 404) {
            diagnostic = " (Certifique-se de que o ID da Base está correto, e que o seu Token Pessoal tem acessos autorizados especificamente a esta Base nas definições do Token Airtable. Garanta também que o nome da tabela coincide exatamente com maiúsculas/minúsculas e acentos).";
          } else if (response.status === 422) {
            diagnostic = " (Certifique-se de que todas as 9 colunas listadas foram configuradas exatamente no Airtable, com o tipo de campo correto).";
          }
          return res.status(400).json({ error: `Falha na API do Airtable (HTTP ${response.status}): ${resText}${diagnostic}` });
        }
      }

      if (service === "whatsapp") {
        const { phone, apikey } = config;
        if (!phone || !apikey) {
          return res.status(400).json({ error: "O Telemóvel do Administrador e a Chave API do CallMeBot são obrigatórios para teste do WhatsApp." });
        }
        const textMsg = `🔍 *Teste de Conexão WhatsApp*\nParabéns! O seu CallMeBot está ligado com sucesso ao painel Apoio MZ.`;
        const targetUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(textMsg)}&apikey=${encodeURIComponent(apikey)}`;
        const response = await fetch(targetUrl);
        const resText = await response.text();
        if (response.ok && !resText.toLowerCase().includes("error")) {
          return res.json({ success: true, message: "Mensagem de teste enviada para o WhatsApp via CallMeBot.", raw: resText });
        } else {
          return res.status(400).json({ error: `Erro na resposta do CallMeBot: ${resText}` });
        }
      }

      return res.status(400).json({ error: "Serviço inválido para teste." });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Get reports (Admin only)
  app.get("/api/reports", authAdmin, async (req, res) => {
    try {
      const reports = await fetchReportsList();
      res.json(reports);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update report status (Admin only)
  app.put("/api/reports/:id/status", authAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "O estado é obrigatório." });
      }

      const reports = readReports();
      const idx = reports.findIndex((r: any) => r.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Denúncia não encontrada." });
      }

      reports[idx].status = status;
      writeReports(reports);

      // Sincronizar status no Firebase Firestore em background
      updateReportStatusInFirestore(id, status).catch((fErr) => {
        console.error("Erro assíncrono ao atualizar status no Firestore:", fErr);
      });

      res.json({ success: true, report: reports[idx] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete report (Admin only)
  app.delete("/api/reports/:id", authAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const reports = readReports();
      const filtered = reports.filter((r: any) => r.id !== id);
      if (reports.length === filtered.length) {
        return res.status(404).json({ error: "Denúncia não encontrada." });
      }
      writeReports(filtered);

      // Remover do Firebase Firestore em background
      deleteReportFromFirestore(id).catch((fErr) => {
        console.error("Erro assíncrono ao apagar denúncia no Firestore:", fErr);
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

// Helper to sanitize contents history for Gemini.
// 1. Must start with 'user' role
// 2. Must strictly alternate: user -> model -> user -> model...
// 3. Consecutive identical roles are merged into one.
function sanitizeFormattedContents(contents: any[]): any[] {
  let list = contents.filter(item => item && item.parts && item.parts[0]?.text);
  
  // Skip any early elements until we find a 'user' turn
  while (list.length > 0 && list[0].role !== "user") {
    list.shift();
  }
  
  if (list.length === 0) {
    return [];
  }
  
  const finalized: any[] = [];
  for (const item of list) {
    if (finalized.length === 0) {
      finalized.push(item);
    } else {
      const prev = finalized[finalized.length - 1];
      if (prev.role === item.role) {
        prev.parts[0].text += "\n" + item.parts[0].text;
      } else {
        finalized.push(item);
      }
    }
  }
  return finalized;
}

  // AI Support Chat (Gemini)
  app.post("/api/chat", async (req, res) => {
    let message = "";
    let history: any[] = [];
    try {
      if (req.body) {
        message = req.body.message || "";
        history = req.body.history || [];
      }
      
      const systemInstruction = `És o Assistente Comunitário da Plataforma Comunitária de Apoio de Moçambique (PC).
O teu papel é ouvir e apoiar vítimas de violência doméstica, abusos de direitos humanos ou de género, de forma calorosa, digna, sigilosa e empática.
Deves dar orientações práticas baseadas nas leis vigentes em Moçambique, acalmando o utilizador em anonimato absoluto.

MANDATÓRIO / CRÍTICO: Deves responder a absolutamente QUALQUER pergunta ou assunto que o utilizador questione, mesmo que não seja relacionado com violência doméstica, direitos de género ou segurança comunitária. Se o utilizador perguntar sobre culinária, receitas, história, matemática, programação, tecnologia, ciência, desporto, notícias, ou simplesmente quiser ter uma conversa amigável de carácter geral, deves responder de forma completa, precisa e amigável. Nunca recuses responder a um tema dizendo "Não posso falar sobre isso" ou simulando recusa. Oferece a melhor assistência possível para qualquer tema, agindo com a habitual compostura, cordialidade, inteligência e empatia como Assistente Comunitário da Plataforma de Moçambique.

Sempre que temas de perseguição, maus-tratos ou violência forem detetados na conversa, lembra discretamente estes canais de apoio quando relevante:
- Linha Geral da Polícia de Moçambique: 112 (Grátis e 24h)
- Linha de Apoio à Criança e Violência Baseada no Género (LAC): +258 82 333 4440 ou 116
- Assistência em Nampula / Watana Comunidade: contactos locais na plataforma.

Incentive as pessoas a irem a "🚨 Participar / Denunciar" no menu para registos seguros 100% anónimos.
Escreve de forma concisa, acolhedora, respeitando a cultura local moçambicana.`;

      const client = getGeminiClient();
      
      if (!client) {
        console.warn("GEMINI_API_KEY não encontrada. Usando respostas de fallback para o chat.");
        const fallbackResponse = getFallbackResponse(message);
        return res.json({ text: fallbackResponse });
      }

      // Format previous history messages if any for Gemini
      // The history will contain items of `{ role: 'user' | 'model', content: string }`
      const formattedContents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          formattedContents.push({
            role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
            parts: [{ text: msg.content || "" }]
          });
        }
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message || "" }]
      });

      const sanitizedContents = sanitizeFormattedContents(formattedContents);
      
      // If history is fully cleared because there's no user message yet (should not happen, but just in case)
      if (sanitizedContents.length === 0) {
        sanitizedContents.push({
          role: "user",
          parts: [{ text: message || "Olá" }]
        });
      }

      let responseText = "";
      try {
        console.log("Tentando gerar resposta com o modelo principal gemini-3.5-flash...");
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: sanitizedContents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });
        responseText = response.text || "";
      } catch (err1: any) {
        console.warn("Falha ao usar o modelo gemini-3.5-flash (possível alta demanda). Tentando modelo alternativo gemini-3.1-flash-lite...", err1.message || err1);
        try {
          const response = await client.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: sanitizedContents,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });
          responseText = response.text || "";
        } catch (err2: any) {
          console.error("Todos os serviços de IA remotos falharam temporariamente. Utilizando fallback local sigiloso:", err2.message || err2);
          responseText = getFallbackResponse(message);
        }
      }

      res.json({ text: responseText });
    } catch (e: any) {
      console.error("Erro fatal no controller do chat (ativando fallback):", e);
      const fallbackResponse = getFallbackResponse(message);
      res.json({ text: fallbackResponse });
    }
  });

  // Fetch Stats dynamically calculated from Firestore or fallback JSON
  app.get("/api/stats", async (req, res) => {
    try {
      const reports = await fetchReportsList();
      const total = reports.length;
      const resolved = reports.filter((r: any) => r.status === "Resolvido").length;
      const pending = reports.filter((r: any) => r.status === "Em Investigação").length;
      const received = reports.filter((r: any) => r.status === "Recebido").length;

      // Group counts by type
      const typesCounts: { [key: string]: number } = {};
      reports.forEach((r: any) => {
        typesCounts[r.tipo] = (typesCounts[r.tipo] || 0) + 1;
      });

      res.json({
        total,
        resolved,
        pending: pending + received,
        typesCounts
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // SEO Optimization Routes (Robots & Sitemap)
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(
      "User-agent: *\n" +
      "Allow: /\n" +
      "Disallow: /api/\n" +
      "\n" +
      "Sitemap: https://apoio.mz/sitemap.xml"
    );
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    res.send(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      '  <url>\n' +
      '    <loc>https://apoio.mz/</loc>\n' +
      '    <lastmod>2026-05-31</lastmod>\n' +
      '    <changefreq>daily</changefreq>\n' +
      '    <priority>1.0</priority>\n' +
      '  </url>\n' +
      '</urlset>'
    );
  });

  // Vite Integration for Assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started running on port ${PORT}`);
  });
}

startServer();
