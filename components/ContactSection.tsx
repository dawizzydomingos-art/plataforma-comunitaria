import React from "react";
import { Phone, Mail, MessageSquare, ShieldAlert, Award, Radio } from "lucide-react";

export const ContactSection: React.FC = () => {
  const hotlines = [
    {
      title: "Polícia de Moçambique",
      number: "112",
      description: "Linha gratuita de emergência ativa 24 horas por dia.",
      badge: "Emergência Geral"
    },
    {
      title: "Linha de Apoio à Criança (IAC)",
      number: "116",
      description: "Linha dedicada a denunciar abusos contra crianças, violência e exploração laboral infantil.",
      badge: "Crianças e Menores"
    },
    {
      title: "Gabinete de Atendimento à Mulher e Criança local",
      number: "+258 82 333 4440",
      description: "Assistência psicossocial e aconselhamento clínico-jurídico sigiloso.",
      badge: "Violência Baseada em Género"
    }
  ];

  return (
    <div className="space-y-6 fade-in font-medium text-xs">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
          <Phone className="w-5 h-5 text-indigo-600" /> Linhas de Apoio e Contactos Rápidos
        </h2>
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Se estiver a sofrer ou presenciar qualquer violência doméstica ou abuso comunitário, utilize os seguintes canais oficiais moçambicanos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hotlines Grid */}
        <div className="lg:col-span-7 space-y-4">
          {hotlines.map((hl, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-200 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    {hl.badge}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-950">{hl.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  {hl.description}
                </p>
              </div>

              <a
                href={`tel:${hl.number.replace(/\s+/g, "")}`}
                className="bg-red-650 hover:bg-red-700 text-white font-extrabold py-3 px-5 rounded-xl border-none shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer text-xs shrink-0 transition-transform hover:scale-[1.02]"
              >
                <Phone className="w-3.5 h-3.5" /> Ligar {hl.number}
              </a>
            </div>
          ))}
        </div>

        {/* Direct Platform Admin Contacts */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
              <Mail className="w-4.5 h-4.5 text-indigo-600" /> Contactar o Responsável Directo
            </h3>
            <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
              A nossa plataforma comunitária é administrada de forma atenta. Se preferir relatar bugs na plataforma ou requerer parcerias diretas, envie mensagens eletrónicas seguras.
            </p>
            <div className="space-y-2.5">
              <a
                href="mailto:dawizzydomingos@gmail.com"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
              >
                <Mail className="w-4.5 h-4.5 text-slate-300" /> Enviar Email
              </a>
              <a
                href="https://wa.me/258869894030"
                target="_blank"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
              >
                <MessageSquare className="w-4.5 h-4.5" /> WhatsApp Direto (+258 86 989 4030)
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-150 space-y-3 shadow-inner">
            <h4 className="font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
              <Radio className="w-4.5 h-4.5 text-indigo-700" /> Rede watana integrada
            </h4>
            <p className="text-[11px] leading-relaxed text-indigo-800 font-semibold">
              Ouça a emissão comunitária da **Rádio Watana 107.0 FM** para atualizações, debates sobre direitos de género, conselhos de segurança local e campanhas de sensibilização social em Moçambique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
