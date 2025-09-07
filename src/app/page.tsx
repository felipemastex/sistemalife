

"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bot, BookOpen, Target, Settings, LogOut, Clock, BarChart3, LayoutDashboard, Menu, Award, Store, Backpack, Swords, UserSquare, Trophy, TowerControl, ListChecks, KeySquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
<<<<<<< HEAD
import { DashboardView } from '@/components/views/core/DashboardView';
import { MetasView } from '@/components/views/core/MetasView';
import { MissionsView } from '@/components/views/core/MissionsView';
import { SkillsView } from '@/components/views/core/SkillsView';
import { RoutineView } from '@/components/views/core/RoutineView';
import { AIChatView } from '@/components/views/ai/AIChatView';
import { SettingsView } from '@/components/views/player/settings/SettingsView';
=======
import { db } from '@/lib/firebase';
import { DashboardView } from '@/components/views/DashboardView';
import { MetasView } from '@/components/views/MetasView';
import { MissionsView } from '@/components/views/MissionsView';
import { SkillsView } from '@/components/views/SkillsView';
import { RoutineView } from '@/components/views/RoutineView';
import { AIChatView } from '@/components/views/AIChatView';
import { SettingsView } from '@/components/views/SettingsView';
import { GuildsView } from '@/components/views/GuildsView';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
>>>>>>> a826633 (Acha que seria bom dividir as estrutura da aba guilda?)
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { OnboardingGuide } from '@/components/custom/OnboardingGuide';
import { AchievementsView } from '@/components/views/player/AchievementsView';
import { ShopView } from '@/components/views/player/ShopView';
import { InventoryView } from '@/components/views/player/InventoryView';
import { GuildsView } from '@/components/views/social/GuildsView';
import { ClassView } from '@/components/views/player/ClassView';
import { SystemAlert } from '@/components/custom/SystemAlert';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { useIsMobile } from '@/hooks/use-mobile';
import TowerView from '@/components/views/gamification/TowerView';
import TasksView from '@/components/views/gamification/TasksView';
import { LoaderCircle, ShieldBan, WifiOff } from 'lucide-react';
import SkillDungeonView from '@/components/views/gamification/SkillDungeonView';
import { DungeonEventPrompt } from '@/components/custom/DungeonEventPrompt';
import DungeonLobbyView from '@/components/views/gamification/DungeonLobbyView';

const PushNotificationPrompt = dynamic(() => import('@/components/custom/PushNotificationPrompt').then(mod => mod.PushNotificationPrompt), { ssr: false });


