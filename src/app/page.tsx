"use client";

import { useState, useEffect, useRef } from 'react';
import { Bot, User, BookOpen, Target, TreeDeciduous, Settings, LogOut, Swords, Brain, Zap, ShieldCheck, Star, PlusCircle, Edit, Trash2, Send, CheckCircle, Circle, Sparkles } from 'lucide-react';
import * as mockData from '@/lib/data';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { generateMotivationalMessage } from '@/ai/flows/generate-motivational-messages';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// --- COMPONENTES ---

const Dashboard = ({ profile }) => {
  const [aiAdvice, setAiAdvice] = useState('A analisar dados...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialMessage = async () => {
      if (!profile) return;
      setLoading(true);
      try {
        const result = await generateMotivationalMessage({
          userName: profile.nome_utilizador,
          profileData: JSON.stringify(profile)
        });
        setAiAdvice(result.message);
      } catch (e) {
        console.error("Erro ao buscar mensagem motivacional:", e);
        setAiAdvice("Erro: Não foi possível comunicar com o Sistema.");
      } finally {
        setLoading(false);
      }
    };
    getInitialMessage();
  }, [profile]);

  if (!profile) return <div className="text-center p-8 text-cyan-400">A carregar perfil...</div>;

  const xpPercentage = (profile.xp / profile.xp_para_proximo_nivel) * 100;
  const stats = [
    { name: 'Força', value: profile.estatisticas.forca, icon: Swords, color: 'text-red-400' },
    { name: 'Inteligência', value: profile.estatisticas.inteligencia, icon: Brain, color: 'text-blue-400' },
    { name: 'Destreza', value: profile.estatisticas.destreza, icon: Zap, color: 'text-yellow-400' },
    { name: 'Constituição', value: profile.estatisticas.constituicao, icon: ShieldCheck, color: 'text-green-400' },
    { name: 'Sabedoria', value: profile.estatisticas.sabedoria, icon: BookOpen, color: 'text-purple-400' },
    { name: 'Carisma', value: profile.estatisticas.carisma, icon: Star, color: 'text-pink-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-cyan-400">{profile.nome_utilizador}</h2>
                <p className="text-gray-400">Nível {profile.nivel}</p>
            </div>
        </div>
        <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>XP</span>
                <span>{profile.xp} / {profile.xp_para_proximo_nivel}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: `${xpPercentage}%` }}></div>
            </div>
        </div>
      </div>
      <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 flex items-start space-x-4">
        <Bot className="h-8 w-8 text-cyan-400 flex-shrink-0 mt-1" />
        <div>
            <h3 className="font-bold text-cyan-400">Mensagem do Sistema</h3>
             {loading ? <p className="text-gray-300 text-sm">A analisar dados...</p> : <p className="text-gray-300 text-sm">{aiAdvice}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(stat => (
          <div key={stat.name} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center space-y-2">
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
            <span className="text-gray-300 text-sm">{stat.name}</span>
            <span className="text-xl font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MetasView = ({ metas, setMetas }) => {
    const [showModal, setShowModal] = useState(false);
    const [currentMeta, setCurrentMeta] = useState(null);
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('');

    const handleOpenModal = (meta = null) => {
        setCurrentMeta(meta);
        setNome(meta ? meta.nome : '');
        setCategoria(meta ? meta.categoria : '');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentMeta(null);
        setNome('');
        setCategoria('');
    };

    const handleSave = () => {
        if (currentMeta) {
            setMetas(metas.map(m => m.id === currentMeta.id ? { ...m, nome, categoria } : m));
        } else {
            const newMeta = { id: Date.now(), nome, categoria, user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' };
            setMetas([...metas, newMeta]);
        }
        handleCloseModal();
    };

    const handleDelete = (id) => {
        setMetas(metas.filter(m => m.id !== id));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Metas</h1>
                <Button onClick={() => handleOpenModal()} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center space-x-2">
                    <PlusCircle className="h-5 w-5" />
                    <span>Adicionar Meta</span>
                </Button>
            </div>
            <p className="text-gray-400 mb-6">Estas são as suas metas de longo prazo. O Sistema irá gerar missões diárias para o ajudar a progredir nelas.</p>
            <div className="space-y-4">
                {metas.map(meta => (
                    <div key={meta.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <p className="text-lg text-gray-200">{meta.nome}</p>
                            <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">{meta.categoria}</span>
                        </div>
                        <div className="flex space-x-2">
                            <Button onClick={() => handleOpenModal(meta)} variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-400"><Edit className="h-5 w-5" /></Button>
                            <Button onClick={() => handleDelete(meta.id)} variant="ghost" size="icon" className="text-gray-400 hover:text-red-400"><Trash2 className="h-5 w-5" /></Button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 border border-cyan-500 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-cyan-400 mb-4">{currentMeta ? 'Editar Meta' : 'Nova Meta'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-400">Nome da Meta</label>
                                <Input type="text" value={nome} onChange={e => setNome(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-400">Categoria</label>
                                <Input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <Button onClick={handleCloseModal} variant="secondary">Cancelar</Button>
                            <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500">Salvar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MissionsView = ({ missions, setMissions, profile, setProfile }) => {

    const handleLevelUp = (currentProfile) => {
        const newLevel = currentProfile.nivel + 1;
        const newXp = currentProfile.xp - currentProfile.xp_para_proximo_nivel;
        const newXpToNextLevel = Math.floor(currentProfile.xp_para_proximo_nivel * 1.5);
        
        return {
            ...currentProfile,
            nivel: newLevel,
            xp: newXp,
            xp_para_proximo_nivel: newXpToNextLevel,
        };
    };

    const toggleMission = (id) => {
        let xpChange = 0;
        const updatedMissions = missions.map(m => {
            if (m.id === id && m.tipo === 'diaria') {
                xpChange = m.concluido ? -m.xp_conclusao : m.xp_conclusao;
                return { ...m, concluido: !m.concluido };
            }
            return m;
        });
        setMissions(updatedMissions);

        if (xpChange !== 0) {
            setProfile(currentProfile => {
                let updatedProfile = { ...currentProfile, xp: currentProfile.xp + xpChange };
                while (updatedProfile.xp >= updatedProfile.xp_para_proximo_nivel) {
                    updatedProfile = handleLevelUp(updatedProfile);
                }
                return updatedProfile;
            });
        }
    };

    const getRankColor = (rank) => {
        switch(rank) {
            case 'F': return 'bg-gray-600 text-gray-200';
            case 'E': return 'bg-green-700 text-green-200';
            case 'D': return 'bg-blue-700 text-blue-200';
            case 'C': return 'bg-blue-500 text-white';
            case 'B': return 'bg-purple-700 text-purple-200';
            case 'A': return 'bg-purple-500 text-white';
            case 'S': return 'bg-yellow-500 text-black';
            case 'SS': return 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg';
            case 'SSS': return 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-xl animate-pulse';
            default: return 'bg-gray-700 text-gray-400';
        }
    }

    const dailyMissions = missions.filter(m => m.tipo === 'diaria');
    const rankedMissions = missions
        .filter(m => m.rank && profile.nivel >= m.level_requirement)
        .sort((a,b) => a.level_requirement - b.level_requirement);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">Diário de Missões</h1>
            
            <div className="mb-8">
                <h2 className="text-xl font-bold text-yellow-400 mb-4">Treino Diário</h2>
                {dailyMissions.length > 0 ? dailyMissions.map(mission => (
                     <div key={mission.id} className={`bg-gray-800/50 border-l-4 ${mission.concluido ? 'border-green-500' : 'border-yellow-500'} rounded-r-lg p-4 flex items-center mb-2`}>
                        <div className="flex-shrink-0 mr-4">
                            <button onClick={() => toggleMission(mission.id)}>
                                {mission.concluido ? <CheckCircle className="h-8 w-8 text-green-500" /> : <Circle className="h-8 w-8 text-gray-500" />}
                            </button>
                        </div>
                        <div className="flex-grow">
                            <p className={`text-lg font-bold ${mission.concluido ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{mission.nome}</p>
                            <p className="text-sm text-gray-400">{mission.descricao}</p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                            <p className="text-sm font-semibold text-cyan-400">+{mission.xp_conclusao} XP</p>
                        </div>
                    </div>
                )) : <p className="text-gray-500">Nenhum treino diário gerado. Complete o treino atual para receber um novo amanhã.</p>}
            </div>

            <div>
                <h2 className="text-xl font-bold text-purple-400 mb-4">Missões Ranqueadas</h2>
                <div className="space-y-4">
                    {rankedMissions.map(mission => (
                        <div key={mission.id} className={`bg-gray-800/50 border-l-4 ${mission.concluido ? 'border-green-500' : 'border-purple-500'} rounded-r-lg p-4`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`text-lg font-bold ${mission.concluido ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{mission.nome}</p>
                                    <p className="text-sm text-gray-400">{mission.descricao}</p>
                                </div>
                                <div className="text-right ml-4 flex-shrink-0 space-y-2">
                                    <p className="text-sm font-semibold text-cyan-400">+{mission.xp_conclusao.toLocaleString('pt-PT')} XP</p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRankColor(mission.rank)}`}>Rank {mission.rank}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SkillsView = ({ skills, profile }) => {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Árvore de Habilidades</h1>
            </div>
            <div className="space-y-4">
                {skills.map(skill => (
                    <div key={skill.id} className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${skill.nivel_atual === 0 ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-lg font-bold text-gray-200">{skill.nome}</p>
                                <p className="text-sm text-gray-400">{skill.descricao}</p>
                            </div>
                            <div className="text-center ml-4">
                                <p className="text-sm text-gray-400">Nível</p>
                                <p className="text-2xl font-bold text-cyan-400">{skill.nivel_atual} / {skill.nivel_maximo}</p>
                            </div>
                        </div>
                        {skill.pre_requisito && (<p className="text-xs text-gray-500 mt-2">Requer: {skills.find(s => s.id === skill.pre_requisito)?.nome}</p>)}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AIChatView = ({ profile, metas }) => {
    const [messages, setMessages] = useState([{ sender: 'ai', text: 'Sistema online. Qual é a sua diretiva?' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { toast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
          const result = await generateSystemAdvice({
            userName: profile.nome_utilizador,
            profile: JSON.stringify(profile),
            metas: JSON.stringify(metas),
            query: input,
          });
          const aiMessage = { sender: 'ai', text: result.response };
          setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Erro ao buscar conselho da IA:", error);
            toast({
              variant: 'destructive',
              title: 'Erro de comunicação com o sistema',
              description: 'Não foi possível obter uma resposta. Tente novamente.',
            })
            setMessages(prev => [...prev, { sender: 'ai', text: 'Erro de comunicação. Verifique a sua conexão e tente novamente.'}])
        } finally {
          setIsLoading(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">Interagir com o Sistema</h1>
            <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <Bot className="h-6 w-6 text-cyan-400 flex-shrink-0" />}
                        <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-cyan-800 text-white' : 'bg-gray-700 text-gray-300'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                         {msg.sender === 'user' && <User className="h-6 w-6 text-gray-400 flex-shrink-0" />}
                    </div>
                ))}
                {isLoading && ( <div className="flex items-start gap-3"><Bot className="h-6 w-6 text-cyan-400 flex-shrink-0" /><div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-300"><div className="flex items-center space-x-2"><div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse"></div></div></div></div>)}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex items-center gap-2">
                <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Digite sua diretiva..."
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading} size="icon" className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-md disabled:bg-gray-500">
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};


export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const [profile, setProfile] = useState(null);
  const [metas, setMetas] = useState([]);
  const [missions, setMissions] = useState([]);
  const [skills, setSkills] = useState([]);
  
  useEffect(() => {
    // Simula o carregamento de dados
    setProfile(mockData.perfis[0]);
    setMetas(mockData.metas);
    setMissions(mockData.missoes);
    setSkills(mockData.habilidades);
  }, []);
  
  const NavItem = ({ icon: Icon, label, page }) => (
    <button 
      onClick={() => setCurrentPage(page)}
      className={cn(
        'w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors',
        currentPage === page ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const renderContent = () => {
    if (!profile) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-cyan-400 text-xl">A carregar sistema...</div>
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard profile={profile} />;
      case 'metas':
        return <MetasView metas={metas} setMetas={setMetas} />;
      case 'missions':
        return <MissionsView missions={missions} setMissions={setMissions} profile={profile} setProfile={setProfile} />;
      case 'skills':
        return <SkillsView skills={skills} profile={profile} />;
      case 'ai-chat':
        return <AIChatView profile={profile} metas={metas} />;
      default:
        return <Dashboard profile={profile} />;
    }
  };
  
  if (!profile) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-cyan-400 text-xl">A carregar sistema...</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-mono flex">
      <aside className="w-64 bg-gray-800/80 border-r border-gray-700/50 p-4 flex-col hidden md:flex">
        <div className="text-2xl font-bold text-cyan-400 text-center mb-8">SISTEMA</div>
        <nav className="flex-grow space-y-2">
            <NavItem icon={User} label="Dashboard" page="dashboard" />
            <NavItem icon={BookOpen} label="Metas" page="metas" />
            <NavItem icon={Target} label="Missões" page="missions" />
            <NavItem icon={TreeDeciduous} label="Habilidades" page="skills" />
            <NavItem icon={Bot} label="Interagir com IA" page="ai-chat" />
        </nav>
        <div className="mt-auto">
            <NavItem icon={Settings} label="Configurações" page="settings" />
            <button 
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Terminar Sessão</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{height: '100vh'}}>
        {renderContent()}
      </main>
    </div>
  );
}
