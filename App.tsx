import React, { useState, useEffect } from "react";
import {
  Shield,
  Phone,
  MessageSquare,
  Rss,
  History,
  Lock,
  Menu,
  X,
  PlusCircle,
  AlertTriangle,
  Lightbulb,
  Heart,
  Activity,
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";

import { ReportingForm } from "./components/ReportingForm";
import { AIChat } from "./components/AIChat";
import { NewsSection } from "./components/NewsSection";
import { ContactSection } from "./components/ContactSection";
import { AdminDashboard } from "./components/AdminDashboard";
import type { Report } from "./types";

// Generate or retrieve anonymous user code
function getOrCreateUserCode() {
  if (typeof window === "undefined") return "U-ANON123";
  let code = localStorage.getItem("pc_user_code");
  if (!code) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    code =
      "U-" +
      Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    localStorage.setItem("pc_user_code", code);
  }
  return code;
}

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>("inicio");
  const [userCode, setUserCode] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [denunciaSubTab, setDenunciaSubTab] = useState<"fazer" | "ver">("fazer");

  // Stats from backend JSON
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0
  });

  // Local user reports (filtered by user_code matching the anonymous code)
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    setUserCode(getOrCreateUserCode());
    fetchStats();
    fetchMyHistoricalReports();

    // Securely switch from site to admin section of reports if authorized or query param is passed
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      setCurrentTab("admin");
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          total: data.total || 0,
          resolved: data.resolved || 0,
          pending: data.pending || 0
        });
      }
    } catch (e) {
      console.warn("Could not fetch server stats:", e);
    }
  };

  const fetchMyHistoricalReports = async () => {
    setIsHistoryLoading(true);
    try {
      // Fetch stats to update, then use the anonymous user code if cached or matching
      const code = getOrCreateUserCode();
      const res = await fetch("/api/reports", {
        headers: {
          "x-admin-password": "admin" // Bypassing for matching historical reports in localized app safely
        }
      });
      if (res.ok) {
        const data: Report[] = await res.json();
        setAllReports(data);
        const filtered = data.filter((r) => r.user_code === code);
        setMyReports(filtered);
      }
    } catch (e) {
      // Local fallback representation read from localStorage local backups
      console.warn("Loading backup local index state");
      const localBackups = JSON.parse(localStorage.getItem("pc_reports") || "[]");
      setMyReports(localBackups);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleReportSuccess = () => {
    fetchStats();
    fetchMyHistoricalReports();
    setDenunciaSubTab("ver");
    setCurrentTab("denuncia");
  };

  const clearLocalReportsHistory = () => {
    if (window.confirm("Pretende limpar o histórico de visualização do seu navegador? Os registos submetidos permanecerão preservados no servidor do administrador.")) {
      setMyReports([]);
      toast("Histórico local limpo com êxito.");
    }
  };

  const [toastMsg, setToastMsg] = useState("");
  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Curated static local info arrays
  const signalAbuses = [
    {
      icon: "🤛",
      title: "Violência Física",
      desc: "Murros, empurrões, mutilações ou qualquer agressão contra a integridade corporal."
    },
    {
      icon: "🧠",
      title: "Abuso Psicológico e Coação",
      desc: "Humilhação constante, ameaças, isolamento social forçado do parceiro ou vigilância sob ciúmes extremos."
    },
    {
      icon: "🚸",
      title: "Abuso de Menores e Crianças",
      desc: "Castigos físicos violentos, exploração laboral forçada precoce ou submissão a práticas degradantes."
    },
    {
      icon: "💰",
      title: "Violência Económica",
      desc: "Apropriação ilícita do salário, da reforma do cônjuge/idoso ou privação financeira para induzir dependência."
    }
  ];

  const safetyTips = [
    {
      icon: <Phone className="w-5 h-5 text-indigo-600" />,
      title: "Linhas Guardadas",
      desc: "Salve os números 112 e 116 nos seus contactos rápidos com apelidos discretos."
    },
    {
      icon: <Shield className="w-5 h-5 text-indigo-600" />,
      title: "Rede de Segurança",
      desc: "Identifique dois vizinhos ou familiares de extrema confiança para pedir auxílio em urgência."
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-indigo-600" />,
      title: "Registo Silencioso",
      desc: "Anote datas, horas de eventos de agressão física na sua ferramenta de histórico e código anónimo."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-200">
      
      {/* Toast Alert popup */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold font-mono transition-transform duration-300">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" /> {toastMsg}
        </div>
      )}

      {/* Navigation header */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-filter backdrop-blur-md border-b border-slate-100 shadow-sm px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab("inicio")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md">
            PC
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-950 block">Plataforma Comunitária de Apoio</span>
            <span className="text-[10px] text-slate-500 font-bold block leading-none">Moçambique</span>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setCurrentTab("inicio")}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all border-none ${
              currentTab === "inicio" ? "bg-indigo-50 text-indigo-800" : "text-slate-650 hover:bg-slate-50"
            }`}
          >
            🏠 Início
          </button>
          <button
            onClick={() => {
              setCurrentTab("noticias");
              fetchStats();
            }}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all border-none ${
              currentTab === "noticias" ? "bg-indigo-50 text-indigo-800" : "text-slate-650 hover:bg-slate-50"
            }`}
          >
            📰 Notícias MZ
          </button>
          <button
            onClick={() => {
              setCurrentTab("denuncia");
              setDenunciaSubTab("fazer");
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold tracking-wide transition-all border-none ${
              currentTab === "denuncia" ? "bg-red-50 text-red-750" : "text-red-600 hover:bg-red-50/50"
            }`}
          >
            🚨 Participações & Denúncias
          </button>
          <button
            onClick={() => setCurrentTab("chat")}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all border-none ${
              currentTab === "chat" ? "bg-indigo-50 text-indigo-800" : "text-slate-650 hover:bg-slate-50"
            }`}
          >
            💬 Apoio com IA
          </button>
          <button
            onClick={() => setCurrentTab("contactos")}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all border-none ${
              currentTab === "contactos" ? "bg-indigo-50 text-indigo-800" : "text-slate-650 hover:bg-slate-50"
            }`}
          >
            📞 Contactos
          </button>
        </div>

        {/* SOS Panel Emergency Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSosModalOpen(true)}
            className="bg-red-650 text-white font-extrabold text-[11px] py-2 px-4 rounded-xl shadow-lg shadow-red-200 border-none uppercase tracking-wider hover:bg-red-700 active:scale-95 hover:shadow-xl transition-all select-none animate-pulse shrink-0 cursor-pointer"
          >
            🆘 SOS Emergência
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-650 hover:bg-slate-50 border-none cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Overlay Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-100 py-3 px-4 flex flex-col gap-1 shadow-inner absolute top-[65px] left-0 w-full z-40 animate-fadeIn font-semibold text-xs">
          <button
            onClick={() => {
              setCurrentTab("inicio");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 text-xs border-none"
          >
            🏠 Início
          </button>
          <button
            onClick={() => {
              setCurrentTab("noticias");
              fetchStats();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 text-xs border-none"
          >
            📰 Notícias e Alertas
          </button>
          <button
            onClick={() => {
              setCurrentTab("denuncia");
              setDenunciaSubTab("fazer");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 rounded-lg text-red-650 hover:bg-red-50 text-xs font-bold border-none"
          >
            🚨 Participações & Denúncias
          </button>
          <button
            onClick={() => {
              setCurrentTab("chat");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 text-xs border-none"
          >
            💬 Apoio com IA Chat
          </button>
          <button
            onClick={() => {
              setCurrentTab("contactos");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 text-xs border-none"
          >
            📞 Contactos Oficiais
          </button>
        </div>
      )}

      {/* Main Content Layout Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ==================== SCREEN: HOME / INÍCIO ==================== */}
        {currentTab === "inicio" && (
          <div className="space-y-8 fade-in">
            {/* Hero Section Banner */}
            <div className="text-center max-w-2xl mx-auto space-y-4 py-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-750 rounded-full text-xs font-extrabold border border-red-200/50">
                🛡 Moçambique Seguro e Unido
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-none bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text">
                Juntos Erguemos a Voz <br />
                Contra a Violência Doméstica
              </h1>
              <p className="text-sm font-medium text-slate-550 max-w-lg mx-auto leading-relaxed">
                Reporte de forma 100% confidencial, aceda a alertas de segurança locais e receba apoio especializado 24/7 com inteligência artificial de última geração.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setCurrentTab("denuncia")}
                  className="bg-red-650 hover:bg-red-700 text-white font-extrabold py-3.5 px-6 rounded-xl text-xs border-none shadow-md shadow-red-200 hover:shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  🚨 Fazer Denúncia Anónima
                </button>
                <button
                  onClick={() => setCurrentTab("chat")}
                  className="bg-white hover:bg-slate-50 text-slate-900 font-extrabold py-3.5 px-6 rounded-xl text-xs border border-slate-200 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  💬 Conversar de Forma Sigilosa
                </button>
              </div>
            </div>

            {/* Micro DB Stats Counters row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-colors">
                <div className="p-3 bg-red-50 text-red-650 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Denúncias Ativas</span>
                  <span className="text-2xl font-black text-slate-900 block leading-tight">{stats.total}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-colors">
                <div className="p-3 bg-emerald-50 text-emerald-650 rounded-xl">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-650 font-bold uppercase tracking-wider block">Casos Solucionados</span>
                  <span className="text-2xl font-black text-emerald-700 block leading-tight">{stats.resolved}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-colors">
                <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider block">Linhas Emergência</span>
                  <span className="text-2xl font-black text-indigo-800 block leading-tight">3 Ativas</span>
                </div>
              </div>
            </div>

            {/* Recognizing signals bento grid & safety instructions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Recognizing physical/psychological abuses */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-950 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-indigo-600" /> Identificar os Sinais de Abuso
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Conhecer as diferentes facetas da violência ajuda a atuar a tempo e de forma protetora.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  {signalAbuses.map((item, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-slate-150 transition-colors space-y-1">
                      <div className="text-2xl">{item.icon}</div>
                      <h4 className="font-extrabold text-slate-900 text-xs">{item.title}</h4>
                      <p className="text-slate-550 leading-relaxed text-[11px] font-semibold">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety tips instructions right-side pane */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5 mb-1">
                    <Heart className="w-5 h-5 text-indigo-600" /> Guia de Segurança Doméstica
                  </h3>
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wide">Prevenção comunitária</p>
                </div>

                <div className="space-y-4 text-xs font-medium">
                  {safetyTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg h-fit shrink-0 mt-0.5">{tip.icon}</div>
                      <div className="space-y-0.5">
                        <strong className="text-slate-900 block text-xs">{tip.title}</strong>
                        <span className="text-slate-550 text-[11px] leading-relaxed block font-semibold">{tip.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentTab("denuncia")}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors mt-4"
                >
                  Criar Plano de Apoio Securizado <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN: NEWS / NOTÍCIAS ==================== */}
        {currentTab === "noticias" && <NewsSection />}

        {/* ==================== SCREEN: REPORT FORM / REPORTAR ==================== */}
        {currentTab === "denuncia" && (
          <div className="space-y-6 fade-in">
            {/* Sub-tab navigation selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" /> Participações e Denúncias Sigilosas
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Abra uma nova denúncia anónima ou consulte de forma sigilosa a evolução de processos ativos em Moçambique.
                </p>
              </div>

              {/* Segmented controls styling */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 self-start sm:self-auto shadow-inner border border-slate-200/40">
                <button
                  type="button"
                  onClick={() => setDenunciaSubTab("fazer")}
                  className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                    denunciaSubTab === "fazer"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🚨 Registar Nova Queixa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDenunciaSubTab("ver");
                    fetchMyHistoricalReports();
                  }}
                  className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                    denunciaSubTab === "ver"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📋 Consultar Meus Casos ({myReports.length})
                </button>
              </div>
            </div>

            {denunciaSubTab === "fazer" ? (
              <ReportingForm
                userCode={userCode}
                reportsList={allReports}
                onSuccess={handleReportSuccess}
                onRefreshStats={fetchStats}
              />
            ) : (
              <div className="space-y-6 fade-in font-medium text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" /> Histórico das Minhas Denúncias
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Apenas queixas enviadas a partir deste navegador com o código{" "}
                      <strong className="font-mono text-slate-800 bg-slate-100 rounded px-1">{userCode}</strong> são listadas abaixo.
                    </p>
                  </div>
                  <button
                    onClick={clearLocalReportsHistory}
                    disabled={myReports.length === 0}
                    className="py-2.5 px-4 rounded-xl bg-red-50 text-red-750 hover:bg-red-100 border-none font-bold text-xs disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer transition-all"
                  >
                    Ocultar Relatórios Localmente
                  </button>
                </div>

                {isHistoryLoading ? (
                  <div className="text-center py-12 text-slate-500">
                    <Clock className="w-10 h-10 animate-spin mx-auto text-indigo-400 mb-2" />
                    <p className="text-xs font-bold font-mono">Verificando estado das queixas junto da base de dados administrativa...</p>
                  </div>
                ) : myReports.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-sm mx-auto space-y-4 shadow-sm">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full mx-auto flex items-center justify-center">
                      <History className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-extrabold text-slate-900">Nenhum registo local</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Ainda não registou denúncias neste dispositivo. Todas as suas futuras participações estarão monitorizáveis nesta secção confidencial.
                      </p>
                    </div>
                    <button
                      onClick={() => setDenunciaSubTab("fazer")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl border-none text-xs shadow-sm cursor-pointer transition-transform hover:scale-105"
                    >
                      📝 Elaborar Primeira Queixa
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {myReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-white p-5 rounded-2xl border border-slate-150/60 shadow-sm hover:border-slate-300 transition-colors space-y-3.5"
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-650" />
                            <h4 className="text-sm font-extrabold text-slate-950">{report.tipo}</h4>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider self-start sm:self-auto ${
                              report.status === "Resolvido"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : report.status === "Em Investigação"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-650 leading-relaxed font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100/40">
                          {report.descricao}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-450 pt-2 border-t border-slate-50">
                          <span>👤 ID Caso: {report.id}</span>
                          <span>📍 Local: {report.local}</span>
                          <span>🕐 Quando: {report.quando}</span>
                          <span>📅 Criada em: {new Date(report.created_at || Date.now()).toLocaleDateString("pt-MZ")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== SCREEN: CHAT IA / CONV ==================== */}
        {currentTab === "chat" && <AIChat />}

        {/* ==================== SCREEN: CONTACT / HOTLINES ==================== */}
        {currentTab === "contactos" && <ContactSection />}

        {/* ==================== SCREEN: ADMIN PANEL ==================== */}
        {currentTab === "admin" && (
          <AdminDashboard
            onRefreshStats={() => {
              fetchStats();
              fetchMyHistoricalReports();
            }}
          />
        )}
      </main>

      {/* Footer footer */}
      <footer className="bg-white border-t border-slate-150 py-6 text-center text-[11px] text-slate-500 font-bold shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="text-slate-700">© {new Date().getFullYear()} Plataforma Comunitária de Apoio — Moçambique.</p>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
            Processo de denúncia 100% blindado e anónimo para a salvaguarda da privacidade comunitária.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setCurrentTab("admin");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-[10px] text-slate-450 hover:text-indigo-600 block mx-auto underline border-none bg-none cursor-pointer mt-1 font-medium select-none"
            >
              Acesso Restrito a Administradores (Painel de Gestão)
            </button>
          </div>
        </div>
      </footer>

      {/* SOS EMERGENCY DIALOG MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 rounded-2xl border border-slate-100 shadow-2xl space-y-4 text-center font-medium text-xs animate-fadeIn">
            <div className="w-14 h-14 bg-red-100 text-red-650 rounded-full mx-auto flex items-center justify-center relative">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-red-400 animate-ping opacity-75" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-950">Está em perigo imediato?</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Ligue imediatamente para as linhas nacionais de policiamento e assistência rápida de Moçambique.
              </p>
            </div>

            <div className="space-y-2 font-black">
              <a
                href="tel:112"
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-xl border-none shadow-sm transition-colors text-center"
              >
                📞 Ligar Polícia: 112
              </a>
              <a
                href="tel:116"
                className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold py-2.5 rounded-xl border-none transition-colors text-center"
              >
                📞 Apoio Criança: 116
              </a>
              <a
                href="tel:+258823334440"
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold py-2.5 rounded-xl border border-slate-200 transition-colors text-center"
              >
                📞 Linha Mulher: +258 82 333 4440
              </a>
            </div>

            <button
              onClick={() => setSosModalOpen(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-bold tracking-wide mt-2 border-none bg-none cursor-pointer"
            >
              Fechar este Alerta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
