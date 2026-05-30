import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
  sheetsEnabled: false,
  sheetsUrl: "",
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
    return {
      enabled: parsed.enabled !== undefined ? parsed.enabled : DEFAULT_WHATSAPP_CONFIG.enabled,
      phone: parsed.phone || DEFAULT_WHATSAPP_CONFIG.phone,
      apikey: parsed.apikey || "",
      telegramEnabled: parsed.telegramEnabled !== undefined ? parsed.telegramEnabled : DEFAULT_WHATSAPP_CONFIG.telegramEnabled,
      telegramBotToken: parsed.telegramBotToken || "",
      telegramChatId: parsed.telegramChatId || "",
      sheetsEnabled: parsed.sheetsEnabled !== undefined ? parsed.sheetsEnabled : DEFAULT_WHATSAPP_CONFIG.sheetsEnabled,
      sheetsUrl: parsed.sheetsUrl || "",
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

// Lazy initializer for Google Gen AI
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
      const { tipo, local, quando, testemunhas, descricao, user_code } = req.body;
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
        created_at: new Date().toISOString()
      };

      const reports = readReports();
      reports.unshift(newReport);
      writeReports(reports);

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
        sheetsEnabled: typeof sheetsEnabled === "boolean" ? sheetsEnabled : false,
        sheetsUrl: sheetsUrl || "",
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
  app.get("/api/reports", authAdmin, (req, res) => {
    try {
      const reports = readReports();
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
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Support Chat (Gemini)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
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
        // Fallback responder to prevent crash when GEMINI_API_KEY is not defined
        console.warn("GEMINI_API_KEY não encontrada. Usando respostas simuladas de apoio.");
        const textLower = (message || "").toLowerCase();
        let fallbackResponse = "Olá! Como Assistente Comunitário da Plataforma de Apoio de Moçambique, estou aqui para responder a todas as suas perguntas, sejam dúvidas gerais de conhecimento ou questões de segurança e bem-estar comunitário. \n\nEm que posso ajudar hoje? Caso queira relatar algum problema de violência doméstica, saiba que pode enviar uma denúncia totalmente anónima e protegida no nosso separador '🚨 Denunciar'.";
        
        if (textLower.includes("perigo") || textLower.includes("emergencia") || textLower.includes("morrer") || textLower.includes("me ajude")) {
          fallbackResponse = "ATENÇÃO: Se a sua segurança ou de alguém está em risco imediato agora, ligue com urgência para a Linha da Polícia de Moçambique: 112 ou dirija-se à esquadra mais próxima! \n\nSe necessitar de conversar de forma segura, envie-nos uma denúncia anónima no menu superior. A sua segurança é o nosso maior objetivo.";
        } else if (textLower.includes("violencia") || textLower.includes("bater") || textLower.includes("espos")) {
          fallbackResponse = "Sinta-se abraçado/a e saiba que a violência doméstica é crime punível por lei em Moçambique. Não tem de carregar esse peso sozinho/a. \n\nRecomendo que faça uma denúncia de forma totalmente anónima usando o nosso formulário no menu '🚨 Denunciar'. Ela guardará apenas as informações do caso e os administradores farão o devido acompanhamento discreto.";
        } else if (textLower.includes("receita") || textLower.includes("arroz") || textLower.includes("cozinhar")) {
          fallbackResponse = "Fico feliz em ajudar com isso! Para fazer um bom arroz solto ao estilo moçambicano, lave bem uma chávena de arroz para retirar o excesso de amido. Refogue um pouco de alho picado e cebola em óleo numa panela, junte o arroz e mexa por um minuto. Adicione duas chávenas de água a ferver e sal a gosto. Deixe cozer em lume brando com a panela semitapada até a água evaporar, depois tape totalmente por 5 minutos antes de servir!";
        } else if (textLower.includes("como") || textLower.includes("quem") || textLower.includes("onde") || textLower.includes("quais") || textLower.includes("o que") || textLower.includes("programar") || textLower.includes("typescript")) {
          fallbackResponse = "Com certeza! Como seu Assistente Comunitário, posso responder a perguntas de todos os temas. Se for sobre programação ou conhecimento geral, estou à sua disposição. Por exemplo, TypeScript é uma linguagem de programação muito popular baseada em JavaScript que acrescenta tipagem estática e segurança ao código. Em que tópico em concreto gostaria de se aprofundar hoje?";
        }
        
        return res.json({ text: fallbackResponse });
      }

      // Format previous history messages if any for Gemini
      // The history will contain items of `{ role: 'user' | 'model', content: string }`
      const formattedContents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          formattedContents.push({
            role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
            parts: [{ text: msg.content }]
          });
        }
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (e: any) {
      console.error("Erro na API Gemini:", e);
      res.status(500).json({ error: "Erro no processamento da IA: " + e.message });
    }
  });

  // Fetch Stats dynamically calculated from backend JSON
  app.get("/api/stats", (req, res) => {
    try {
      const reports = readReports();
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
