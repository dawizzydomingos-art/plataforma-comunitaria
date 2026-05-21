import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Ensure reports directory exists
const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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

  // Simple Admin Password
  const ADMIN_PASSWORD = "admin"; // Highly customisable fallback inside the code

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

      return res.status(201).json({ success: true, report: newReport });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started running on port ${PORT}`);
  });
}

startServer();
