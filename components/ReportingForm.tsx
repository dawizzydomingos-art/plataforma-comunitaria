import React, { useState, useEffect } from "react";
import { Shield, Eye, CheckCircle, AlertTriangle, FileText, Trash2, Clock, Phone, User } from "lucide-react";
import type { Report } from "../types";

interface ReportingFormProps {
  userCode: string;
  onSuccess: () => void;
  reportsList: Report[];
  onRefreshStats: () => void;
}

export const ReportingForm: React.FC<ReportingFormProps> = ({
  userCode,
  onSuccess,
  reportsList,
  onRefreshStats
}) => {
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [quando, setQuando] = useState("");
  const [testemunhas, setTestemunhas] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedCode, setSubmittedCode] = useState("");

  // New states for GPS tracking and reporter name
  const [nomeDenunciante, setNomeDenunciante] = useState("");


  const incidentTypes = [
    "Violência doméstica",
    "Abuso sexual",
    "Assalto / Roubo",
    "Ameaça / Intimidação",
    "Tráfico ou recrutamento forçado",
    "Trabalho infantil",
    "Abuso contra idosos",
    "Discriminação de género/etnia",
    "Outro incidente de violência"
  ];

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo) {
      triggerToast("Selecione o tipo de incidente antes de submeter.", "error");
      return;
    }
    if (!descricao.trim()) {
      triggerToast("A descrição detalhada é obrigatória.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          local,
          quando,
          testemunhas,
          descricao,
          user_code: userCode,
          nome_denunciante: nomeDenunciante.trim() || undefined,
          latitude: undefined,
          longitude: undefined,
          precisao: undefined,
          endereco_completo: undefined,
          google_maps_link: undefined,
          data_local: undefined,
          hora_local: undefined
        })
      });

      if (!response.ok) {
        throw new Error("Não foi possível registar a denúncia no servidor.");
      }

      const data = await response.json();
      if (data.success) {
        setSubmittedCode(userCode);
        setTipo("");
        setLocal("");
        setQuando("");
        setTestemunhas("");
        setDescricao("");
        setNomeDenunciante("");

        setShowSuccessModal(true); // Open the beautiful stylized modal
        onRefreshStats();
      } else {
        throw new Error(data.error || "Erro desconhecido.");
      }
    } catch (err: any) {
      triggerToast(err.message || "Ocorreu um erro de ligação.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {notification && (
        <div
          className={`p-4 rounded-xl shadow-md border flex items-center gap-3 transition-all duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <span className="text-sm font-medium">{notification.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Preencher Ficha Demográfica</h2>
              <p className="text-xs text-slate-500 font-medium">As suas informações são tratadas de forma 100% anónima.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Nome do Denunciante (Opcional)
              </label>
              <input
                type="text"
                placeholder="Escreva o seu nome se preferir identificar-se (deixe em branco para manter sigilo absoluto)"
                value={nomeDenunciante}
                onChange={(e) => setNomeDenunciante(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tipo de Incidente *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              >
                <option value="">— selecione o tipo de violência/abuso —</option>
                {incidentTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Localização (bairro, rua, província)
                </label>
                <input
                  type="text"
                  placeholder="Exemplo: Bairro Central, Beira, Sofala"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Quando aconteceu?
                </label>
                <input
                  type="text"
                  placeholder="Exemplo: Ontem à tarde, ou 15/05/2026"
                  value={quando}
                  onChange={(e) => setQuando(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Existem testemunhas?
                </label>
                <input
                  type="text"
                  placeholder="Exemplo: Vizinhos ou familiares"
                  value={testemunhas}
                  onChange={(e) => setTestemunhas(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Descrição Detalhada do Caso *
              </label>
              <textarea
                placeholder="Explique o incidente com o máximo de detalhe possível para ajudar na investigação (ex: pessoas envolvidas, gravidade, ameaças proferidas, etc.). Nunca adicione os seus dados reais."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 h-32 resize-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>

            <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3.5 text-red-950">
              <Eye className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold block">Conselho de Anonimato Completo</span>
                <span className="leading-relaxed opacity-90 block">
                  A nossa plataforma nunca regista o seu IP ou identidade real. Para monitorizar a evolução da queixa, use o seguinte código anónimo exclusivo:
                </span>
                <span className="font-mono font-bold tracking-wider text-sm block mt-1 select-all bg-white py-1 px-2.5 rounded-lg border border-red-200 w-fit">
                  {userCode}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold py-3.5 px-5 rounded-xl border-none shadow-lg shadow-red-105 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" /> Enviando Denúncia de Forma Segura...
                </>
              ) : (
                <span className="flex items-center gap-2 justify-center"><Shield className="w-4 h-4 text-white" /> Enviar Denúncia de Forma Segura</span>
              )}
            </button>
          </form>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white text-black p-6 rounded-2xl shadow-2xl space-y-4 border border-slate-200/80 animate-float-slow">
            <h3 className="text-base font-black flex items-center gap-2 uppercase tracking-wide text-black">
              <AlertTriangle className="w-5 h-5 animate-pulse text-red-600" /> Está em perigo imediato?
            </h3>
            <p className="text-xs text-slate-800 leading-relaxed font-bold">
              Se a sua integridade física ou a vida de terceiros estiver sob ameaça eminente AGORA, por favor não preencha apenas a denúncia neste site. Telefone com a maior urgência!
            </p>
            <div className="space-y-2">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black py-3.5 px-4 rounded-xl text-sm border-none shadow-md transition-all text-center uppercase tracking-wider cursor-pointer"
              >
                <Phone className="w-4 h-4 text-white" /> Ligar 112 — Polícia
              </a>
              <a
                href="tel:+258823334440"
                className="flex items-center justify-center gap-2 w-full bg-indigo-950 hover:bg-indigo-900 text-white font-black py-2.5 px-4 rounded-xl text-xs border border-indigo-900 transition-all text-center uppercase tracking-wider cursor-pointer"
              >
                <Phone className="w-4 h-4 text-indigo-200" /> Ligar LAC (+258 82 333 4440)
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-600" /> Como funciona o processo?
            </h3>
            <div className="space-y-4 text-xs text-slate-600 font-medium">
              <div className="relative pl-7">
                <div className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                  1
                </div>
                <strong className="text-slate-950 block">Submissão Anónima</strong>
                A queixa é inserida no nosso sistema central. Nenhuns dados adicionais sobre si são guardados.
              </div>
              <div className="relative pl-7">
                <div className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[10px] flex items-center justify-center">
                  2
                </div>
                <strong className="text-slate-950 block">Análise Administrativa</strong>
                O administrador único lê a queixa pormenorizadamente no painel reservado e avalia a intervenção.
              </div>
              <div className="relative pl-7">
                <div className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] flex items-center justify-center">
                  3
                </div>
                <strong className="text-slate-950 block">Encaminhamento Legal</strong>
                A denúncia é reportada às esquadras regionais ou equipas de apoio para as devidas acções no local.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL OVERLAY */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-center p-8 space-y-6 animate-fadeIn">
            
            {/* Elegant Success Icon Ring */}
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center relative shadow-inner">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
              <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-35" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Submetido com Sucesso!
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight pt-1">
                Denúncia de Violência Registada
              </h3>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold max-w-sm mx-auto">
                A sua denúncia foi encriptada e guardada com êxito na base de dados administrativa e sincronizada. Os administradores irão rever o conteúdo com sigilo absoluto.
              </p>
            </div>

            {/* Code Highlight Box */}
            <div className="p-4 bg-slate-50 border border-slate-150/60 rounded-xl space-y-2 max-w-sm mx-auto text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                Código Anónimo de Acompanhamento:
              </span>
              <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 p-2.5 rounded-lg">
                <span className="font-mono font-black text-sm tracking-widest text-slate-900 select-all">
                  {submittedCode}
                </span>
                <span className="text-[9px] font-extrabold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150">
                  Guardado
                </span>
              </div>
              <p className="text-[9px] text-slate-450 leading-snug font-medium pt-1">
                ⚠️ <strong>Guarde este código de utente!</strong> Terá de o introduzir sempre que pretender consultar o progresso do seu caso sem revelar a sua identidade.
              </p>
            </div>

            {/* Privacy Safeguard Notice */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl max-w-sm mx-auto text-[10px] leading-snug font-semibold text-indigo-950 flex items-start gap-2.5 text-left">
              <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Privacidade Blindada:</strong> O seu IP de ligação e as especificidades do browser foram limpos. O canal de segurança com o Google Sheets foi acionado com segurança.
              </span>
            </div>

            {/* Continue Button */}
            <div className="pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onSuccess(); // triggers the history check tab automatically
                }}
                className="w-full bg-blue-600 hover:bg-black active:bg-black text-white font-extrabold py-3.5 px-5 rounded-xl text-xs border-none shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-black hover:scale-[1.01] transition-all cursor-pointer"
              >
                Entendido, Acompanhar Caso 🔍
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