export default function App() {
  const { authState, logout } = useAuth();
  const { 
      isDataLoaded,
      questNotification, systemAlert, showOnboarding,
      setQuestNotification, setSystemAlert, setShowOnboarding, persistData, profile,
      activeDungeonEvent, setCurrentPage, currentPage, clearDungeonSession
   } = usePlayerDataContext();


  const isMobile = useIsMobile();
<<<<<<< HEAD
=======
  
  const [profile, setProfile] = useState(null);
  const [metas, setMetas] = useState([]);
  const [missions, setMissions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [routine, setRoutine] = useState({});
  const [routineTemplates, setRoutineTemplates] = useState({});
  const [guilds, setGuilds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [questNotification, setQuestNotification] = useState<QuestInfoProps | null>(null);
  
  const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

  // --- PERSISTENCE FUNCTIONS ---
  const persistProfile = useCallback(async (newProfile) => {
      if (!user) return;
      
      const profileToSave = {
        ...newProfile,
        nome_utilizador: newProfile.primeiro_nome || newProfile.nome_utilizador || '',
      };

      setProfile(profileToSave);
      await setDoc(doc(db, 'users', user.uid), profileToSave, { merge: true });
  }, [user]);

  const persistMetas = useCallback(async (newMetas) => {
      if (!user) return;
      setMetas(newMetas);
      const batch = writeBatch(db);
      const metasRef = collection(db, 'users', user.uid, 'metas');
      
      const existingDocsSnapshot = await getDocs(metasRef);
      const existingIds = existingDocsSnapshot.docs.map(d => d.id);
      const newIds = newMetas.map(m => String(m.id));
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));
      
      idsToDelete.forEach(id => batch.delete(doc(metasRef, id)));
      newMetas.forEach(meta => {
          const metaDocRef = doc(metasRef, String(meta.id));
          const metaToSave = { ...meta, prazo: meta.prazo || null, concluida: meta.concluida || false };
          batch.set(metaDocRef, metaToSave);
      });
      await batch.commit();
  }, [user]);

  const persistMissions = useCallback(async (newMissions) => {
      if (!user || !Array.isArray(newMissions)) return;
      setMissions(newMissions);
      const batch = writeBatch(db);
      const missionsRef = collection(db, 'users', user.uid, 'missions');

      const existingDocsSnapshot = await getDocs(missionsRef);
      const existingIds = existingDocsSnapshot.docs.map(d => d.id);
      const newIds = newMissions.map(m => String(m.id));
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));

      idsToDelete.forEach(id => batch.delete(doc(missionsRef, id)));
      newMissions.forEach(mission => {
          const missionDocRef = doc(missionsRef, String(mission.id));
          batch.set(missionDocRef, mission);
      });
      await batch.commit();
  }, [user]);
  
  const persistSkills = useCallback(async (newSkills) => {
      if (!user || !Array.isArray(newSkills)) return;
      setSkills(newSkills);
      const batch = writeBatch(db);
      const skillsRef = collection(db, 'users', user.uid, 'skills');

      const existingDocsSnapshot = await getDocs(skillsRef);
      const existingIds = existingDocsSnapshot.docs.map(d => d.id);
      const newIds = newSkills.map(s => String(s.id));
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));

      idsToDelete.forEach(id => batch.delete(doc(skillsRef, id)));
      newSkills.forEach(skill => {
          const skillDocRef = doc(skillsRef, String(skill.id));
          batch.set(skillDocRef, skill);
      });
      await batch.commit();
  }, [user]);

  const persistRoutine = useCallback(async (newRoutine) => {
      if (!user) return;
      setRoutine(newRoutine); // Update parent state for other components
      await setDoc(doc(db, 'users', user.uid, 'routine', 'main'), newRoutine);
  }, [user]);
  
  const persistRoutineTemplates = useCallback(async (newTemplates) => {
      if (!user) return;
      setRoutineTemplates(newTemplates);
      await setDoc(doc(db, 'users', user.uid, 'routine', 'templates'), newTemplates);
  }, [user]);
  
  const persistGuilds = useCallback(async (newGuilds) => {
    setGuilds(newGuilds);
    const batch = writeBatch(db);
    const guildsRef = collection(db, 'guilds');

    // Get all existing guilds to compare
    const existingDocsSnapshot = await getDocs(guildsRef);
    const existingIds = existingDocsSnapshot.docs.map(d => d.id);
    const newIds = newGuilds.map(g => g.id);

    // Find which to delete
    const idsToDelete = existingIds.filter(id => !newIds.includes(id));
    idsToDelete.forEach(id => {
      batch.delete(doc(guildsRef, id));
    });

    // Find which to add or update
    newGuilds.forEach(guild => {
      const guildDocRef = doc(guildsRef, guild.id);
      // We are saving the whole guild object, simple set is enough
      batch.set(guildDocRef, guild);
    });

    await batch.commit();
  }, []);


  // --- NOTIFICATION HANDLERS ---
  const handleShowLevelUpNotification = (newLevel, newTitle, newRank) => {
    setQuestNotification({
      title: 'NÍVEL AUMENTADO!',
      description: 'O seu esforço foi recompensado. Você alcançou um novo patamar de poder.',
      goals: [
        { name: '- NOVO NÍVEL', progress: `[${newLevel}]` },
        { name: '- NOVO TÍTULO', progress: `[${newTitle}]` },
        { name: '- NOVO RANK', progress: `[${newRank}]` },
      ],
      caution: 'Continue a sua jornada para desbloquear todo o seu potencial.',
      onClose: () => setQuestNotification(null),
    });
  };

  const handleShowNewEpicMissionNotification = (newEpicMissionName: string, newEpicMissionDescription: string) => {
    setQuestNotification({
      title: 'NOVA MISSÃO ÉPICA',
      description: 'Você abriu um novo capítulo na sua jornada. Um novo desafio épico o aguarda.',
      goals: [
        { name: '- NOME', progress: `[${newEpicMissionName}]` },
        { name: '- OBJETIVO', progress: `[${newEpicMissionDescription}]` },
      ],
      caution: 'Prepare-se para o que vem a seguir. A sua lenda continua a ser escrita.',
      onClose: () => setQuestNotification(null),
    });
  };

  const handleShowSkillUpNotification = (skillName, newLevel, statBonuses) => {
     const goals = [
        { name: `- HABILIDADE`, progress: `[${skillName}]` },
        { name: `- NOVO NÍVEL`, progress: `[${newLevel}]` },
     ];

     if (statBonuses && statBonuses.length > 0) {
        goals.push({ name: '- BÓNUS DE ATRIBUTO', progress: `[${statBonuses.join(', ')}]` });
     }

    setQuestNotification({
      title: 'HABILIDADE AUMENTADA!',
      description: 'A sua dedicação e prática foram recompensadas. Uma das suas habilidades evoluiu.',
      goals: goals,
      caution: 'A maestria é uma jornada sem fim. Continue a aprimorar as suas competências.',
      onClose: () => setQuestNotification(null),
    });
  };

  const handleShowSkillDecayNotification = (decayedSkillsInfo: {name: string, xpLost: number}[]) => {
     const goals = decayedSkillsInfo.map(info => ({
        name: `- HABILIDADE`,
        progress: `[${info.name}] (-${info.xpLost} XP)`,
     }));

    setQuestNotification({
      title: 'CORRUPÇÃO DETETADA',
      description: 'A inatividade prolongada corrompeu o seu progresso. Algumas habilidades perderam XP.',
      goals: goals,
      caution: 'A prática constante é a chave para a maestria. Use as suas habilidades para recuperar o seu poder.',
      onClose: () => setQuestNotification(null),
    });
  };

  const handleShowSkillAtRiskNotification = (atRiskSkills: {name: string, daysInactive: number}[]) => {
    const goals = atRiskSkills.map(info => ({
        name: `- HABILIDADE`,
        progress: `[${info.name}] (${info.daysInactive} dias inativa)`,
    }));

    setQuestNotification({
      title: 'ALERTA DO SISTEMA',
      description: 'Atenção, Caçador. As seguintes habilidades estão em risco de corrupção por falta de uso.',
      goals: goals,
      caution: 'Pratique estas habilidades em breve para evitar a perda de progresso.',
      onClose: () => setQuestNotification(null),
    });
  };
  
  const handleShowDailyBriefingNotification = (briefingMissions) => {
    if (!briefingMissions || briefingMissions.length === 0) return;

    const goals = briefingMissions.map(mission => ({
        name: `- [${mission.epicMissionName}]`,
        progress: mission.nome,
    }));
>>>>>>> 434b14c (I see this error with the app, reported by NextJS, please fix it. The er)
    
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Redirecionamento para login se não autenticado
  useEffect(() => {
    if (authState === 'unauthenticated') {
      console.log('🔄 Usuário não autenticado, redirecionando para login...');
      window.location.href = '/login';
    }
  }, [authState]);
  
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const touchEndRef = useRef<{ x: number, y: number } | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onTouchEnd = (fromSheet: boolean = false) => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const distanceX = touchStartRef.current.x - touchEndRef.current.x;
    const distanceY = touchStartRef.current.y - touchEndRef.current.y;
    
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
        const isLeftSwipe = distanceX > 0;
        const isRightSwipe = distanceX < 0;

        if (isRightSwipe && !fromSheet && touchStartRef.current.x < 50 && isMobile) { 
            setIsSheetOpen(true);
        }

        if (isLeftSwipe && fromSheet && isMobile) {
            setIsSheetOpen(false);
        }
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (isMobile) setIsSheetOpen(false);
  };

  const handleEnterDungeon = () => {
    setCurrentPage('dungeon');
  }
  

  const NavItem = ({ icon: Icon, label, page, inSheet = false, className = "" }: { 
    icon: React.ComponentType<{ className?: string }>, 
    label: string, 
    page: string, 
    inSheet?: boolean, 
    className?: string 
  }) => {
    const handleNav = () => {
        handleNavigate(page);
    };
    
    return (
        <button
          onClick={handleNav}
          className={cn(
            'w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200',
            currentPage === page ? 'bg-primary/20 text-primary font-bold' : 'text-gray-400 hover:bg-secondary hover:text-white'
          )}
        >
          <Icon className="h-5 w-5" />
          <span className={cn("font-medium", className)}>{label}</span>
        </button>
    );
  };
  
  const NavContent = ({inSheet = false}) => {
    return (
        <div className="h-full flex flex-col">
          <div className="font-cinzel text-3xl font-bold text-primary text-center mb-8 tracking-widest">SISTEMA</div>
          <nav className="flex-grow space-y-2">
              <NavItem icon={LayoutDashboard} label="Dashboard" page="dashboard" inSheet={inSheet}/>
              <NavItem icon={BookOpen} label="Metas" page="metas" inSheet={inSheet} />
              <NavItem icon={Target} label="Missões" page="missions" inSheet={inSheet}/>
              <NavItem icon={ListChecks} label="Afazeres" page="tasks" inSheet={inSheet}/>
              <NavItem icon={TowerControl} label="Torre" page="tower" inSheet={inSheet}/>
              <NavItem icon={KeySquare} label="Masmorra" page="dungeon" inSheet={inSheet}/>
              <NavItem icon={BarChart3} label="Habilidades" page="skills" inSheet={inSheet}/>
              <NavItem icon={UserSquare} label="Classe" page="class" inSheet={inSheet}/>
              <NavItem icon={Clock} label="Rotina" page="routine" inSheet={inSheet}/>
              <NavItem icon={Award} label="Conquistas" page="achievements" inSheet={inSheet} />
              <NavItem icon={Swords} label="Guildas" page="guilds" inSheet={inSheet} />
              <NavItem icon={Store} label="Loja" page="shop" inSheet={inSheet} />
              <NavItem icon={Backpack} label="Inventário" page="inventory" inSheet={inSheet} />

              <NavItem icon={Bot} label="Arquiteto" page="ai-chat" inSheet={inSheet} className="font-cinzel font-bold tracking-wider" />
          </nav>
          <div className="mt-auto">
              <NavItem icon={Settings} label="Configurações" page="settings" inSheet={inSheet}/>
              <button 
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Terminar Sessão</span>
              </button>
          </div>
        </div>
    );
  };

  const renderContent = () => {
    if (!isDataLoaded) {
      return null
    }
<<<<<<< HEAD

    const views: Record<string, React.ReactNode> = {
      'dashboard': <DashboardView />,
      'metas': <MetasView />,
      'missions': <MissionsView />,
      'skills': <SkillsView onEnterDungeon={handleEnterDungeon} />,
      'class': <ClassView />,
      'routine': <RoutineView />,
      'achievements': <AchievementsView />,
      'guilds': <GuildsView />,
      'shop': <ShopView />,
      'inventory': <InventoryView />,
      'ai-chat': <AIChatView />,
      'settings': <SettingsView />,
      'tower': <TowerView />,
      'tasks': <TasksView />,
      'dungeon': profile?.dungeon_session ? <SkillDungeonView onExit={() => handleNavigate('dungeon')} /> : <DungeonLobbyView onNavigateToSkills={() => handleNavigate('skills')} />,
=======
    
    const views = {
      'dashboard': <DashboardView profile={profile} />,
      'metas': <MetasView metas={metas} setMetas={persistMetas} missions={missions} setMissions={persistMissions} profile={profile} skills={skills} setSkills={persistSkills} />,
      'missions': <MissionsView missions={missions} setMissions={persistMissions} profile={profile} setProfile={persistProfile} metas={metas} setMetas={setMetas} skills={skills} setSkills={persistSkills} onLevelUpNotification={handleShowLevelUpNotification} onNewEpicMissionNotification={handleShowNewEpicMissionNotification} onSkillUpNotification={handleShowSkillUpNotification} onGoalCompletedNotification={handleShowGoalCompletedNotification} />,
      'skills': <SkillsView skills={skills} setSkills={persistSkills} metas={metas} setMetas={setMetas} />,
      'routine': <RoutineView initialRoutine={routine} persistRoutine={persistRoutine} missions={missions} initialTemplates={routineTemplates} persistTemplates={persistRoutineTemplates} />,
      'ai-chat': <AIChatView profile={profile} metas={metas} routine={routine} missions={missions} />,
      'settings': <SettingsView profile={profile} setProfile={persistProfile} onReset={handleFullReset} />,
<<<<<<< HEAD
      'guild': <GuildsView profile={profile} setProfile={persistProfile} guilds={guilds} setGuilds={setGuilds} metas={metas} allUsers={allUsers} />,
>>>>>>> a826633 (Acha que seria bom dividir as estrutura da aba guilda?)
=======
      'guild': <GuildsView profile={profile} setProfile={persistProfile} guilds={guilds} setGuilds={persistGuilds} metas={metas} allUsers={allUsers} />,
>>>>>>> 434b14c (I see this error with the app, reported by NextJS, please fix it. The er)
    };

    return (
      <div key={currentPage} className="animate-in fade-in-50 duration-500 h-full">
        {views[currentPage] || <DashboardView />}
      </div>
    )
  };
  
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <div className="flex flex-col items-center space-y-4">
          <LoaderCircle className="animate-spin h-10 w-10" />
          <span className="text-xl font-cinzel tracking-wider">A VALIDAR SESSÃO...</span>
          <span className="text-sm text-gray-400">Conectando ao Firebase...</span>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <div className="flex flex-col items-center space-y-4">
          <ShieldBan className="h-10 w-10" />
          <span className="text-xl font-cinzel tracking-wider">REDIRECIONANDO...</span>
          <span className="text-sm text-gray-400">Acesso negado. Redirecionando para login...</span>
        </div>
      </div>
    );
  }
  
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <div className="flex flex-col items-center space-y-4">
          <LoaderCircle className="animate-spin h-10 w-10" />
          <span className="text-xl font-cinzel tracking-wider">A CARREGAR DADOS DO JOGADOR...</span>
          <span className="text-sm text-gray-400">Sincronizando com o Firestore...</span>
        </div>
      </div>
    );
  }

  if (profile?._isOfflineMode) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center text-yellow-400">
            <div className="flex flex-col items-center space-y-4 text-center p-8">
              <WifiOff className="h-12 w-12" />
              <h1 className="text-2xl font-cinzel tracking-wider">MODO OFFLINE</h1>
              <p className="text-yellow-200/80 max-w-md">Não foi possível conectar ao Firebase. A aplicação está a correr com dados de demonstração. As suas alterações não serão guardadas. Verifique a sua conexão com a internet e atualize a página.</p>
            </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
        {!isMobile && (
          <aside className="w-64 bg-card/50 border-r border-border/50 p-4 flex flex-col">
              <NavContent />
          </aside>
        )}
        
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden relative" 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => onTouchEnd(false)}
      >
         {isMobile && (
            <header className="sticky top-0 left-0 right-0 z-10 p-2 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center">
                 <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Abrir menu">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left" 
                        className="w-72 bg-card/95 border-r border-border/50 p-4 flex flex-col"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={() => onTouchEnd(true)}
                    >
                        <NavContent inSheet={true}/>
                    </SheetContent>
                </Sheet>
                 <h2 className="text-lg font-bold text-primary ml-4 capitalize font-cinzel tracking-wider">{currentPage}</h2>
            </header>
          )}
        {renderContent()}
        
        {showOnboarding && <OnboardingGuide onFinish={() => {
            setShowOnboarding(false);
            if (profile) {
              persistData('profile', {...profile, onboarding_completed: true});
            }
        }} />}
        {systemAlert && (
            <SystemAlert
              message={systemAlert.message}
              position={systemAlert.position}
              onDismiss={() => setSystemAlert(null)}
            />
        )}
        {profile?.active_dungeon_event && <DungeonEventPrompt />}
      </main>
    </div>
  );
}

<<<<<<< HEAD
<<<<<<< HEAD
    
=======
    

    
>>>>>>> a826633 (Acha que seria bom dividir as estrutura da aba guilda?)
=======
    
>>>>>>> 434b14c (I see this error with the app, reported by NextJS, please fix it. The er)
