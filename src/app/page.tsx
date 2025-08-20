
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, User, BookOpen, Target, TreeDeciduous, Settings, LogOut, Clock, LoaderCircle } from 'lucide-react';
import * as mockData from '@/lib/data';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { DashboardView } from '@/components/views/DashboardView';
import { MetasView } from '@/components/views/MetasView';
import { MissionsView } from '@/components/views/MissionsView';
import { SkillsView } from '@/components/views/SkillsView';
import { RoutineView } from '@/components/views/RoutineView';
import { AIChatView } from '@/components/views/AIChatView';

export default function App() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const [profile, setProfile] = useState(null);
  const [metas, setMetas] = useState([]);
  const [missions, setMissions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [routine, setRoutine] = useState({});
  const [routineTemplates, setRoutineTemplates] = useState({});
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if(user) {
      const initialProfile = mockData.perfis[0];
      const initialMetas = mockData.metas;
      const initialMissions = [...mockData.missoes];
      
      const initialSkills = mockData.metas.map(meta => {
          const hasSkill = mockData.habilidades?.find(h => h.id === meta.habilidade_associada_id);
          if (hasSkill) return hasSkill;
          return {
              id: meta.habilidade_associada_id,
              nome: `Maestria em ${meta.nome}`,
              descricao: `Habilidade relacionada ao objetivo: ${meta.nome}`,
              categoria: meta.categoria,
              nivel_atual: 1, 
              nivel_maximo: 10, 
              xp_atual: 0, 
              xp_para_proximo_nivel: 50, 
              pre_requisito: null, 
              nivel_minimo_para_desbloqueio: null,
          }
      });

      const initialRoutine = mockData.rotina;
      const initialRoutineTemplates = mockData.rotinaTemplates;
      
      initialMetas.forEach(meta => {
          const hasMission = initialMissions.some(m => m.meta_associada === meta.nome);
          if (!hasMission) {
              initialMissions.push({
                  id: Date.now() + Math.random(), 
                  nome: `Missão Épica: ${meta.nome}`,
                  descricao: `Um grande passo em direção a: ${meta.nome}.`,
                  concluido: false, 
                  rank: 'E', 
                  level_requirement: 1,
                  meta_associada: meta.nome, 
                  total_missoes_diarias: 10,
                  ultima_missao_concluida_em: null,
                  missoes_diarias: [{
                      id: Date.now() + Math.random(),
                      nome: `Iniciar a jornada para "${meta.nome}"`,
                      descricao: `O primeiro passo é o mais importante. Complete esta missão para receber a sua primeira tarefa do Sistema.`,
                      xp_conclusao: 10, 
                      concluido: false, 
                      tipo: 'diaria',
                  }]
              });
          }
      });

      setProfile(initialProfile);
      setMetas(initialMetas);
      setMissions(initialMissions);
      setSkills(initialSkills);
      setRoutine(initialRoutine);
      setRoutineTemplates(initialRoutineTemplates);
    }
  }, [user]);
  
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
        return <DashboardView profile={profile} />;
      case 'metas':
        return <MetasView metas={metas} setMetas={setMetas} missions={missions} setMissions={setMissions} profile={profile} skills={skills} setSkills={setSkills} />;
      case 'missions':
        return <MissionsView missions={missions} setMissions={setMissions} profile={profile} setProfile={setProfile} metas={metas} skills={skills} setSkills={setSkills} />;
      case 'skills':
        return <SkillsView skills={skills} setSkills={setSkills} />;
      case 'routine':
        return <RoutineView routine={routine} setRoutine={setRoutine} missions={missions} routineTemplates={routineTemplates} setRoutineTemplates={setRoutineTemplates} />;
      case 'ai-chat':
        return <AIChatView profile={profile} metas={metas} routine={routine} missions={missions} />;
      default:
        return <DashboardView profile={profile} />;
    }
  };
  
  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-cyan-400">
        <LoaderCircle className="animate-spin h-10 w-10 mr-4" />
        <span className="text-xl">A validar sessão...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-mono flex">
      <aside className="w-64 bg-gray-800/80 border-r border-gray-700/50 p-4 flex-col hidden md:flex">
        <div className="text-2xl font-bold text-cyan-400 text-center mb-8">SISTEMA</div>
        <nav className="flex-grow space-y-2">
            <NavItem icon={User} label="Dashboard" page="dashboard" />
            <NavItem icon={BookOpen} label="Metas" page="metas" />
            <NavItem icon={Target} label="Missões" page="missions" />
            <NavItem icon={Clock} label="Rotina" page="routine" />
            <NavItem icon={TreeDeciduous} label="Habilidades" page="skills" />
            <NavItem icon={Bot} label="Interagir com IA" page="ai-chat" />
        </nav>
        <div className="mt-auto">
            <NavItem icon={Settings} label="Configurações" page="settings" />
            <button 
              onClick={logout}
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
