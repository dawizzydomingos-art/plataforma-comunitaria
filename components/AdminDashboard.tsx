import React, { useState, useEffect } from "react";
import { Lock, Unlock, ShieldAlert, BarChart3, Search, Calendar, MapPin, Eye, Check, AlertCircle, Trash2, RefreshCw, Layers } from "lucide-react";
import type { Report } from "../types";

interface AdminDashboardProps {
  onRefreshStats: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onRefreshStats }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/reports", {
        headers: {
          "x-admin-password": password || localStorage.getItem("admin_session_auth") || ""
        }
      });

      if (!response.ok) {
        throw new Error("Palavra-passe administrativa inválida.");
      }

      const data = await response.json();
      setReports(data);
      setIsAuthenticated(true);
      if (password) {
        localStorage.setItem("admin_session_auth", password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de ligação com o servidor.");
      localStorage.removeItem("admin_session_auth");
    } finally {
      setIsLoading(false);
    }
  };

  // Check auto-login on mount
  useEffect(() => {
    const cachedPass = localStorage.getItem("admin_session_auth");
    if (cachedPass) {
      setIsLoading(true);
      fetch("/api/reports", {
        headers: { "x-admin-password": cachedPass }
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error("Invalid cached pass");
        })
        .then((data) => {
          setReports(data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem("admin_session_auth");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_session_auth");
    setPassword("");
    setReports([]);
    setIsAuthenticated(false);
  };

  const showActionStatus = (text: string, type: "success" | "error" = "success") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleUpdateStatus = async (id: string, newStatus: "Recebido" | "Em Investigação" | "Resolvido") => {
    const authHeaders: any = {
      "Content-Type": "application/json",
      "x-admin-password": password || localStorage.getItem("admin_session_auth") || ""
    };

    try {
      const res = await fetch(`/api/reports/${id}/status`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error("Falha ao atualizar o estado.");
      }

      // Update local state representation
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      showActionStatus(`O estado da denúncia foi atualizado para "${newStatus}".`);
      onRefreshStats();
    } catch (err: any) {
      showActionStatus(err.message || "Não foi possível cumprir a ação.", "error");
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("Pretende realmente apagar esta denúncia em definitivo? Esta ação não pode ser desfeita.")) {
      return;
    }

    const authHeaders: any = {
      "x-admin-password": password || localStorage.getItem("admin_session_auth") || ""
    };

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });

      if (!res.ok) {
        throw new Error("Falha ao apagar registo.");
      }

      setReports((prev) => prev.filter((r) => r.id !== id));
      showActionStatus("Denúncia apagada do sistema de forma segura.");
      onRefreshStats();
    } catch (err: any) {
      showActionStatus(err.message || "Não foi possível cumprir a ação.", "error");
    }
  };

  // Aggregation Calculations for Analytics
  const totalCount = reports.length;
  const resolvedCount = reports.filter((r) => r.status === "Resolvido").length;
  const investigatingCount = reports.filter((r) => r.status === "Em Investigação").length;
  const receivedCount = reports.filter((r) => r.status === "Recebido").length;

  // Types breakdown grouped map
  const typeDistribution: { [key: string]: number } = {};
  reports.forEach((r) => {
    typeDistribution[r.tipo] = (typeDistribution[r.tipo] || 0) + 1;
  });

  // Filter lists based on search parameter & tabs selection
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.local.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "resolved" && r.status === "Resolvido") ||
      (statusFilter === "investigating" && r.status === "Em Investigação") ||
      (statusFilter === "received" && r.status === "Recebido");

    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 fade-in">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-red-50 text-red-650 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Portal do Administrador</h2>
            <p className="text-xs text-slate-500 font-medium">Insira a palavra-passe para aceder às denúncias anónimas.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Palavra-passe
              </label>
              <input
                type="password"
                placeholder="Insira palavra-passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-850 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
              {errorMsg && <p className="text-xs font-bold text-red-600 mt-2 flex items-center gap-1">⚠ {errorMsg}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-5 rounded-xl border-none shadow-md hover:scale-[1.01] transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? "Validando Acesso..." : "🔓 Aceder ao Sistema"}
            </button>
          </form>

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-center text-[10px] text-slate-450 font-semibold leading-relaxed">
            Se for o proprietário, a palavra-passe por defeito é <strong className="text-slate-700">admin</strong>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header Info */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Unlock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
              Painel de Controlo Sigiloso
              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                ADMIN
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">A monitorizar todos os eventos e reports registados na base de dados.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchReports}
            className="p-2.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200/60 cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl border-none font-bold text-xs cursor-pointer transition-all"
          >
            Sair do Painel
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl shadow-md border flex items-center gap-3 transition-all duration-300 ${
            actionMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {actionMsg.type === "success" ? (
            <Check className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <span className="text-xs font-bold">{actionMsg.text}</span>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Denúncias</span>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-[10px] text-emerald-650 font-bold uppercase tracking-wider">Casos Resolvidos</span>
          <p className="text-2xl font-black text-emerald-700">{resolvedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Em Investigação</span>
          <p className="text-2xl font-black text-amber-600">{investigatingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-[10px] text-blue-650 font-bold uppercase tracking-wider">Recebidas</span>
          <p className="text-2xl font-black text-blue-600">{receivedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table/List Database */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-5 h-5 text-slate-700" /> Registos da Base de Dados
            </h3>

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setStatusFilter("all")}
                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                  statusFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setStatusFilter("received")}
                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                  statusFilter === "received" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                Recebidas
              </button>
              <button
                onClick={() => setStatusFilter("investigating")}
                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                  statusFilter === "investigating" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                Investigando
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                  statusFilter === "resolved" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                Resolvidas
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por descrição, local ou código de utente anónimo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-slate-450 space-y-2">
              <Check className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold">Nenhum registo de denúncia encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[480px]">
              {filteredReports.map((r) => (
                <div key={r.id} className="py-4 space-y-3 font-medium text-xs">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[9px] font-mono tracking-wider font-bold">
                        {r.user_code}
                      </span>
                      <span className="font-extrabold text-slate-900">{r.tipo}</span>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          r.status === "Resolvido"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.status === "Em Investigação"
                            ? "bg-amber-50 text-amber-700 border border-amber-250"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100/40">
                    {r.descricao}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-450">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {r.local}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {r.quando}
                      </span>
                      {r.testemunhas !== "Não informado" && (
                        <span>👥 Testemunhas: {r.testemunhas}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <select
                        value={r.status}
                        onChange={(e) => handleUpdateStatus(r.id, e.target.value as any)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-[10px] cursor-pointer text-slate-700 focus:outline-none focus:border-indigo-600 transition-colors"
                      >
                        <option value="Recebido">Recebida</option>
                        <option value="Em Investigação">Investigando</option>
                        <option value="Resolvido">Resolvida</option>
                      </select>
                      <button
                        onClick={() => handleDeleteReport(r.id)}
                        className="p-1 px-1.5 text-red-600 hover:text-white hover:bg-red-600 border border-slate-200 hover:border-red-600 rounded-lg cursor-pointer transition-all"
                        title="Apagar registo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories Analysis */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-slate-700" /> Distribuição de Casos
            </h3>
            <div className="space-y-4 font-medium text-xs">
              {Object.keys(typeDistribution).length === 0 ? (
                <p className="text-slate-450 text-[11px] font-semibold text-center italic py-4">Sem informações disponíveis no momento.</p>
              ) : (
                Object.entries(typeDistribution).map(([label, count]) => {
                  const perc = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  return (
                    <div key={label} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-800 text-ellipsis overflow-hidden whitespace-nowrap">{label}</span>
                        <span className="font-bold font-mono text-slate-950">{count} ({perc}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${perc}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-red-500 to-indigo-600 transition-all duration-1000"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-5 rounded-2xl text-indigo-50 leading-relaxed space-y-3 shadow-md border-none">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-300" />
              <h4 className="font-black text-xs uppercase tracking-wide">Salvaguarda Administrativa</h4>
            </div>
            <p className="text-[11px] opacity-90 font-medium">
              Por favor note que ao apagar qualquer denúncia, os registos serão excluídos permanentemente da base de dados local. Recomendamos transferir relatórios sensíveis para sistemas de policiamento federais antes de purgar o histórico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
