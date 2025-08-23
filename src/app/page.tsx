
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, User, BookOpen, Target, TreeDeciduous, Settings, LogOut, Clock, LoaderCircle, BarChart3, LayoutDashboard, Menu, AlertCircle, Award, Store, Backpack, Swords } from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc, updateDoc } from "firebase/firestore";
import * as mockData from '@/lib/data';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { DashboardView } from '@/components/views/core/DashboardView';
import { MetasView } from '@/components/views/core/MetasView';
import { MissionsView } from '@/components/views/core/MissionsView';
import { SkillsView } from '@/components/views/core/SkillsView';
import { RoutineView } from '@/components/views/core/RoutineView';
import { AIChatView } from '@/components/views/ai/AIChatView';
import { SettingsView } from '@/components/views/player/SettingsView';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { QuestInfoDialog } from '@/components/custom/QuestInfoDialog';
import { OnboardingGuide } from '@/components/custom/OnboardingGuide';
import { AchievementsView } from '@/components/views/player/AchievementsView';
import { ShopView } from '@/components/views/player/ShopView';
import { InventoryView } from '@/components/views/player/InventoryView';
import { GuildsView } from '@/components/views/social/GuildsView';
import { SystemAlert } from '@/components/custom/SystemAlert';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { generateNextDailyMission } from '@/ai/flows/generate-next-daily-mission';
import { generateSkillExperience } from '@/ai/flows/generate-skill-experience';
import { achievements } from '@/lib/achievements';
import { differenceInCalendarDays, isToday } from 'date-fns';
import { statCategoryMapping } from '@/lib/mappings';


