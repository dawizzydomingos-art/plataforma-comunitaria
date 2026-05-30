import React, { useState } from "react";
import { 
  Smartphone, 
  Download, 
  Shield, 
  Share2, 
  Cpu, 
  WifiOff, 
  CheckCircle2, 
  ChevronRight, 
  Smartphone as PhoneIcon,
  Bell,
  Signal,
  Wifi,
  BatteryMedium
} from "lucide-react";

interface AndroidSectionProps {
  deferredPrompt: any;
  isInstalled: boolean;
  onNavigateToTab: (tab: string) => void;
}

export const AndroidSection: React.FC<AndroidSectionProps> = ({
  deferredPrompt,
  isInstalled,
  onNavigateToTab
}) => {
  const [activeSimScreen, setActiveSimScreen] = useState<string>("inicio");
  const [mockNotification, setMockNotification] = useState<boolean>(true);
  const [installStep, setInstallStep] = useState<number>(1);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  // Trigger PWA installation prompt
  const handlePwaInstall = async () => {
    if (!deferredPrompt) {
      // Simulate fallback visual installation
      setIsInstalling(true);
      setTimeout(() => {
        setIsInstalling(false);
        setInstallSuccess(true);
      }, 1500);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Utilizador selecionou instalação: ${outcome}`);
      if (outcome === "accepted") {
        setInstallSuccess(true);
      }
    } catch (err) {
      console.error("Erro ao chamar prompt:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start fade-in font-medium text-xs text-slate-700">
      {/* LEFT COLUMN: Installation details and native characteristics (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full text-[11px] font-extrabold border border-indigo-150 shadow-sm mb-3">
            <Smartphone className="w-3.5 h-3.5" /> Aplicativo Nativo de Moçambique (Android)
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Instale a Plataforma de Apoio no Seu Android
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Transforme este site num aplicativo rápido, discreto, que não consome megas adicionais e funciona mesmo sem ligação ativa à Internet.
          </p>
        </div>

        {/* Dynamic Native PWA Installer Box */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl space-y-5 shadow-xl relative overflow-hidden border border-indigo-900/40">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Smartphone className="w-64 h-64 text-indigo-200" />
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-300">Compatibilidade PWA-APK</span>
            </div>
            <h3 className="text-base font-black tracking-tight text-white">
              {installSuccess 
                ? "🎉 Aplicativo Instalado com Sucesso!" 
                : isInstalled 
                ? "Aplicativo Já Ativo no Seu Android" 
                : "Descarregar Aplicação Direta — Menos de 1 MB"}
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed font-medium">
              A nossa tecnologia cria uma ponte nativa de Android que empacota o site com toda a segurança. Perfeito para manter no seu ecrã inicial de forma invisível.
            </p>
          </div>

          <div className="pt-2 relative z-10">
            {installSuccess ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-xs text-emerald-200">Pronto a Usar!</p>
                  <p className="text-[11px] text-slate-350 leading-normal">
                    Pode agora encontrar o ícone vermelho & azul <strong>"Apoio MZ"</strong> na sua gaveta oficial de aplicações do seu Android.
                  </p>
                </div>
              </div>
            ) : isInstalled ? (
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-xs text-slate-200">Uso Autónomo Ativo</p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Excelente! Está a correr esta aplicação em modo PWA Standalone de Android. Todas as barras de navegação do browser foram suprimidas para a sua inteira privacidade.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePwaInstall}
                  disabled={isInstalling}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 px-6 rounded-xl text-xs border-none cursor-pointer transition-all shadow-lg active:scale-98 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isInstalling ? "A criar ponte no Android..." : "Instalar Aplicação no Meu Android"}
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById("passo-a-passo");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-white/10 hover:bg-white/15 text-white font-bold py-3 px-5 rounded-xl text-xs border-none cursor-pointer transition-colors"
                >
                  Ver Instruções Manuais
                </button>
              </div>
            )}
          </div>

          {!deferredPrompt && !isInstalled && !installSuccess && (
            <div className="text-[10px] text-indigo-300 font-semibold bg-indigo-950/60 p-3 rounded-xl border border-indigo-900/40">
              💡 <strong>Nota Técnica:</strong> Se estiver no PC ou a usar o emulador de desenvolvimento, pode instalar acedendo ao ícone de download (ecrã com seta para baixo) na barra de pesquisa do seu navegador Chrome.
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-150/40 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-xs">Disfarce de Segurança</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              O aplicativo é leve e pode ser configurado com o disfarce de atalho discreto para proteger a sua inteira segurança familiar.
            </p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-150/40 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <WifiOff className="w-4.5 h-4.5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-xs text-emerald-700">Modo Offline e Sem Megas</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Carrega instantaneamente mesmo sem megas ativos no saldo mcel/Vodacom/tmcel, salvaguardando acesso aos contactos de urgência nacionais.
            </p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-150/40 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-4.5 h-4.5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-xs">Consumo de Bateria Mínimo</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Optimizado para telemóveis Android de todos os orçamentos (Itel, Tecno, etc.), preservando o ecrã e a saúde da bateria.
            </p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-150/40 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-xs">Atualizações Automáticas</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Não precisa de ir à Google Play Store gastar saldo extra para actualizar. Sempre que o site melhora, o seu App actualiza-se sozinho e em silêncio.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div id="passo-a-passo" className="bg-white p-6 rounded-3xl border border-slate-150/45 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-indigo-600" /> Como Instalar Manualmente em 30 Segundos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs select-none">1</span>
              <h5 className="font-extrabold text-slate-900 text-xs">Abra no Chrome</h5>
              <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                Navegue até à nossa plataforma pelo seu telemóvel Android usando o Chrome ou Samsung Web.
              </p>
            </div>

            <div className="space-y-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs select-none">2</span>
              <h5 className="font-extrabold text-slate-900 text-xs">Aceda ao Menu</h5>
              <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                Toque nos três pontos verticais ou horizontais (<strong>⋮</strong>) localizados no canto superior direito do seu navegador.
              </p>
            </div>

            <div className="space-y-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs select-none">3</span>
              <h5 className="font-extrabold text-slate-900 text-xs">Adicionar ao Ecrã</h5>
              <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                Clique na opção <strong>"Instalar aplicação"</strong> ou <strong>"Adicionar ao ecrã principal"</strong> e confirme.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Smartphone Emulator Mockup (5 cols) */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <span className="text-[11px] text-slate-450 font-bold mb-3 uppercase tracking-wider block">
          📱 Simulador Android em Tempo Real
        </span>

        {/* Outer Phone Frame */}
        <div className="w-[290px] h-[585px] bg-slate-950 rounded-[40px] p-3 shadow-2xl relative border-4 border-slate-800/80 ring-10 ring-slate-900 flex flex-col">
          {/* Top Notch Camera */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-45 flex items-center justify-between px-3">
            <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
            <span className="w-2.5 h-1.5 bg-slate-900 rounded-full" />
          </div>

          {/* Time & Connectivity display inside phone top bar */}
          <div className="flex justify-between items-center px-4 pt-1.5 pb-2 text-[10px] text-white/95 font-black font-mono select-none z-30">
            <span>11:24</span>
            <div className="flex items-center gap-1 opacity-90">
              <Wifi className="w-3 h-3" />
              <Signal className="w-3 h-3" />
              <div className="flex items-center gap-0.5">
                <BatteryMedium className="w-3.5 h-3.5 rotate-90 scale-95 origin-center text-emerald-450" />
              </div>
            </div>
          </div>

          {/* Simulated App screen container */}
          <div className="flex-1 bg-slate-50 rounded-[28px] overflow-hidden flex flex-col relative select-none border border-slate-900/10">
            
            {/* Phone Mock Header */}
            <div className="bg-indigo-950 text-white p-3.5 pt-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-red-500 to-indigo-600 flex items-center justify-center text-white font-black text-[10px]">
                  PC
                </div>
                <div>
                  <h4 className="font-extrabold text-[10px] leading-tight text-white">Apoio MZ</h4>
                  <span className="text-[7px] text-indigo-300 block font-semibold">Comunidade Moçambique</span>
                </div>
              </div>
              <button 
                onClick={() => setMockNotification(!mockNotification)}
                className="text-white hover:text-indigo-200 border-none bg-none p-0 relative cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                {mockNotification && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-indigo-950" />
                )}
              </button>
            </div>

            {/* Notification push drawer (Simulated Android Push notification) */}
            {mockNotification && (
              <div className="mx-2 mt-2 bg-white/95 backdrop-blur-sm shadow-md border border-slate-100 p-2.5 rounded-xl flex items-start gap-2.5 relative z-20 animate-bounce">
                <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Shield className="w-3 h-3" />
                </div>
                <div className="flex-1 space-y-0.5 text-left">
                  <p className="text-[9px] font-black text-slate-900 leading-none">Contacto Seguro de Alerta</p>
                  <p className="text-[8px] text-slate-500 leading-normal font-semibold">
                    Se estiver em perigo imediato, ligue para a Linha 112 da Polícia. 
                  </p>
                </div>
                <button 
                  onClick={() => setMockNotification(false)}
                  className="text-slate-400 hover:text-slate-650 font-bold border-none bg-transparent p-0 flex text-xs cursor-pointer select-none"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Simulated Interactive Mobile Screen Content based on activeSimScreen state */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-left">
              
              {activeSimScreen === "inicio" ? (
                <div className="space-y-3 animate-fadeIn">
                  <div className="bg-gradient-to-tr from-indigo-700 to-blue-800 text-white p-3 rounded-2xl space-y-1.5 text-center">
                    <span className="text-[7px] bg-white/15 px-1.5 py-0.5 rounded-full font-bold">Moçambique Seguro</span>
                    <h5 className="text-[10px] font-black">Balanço de Casos Comunitários</h5>
                    <p className="text-[8px] text-indigo-150 leading-relaxed font-semibold">
                      Com o seu apoio anónimo, ajudamos a proteger mais de 150 mulheres e crianças este mês.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h6 className="text-[9px] font-black text-slate-900 uppercase">Alertas Ativos</h6>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150/50 space-y-1 shadow-sm">
                      <div className="flex items-center gap-1 text-[8px] text-red-655 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Aviso de Proteção
                      </div>
                      <p className="text-[9px] text-slate-800 font-bold">Guardar Códigos Sigilosos</p>
                      <p className="text-[8px] text-slate-500 leading-relaxed">
                        Copie sempre o seu código de candidatura confidencial para verificar as queixas mais tarde.
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-50 hover:bg-red-100/75 border border-red-100 p-2.5 rounded-xl flex items-center justify-between cursor-pointer" onClick={() => setActiveSimScreen("denuncia")}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🚨</span>
                      <div>
                        <p className="text-[9px] font-black text-red-950">Denunciar Incidente</p>
                        <p className="text-[7px] text-red-750">Registar queixa sigilosa</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-red-500" />
                  </div>
                </div>
              ) : activeSimScreen === "chat" ? (
                <div className="space-y-3 animate-fadeIn">
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    <div className="bg-indigo-50 border border-indigo-100/50 p-2 rounded-xl rounded-tl-none font-semibold text-[8px] text-indigo-950 max-w-[85%] self-start leading-relaxed">
                      Olá! Sou o seu Assistente de Apoio de Moçambique. Como se sente hoje? Pode conversar comigo em segredo absoluto.
                    </div>
                    <div className="bg-white border border-slate-150/40 p-2 rounded-xl rounded-tr-none font-semibold text-[8px] text-slate-800 max-w-[85%] ml-auto text-right leading-relaxed">
                      Sinto-me inseguro/a na minha própria casa de família. O que posso fazer em Moçambique?
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100/50 p-2 rounded-xl rounded-tl-none font-semibold text-[8px] text-indigo-950 max-w-[85%] self-start leading-relaxed">
                      Sinto muito por estar a passar por isso. Saiba que a Lei contra Violência Doméstica protege-o/a. Recomendo registar uma denúncia anónima no menu superior ou ligar 112 imediatamente.
                    </div>
                  </div>

                  <div className="flex gap-1.5 border-t border-slate-100 pt-2 shrink-0">
                    <input 
                      type="text" 
                      placeholder="Converse em sigilo..." 
                      disabled
                      className="flex-1 bg-white text-[8px] border border-slate-150/80 rounded-lg p-1 px-2 focus:outline-none"
                    />
                    <button className="bg-indigo-600 text-[8px] text-white font-bold p-1 px-2.5 rounded-lg border-none cursor-pointer">OK</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-fadeIn">
                  <span className="text-[7px] uppercase tracking-wide bg-red-50 text-red-800 px-1.5 py-0.5 rounded-full font-bold">Canais Rápidos</span>
                  <h5 className="text-[9px] font-black text-slate-900 leading-tight">Envio de Denúncia Segura</h5>
                  
                  <div className="space-y-2">
                    <div className="space-y-1 font-semibold">
                      <label className="text-[8px] text-slate-500 block">Tipo de Incidente em Moçambique</label>
                      <select disabled className="w-full bg-white border border-slate-150/80 rounded-lg text-[8px] p-1 text-slate-850">
                        <option>Violência doméstica</option>
                      </select>
                    </div>

                    <div className="space-y-1 font-semibold">
                      <label className="text-[8px] text-slate-500 block">Descrição Sumária</label>
                      <textarea 
                        disabled 
                        placeholder="Relato sumário..." 
                        className="w-full h-10 bg-white border border-slate-150/80 rounded-lg text-[8px] p-1 focus:outline-none"
                      />
                    </div>

                    <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-lg border-none text-[8px] transition-colors cursor-pointer text-center">
                      Submeter Queixa Anónima
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Simulated Android App Bottom Navigation Bar inside phone */}
            <div className="bg-white border-t border-slate-150 flex items-center justify-around py-2 shrink-0 shadow-inner">
              <button 
                onClick={() => setActiveSimScreen("inicio")}
                className={`flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer ${
                  activeSimScreen === "inicio" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-650"
                }`}
              >
                <span className="text-[10px]">🏠</span>
                <span className="text-[7px] scale-90">Início</span>
              </button>
              
              <button 
                onClick={() => setActiveSimScreen("denuncia")}
                className={`flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer ${
                  activeSimScreen === "denuncia" ? "text-red-650 font-bold" : "text-slate-400 hover:text-red-500"
                }`}
              >
                <span className="text-[10px]">🚨</span>
                <span className="text-[7px] scale-90">Queixa</span>
              </button>

              <button 
                onClick={() => setActiveSimScreen("chat")}
                className={`flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer ${
                  activeSimScreen === "chat" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-650"
                }`}
              >
                <span className="text-[10px]">💬</span>
                <span className="text-[7px] scale-90">Chat IA</span>
              </button>
            </div>

            {/* Simulated Android System Soft Navigation Keys */}
            <div className="bg-slate-900 py-1.5 flex justify-around items-center shrink-0 border-t border-slate-950/20">
              <div className="w-2.5 h-2.5 border border-white/60 rounded-sm" />
              <div className="w-2.5 h-2.5 border border-white/60 rounded-full" />
              <div className="w-1.5 h-2 w-2 bg-transparent border-y-2 border-l-2 border-white/60 rotate-45 rounded-bl-sm" />
            </div>

          </div>
        </div>

        {/* Quick Back to Site Call to action */}
        <button 
          onClick={() => onNavigateToTab("inicio")}
          className="mt-4 text-[11px] text-indigo-600 underline font-semibold flex items-center gap-1 border-none bg-none cursor-pointer hover:text-indigo-700 transition-colors"
        >
          Voltar para o Portal Principal Web
        </button>
      </div>
    </div>
  );
};
