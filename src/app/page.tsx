
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, User, BookOpen, Target, TreeDeciduous, Settings, LogOut, Clock, LoaderCircle, BarChart3, LayoutDashboard, Menu, AlertCircle } from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc, updateDoc } from "firebase/firestore";
import * as mockData from '@/lib/data';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { DashboardView } from '@/components/views/DashboardView';
import { MetasView } from '@/components/views/MetasView';
import { MissionsView } from '@/components/views/MissionsView';
import { SkillsView } from '@/components/views/SkillsView';
import { RoutineView } from '@/components/views/RoutineView';
import { AIChatView } from '@/components/views/AIChatView';
import { SettingsView } from '@/components/views/SettingsView';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { QuestInfoDialog, QuestInfoProps } from '@/components/custom/QuestInfoDialog';


export default function App() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [profile, setProfile] = useState(null);
  const [metas, setMetas] = useState([]);
  const [missions, setMissions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [routine, setRoutine] = useState({});
  const [routineTemplates, setRoutineTemplates] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [questNotification, setQuestNotification] = useState<QuestInfoProps | null>(null);
  
  const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

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
  
  const handleShowDailyBriefingNotification = (mission) => {
    setQuestNotification({
      title: 'BRIEFING DIÁRIO',
      description: 'Sistema online. O seu objetivo principal para hoje foi identificado. Concentre os seus esforços nesta missão.',
      goals: [
        { name: `- MISSÃO`, progress: `[${mission.nome}]` },
        { name: `- DESCRIÇÃO`, progress: `[${mission.descricao}]` },
        { name: `- RECOMPENSA`, progress: `[${mission.xp_conclusao} XP]` },
      ],
      caution: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
      onClose: () => setQuestNotification(null),
    });
  };
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const setupInitialData = async (userId, userEmail) => {
      const userRef = doc(db, 'users', userId);
      const batch = writeBatch(db);

      // 1. Profile
      const emailUsername = userEmail.split('@')[0];
      const initialProfile = { 
          ...mockData.perfis[0], 
          id: userId, 
          email: userEmail,
          primeiro_nome: emailUsername,
          apelido: "Caçador",
          nome_utilizador: emailUsername,
          avatar_url: `https://placehold.co/100x100.png?text=${emailUsername.substring(0,2).toUpperCase()}`,
          ultimo_login_em: new Date().toISOString() // Add last login field
      };
      batch.set(userRef, initialProfile);

      // 2. Metas
      const metasRef = collection(db, 'users', userId, 'metas');
      mockData.metas.forEach(meta => {
          const metaDocRef = doc(metasRef, String(meta.id));
          const metaToSave = { ...meta, prazo: meta.prazo || null };
          batch.set(metaDocRef, metaToSave);
      });

      // 3. Missions
      const missionsRef = collection(db, 'users', userId, 'missions');
      mockData.missoes.forEach(mission => {
          const missionDocRef = doc(missionsRef, String(mission.id));
          batch.set(missionDocRef, mission);
      });

      // 4. Skills
      const skillsRef = collection(db, 'users', userId, 'skills');
      mockData.habilidades.forEach(skill => {
          const skillDocRef = doc(skillsRef, String(skill.id));
          batch.set(skillDocRef, skill);
      });

      // 5. Routine
      const routineRef = doc(db, 'users', userId, 'routine', 'main');
      batch.set(routineRef, mockData.rotina);

      // 6. Routine Templates
      const routineTemplatesRef = doc(db, 'users', userId, 'routine', 'templates');
      batch.set(routineTemplatesRef, mockData.rotinaTemplates);

      await batch.commit();

      // Manually set the state after committing the batch
      setProfile(initialProfile);
      setMetas(mockData.metas.map(m => ({ ...m, prazo: m.prazo || null })));
      setMissions(mockData.missoes);
      setSkills(mockData.habilidades);
      setRoutine(mockData.rotina);
      setRoutineTemplates(mockData.rotinaTemplates);

      toast({ title: "Bem-vindo ao Sistema!", description: "O seu perfil inicial foi configurado." });
  };
  
  const checkSkillStatus = useCallback((currentSkills) => {
    const now = new Date();
    const INACTIVITY_THRESHOLD_DAYS = 14;
    const AT_RISK_THRESHOLD_DAYS = 7;
    const XP_DECAY_PER_DAY = 5;
    let skillsChanged = false;
    let decayedSkillsInfo = [];
    let atRiskSkillsInfo = [];

    const updatedSkills = currentSkills.map(skill => {
        if (!skill.ultima_atividade_em) {
            return { ...skill, ultima_atividade_em: now.toISOString() };
        }

        const lastActivity = new Date(skill.ultima_atividade_em);
        const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 3600 * 24);

        if (daysSinceActivity > INACTIVITY_THRESHOLD_DAYS) {
            const daysToDecay = Math.floor(daysSinceActivity - INACTIVITY_THRESHOLD_DAYS);
            const totalDecay = daysToDecay * XP_DECAY_PER_DAY;
            
            const originalXp = skill.xp_atual;
            const newXp = Math.max(0, originalXp - totalDecay);

            if (newXp !== originalXp) {
                skillsChanged = true;
                const xpLost = originalXp - newXp;
                decayedSkillsInfo.push({ name: skill.nome, xpLost: Math.round(xpLost) });
                return { ...skill, xp_atual: newXp, ultima_atividade_em: now.toISOString() };
            }
        } else if (daysSinceActivity > AT_RISK_THRESHOLD_DAYS) {
            atRiskSkillsInfo.push({ name: skill.nome, daysInactive: Math.floor(daysSinceActivity) });
        }
        return skill;
    });

    if (decayedSkillsInfo.length > 0) {
        handleShowSkillDecayNotification(decayedSkillsInfo);
    } else if (atRiskSkillsInfo.length > 0) {
        handleShowSkillAtRiskNotification(atRiskSkillsInfo);
    }
    
    return { updatedSkills, skillsChanged };
  }, []);
  
  const checkDailyLogin = useCallback((profileData, missionsData) => {
    const now = new Date();
    const today = now.toDateString();
    
    const lastLogin = profileData.ultimo_login_em ? new Date(profileData.ultimo_login_em) : new Date(0);
    const lastLoginDay = lastLogin.toDateString();

    if (today !== lastLoginDay) {
      // It's a new day, show briefing
      const visibleEpicMissions = [];
      const missionsByGoal = missionsData.reduce((acc, mission) => {
          if (!acc[mission.meta_associada]) {
              acc[mission.meta_associada] = [];
          }
          acc[mission.meta_associada].push(mission);
          return acc;
      }, {});

      for (const goalName in missionsByGoal) {
          const goalMissions = missionsByGoal[goalName]
              .filter(m => !m.concluido)
              .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));

          if (goalMissions.length > 0) {
              visibleEpicMissions.push(goalMissions[0]);
          }
      }
      const sortedVisibleMissions = visibleEpicMissions.sort((a,b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
      const firstActiveEpicMission = sortedVisibleMissions[0];
      const briefingMission = firstActiveEpicMission?.missoes_diarias?.find(dm => !dm.concluido);

      if (briefingMission) {
        handleShowDailyBriefingNotification(briefingMission);
      }
      
      // Update last login time in profile
      return true; // Indicates that profile needs update
    }
    return false; // No update needed
  }, []);


  const fetchData = useCallback(async (userId) => {
      try {
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
              const profileData = userDoc.data();
              if (profileData.nome_utilizador && !profileData.primeiro_nome) {
                  profileData.primeiro_nome = profileData.nome_utilizador;
                  profileData.apelido = "Caçador";
              }
              
              const missionsSnapshot = await getDocs(collection(userDocRef, 'missions'));
              const fetchedMissions = missionsSnapshot.docs.map(doc => ({ ...doc.data() }));
              setMissions(fetchedMissions);
              
              const showBriefing = checkDailyLogin(profileData, fetchedMissions);

              if (showBriefing) {
                  const updatedProfile = { ...profileData, ultimo_login_em: new Date().toISOString() };
                  setProfile(updatedProfile);
                  await setDoc(userDocRef, updatedProfile, { merge: true });
              } else {
                  setProfile(profileData);
              }

              const metasSnapshot = await getDocs(collection(userDocRef, 'metas'));
              setMetas(metasSnapshot.docs.map(doc => ({ ...doc.data() })));

              const skillsSnapshot = await getDocs(collection(userDocRef, 'skills'));
              const fetchedSkills = skillsSnapshot.docs.map(doc => ({ ...doc.data() }));
              
              const { updatedSkills, skillsChanged } = checkSkillStatus(fetchedSkills);
              setSkills(updatedSkills);
              if (skillsChanged) {
                  persistSkills(updatedSkills); // Save decayed state back to DB
              }

              const routineDoc = await getDoc(doc(userDocRef, 'routine', 'main'));
              setRoutine(routineDoc.exists() ? routineDoc.data() : {});
              
              const routineTemplatesDoc = await getDoc(doc(userDocRef, 'routine', 'templates'));
              setRoutineTemplates(routineTemplatesDoc.exists() ? routineTemplatesDoc.data() : {});

          } else {
              console.log("Utilizador novo. A configurar dados iniciais...");
              await setupInitialData(user.uid, user.email);
          }
      } catch (error) {
          console.error("Erro a carregar dados do Firestore:", error);
          toast({ variant: 'destructive', title: "Erro de Sincronização", description: "Não foi possível carregar os seus dados." });
      } finally {
          setIsDataLoaded(true);
      }
  }, [user, toast, checkSkillStatus, checkDailyLogin]);

  useEffect(() => {
    if (user && !isDataLoaded) {
      fetchData(user.uid);
    }
  }, [user, isDataLoaded, fetchData]);
  
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
          const metaToSave = { ...meta, prazo: meta.prazo || null };
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

  const handleFullReset = async () => {
    if (!user) return;
    setIsDataLoaded(false);

    try {
        await setupInitialData(user.uid, user.email);
        
    } catch (error) {
        console.error("Erro ao resetar os dados:", error);
        toast({ variant: 'destructive', title: "Erro no Reset", description: `Não foi possível apagar os seus dados. Erro: ${error.message}` });
    } finally {
        setIsDataLoaded(true);
    }
  };


  const NavItem = ({ icon: Icon, label, page, inSheet = false, className = "" }) => {
    const Component = inSheet ? SheetClose : 'button';
    
    return (
        <Component
          onClick={() => setCurrentPage(page)}
          className={cn(
            'w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200',
            currentPage === page ? 'bg-primary/20 text-primary font-bold' : 'text-gray-400 hover:bg-secondary hover:text-white'
          )}
        >
          <Icon className="h-5 w-5" />
          <span className={cn("font-medium", className)}>{label}</span>
        </Component>
    );
  };
  
  const NavContent = ({inSheet = false}) => (
    <>
      <div className="font-cinzel text-3xl font-bold text-primary text-center mb-8 tracking-widest">SISTEMA</div>
      <nav className="flex-grow space-y-2">
          <NavItem icon={LayoutDashboard} label="Dashboard" page="dashboard" inSheet={inSheet}/>
          <NavItem icon={BookOpen} label="Metas" page="metas" inSheet={inSheet} />
          <NavItem icon={Target} label="Missões" page="missions" inSheet={inSheet}/>
          <NavItem icon={Clock} label="Rotina" page="routine" inSheet={inSheet}/>
          <NavItem icon={BarChart3} label="Habilidades" page="skills" inSheet={inSheet}/>
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
    </>
  );

  const renderContent = () => {
    if (!profile) {
      return null
    }
    
    const views = {
      'dashboard': <DashboardView profile={profile} />,
      'metas': <MetasView metas={metas} setMetas={persistMetas} missions={missions} setMissions={persistMissions} profile={profile} skills={skills} setSkills={persistSkills} />,
      'missions': <MissionsView missions={missions} setMissions={persistMissions} profile={profile} setProfile={persistProfile} metas={metas} skills={skills} setSkills={persistSkills} onLevelUpNotification={handleShowLevelUpNotification} onNewEpicMissionNotification={handleShowNewEpicMissionNotification} onSkillUpNotification={handleShowSkillUpNotification} />,
      'skills': <SkillsView skills={skills} setSkills={persistSkills} metas={metas} setMetas={persistMetas} />,
      'routine': <RoutineView initialRoutine={routine} persistRoutine={persistRoutine} missions={missions} initialTemplates={routineTemplates} persistTemplates={persistRoutineTemplates} />,
      'ai-chat': <AIChatView profile={profile} metas={metas} routine={routine} missions={missions} />,
      'settings': <SettingsView profile={profile} setProfile={persistProfile} onReset={handleFullReset} />,
    };

    return (
      <div key={currentPage} className="animate-in fade-in-25 duration-500">
        {views[currentPage] || <DashboardView profile={profile} />}
      </div>
    )
  };
  
  if (loading || !user || !isDataLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <LoaderCircle className="animate-spin h-10 w-10 mr-4" />
        <span className="text-xl font-cinzel tracking-wider">A VALIDAR SESSÃO...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
        {!isMobile && (
          <aside className="w-64 bg-card/50 border-r border-border/50 p-4 flex flex-col">
              <NavContent />
          </aside>
        )}
        
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{height: '100vh'}}>
         {isMobile && (
            <header className="sticky top-0 left-0 right-0 z-10 p-2 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center">
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 bg-card/95 border-r border-border/50 p-4 flex flex-col">
                        <SheetHeader>
                            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                            <SheetDescription className="sr-only">
                                Navegue pelas diferentes secções da aplicação.
                            </SheetDescription>
                        </SheetHeader>
                        <NavContent inSheet={true}/>
                    </SheetContent>
                </Sheet>
                 <h2 className="text-lg font-bold text-primary ml-4 capitalize font-cinzel tracking-wider">{currentPage}</h2>
            </header>
          )}
        {renderContent()}
        {questNotification && <QuestInfoDialog {...questNotification} />}
      </main>
    </div>
  );
}
