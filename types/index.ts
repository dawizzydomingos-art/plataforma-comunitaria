export interface Report {
  id: string;
  tipo: string;
  local: string;
  quando: string;
  testemunhas: string;
  descricao: string;
  status: "Recebido" | "Em Investigação" | "Resolvido";
  user_code: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  date: string;
  category: "violencia" | "mulheres" | "trafico" | "seguranca";
  icon: string;
  url: string;
}
