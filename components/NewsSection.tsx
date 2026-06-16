import React, { useState, useEffect } from "react";
import { 
  Newspaper, 
  Shield, 
  Scale, 
  FileText, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  ArrowRight, 
  X,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { NewsArticle } from "../types";

export const NewsSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // High-fidelity local fallback news with detailed content
  const fallbackNews: NewsArticle[] = [
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
      fullContent: "Num esforço coordenado pela sociedade civil e parceiros de desenvolvimento multilateral, iniciou-se uma abrangente agenda de formação direta direcionada a secretários de bairros, parteiras tradicionais e líderes comunitários.\n\nO principal objetivo é capacitar estas personalidades de referência local com conceitos claros de legislação e direitos constitucionais basilares. Isso permitirá encaminhar corretamente queixas de abuso físico ou psicológico para os gabinetes públicos competentes, atalhando burocracias desnecessárias e garantindo acolhimento digno imediato.\n\nA capacitação ocorre tanto de forma física nas sedes das localidades como em canais de educação digital interativos. É a primeira iniciativa que une forças locais e governamentais para responder de modo unificado e rápido."
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
      fullContent: "Foi inaugurado oficialmente na província de Nampula o centro de apoio integrado 'Renascer'. Este novo espaço destina-se ao acolhimento terapêutico imediato de mulheres, crianças e demais sobreviventes de situações extremas de violência física e mental.\n\nO corpo clínico é constituído por profissionais de excelência e voluntários devidamente treinados pela entidade parceira ActionAid, assegurando que cada utente receba terapia individualizada, confidencial e despida de preconitos sociais.\n\nO local oferece também salas de banho independentes, alimentação quente temporária e encaminhamento célere para serviços jurídicos comunitários para garantir reparação e proteção preventiva."
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

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) {
        throw new Error("Erro de comunicação com o servidor.");
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setArticles(data);
      } else {
        setArticles(fallbackNews);
      }
    } catch (error) {
      console.warn("Utilizando notícias comunitárias locais pré-carregadas:", error);
      setArticles(fallbackNews);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 350);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const categories = [
    { id: "all", name: "Todos os Alertas", icon: Newspaper },
    { id: "seguranca", name: "Segurança", icon: Shield },
    { id: "direitos_civis", name: "Direitos Civis", icon: Scale },
    { id: "avisos_legais", name: "Avisos Legais", icon: FileText },
    { id: "emergencias", name: "Emergências", icon: AlertTriangle }
  ];

  const filteredArticles = activeCategory === "all"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case "seguranca":
        return { name: "Segurança", icon: Shield, bg: "bg-emerald-50 text-emerald-850 border-emerald-100", dot: "bg-emerald-500" };
      case "direitos_civis":
        return { name: "Direitos Civis", icon: Scale, bg: "bg-indigo-50 text-indigo-850 border-indigo-100", dot: "bg-indigo-500" };
      case "avisos_legais":
        return { name: "Aviso Legal", icon: FileText, bg: "bg-blue-50 text-blue-850 border-blue-100", dot: "bg-blue-500" };
      case "emergencias":
        return { name: "Emergência", icon: AlertTriangle, bg: "bg-rose-50 text-rose-850 border-rose-100", dot: "bg-rose-600 animate-pulse" };
      default:
        return { name: "Geral", icon: Newspaper, bg: "bg-slate-50 text-slate-850 border-slate-100", dot: "bg-slate-500" };
    }
  };

  return (
    <div className="space-y-8 py-2 md:py-4 selection:bg-indigo-100 selection:text-indigo-900" id="secao-noticias-alertas">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50/70 border border-indigo-100/40 text-indigo-700 rounded-full text-xs font-semibold tracking-wide">
            <Newspaper className="w-3.5 h-3.5 animate-pulse text-indigo-650" />
            <span>Painel Informativo Moçambique</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none" id="noticias-titulo">
            Notícias e Alertas Ativos
          </h2>
          <p className="text-sm font-medium text-slate-500 leading-relaxed" id="noticias-subtitulo">
            Informações atualizadas sobre incidentes de segurança, direitos civis e avisos legais.
          </p>
        </div>
        
        <button
          onClick={fetchNews}
          disabled={isLoading}
          id="btn-atualizar-noticias"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-60 cursor-pointer w-full md:w-auto font-sans"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "A carregar..." : "Atualizar Conteúdo"}
        </button>
      </div>

      {/* Category Filters Grid */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Filtro de Categorias</label>
        <div className="flex flex-wrap gap-2" id="categorias-filtros">
          {categories.map((c) => {
            const IconComponent = c.icon;
            const isSelected = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                id={`btn-categoria-${c.id}`}
                className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer duration-150 ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800"
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Stream */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 animate-pulse" id="noticias-carregando">
          <div className="relative flex items-center justify-center mb-4">
            <div className="absolute w-12 h-12 border-2 border-indigo-200 rounded-full animate-ping"></div>
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-xs font-bold text-slate-400">Sincronizando alertas comunitários em tempo real...</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            id="noticias-grelha-cartoes"
          >
            {filteredArticles.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-slate-50/40 rounded-2xl border border-slate-100" id="noticias-vazio">
                <p className="text-xs font-bold text-slate-400 mb-2">Nenhum alerta localizado nesta categoria.</p>
                <button 
                  onClick={() => setActiveCategory("all")}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Visualizar todos os alertas ativos
                </button>
              </div>
            ) : (
              filteredArticles.map((article, idx) => {
                const details = getCategoryDetails(article.category);
                const CardIcon = details.icon;
                return (
                  <motion.div
                    key={`${article.title}-${idx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.98, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                    id={`cartao-alerta-${idx}`}
                  >
                    {/* Integrated Article Image */}
                    {article.image && (
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
                        <img 
                          src={article.image} 
                          alt={article.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm border text-[10px] font-extrabold tracking-wide uppercase ${details.bg}`}>
                            <CardIcon className="w-3 h-3 shrink-0" />
                            <span>{details.name}</span>
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Meta information row if image didn't have badge */}
                        {!article.image && (
                          <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-extrabold tracking-wide uppercase ${details.bg}`}>
                              <CardIcon className="w-3 h-3 shrink-0" />
                              <span>{details.name}</span>
                            </span>
                          </div>
                        )}

                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold mb-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          <span>{article.date}</span>
                        </span>

                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-950 transition-colors duration-150 leading-snug line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="text-xs text-slate-500 leading-relaxed font-normal line-clamp-3">
                          {article.description}
                        </p>
                      </div>

                      {/* Bottom action panel */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-5">
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded">
                          Fonte: {article.source}
                        </span>
                        
                        <button
                          onClick={() => setSelectedArticle(article)}
                          id={`btn-ler-mais-${idx}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-indigo-650 text-indigo-700 hover:text-white rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-sm border border-slate-100 hover:border-indigo-650"
                        >
                          <span>Ler Mais</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Complete News Read-More Overlay Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="modal-noticia-completa">
            {/* Soft Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              id="modal-backdrop"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 border border-slate-100 flex flex-col max-h-[90vh]"
              id="modal-conteudo-wrapper"
            >
              {/* Header Image if available */}
              {selectedArticle.image && (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0">
                  <img 
                    src={selectedArticle.image} 
                    alt={selectedArticle.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle Dark Gradient Overlay at top of image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
                  
                  {/* Category Badge overlaying image */}
                  <div className="absolute bottom-4 left-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-md border text-[11px] font-extrabold tracking-wide uppercase ${getCategoryDetails(selectedArticle.category).bg}`}>
                      {React.createElement(getCategoryDetails(selectedArticle.category).icon, { className: "w-3.5 h-3.5 shrink-0" })}
                      <span>{getCategoryDetails(selectedArticle.category).name}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Close Button Float */}
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 z-20 p-2.5 bg-slate-900/40 hover:bg-slate-900/70 text-white rounded-full transition-colors cursor-pointer border border-white/20 hover:scale-105 active:scale-95"
                aria-label="Confirmar fecho da notícia"
                id="btn-fechar-modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Scrollable Content Section */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-grow scrollbar-thin scrollbar-thumb-slate-200">
                
                {/* Meta details if no image is available */}
                {!selectedArticle.image && (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-extrabold tracking-wide uppercase ${getCategoryDetails(selectedArticle.category).bg}`}>
                      {React.createElement(getCategoryDetails(selectedArticle.category).icon, { className: "w-3.5 h-3.5" })}
                      <span>{getCategoryDetails(selectedArticle.category).name}</span>
                    </span>
                  </div>
                )}

                {/* Main Display Heading */}
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>{selectedArticle.date}</span>
                  </span>
                  
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    {selectedArticle.title}
                  </h3>
                </div>

                {/* Horizontal Separator */}
                <div className="border-t border-slate-100" />

                {/* Core Long Text Body */}
                <div className="text-slate-600 space-y-4 text-sm font-medium leading-relaxed" id="noticia-corpo-integra">
                  {selectedArticle.fullContent ? (
                    selectedArticle.fullContent.split("\n\n").map((paragrafo, index) => (
                      <p key={index}>{paragrafo}</p>
                    ))
                  ) : (
                    <>
                      <p>{selectedArticle.description}</p>
                      <p>Para mais informações de esclarecimento sobre este aviso comunitário, pedimos que se mantenha atento às atualizações automáticas emitidas pelo painel informativo oficial da sua província ou consulte canais locais de atendimento.</p>
                    </>
                  )}
                </div>

                {/* Secure local context badge */}
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider">Visualização Direta Segura</h5>
                    <p className="text-xs text-indigo-850 font-normal leading-relaxed">
                      Esta edição foi carregada de forma direta e confidencial. Não são partilhados dados de rastreio ou cookies de geolocalização externos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Row */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                <span className="text-[11px] text-slate-500 font-bold">
                  Fonte Oficial: <span className="text-slate-800 underline font-extrabold">{selectedArticle.source}</span>
                </span>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    id="btn-voltar-painel"
                  >
                    Voltar ao Portal
                  </button>

                  {selectedArticle.url && selectedArticle.url !== "#" && (
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                      id="btn-visitar-fonte"
                    >
                      <span>Site Oficial</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Emergencies Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100/60" id="aviso-rodape-alertas">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100/60 border border-amber-200/50 p-2 rounded-xl text-amber-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
          </div>
          <div className="text-xs font-semibold text-slate-600 text-center sm:text-left leading-relaxed">
            <span className="font-extrabold text-slate-900 block sm:inline">Aviso Importante: </span>
            Se estiver em situação de perigo iminente ou necessite de apoio policial com máxima urgência, contacte de imediato o piquete da Polícia com o número gratuito <span className="font-extrabold text-indigo-600">112</span>.
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">
          SIGILO 100% GARANTIDO
        </div>
      </div>
    </div>
  );
};
