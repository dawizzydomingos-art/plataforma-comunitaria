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
  
  // Geolocation and additional information
  nome_denunciante?: string;
  latitude?: number;
  longitude?: number;
  precisao?: number;
  endereco_completo?: string;
  google_maps_link?: string;
  data_local?: string;
  hora_local?: string;
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
  category: "seguranca" | "direitos_civis" | "avisos_legais" | "emergencias";
  icon?: string;
  url: string;
  image?: string;
  fullContent?: string;
}
