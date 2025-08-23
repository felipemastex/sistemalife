"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { useToast } from './use-toast';
import * as mockData from '@/lib/data';
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

const PlayerDataContext = createContext(null);

export function usePlayerData() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

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
    const [systemAlert, setSystemAlert] = useState<{ message: string; position: { top: string; left: string; } } | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

    // --- PERSISTENCE FUNCTIONS ---
    const persistProfile = useCallback(async (newProfile) => {
        if (!user) return;
        const profileToSave = { ...newProfile, nome_utilizador: newProfile.primeiro_nome || newProfile.nome_utilizador || '' };
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
        setRoutine(newRoutine);
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

    // --- NOTIFICATION HANDLERS ---
    const handleShowLevelUpNotification = (newLevel, newTitle, newRank) => setQuestNotification({ title: 'NÍVEL AUMENTADO!', description: 'Você alcançou um novo patamar de poder.', goals: [{ name: '- NOVO NÍVEL', progress: `[${newLevel}]` }, { name: '- NOVO TÍTULO', progress: `[${newTitle}]` }, { name: '- NOVO RANK', progress: `[${newRank}]` }], caution: 'Continue a sua jornada para desbloquear todo o seu potencial.' });
    const handleShowNewEpicMissionNotification = (newEpicMissionName, newEpicMissionDescription) => setQuestNotification({ title: 'NOVA MISSÃO ÉPICA', description: 'Um novo desafio épico o aguarda.', goals: [{ name: '- NOME', progress: `[${newEpicMissionName}]` }, { name: '- OBJETIVO', progress: `[${newEpicMissionDescription}]` }], caution: 'Prepare-se para o que vem a seguir.' });
    const handleShowSkillUpNotification = (skillName, newLevel, statBonuses) => {
        const goals = [{ name: `- HABILIDADE`, progress: `[${skillName}]` }, { name: `- NOVO NÍVEL`, progress: `[${newLevel}]` }];
        if (statBonuses && statBonuses.length > 0) goals.push({ name: '- BÓNUS DE ATRIBUTO', progress: `[${statBonuses.join(', ')}]` });
        setQuestNotification({ title: 'HABILIDADE AUMENTADA!', description: 'A sua dedicação foi recompensada.', goals, caution: 'A maestria é uma jornada sem fim.' });
    };
    const handleShowSkillDecayNotification = (decayedSkillsInfo) => setQuestNotification({ title: 'CORRUPÇÃO DETETADA', description: 'Inatividade prolongada corrompeu o seu progresso.', goals: decayedSkillsInfo.map(info => ({ name: `- HABILIDADE`, progress: `[${info.name}] (-${info.xpLost} XP)` })), caution: 'A prática constante é a chave para a maestria.' });
    const handleShowSkillAtRiskNotification = (atRiskSkills) => setQuestNotification({ title: 'ALERTA DO SISTEMA', description: 'As seguintes habilidades estão em risco de corrupção.', goals: atRiskSkills.map(info => ({ name: `- HABILIDADE`, progress: `[${info.name}] (${info.daysInactive} dias inativa)` })), caution: 'Pratique estas habilidades para evitar a perda de progresso.' });
    const handleShowDailyBriefingNotification = (briefingMissions) => {
        if (!briefingMissions || briefingMissions.length === 0) return;
        const goals = briefingMissions.map(mission => ({ name: `- [${mission.epicMissionName}]`, progress: mission.nome }));
        setQuestNotification({ title: 'BRIEFING DIÁRIO', description: 'Os seus objetivos para hoje foram identificados.', goals, caution: 'O sucesso é a soma de pequenos esforços.' });
    };
    const handleShowGoalCompletedNotification = (goalName) => setQuestNotification({ title: 'META CONCLUÍDA!', description: 'Parabéns, Caçador! Você completou um dos seus maiores objetivos.', goals: [{ name: '- CONQUISTA', progress: `[${goalName}]` }], caution: 'Um novo horizonte de desafios aguarda.' });
    const handleShowAchievementUnlockedNotification = (achievementName) => setQuestNotification({ title: 'CONQUISTA DESBLOQUEADA!', description: 'O seu esforço foi reconhecido pelo Sistema.', goals: [{ name: '- CONQUISTA', progress: `[${achievementName}]` }], caution: 'Continue a sua jornada para desbloquear todos os segredos.' });
    
    // --- CORE LOGIC ---
    const handleToastError = (error, customMessage) => {
        console.error("Erro de IA:", error);
        toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage || 'Não foi possível continuar. O Sistema pode estar sobrecarregado.' });
    };

    const handleLevelUp = (currentProfile) => {
        const newLevel = currentProfile.nivel + 1;
        const newXpToNextLevel = Math.floor(currentProfile.xp_para_proximo_nivel + 25);
        const newXp = currentProfile.xp - currentProfile.xp_para_proximo_nivel;
        const { rank, title } = getProfileRank(newLevel);
        handleShowLevelUpNotification(newLevel, title, rank);
        return { ...currentProfile, nivel: newLevel, xp: newXp, xp_para_proximo_nivel: newXpToNextLevel };
    };

    const checkAndUnlockAchievements = (currentProfile) => {
        const newlyUnlocked = [];
        achievements.forEach(achievement => {
            const isAlreadyUnlocked = currentProfile.achievements?.some(a => a.achievementId === achievement.id);
            if (isAlreadyUnlocked) return;
            let conditionMet = false;
            switch (achievement.criteria.type) {
                case 'missions_completed': conditionMet = currentProfile.missoes_concluidas_total >= achievement.criteria.value; break;
                case 'level_reached': conditionMet = currentProfile.nivel >= achievement.criteria.value; break;
            }
            if (conditionMet) {
                newlyUnlocked.push({ achievementId: achievement.id, date: new Date().toISOString() });
                handleShowAchievementUnlockedNotification(achievement.name);
            }
        });
        return newlyUnlocked.length > 0 ? { ...currentProfile, achievements: [...(currentProfile.achievements || []), ...newlyUnlocked] } : currentProfile;
    };

    const handleStreak = (currentProfile) => {
        const today = new Date();
        const lastCompletionDateStr = currentProfile.ultimo_dia_de_missao_concluida;
        if (lastCompletionDateStr && isToday(new Date(lastCompletionDateStr))) return { ...currentProfile, streakUpdated: false };
        let newStreak = currentProfile.streak_atual || 0;
        let streakProtected = false;
        if (!lastCompletionDateStr) {
            newStreak = 1;
            toast({ title: 'Nova Sequência Iniciada!' });
        } else {
            const diffDays = differenceInCalendarDays(today, new Date(lastCompletionDateStr));
            if (diffDays === 1) {
                newStreak++;
                toast({ title: `Sequência Mantida: Dia ${newStreak}!` });
            } else if (diffDays > 1) {
                const streakRecoveryAmulet = (currentProfile.active_effects || []).find(eff => eff.type === 'streak_recovery');
                if (streakRecoveryAmulet) {
                    newStreak++;
                    streakProtected = true;
                    toast({ title: 'Amuleto Ativado!', description: 'A sua sequência foi salva!' });
                } else {
                    newStreak = 1;
                    toast({ title: 'Nova Sequência Iniciada!' });
                }
            }
        }
        const updatedProfile = { ...currentProfile, streak_atual: newStreak, ultimo_dia_de_missao_concluida: today.toISOString(), streakUpdated: true };
        if (streakProtected) updatedProfile.active_effects = updatedProfile.active_effects.filter(eff => eff.type !== 'streak_recovery');
        return updatedProfile;
    };

    const completeMission = async ({ rankedMissionId, dailyMissionId, subTask, amount, feedback }) => {
        const now = new Date();
        let updatedMissions = missions.map(rm => rm.id !== rankedMissionId ? rm : { ...rm, missoes_diarias: rm.missoes_diarias.map(dm => dm.id !== dailyMissionId ? dm : { ...dm, subTasks: dm.subTasks.map(st => st.name === subTask.name ? { ...st, current: Math.min(st.target, (st.current || 0) + amount) } : st) }) });
        const rankedMission = updatedMissions.find(rm => rm.id === rankedMissionId);
        const dailyMission = rankedMission.missoes_diarias.find(dm => dm.id === dailyMissionId);
        const allSubTasksCompleted = dailyMission.subTasks.every(st => (st.current || 0) >= st.target);
        persistMissions(updatedMissions);
        if (!allSubTasksCompleted) return;

        let updatedProfile = { ...profile };
        const xpBoostEffect = (updatedProfile.active_effects || []).find(eff => eff.type === 'xp_boost' && new Date(eff.expires_at) > now);
        const xpMultiplier = xpBoostEffect ? xpBoostEffect.multiplier : 1;
        const finalXPGained = Math.round(dailyMission.xp_conclusao * xpMultiplier);
        if (xpMultiplier > 1) toast({ title: 'Bónus de XP Ativo!', description: `Você ganhou ${finalXPGained} XP (${xpMultiplier}x)!` });
        updatedProfile.xp += finalXPGained;
        updatedProfile.fragmentos = (updatedProfile.fragmentos || 0) + (dailyMission.fragmentos_conclusao || 0);
        updatedProfile.missoes_concluidas_total = (updatedProfile.missoes_concluidas_total || 0) + 1;
        updatedProfile = handleStreak(updatedProfile);
        if (updatedProfile.xp >= updatedProfile.xp_para_proximo_nivel) updatedProfile = handleLevelUp(updatedProfile);
        updatedProfile = checkAndUnlockAchievements(updatedProfile);

        let updatedSkills = [...skills];
        const meta = metas.find(m => m.nome === rankedMission?.meta_associada);
        if (meta?.habilidade_associada_id) {
            const skillIndex = updatedSkills.findIndex(s => s.id === meta.habilidade_associada_id);
            if (skillIndex !== -1 && updatedSkills[skillIndex].nivel_atual < updatedSkills[skillIndex].nivel_maximo) {
                try {
                    const { xp } = await generateSkillExperience({ missionText: `${dailyMission.nome}: ${dailyMission.subTasks.map(st => st.name).join(', ')}`, skillLevel: updatedSkills[skillIndex].nivel_atual });
                    updatedSkills[skillIndex].xp_atual += xp;
                    updatedSkills[skillIndex].ultima_atividade_em = now.toISOString();
                    if (updatedSkills[skillIndex].xp_atual >= updatedSkills[skillIndex].xp_para_proximo_nivel) {
                        const skillToLevelUp = updatedSkills[skillIndex];
                        const statsToUpgrade = statCategoryMapping[skillToLevelUp.categoria] || [];
                        handleShowSkillUpNotification(skillToLevelUp.nome, skillToLevelUp.nivel_atual + 1, statsToUpgrade.map(s => s.charAt(0).toUpperCase() + s.slice(1)));
                        if (statsToUpgrade.length > 0) statsToUpgrade.forEach(stat => { updatedProfile.estatisticas[stat] = (updatedProfile.estatisticas[stat] || 0) + 1; });
                        updatedSkills[skillIndex] = { ...skillToLevelUp, nivel_atual: skillToLevelUp.nivel_atual + 1, xp_atual: skillToLevelUp.xp_atual - skillToLevelUp.xp_para_proximo_nivel, xp_para_proximo_nivel: Math.floor(skillToLevelUp.xp_para_proximo_nivel * 1.5) };
                    }
                } catch (error) { handleToastError(error, "Não foi possível calcular o XP da habilidade."); }
            }
        }
        let missionsWithCompletedDaily = updatedMissions.map(rm => rm.id === rankedMissionId ? { ...rm, missoes_diarias: rm.missoes_diarias.map(dm => dm.id === dailyMission.id ? { ...dm, concluido: true } : dm), ultima_missao_concluida_em: now.toISOString() } : rm);
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
                const result = await generateNextDailyMission({ rankedMissionName: rankedMission.nome, metaName: meta?.nome || "Objetivo geral", goalDeadline: meta?.prazo, history: history || `O utilizador acabou de completar: "${dailyMission.nome}".`, userLevel: updatedProfile.nivel, feedback });
                const newDailyMission = { id: Date.now(), nome: result.nextMissionName, xp_conclusao: result.xp, fragmentos_conclusao: result.fragments, concluido: false, tipo: 'diaria', learningResources: result.learningResources || [], subTasks: result.subTasks };
                const finalMissionsState = missionsWithCompletedDaily.map(rm => rm.id === rankedMissionId ? { ...rm, missoes_diarias: [...rm.missoes_diarias, newDailyMission] } : rm);
                persistMissions(finalMissionsState);
            }
        } catch (error) { handleToastError(error, "Não foi possível gerar a próxima missão diária."); }
    };

    const setupInitialData = async (userId, userEmail) => {
        const userRef = doc(db, 'users', userId);
        const batch = writeBatch(db);
        const emailUsername = userEmail.split('@')[0];
        const initialProfile = { ...mockData.perfis[0], id: userId, email: userEmail, primeiro_nome: emailUsername, apelido: "Caçador", nome_utilizador: emailUsername, avatar_url: `https://placehold.co/100x100.png?text=${emailUsername.substring(0, 2).toUpperCase()}`, ultimo_login_em: new Date().toISOString(), inventory: [], active_effects: [], guild_id: null, guild_role: null, onboarding_completed: false };
        batch.set(userRef, initialProfile);
        const metasRef = collection(db, 'users', userId, 'metas');
        mockData.metas.forEach(meta => batch.set(doc(metasRef, String(meta.id)), { ...meta, prazo: meta.prazo || null, concluida: meta.concluida || false }));
        const missionsRef = collection(db, 'users', userId, 'missions');
        mockData.missoes.forEach(mission => batch.set(doc(missionsRef, String(mission.id)), mission));
        const skillsRef = collection(db, 'users', userId, 'skills');
        mockData.habilidades.forEach(skill => batch.set(doc(skillsRef, String(skill.id)), skill));
        batch.set(doc(db, 'users', userId, 'routine', 'main'), mockData.rotina);
        batch.set(doc(db, 'users', userId, 'routine', 'templates'), mockData.rotinaTemplates);
        await batch.commit();
        setProfile(initialProfile);
        setMetas(mockData.metas.map(m => ({ ...m, prazo: m.prazo || null, concluida: m.concluida || false })));
        setMissions(mockData.missoes);
        setSkills(mockData.habilidades);
        setRoutine(mockData.rotina);
        setRoutineTemplates(mockData.rotinaTemplates);
        toast({ title: "Bem-vindo ao Sistema!", description: "O seu perfil inicial foi configurado." });
    };

    const handleFullReset = async () => {
        if (!user) return;
        setIsDataLoaded(false);
        try {
            await setupInitialData(user.uid, user.email);
            setShowOnboarding(true);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro no Reset", description: `Não foi possível apagar os seus dados. Erro: ${error.message}` });
        } finally {
            setIsDataLoaded(true);
        }
    };

    const checkSkillStatus = useCallback((currentSkills) => {
        const now = new Date();
        const INACTIVITY_THRESHOLD_DAYS = 14, AT_RISK_THRESHOLD_DAYS = 7, XP_DECAY_PER_DAY = 5;
        let skillsChanged = false, decayedSkillsInfo = [], atRiskSkillsInfo = [];
        const updatedSkills = currentSkills.map(skill => {
            if (!skill.ultima_atividade_em) return { ...skill, ultima_atividade_em: now.toISOString() };
            const daysSinceActivity = (now.getTime() - new Date(skill.ultima_atividade_em).getTime()) / (1000 * 3600 * 24);
            if (daysSinceActivity > INACTIVITY_THRESHOLD_DAYS) {
                const totalDecay = Math.floor(daysSinceActivity - INACTIVITY_THRESHOLD_DAYS) * XP_DECAY_PER_DAY;
                const newXp = Math.max(0, skill.xp_atual - totalDecay);
                if (newXp !== skill.xp_atual) {
                    skillsChanged = true;
                    decayedSkillsInfo.push({ name: skill.nome, xpLost: Math.round(skill.xp_atual - newXp) });
                    return { ...skill, xp_atual: newXp, ultima_atividade_em: now.toISOString() };
                }
            } else if (daysSinceActivity > AT_RISK_THRESHOLD_DAYS) {
                atRiskSkillsInfo.push({ name: skill.nome, daysInactive: Math.floor(daysSinceActivity) });
            }
            return skill;
        });
        if (decayedSkillsInfo.length > 0) handleShowSkillDecayNotification(decayedSkillsInfo);
        else if (atRiskSkillsInfo.length > 0) handleShowSkillAtRiskNotification(atRiskSkillsInfo);
        return { updatedSkills, skillsChanged };
    }, []);

    const checkDailyLogin = useCallback((profileData, missionsData) => {
        const lastLogin = profileData.ultimo_login_em ? new Date(profileData.ultimo_login_em) : new Date(0);
        if (!isToday(lastLogin)) {
            const briefingMissions = [];
            const missionsByGoal = missionsData.reduce((acc, mission) => { (acc[mission.meta_associada] = acc[mission.meta_associada] || []).push(mission); return acc; }, {});
            for (const goalName in missionsByGoal) {
                const firstActiveEpicMission = missionsByGoal[goalName].filter(m => !m.concluido).sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank))[0];
                if (firstActiveEpicMission) {
                    const activeDailyMission = firstActiveEpicMission.missoes_diarias?.find(dm => !dm.concluido);
                    if (activeDailyMission) briefingMissions.push({ ...activeDailyMission, epicMissionName: firstActiveEpicMission.nome });
                }
            }
            if (briefingMissions.length > 0) handleShowDailyBriefingNotification(briefingMissions);
            return true;
        }
        return false;
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
                const updatedProfile = showBriefing ? { ...profileData, ultimo_login_em: new Date().toISOString() } : profileData;
                setProfile(updatedProfile);
                if (showBriefing) await setDoc(userDocRef, updatedProfile, { merge: true });
                if (profileData.onboarding_completed === false) setShowOnboarding(true);
                const metasSnapshot = await getDocs(collection(userDocRef, 'metas'));
                setMetas(metasSnapshot.docs.map(doc => ({ ...doc.data() })));
                const skillsSnapshot = await getDocs(collection(userDocRef, 'skills'));
                const { updatedSkills, skillsChanged } = checkSkillStatus(skillsSnapshot.docs.map(doc => ({ ...doc.data() })));
                setSkills(updatedSkills);
                if (skillsChanged) persistSkills(updatedSkills);
                const routineDoc = await getDoc(doc(userDocRef, 'routine', 'main'));
                setRoutine(routineDoc.exists() ? routineDoc.data() : {});
                const routineTemplatesDoc = await getDoc(doc(userDocRef, 'routine', 'templates'));
                setRoutineTemplates(routineTemplatesDoc.exists() ? routineTemplatesDoc.data() : {});
                const allUsersSnapshot = await getDocs(collection(db, 'users'));
                setAllUsers(allUsersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                const guildsSnapshot = await getDocs(collection(db, 'guilds'));
                setGuilds(guildsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                await setupInitialData(user.uid, user.email);
                setShowOnboarding(true);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro de Sincronização", description: "Não foi possível carregar os seus dados." });
        } finally {
            setIsDataLoaded(true);
        }
    }, [user, toast, checkSkillStatus, checkDailyLogin, persistSkills, rankOrder]);

    useEffect(() => {
        if (user && !isDataLoaded) fetchData(user.uid);
    }, [user, isDataLoaded, fetchData]);
    
    useEffect(() => {
        if (!isDataLoaded || systemAlert) return;
        const timer = setTimeout(async () => {
            try {
                const result = await generateSystemAdvice({ userName: profile.nome_utilizador, profile: JSON.stringify(profile), metas: JSON.stringify(metas), routine: JSON.stringify(routine), missions: JSON.stringify(missions.filter(m => !m.concluido)), query: "Dê-me um alerta rápido ou uma dica estratégica sobre o meu estado atual, em uma frase curta." });
                const top = `${Math.floor(Math.random() * 40) + 15}%`;
                const left = `${Math.floor(Math.random() * 60) + 5}%`;
                setSystemAlert({ message: result.response, position: { top, left } });
            } catch (error) { console.warn("Could not fetch proactive system alert:", error); }
        }, 90000);
        return () => clearTimeout(timer);
    }, [isDataLoaded, systemAlert, profile, metas, routine, missions]);

    return {
        isDataLoaded,
        profile, metas, missions, skills, routine, routineTemplates, guilds, allUsers,
        setProfile: persistProfile, setMetas: persistMetas, setMissions: persistMissions,
        setSkills: persistSkills, setRoutine: persistRoutine, setRoutineTemplates: persistRoutineTemplates,
        setGuilds: persistGuilds, setAllUsers,
        completeMission, handleFullReset,
        questNotification, setQuestNotification,
        systemAlert, setSystemAlert,
        showOnboarding, setShowOnboarding,
    };
}


export const PlayerDataProvider = ({ children }: { children: ReactNode }) => {
    const playerData = usePlayerData();
    return (
        <PlayerDataContext.Provider value={playerData}>
            {children}
        </PlayerDataContext.Provider>
    );
};

export const usePlayerDataContext = () => {
    const context = useContext(PlayerDataContext);
    if (!context) {
        throw new Error('usePlayerDataContext must be used within a PlayerDataProvider');
    }
    return context;
};