const getProfileRank = (level) => {
    if (level <= 5) return { rank: 'F', title: 'Novato' };
    if (level <= 10) return { rank: 'E', title: 'Iniciante' };
    if (level <= 20) return { rank: 'D', title: 'Adepto' };
    if (level <= 30) return { rank: 'C', title: 'Experiente' };
    if (level <= 40) return { rank: 'B', 'title': 'Perito' };
    if (level <= 50) return { rank: 'A', title: 'Mestre' };
    if (level <= 70) return { rank: 'S', title: 'Grão-Mestre' };
    if (level <= 90) return { rank: 'SS', title: 'Herói' };
    return { rank: 'SSS', title: 'Lendário' };
};

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
  const [allUsers, setAllUsers] = useState([]);
  const [guilds, setGuilds] = useState([]);

  const [questNotification, setQuestNotification] = useState(null);

  // State for proactive AI alerts
  const [systemAlert, setSystemAlert] = useState<{ message: string; position: { top: string; left: string; } } | null>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // State for mobile sheet menu
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // --- Swipe Gesture Logic ---
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
    
    // Check if it's a horizontal swipe and not a vertical scroll
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
        const isLeftSwipe = distanceX > 0;
        const isRightSwipe = distanceX < 0;

        if (isRightSwipe && !fromSheet && touchStartRef.current.x < 50 && isMobile) { // Swipe right from left edge of main content
            setIsSheetOpen(true);
        }

        if (isLeftSwipe && fromSheet && isMobile) { // Swipe left inside the sheet
            setIsSheetOpen(false);
        }
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
  };
  
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
    if (!user) return;
    setGuilds(newGuilds);
    const batch = writeBatch(db);
    const guildsRef = collection(db, 'guilds');

    // This is a simplified persistence logic. For a real app, more granular updates would be better.
    // For now, we'll overwrite the guild documents.
    const existingDocsSnapshot = await getDocs(guildsRef);
    const existingIds = existingDocsSnapshot.docs.map(d => d.id);
    const newIds = newGuilds.map(g => String(g.id));
    const idsToDelete = existingIds.filter(id => !newIds.includes(id));

    idsToDelete.forEach(id => batch.delete(doc(guildsRef, id)));
    newGuilds.forEach(guild => {
      const guildDocRef = doc(guildsRef, String(guild.id));
      batch.set(guildDocRef, guild);
    });
    await batch.commit();
  }, [user]);

  const handleCompleteOnboarding = async () => {
    if (!profile) return;
    const updatedProfile = { ...profile, onboarding_completed: true };
    await persistProfile(updatedProfile);
    setShowOnboarding(false);
    toast({
        title: "Tutorial Concluído!",
        description: "A sua jornada começa agora. Boa sorte, Caçador.",
    });
  };

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
    
    setQuestNotification({
      title: 'BRIEFING DIÁRIO',
      description: 'Sistema online. Os seus objetivos para hoje foram identificados. Concentre os seus esforços nestas missões.',
      goals,
      caution: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
      onClose: () => setQuestNotification(null),
    });
  };

  const handleShowGoalCompletedNotification = (goalName: string) => {
    setQuestNotification({
      title: 'META CONCLUÍDA!',
      description: 'Parabéns, Caçador! Você completou um dos seus maiores objetivos. O seu nome será lembrado.',
      goals: [
        { name: '- CONQUISTA', progress: `[${goalName}]` },
      ],
      caution: 'Um novo horizonte de desafios aguarda. Use esta vitória como combustível para a sua próxima jornada.',
      onClose: () => setQuestNotification(null),
    });
  };

  const handleShowAchievementUnlockedNotification = (achievementName: string) => {
    setQuestNotification({
      title: 'CONQUISTA DESBLOQUEADA!',
      description: 'O seu esforço e dedicação foram reconhecidos pelo Sistema.',
      goals: [
        { name: '- CONQUISTA', progress: `[${achievementName}]` },
      ],
      caution: 'Continue a sua jornada para desbloquear todos os segredos do Sistema.',
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
          ultimo_login_em: new Date().toISOString(), // Add last login field
          inventory: [], // Initialize inventory
          active_effects: [], // Initialize active effects
          guild_id: null,
          guild_role: null,
          onboarding_completed: false, // Add onboarding field
      };
      batch.set(userRef, initialProfile);

      // 2. Metas
      const metasRef = collection(db, 'users', userId, 'metas');
      mockData.metas.forEach(meta => {
          const metaDocRef = doc(metasRef, String(meta.id));
          const metaToSave = { ...meta, prazo: meta.prazo || null, concluida: meta.concluida || false };
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
      setMetas(mockData.metas.map(m => ({ ...m, prazo: m.prazo || null, concluida: m.concluida || false })));
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
        const briefingMissions = [];
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
                const firstActiveEpicMission = goalMissions[0];
                const activeDailyMission = firstActiveEpicMission.missoes_diarias?.find(dm => !dm.concluido);
                if (activeDailyMission) {
                    briefingMissions.push({
                        ...activeDailyMission,
                        epicMissionName: firstActiveEpicMission.nome, // Add epic mission name for context
                    });
                }
            }
        }
        
        if (briefingMissions.length > 0) {
            handleShowDailyBriefingNotification(briefingMissions);
        }

        // Update last login time in profile
        return true; // Indicates that profile needs update
    }
    return false; // No update needed
  }, [rankOrder]);


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

              if (profileData.onboarding_completed === false) {
                  setShowOnboarding(true);
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
              
              // Fetch all users and guilds for the Guilds view
              const allUsersSnapshot = await getDocs(collection(db, 'users'));
              setAllUsers(allUsersSnapshot.docs.map(d => ({id: d.id, ...d.data()})));
              
              const guildsSnapshot = await getDocs(collection(db, 'guilds'));
              setGuilds(guildsSnapshot.docs.map(d => ({id: d.id, ...d.data()})));


          } else {
              console.log("Utilizador novo. A configurar dados iniciais...");
              await setupInitialData(user.uid, user.email);
              setShowOnboarding(true); // Show onboarding for new users
          }
      } catch (error) {
          console.error("Erro a carregar dados do Firestore:", error);
          toast({ variant: 'destructive', title: "Erro de Sincronização", description: "Não foi possível carregar os seus dados." });
      } finally {
          setIsDataLoaded(true);
      }
  }, [user, toast, checkSkillStatus, checkDailyLogin, persistSkills, setupInitialData, rankOrder]);

  // --- Proactive AI Alert Logic ---
  useEffect(() => {
    if (!isDataLoaded || systemAlert) return;

    const timer = setTimeout(async () => {
      try {
        console.log("Fetching proactive alert...");
        const result = await generateSystemAdvice({
          userName: profile.nome_utilizador,
          profile: JSON.stringify(profile),
          metas: JSON.stringify(metas),
          routine: JSON.stringify(routine),
          missions: JSON.stringify(missions.filter(m => !m.concluido)),
          query: "Dê-me um alerta rápido ou uma dica estratégica sobre o meu estado atual, em uma frase curta.",
        });

        // Generate a random position on the screen
        const top = `${Math.floor(Math.random() * (isMobile ? 40 : 70)) + 15}%`; // Avoid top/bottom edges
        const left = `${Math.floor(Math.random() * (isMobile ? 10 : 60)) + 5}%`; // Avoid left/right edges

        setSystemAlert({
          message: result.response,
          position: { top, left },
        });

      } catch (error) {
        console.warn("Could not fetch proactive system alert:", error);
      }
    }, 90000); // 90 seconds

    return () => clearTimeout(timer);

  }, [isDataLoaded, systemAlert, profile, metas, routine, missions, isMobile]);

  useEffect(() => {
    if (user && !isDataLoaded) {
      fetchData(user.uid);
    }
  }, [user, isDataLoaded, fetchData]);
  

  const handleFullReset = async () => {
    if (!user) return;
    setIsDataLoaded(false);

    try {
        await setupInitialData(user.uid, user.email);
        setShowOnboarding(true); // Make sure onboarding appears after reset
        
    } catch (error) {
        console.error("Erro ao resetar os dados:", error);
        toast({ variant: 'destructive', title: "Erro no Reset", description: `Não foi possível apagar os seus dados. Erro: ${error.message}` });
    } finally {
        setIsDataLoaded(true);
    }
  };

    const handleToastError = (error, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };
    
    // --- Logic moved from MissionsView ---
    const handleLevelUp = (currentProfile) => {
        const newLevel = currentProfile.nivel + 1;
        const newXpToNextLevel = Math.floor(currentProfile.xp_para_proximo_nivel + 25);
        const newXp = currentProfile.xp - currentProfile.xp_para_proximo_nivel;
        
        const { rank, title } = getProfileRank(newLevel);
        handleShowLevelUpNotification(newLevel, title, rank);
        
        return {
            ...currentProfile,
            nivel: newLevel,
            xp: newXp,
            xp_para_proximo_nivel: newXpToNextLevel,
        };
    };

    const checkAndUnlockAchievements = (currentProfile) => {
        const newlyUnlocked = [];
        achievements.forEach(achievement => {
            const isAlreadyUnlocked = currentProfile.achievements?.some(a => a.achievementId === achievement.id);
            if (isAlreadyUnlocked) return;

            let conditionMet = false;
            switch (achievement.criteria.type) {
                case 'missions_completed':
                    conditionMet = currentProfile.missoes_concluidas_total >= achievement.criteria.value;
                    break;
                case 'level_reached':
                    conditionMet = currentProfile.nivel >= achievement.criteria.value;
                    break;
                // Adicionar outras verificações (goals, skills) aqui no futuro.
            }
            
            if (conditionMet) {
                newlyUnlocked.push({ achievementId: achievement.id, date: new Date().toISOString() });
                handleShowAchievementUnlockedNotification(achievement.name);
            }
        });

        if (newlyUnlocked.length > 0) {
            return { ...currentProfile, achievements: [...(currentProfile.achievements || []), ...newlyUnlocked] };
        }
        return currentProfile;
    };

    const handleStreak = (currentProfile) => {
        const today = new Date();
        const lastCompletionDateStr = currentProfile.ultimo_dia_de_missao_concluida;
        
        if (lastCompletionDateStr && isToday(new Date(lastCompletionDateStr))) {
            return { ...currentProfile, streakUpdated: false };
        }

        let newStreak = currentProfile.streak_atual || 0;
        let streakProtected = false;
    
        if (!lastCompletionDateStr) {
            newStreak = 1;
            toast({ title: 'Nova Sequência Iniciada!', description: 'A consistência é a chave. Vamos lá!' });
        } else {
            const lastCompletionDate = new Date(lastCompletionDateStr);
            const diffDays = differenceInCalendarDays(today, lastCompletionDate);
            
            if (diffDays === 1) {
                newStreak++;
                toast({ title: `Sequência Mantida: Dia ${newStreak}!`, description: `Bom trabalho! Continue assim.` });
            } else if (diffDays > 1) {
                const streakRecoveryAmulet = (currentProfile.active_effects || []).find(eff => eff.type === 'streak_recovery');
                if (streakRecoveryAmulet) {
                    newStreak++; 
                    streakProtected = true;
                    toast({ title: 'Amuleto Ativado!', description: 'A sua sequência foi salva da quebra!' });
                } else {
                    newStreak = 1;
                    toast({ title: 'Nova Sequência Iniciada!', description: 'A consistência é a chave. Vamos lá!' });
                }
            }
        }
        
        const updatedProfile = {
            ...currentProfile,
            streak_atual: newStreak,
            ultimo_dia_de_missao_concluida: today.toISOString(),
            streakUpdated: true
        };

        if (streakProtected) {
            updatedProfile.active_effects = updatedProfile.active_effects.filter(eff => eff.type !== 'streak_recovery');
        }

        return updatedProfile;
    };


    const handleCompleteMission = async ({ rankedMissionId, dailyMissionId, subTask: subTaskToUpdate, amount, feedback }) => {
        const now = new Date();
        
        // --- 1. Update sub-task progress and mission state ---
        let updatedMissions = missions.map(rm => {
            if (rm.id !== rankedMissionId) return rm;
            
            return {
                ...rm,
                missoes_diarias: rm.missoes_diarias.map(dm => {
                    if (dm.id !== dailyMissionId) return dm;
                    
                    return {
                        ...dm,
                        subTasks: dm.subTasks.map(st => 
                            st.name === subTaskToUpdate.name 
                            ? { ...st, current: Math.min(st.target, (st.current || 0) + amount) }
                            : st
                        )
                    };
                })
            };
        });

        // --- 2. Check if the daily mission is fully completed ---
        const rankedMission = updatedMissions.find(rm => rm.id === rankedMissionId);
        const dailyMission = rankedMission.missoes_diarias.find(dm => dm.id === dailyMissionId);
        const allSubTasksCompleted = dailyMission.subTasks.every(st => (st.current || 0) >= st.target);
        
        persistMissions(updatedMissions); // Save sub-task progress immediately
        
        if (!allSubTasksCompleted) {
            return; // Mission not fully complete, so we stop here
        }

        // --- 3. If mission is complete, proceed with profile updates and new mission generation ---
        let updatedProfile = JSON.parse(JSON.stringify(profile));
        let updatedSkills = JSON.parse(JSON.stringify(skills));
        
        const xpBoostEffect = (updatedProfile.active_effects || []).find(eff => eff.type === 'xp_boost' && new Date(eff.expires_at) > now);
        const xpMultiplier = xpBoostEffect ? xpBoostEffect.multiplier : 1;
        const finalXPGained = Math.round(dailyMission.xp_conclusao * xpMultiplier);
    
        if (xpMultiplier > 1) {
            toast({ title: 'Bónus de XP Ativo!', description: `Você ganhou ${finalXPGained} XP (${xpMultiplier}x)!`, className: 'bg-yellow-500/20 border-yellow-500 text-white' });
        }
    
        updatedProfile.xp += finalXPGained;
        updatedProfile.fragmentos = (updatedProfile.fragmentos || 0) + (dailyMission.fragmentos_conclusao || 0);
        updatedProfile.missoes_concluidas_total = (updatedProfile.missoes_concluidas_total || 0) + 1;
        
        updatedProfile = handleStreak(updatedProfile);

        if (updatedProfile.xp >= updatedProfile.xp_para_proximo_nivel) {
            updatedProfile = handleLevelUp(updatedProfile);
        }
        updatedProfile = checkAndUnlockAchievements(updatedProfile);
    
        const meta = metas.find(m => m.nome === rankedMission?.meta_associada);
        if (meta?.habilidade_associada_id) {
            const skillIndex = updatedSkills.findIndex(s => s.id === meta.habilidade_associada_id);
            if (skillIndex !== -1 && updatedSkills[skillIndex].nivel_atual < updatedSkills[skillIndex].nivel_maximo) {
                try {
                    const { xp } = await generateSkillExperience({
                        missionText: `${dailyMission.nome}: ${dailyMission.subTasks.map(st => st.name).join(', ')}`,
                        skillLevel: updatedSkills[skillIndex].nivel_atual,
                    });
                    updatedSkills[skillIndex].xp_atual += xp;
                    updatedSkills[skillIndex].ultima_atividade_em = now.toISOString();
                    
                    if (updatedSkills[skillIndex].xp_atual >= updatedSkills[skillIndex].xp_para_proximo_nivel) {
                        const skillToLevelUp = updatedSkills[skillIndex];
                        const statsToUpgrade = statCategoryMapping[skillToLevelUp.categoria] || [];
                        handleShowSkillUpNotification(skillToLevelUp.nome, skillToLevelUp.nivel_atual + 1, statsToUpgrade.map(s => s.charAt(0).toUpperCase() + s.slice(1)));
                        if (statsToUpgrade.length > 0) {
                            statsToUpgrade.forEach(stat => { updatedProfile.estatisticas[stat] = (updatedProfile.estatisticas[stat] || 0) + 1; });
                        }
                        updatedSkills[skillIndex] = {
                            ...skillToLevelUp,
                            nivel_atual: skillToLevelUp.nivel_atual + 1,
                            xp_atual: skillToLevelUp.xp_atual - skillToLevelUp.xp_para_proximo_nivel,
                            xp_para_proximo_nivel: Math.floor(skillToLevelUp.xp_para_proximo_nivel * 1.5)
                        };
                    }
                } catch (error) { handleToastError(error, "Não foi possível calcular o XP da habilidade."); }
            }
        }
    
        let missionsWithCompletedDaily = updatedMissions.map(rm =>
            rm.id === rankedMissionId
                ? {
                    ...rm,
                    missoes_diarias: rm.missoes_diarias.map(dm => dm.id === dailyMission.id ? { ...dm, concluido: true } : dm),
                    ultima_missao_concluida_em: now.toISOString(),
                }
                : rm
        );
    
        persistProfile(updatedProfile);
        persistSkills(updatedSkills);
        persistMissions(missionsWithCompletedDaily);
    
        try {
            const currentRankedMission = missionsWithCompletedDaily.find(rm => rm.id === rankedMissionId);
            const isRankedMissionComplete = currentRankedMission.missoes_diarias.filter(d => d.concluido).length >= (currentRankedMission.total_missoes_diarias || 10);
            
            if (isRankedMissionComplete) {
                const finalMissionsState = missionsWithCompletedDaily.map(rm => rm.id === rankedMissionId ? { ...rm, concluido: true } : rm);
                persistMissions(finalMissionsState);
                toast({ title: "Missão Épica Concluída!", description: `Você conquistou "${rankedMission.nome}"!` });
    
                const goalMissions = finalMissionsState.filter(m => m.meta_associada === rankedMission.meta_associada).sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
                const currentIndex = goalMissions.findIndex(m => m.id === rankedMissionId);
                const nextMission = goalMissions[currentIndex + 1];
    
                if (nextMission) { handleShowNewEpicMissionNotification(nextMission.nome, nextMission.descricao); }
                else {
                    const completedGoal = metas.find(m => m.nome === rankedMission.meta_associada);
                    if (completedGoal) {
                        persistMetas(metas.map(m => m.id === completedGoal.id ? { ...m, concluida: true } : m));
                        handleShowGoalCompletedNotification(completedGoal.nome);
                    }
                }
            } else {
                const history = currentRankedMission.missoes_diarias.filter(d => d.concluido).map(d => `- ${d.nome}`).join('\n');
    
                const result = await generateNextDailyMission({
                    rankedMissionName: rankedMission.nome,
                    metaName: meta?.nome || "Objetivo geral",
                    goalDeadline: meta?.prazo,
                    history: history || `O utilizador acabou de completar: "${dailyMission.nome}".`,
                    userLevel: updatedProfile.nivel,
                    feedback,
                });
    
                const newDailyMission = {
                    id: Date.now(),
                    nome: result.nextMissionName,
                    xp_conclusao: result.xp,
                    fragmentos_conclusao: result.fragments,
                    concluido: false,
                    tipo: 'diaria',
                    learningResources: result.learningResources || [],
                    subTasks: result.subTasks,
                };
    
                const finalMissionsState = missionsWithCompletedDaily.map(rm =>
                    rm.id === rankedMissionId
                        ? { ...rm, missoes_diarias: [...rm.missoes_diarias, newDailyMission] }
                        : rm
                );
                persistMissions(finalMissionsState);
            }
        } catch (error) {
            handleToastError(error, "Não foi possível gerar a próxima missão diária.");
        }
    };


  const NavItem = ({ icon: Icon, label, page, inSheet = false, className = "" }) => {
    const handleNav = () => {
        setCurrentPage(page);
        if (inSheet) {
            setIsSheetOpen(false); // Close sheet on navigation
        }
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
              <NavItem icon={Clock} label="Rotina" page="routine" inSheet={inSheet}/>
              <NavItem icon={BarChart3} label="Habilidades" page="skills" inSheet={inSheet}/>
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

  const currentGuild = useMemo(() => {
    if (profile?.guild_id) {
        return guilds.find(g => g.id === profile.guild_id) || null;
    }
    return null;
  }, [profile?.guild_id, guilds]);

  const renderContent = () => {
    if (!profile) {
      return null
    }
    
    const views = {
      'dashboard': <DashboardView profile={profile} />,
      'metas': <MetasView metas={metas} setMetas={persistMetas} missions={missions} setMissions={persistMissions} profile={profile} skills={skills} setSkills={persistSkills} />,
      'missions': <MissionsView missions={missions} onCompleteMission={handleCompleteMission} />,
      'skills': <SkillsView skills={skills} setSkills={persistSkills} metas={metas} setMetas={setMetas} />,
      'routine': <RoutineView initialRoutine={routine} persistRoutine={persistRoutine} missions={missions} initialTemplates={routineTemplates} persistTemplates={persistRoutineTemplates} />,
      'achievements': <AchievementsView profile={profile} />,
      'guilds': <GuildsView profile={profile} setProfile={persistProfile} guilds={guilds} setGuilds={persistGuilds} metas={metas} allUsers={allUsers} setAllUsers={setAllUsers} currentGuild={currentGuild} />,
      'shop': <ShopView profile={profile} setProfile={persistProfile} />,
      'inventory': <InventoryView profile={profile} setProfile={persistProfile} />,
      'ai-chat': <AIChatView />,
      'settings': <SettingsView profile={profile} setProfile={persistProfile} onReset={handleFullReset} />,
    };

    return (
      <div key={currentPage} className="animate-in fade-in-50 duration-500">
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
        
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden relative" 
        style={{height: '100vh'}}
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
                        <SheetHeader className="sr-only">
                           <SheetTitle>Menu de Navegação</SheetTitle>
                           <SheetDescription>
                               Use esta barra lateral para navegar entre as diferentes secções da aplicação.
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
        {showOnboarding && <OnboardingGuide onFinish={handleCompleteOnboarding} />}
        {systemAlert && (
            <SystemAlert
              message={systemAlert.message}
              position={systemAlert.position}
              onDismiss={() => setSystemAlert(null)}
            />
        )}
      </main>
    </div>
  );
}
