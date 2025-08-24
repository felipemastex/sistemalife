
"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useReducer } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc } from "firebase/firestore";
import { useToast } from './use-toast';
import * as mockData from '@/lib/data';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { generateNextDailyMission } from '@/ai/flows/generate-next-daily-mission';
import { generateSkillExperience } from '@/ai/flows/generate-skill-experience';
import { achievements } from '@/lib/achievements';
import { differenceInCalendarDays, isToday } from 'date-fns';
import { statCategoryMapping } from '@/lib/mappings';
import { usePlayerNotifications } from './use-player-notifications';


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

const initialState = {
    profile: null,
    metas: [],
    missions: [],
    skills: [],
    routine: {},
    routineTemplates: {},
    allUsers: [],
    guilds: [],
    isDataLoaded: false,
    missionFeedback: {}, 
    generatingMission: null,
};

function playerDataReducer(state, action) {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return {
                ...state,
                ...action.payload,
                isDataLoaded: true,
            };
        case 'SET_DATA_LOADED':
            return { ...state, isDataLoaded: action.payload };
        case 'SET_PROFILE':
            return { ...state, profile: action.payload };
        case 'SET_METAS':
            return { ...state, metas: action.payload };
        case 'SET_MISSIONS':
            return { ...state, missions: action.payload };
        case 'SET_SKILLS':
            return { ...state, skills: action.payload };
        case 'SET_ROUTINE':
            return { ...state, routine: action.payload };
        case 'SET_ROUTINE_TEMPLATES':
            return { ...state, routineTemplates: action.payload };
        case 'SET_ALL_USERS':
            return { ...state, allUsers: action.payload };
        case 'SET_GUILDS':
            return { ...state, guilds: action.payload };
        case 'SET_GENERATING_MISSION':
            return { ...state, generatingMission: action.payload };
        case 'SET_MISSION_FEEDBACK':
            return { ...state, missionFeedback: { ...state.missionFeedback, [action.payload.missionId]: action.payload.feedback }};
        case 'CLEAR_MISSION_FEEDBACK': {
            const newFeedback = { ...state.missionFeedback };
            delete newFeedback[action.payload.missionId];
            return { ...state, missionFeedback: newFeedback };
        }
        case 'UPDATE_SUB_TASK_PROGRESS': {
            const { rankedMissionId, dailyMissionId, subTaskName, amount } = action.payload;
            const newMissions = state.missions.map(rm => 
                rm.id !== rankedMissionId ? rm : {
                    ...rm,
                    missoes_diarias: rm.missoes_diarias.map(dm => 
                        dm.id !== dailyMissionId ? dm : {
                            ...dm,
                            subTasks: dm.subTasks.map(st => 
                                st.name === subTaskName ? { ...st, current: Math.min(st.target, (st.current || 0) + amount) } : st
                            )
                        }
                    )
                }
            );
            return { ...state, missions: newMissions };
        }
        case 'COMPLETE_DAILY_MISSION': {
             const { rankedMissionId, dailyMissionId, newDailyMission } = action.payload;
             const updatedMissions = state.missions.map(rm => {
                if (rm.id === rankedMissionId) {
                    const newDailyMissionsList = rm.missoes_diarias.map(dm => 
                        dm.id === dailyMissionId ? { ...dm, concluido: true, completed_at: new Date().toISOString() } : dm
                    );
                    if (newDailyMission) {
                        newDailyMissionsList.push(newDailyMission);
                    }
                    return { ...rm, missoes_diarias: newDailyMissionsList, ultima_missao_concluida_em: new Date().toISOString() };
                }
                return rm;
            });
            return { ...state, missions: updatedMissions };
        }
        case 'COMPLETE_EPIC_MISSION': {
            const { rankedMissionId } = action.payload;
            const updatedMissions = state.missions.map(rm => 
                rm.id === rankedMissionId ? { ...rm, concluido: true } : rm
            );
            return { ...state, missions: updatedMissions };
        }
        case 'UPDATE_SKILL': {
            const { skillId, updates } = action.payload;
            return {
                ...state,
                skills: state.skills.map(s => s.id === skillId ? { ...s, ...updates } : s)
            };
        }
        default:
            return state;
    }
}


export function PlayerDataProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [state, dispatch] = useReducer(playerDataReducer, initialState);
    const { toast } = useToast();
    
    const { 
        questNotification, setQuestNotification,
        systemAlert, setSystemAlert,
        showOnboarding, setShowOnboarding,
        timers,
        handleShowLevelUpNotification,
        handleShowNewEpicMissionNotification,
        handleShowSkillUpNotification,
        handleShowSkillDecayNotification,
        handleShowSkillAtRiskNotification,
        handleShowDailyBriefingNotification,
        handleShowGoalCompletedNotification,
        handleShowAchievementUnlockedNotification,
        handleShowStreakBonusNotification,
    } = usePlayerNotifications(state.profile);

    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

    const persistData = useCallback(async (key, data) => {
        if (!user) return;
        
        const singleDocCollections = {
            profile: () => doc(db, 'users', user.uid),
            routine: () => doc(db, 'users', user.uid, 'routine', 'main'),
            routineTemplates: () => doc(db, 'users', user.uid, 'routine', 'templates'),
        };

        const typeMap = {
            profile: 'SET_PROFILE',
            metas: 'SET_METAS',
            missions: 'SET_MISSIONS',
            skills: 'SET_SKILLS',
            routine: 'SET_ROUTINE',
            routineTemplates: 'SET_ROUTINE_TEMPLATES',
            guilds: 'SET_GUILDS',
            allUsers: 'SET_ALL_USERS',
        };

        const actionType = typeMap[key];
        if (actionType) {
            dispatch({ type: actionType, payload: data });
        }


        if (singleDocCollections[key]) {
            await setDoc(singleDocCollections[key](), data, { merge: true });
            return;
        }

        const multiDocCollections = {
            metas: 'metas',
            missions: 'missions',
            skills: 'skills',
            guilds: 'guilds',
            allUsers: 'users',
        };

        if (multiDocCollections[key]) {
             const collectionName = multiDocCollections[key];
             const isGlobalCollection = key === 'guilds' || key === 'allUsers';
             const ref = collection(db, isGlobalCollection ? collectionName : `users/${user.uid}/${collectionName}`);
             
             const batch = writeBatch(db);
             const snapshot = await getDocs(ref);
             const existingIds = snapshot.docs.map(d => d.id);
             const newIds = data.map(item => String(item.id));
             
             const idsToDelete = existingIds.filter(id => !newIds.includes(id));

             idsToDelete.forEach(id => batch.delete(doc(ref, id)));
             data.forEach(item => {
                const docRef = doc(ref, String(item.id));
                batch.set(docRef, item);
             });
             await batch.commit();
        }

    }, [user]);

    const handleLevelUp = (currentProfile) => {
        const newLevel = currentProfile.nivel + 1;
        const newXpToNextLevel = Math.floor(currentProfile.xp_para_proximo_nivel * 1.5);
        const newXp = currentProfile.xp - currentProfile.xp_para_proximo_nivel;
        const { rank, title } = getProfileRank(newLevel);
        handleShowLevelUpNotification(newLevel, title, rank);
        const newProfile = { ...currentProfile, nivel: newLevel, xp: newXp, xp_para_proximo_nivel: newXpToNextLevel };
        dispatch({ type: 'SET_PROFILE', payload: newProfile });
        return newProfile;
    };
    
    const checkAndUnlockAchievements = useCallback((currentProfile, currentMetas, currentSkills) => {
        if (!currentProfile) return;

        const newlyUnlocked = [];
        achievements.forEach(achievement => {
            const isAlreadyUnlocked = currentProfile.achievements?.some(a => a.achievementId === achievement.id);
            if (isAlreadyUnlocked) return;

            let conditionMet = false;
            switch (achievement.criteria.type) {
                case 'missions_completed':
                    conditionMet = (currentProfile.missoes_concluidas_total || 0) >= achievement.criteria.value;
                    break;
                case 'level_reached':
                    conditionMet = (currentProfile.nivel || 1) >= achievement.criteria.value;
                    break;
                case 'goals_created':
                     conditionMet = currentMetas.length >= achievement.criteria.value;
                     break;
                case 'goals_completed':
                     conditionMet = currentMetas.filter(m => m.concluida).length >= achievement.criteria.value;
                     break;
                case 'skills_acquired':
                     conditionMet = currentSkills.length >= achievement.criteria.value;
                     break;
                 case 'skill_max_level':
                     conditionMet = currentSkills.some(s => s.nivel_atual >= s.nivel_maximo);
                     break;
            }

            if (conditionMet) {
                newlyUnlocked.push({ achievementId: achievement.id, date: new Date().toISOString() });
                handleShowAchievementUnlockedNotification(achievement.name);
            }
        });

        if (newlyUnlocked.length > 0) {
            const updatedProfile = { ...currentProfile, achievements: [...(currentProfile.achievements || []), ...newlyUnlocked] };
            persistData('profile', updatedProfile);
        }
    }, [persistData, handleShowAchievementUnlockedNotification]);

    useEffect(() => {
        if (state.isDataLoaded) {
            checkAndUnlockAchievements(state.profile, state.metas, state.skills);
        }
    }, [state.profile, state.metas, state.skills, state.isDataLoaded, checkAndUnlockAchievements]);
    
     const handleStreak = (currentProfile) => {
        const today = new Date();
        const lastCompletionDateStr = currentProfile.ultimo_dia_de_missao_concluida;
        let bonus = { xp: 0, fragments: 0 };

        if (lastCompletionDateStr && isToday(new Date(lastCompletionDateStr))) {
            return { updatedProfile: {...currentProfile}, streakUpdated: false, bonus };
        }
        
        let newStreak = currentProfile.streak_atual || 0;
        let streakProtected = false;

        if (!lastCompletionDateStr) {
            newStreak = 1;
        } else {
            const diffDays = differenceInCalendarDays(today, new Date(lastCompletionDateStr));
            if (diffDays === 1) {
                newStreak++;
            } else if (diffDays > 1) {
                const streakRecoveryAmulet = (currentProfile.active_effects || []).find(eff => eff.type === 'streak_recovery');
                if (streakRecoveryAmulet) {
                    newStreak++;
                    streakProtected = true;
                    toast({ title: 'Amuleto Ativado!', description: 'A sua sequência foi salva!' });
                } else {
                    newStreak = 1;
                }
            }
        }
        
        const streakMilestones = { 3: 20, 7: 50, 14: 120, 30: 300 }; 
        if (streakMilestones[newStreak]) {
            const xpBonus = streakMilestones[newStreak];
            const fragmentBonus = Math.round(xpBonus / 10);
            bonus = { xp: xpBonus, fragments: fragmentBonus };
            handleShowStreakBonusNotification(newStreak, xpBonus, fragmentBonus);
        }

        const updatedProfile = { 
            ...currentProfile, 
            streak_atual: newStreak, 
            ultimo_dia_de_missao_concluida: today.toISOString(),
        };

        if (streakProtected) {
            updatedProfile.active_effects = updatedProfile.active_effects.filter(eff => eff.type !== 'streak_recovery');
        }

        return { updatedProfile, streakUpdated: true, bonus };
    };

    const setMissionFeedback = (missionId, feedback) => {
        dispatch({ type: 'SET_MISSION_FEEDBACK', payload: { missionId, feedback } });
    };

    const completeMission = useCallback(async ({ rankedMissionId, dailyMissionId, subTask, amount, feedback }) => {
        
        dispatch({ type: 'UPDATE_SUB_TASK_PROGRESS', payload: { rankedMissionId, dailyMissionId, subTaskName: subTask.name, amount } });
        
        const tempState = playerDataReducer(state, { type: 'UPDATE_SUB_TASK_PROGRESS', payload: { rankedMissionId, dailyMissionId, subTaskName: subTask.name, amount } });
        const tempRankedMission = tempState.missions.find(rm => rm.id === rankedMissionId);
        const tempDailyMission = tempRankedMission?.missoes_diarias.find(dm => dm.id === dailyMissionId);

        if (!tempDailyMission) return;
        
        const allSubTasksCompleted = tempDailyMission.subTasks.every(st => (st.current || 0) >= st.target);
        
        if (!allSubTasksCompleted) {
             persistData('missions', tempState.missions);
             return;
        }

        dispatch({ type: 'SET_GENERATING_MISSION', payload: rankedMissionId });
        
        let updatedProfile = { ...state.profile };
        const { updatedProfile: profileAfterStreak, bonus: streakBonus } = handleStreak(updatedProfile);
        updatedProfile = profileAfterStreak;

        const xpBoostEffect = (updatedProfile.active_effects || []).find(eff => eff.type === 'xp_boost' && new Date(eff.expires_at) > new Date());
        const xpMultiplier = xpBoostEffect ? xpBoostEffect.multiplier : 1;
        const finalXPGained = Math.round(tempDailyMission.xp_conclusao * xpMultiplier);
        
        if (xpMultiplier > 1) toast({ title: 'Bónus de XP Ativo!', description: `Você ganhou ${finalXPGained} XP (${xpMultiplier}x)!` });
        
        updatedProfile.xp += finalXPGained + streakBonus.xp;
        updatedProfile.fragmentos = (updatedProfile.fragmentos || 0) + (tempDailyMission.fragmentos_conclusao || 0) + streakBonus.fragments;
        updatedProfile.missoes_concluidas_total = (updatedProfile.missoes_concluidas_total || 0) + 1;
        
        if (updatedProfile.xp >= updatedProfile.xp_para_proximo_nivel) {
            updatedProfile = handleLevelUp(updatedProfile);
        }
        
        let missionSkillXp = 0;
        try {
            const { xp } = await generateSkillExperience({ missionText: `${tempDailyMission.nome}: ${tempDailyMission.subTasks.map(st => st.name).join(', ')}`, skillLevel: 1 });
            missionSkillXp = xp;
        } catch(e) { console.error("Could not get skill xp", e); }
        
        const meta = state.metas.find(m => m.nome === tempRankedMission.meta_associada);
        if (meta?.habilidade_associada_id) {
            const skillToUpdate = { ...state.skills.find(s => s.id === meta.habilidade_associada_id) };
            if (skillToUpdate && skillToUpdate.nivel_atual < skillToUpdate.nivel_maximo) {
                skillToUpdate.xp_atual += missionSkillXp;
                skillToUpdate.ultima_atividade_em = new Date().toISOString();
                 if (skillToUpdate.xp_atual >= skillToUpdate.xp_para_proximo_nivel) {
                    const statsToUpgrade = statCategoryMapping[skillToUpdate.categoria] || [];
                    handleShowSkillUpNotification(skillToUpdate.nome, skillToUpdate.nivel_atual + 1, statsToUpgrade.map(s => s.charAt(0).toUpperCase() + s.slice(1)));
                    if (statsToUpgrade.length > 0) statsToUpgrade.forEach(stat => { updatedProfile.estatisticas[stat] = (updatedProfile.estatisticas[stat] || 0) + 1; });
                    skillToUpdate.nivel_atual += 1;
                    skillToUpdate.xp_atual -= skillToUpdate.xp_para_proximo_nivel;
                    skillToUpdate.xp_para_proximo_nivel = Math.floor(skillToUpdate.xp_para_proximo_nivel * 1.5);
                }
                dispatch({ type: 'UPDATE_SKILL', payload: { skillId: meta.habilidade_associada_id, updates: skillToUpdate } });
            }
        }
        
        let newDailyMission = null;
        try {
            const rankedMissionAfterDaily = { ...tempRankedMission, missoes_diarias: tempRankedMission.missoes_diarias.map(dm => dm.id === dailyMissionId ? {...dm, concluido: true} : dm) };
            const isRankedMissionComplete = rankedMissionAfterDaily.missoes_diarias.filter(d => d.concluido).length >= (rankedMissionAfterDaily.total_missoes_diarias || 10);
            if (!isRankedMissionComplete) {
                const history = rankedMissionAfterDaily.missoes_diarias.filter(d => d.concluido).map(d => `- ${d.nome}`).join('\n');
                const feedbackForAI = feedback || state.missionFeedback[rankedMissionId];
                const result = await generateNextDailyMission({ rankedMissionName: tempRankedMission.nome, metaName: meta?.nome || "Objetivo geral", goalDeadline: meta?.prazo, history: history || `O utilizador acabou de completar: "${tempDailyMission.nome}".`, userLevel: updatedProfile.nivel, feedback: feedbackForAI });
                newDailyMission = { id: Date.now(), nome: result.nextMissionName, descricao: result.nextMissionDescription, xp_conclusao: result.xp, fragmentos_conclusao: result.fragments, concluido: false, tipo: 'diaria', learningResources: result.learningResources || [], subTasks: result.subTasks.map(st => ({...st, current: 0})) };
                if (feedbackForAI) {
                    dispatch({ type: 'CLEAR_MISSION_FEEDBACK', payload: { missionId: rankedMissionId }});
                }
            }
        } catch(e) { console.error("Could not generate next mission", e) }

        dispatch({ type: 'COMPLETE_DAILY_MISSION', payload: { rankedMissionId, dailyMissionId, newDailyMission } });

        const finalRankedMission = tempState.missions.find(m => m.id === rankedMissionId);
        const isRankedMissionComplete = finalRankedMission.missoes_diarias.filter(d => d.concluido).length >= (finalRankedMission.total_missoes_diarias || 10);
        
        if(isRankedMissionComplete) {
            dispatch({ type: 'COMPLETE_EPIC_MISSION', payload: { rankedMissionId } });
            toast({ title: "Missão Épica Concluída!", description: `Você conquistou "${tempRankedMission.nome}"!` });
            const goalMissions = tempState.missions.filter(m => m.meta_associada === tempRankedMission.meta_associada).sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
            const currentIndex = goalMissions.findIndex(m => m.id === rankedMissionId);
            const nextMission = goalMissions[currentIndex + 1];
            if (nextMission) { handleShowNewEpicMissionNotification(nextMission.nome, nextMission.descricao); }
            else {
                const completedGoal = state.metas.find(m => m.nome === tempRankedMission.meta_associada);
                if (completedGoal) {
                    persistData('metas', state.metas.map(m => m.id === completedGoal.id ? { ...m, concluida: true } : m));
                    handleShowGoalCompletedNotification(completedGoal.nome);
                }
            }
        }

        dispatch({ type: 'SET_GENERATING_MISSION', payload: null });
        await persistData('profile', updatedProfile);
        await persistData('missions', tempState.missions.map(rm => rm.id === rankedMissionId ? {...rm, missoes_diarias: [...rm.missoes_diarias.filter(dm => dm.id !== dailyMissionId), {...tempDailyMission, concluido: true}, ...(newDailyMission ? [newDailyMission] : [])]} : rm));

    }, [state, persistData, toast, handleShowStreakBonusNotification, handleLevelUp, handleShowSkillUpNotification, handleShowNewEpicMissionNotification, handleShowGoalCompletedNotification, rankOrder]);
    
    const resetUserSubCollections = async (userRef) => {
        const batch = writeBatch(db);
        const collectionsToDelete = ['metas', 'missions', 'skills'];
        for (const coll of collectionsToDelete) {
            const snapshot = await getDocs(collection(userRef, coll));
            snapshot.forEach(doc => batch.delete(doc.ref));
        }
        await batch.commit();
    };

    const handleFullReset = async () => {
        if (!user) return;
        dispatch({ type: 'SET_DATA_LOADED', payload: false });
        try {
            const userRef = doc(db, 'users', user.uid);
            await resetUserSubCollections(userRef);

            const batch = writeBatch(db);
            const emailUsername = user.email.split('@')[0];
            
            const defaultUserSettings = {
                mission_view_style: 'inline',
                ai_personality: 'balanced',
                theme_accent_color: '198 90% 55%',
                reduce_motion: false,
                font_size: 'medium',
                layout_density: 'default',
                notifications: {
                    daily_briefing: true,
                    goal_completed: true,
                    level_up: true,
                    quiet_hours: { enabled: false, start: '22:00', end: '08:00' }
                }
            };
            
            const initialProfile = { ...mockData.perfis[0], id: user.uid, email: user.email, primeiro_nome: emailUsername, apelido: "Caçador", nome_utilizador: emailUsername, avatar_url: `https://placehold.co/100x100.png?text=${emailUsername.substring(0, 2).toUpperCase()}`, ultimo_login_em: new Date().toISOString(), inventory: [], active_effects: [], guild_id: null, guild_role: null, onboarding_completed: false, user_settings: defaultUserSettings };
            batch.set(userRef, initialProfile);

            mockData.metas.forEach(meta => batch.set(doc(collection(userRef, 'metas'), String(meta.id)), { ...meta, prazo: meta.prazo || null, concluida: meta.concluida || false }));
            mockData.missoes.forEach(mission => batch.set(doc(collection(userRef, 'missions'), String(mission.id)), mission));
            mockData.habilidades.forEach(skill => batch.set(doc(collection(userRef, 'skills'), String(skill.id)), skill));
            batch.set(doc(collection(userRef, 'routine'), 'main'), mockData.rotina);
            batch.set(doc(collection(userRef, 'routine'), 'templates'), mockData.rotinaTemplates);
            await batch.commit();

            window.location.reload();

        } catch (error) {
            toast({ variant: 'destructive', title: "Erro no Reset", description: `Não foi possível apagar os seus dados. Erro: ${error.message}` });
             dispatch({ type: 'SET_DATA_LOADED', payload: true });
        }
    };
    
    const handleImportData = async (file) => {
        if (!user) throw new Error("Utilizador não autenticado.");
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result as string);
                    
                    if (!data.profile || !data.metas || !data.missions || !data.skills) {
                        throw new Error("O ficheiro de backup está incompleto ou mal formatado.");
                    }
                    
                    dispatch({ type: 'SET_DATA_LOADED', payload: false });
                    const userRef = doc(db, 'users', user.uid);
                    await resetUserSubCollections(userRef);

                    const batch = writeBatch(db);
                    
                    // O ID do perfil no backup é ignorado; usamos o ID do utilizador atual.
                    const importedProfile = { ...data.profile, id: user.uid, email: user.email };
                    batch.set(userRef, importedProfile);

                    const collectionsToImport = {
                        metas: data.metas,
                        missions: data.missions,
                        skills: data.skills,
                    };
                    for (const [collName, collData] of Object.entries(collectionsToImport)) {
                        collData.forEach(item => batch.set(doc(collection(userRef, collName), String(item.id)), item));
                    }

                    if (data.routine) batch.set(doc(userRef, 'routine', 'main'), data.routine);
                    if (data.routineTemplates) batch.set(doc(userRef, 'routine', 'templates'), data.routineTemplates);
                    
                    await batch.commit();

                    toast({ title: "Importação Concluída!", description: "Os seus dados foram restaurados. A página será recarregada." });
                    setTimeout(() => window.location.reload(), 2000);
                    resolve(true);

                } catch (e) {
                    dispatch({ type: 'SET_DATA_LOADED', payload: true }); // Reset loading state on error
                    reject(e);
                }
            };
            reader.onerror = (e) => reject(new Error("Não foi possível ler o ficheiro."));
            reader.readAsText(file);
        });
    };


    const fetchData = useCallback(async (userId) => {
        console.log('📋 Iniciando fetchData para userId:', userId);
        try {
            const userDocRef = doc(db, 'users', userId);
            console.log('📋 Fazendo queries ao Firestore...');
            const [userDoc, metasSnapshot, missionsSnapshot, skillsSnapshot, routineDoc, routineTemplatesDoc, allUsersSnapshot, guildsSnapshot] = await Promise.all([
                getDoc(userDocRef),
                getDocs(collection(userDocRef, 'metas')),
                getDocs(collection(userDocRef, 'missions')),
                getDocs(collection(userDocRef, 'skills')),
                getDoc(doc(db, 'users', userId, 'routine', 'main')),
                getDoc(doc(db, 'users', userId, 'routine', 'templates')),
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'guilds'))
            ]);

            console.log('📋 Queries completadas. UserDoc exists:', userDoc.exists());
            if (userDoc.exists()) {
                const profileData = userDoc.data();
                console.log('📋 Dados do perfil carregados:', profileData?.nome_utilizador || 'sem nome');
                dispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        profile: profileData,
                        metas: metasSnapshot.docs.map(d => d.data()),
                        missions: missionsSnapshot.docs.map(d => d.data()),
                        skills: skillsSnapshot.docs.map(d => d.data()),
                        routine: routineDoc.exists() ? routineDoc.data() : {},
                        routineTemplates: routineTemplatesDoc.exists() ? routineTemplatesDoc.data() : {},
                        allUsers: allUsersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
                        guilds: guildsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
                    }
                });
                console.log('📋 Dados carregados com sucesso!');
                 if (profileData.onboarding_completed === false) {
                    setShowOnboarding(true);
                }
            } else {
                console.log('📋 Usuário não existe, iniciando reset...');
                await handleFullReset();
            }
        } catch (error) {
            console.error('🚨 Erro no fetchData:', error);
            console.log('📝 Carregando dados de fallback (mock)...');
            
            const fallbackProfile = { 
                ...mockData.perfis[0], 
                id: userId, 
                email: user.email || 'usuario@exemplo.com',
                primeiro_nome: user.email?.split('@')[0] || 'Usuario',
                apelido: "Caçador",
                nome_utilizador: user.email?.split('@')[0] || 'Usuario',
                avatar_url: `https://placehold.co/100x100.png?text=${(user.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()}`,
                ultimo_login_em: new Date().toISOString(),
                inventory: [],
                active_effects: [],
                guild_id: null,
                guild_role: null,
                onboarding_completed: false,
                _isOfflineMode: true
            };
            
            dispatch({
                type: 'SET_INITIAL_DATA',
                payload: {
                    profile: fallbackProfile,
                    metas: mockData.metas.map(m => ({ ...m, prazo: m.prazo || null, concluida: m.concluida || false })),
                    missions: mockData.missoes,
                    skills: mockData.habilidades,
                    routine: mockData.rotina,
                    routineTemplates: mockData.rotinaTemplates,
                    allUsers: [],
                    guilds: [],
                }
            });
            
            setShowOnboarding(true);
            toast({ 
                variant: 'destructive', 
                title: "Modo Offline Ativo", 
                description: "Usando dados locais. Algumas funcionalidades podem estar limitadas." 
            });
        }
    }, [toast, handleFullReset, setShowOnboarding, user]);
    
    useEffect(() => {
        console.log('🔄 useEffect - user:', user ? 'presente' : 'null', 'isDataLoaded:', state.isDataLoaded);
        
        if (user && !state.isDataLoaded) {
            console.log('🔄 Chamando fetchData...');
            fetchData(user.uid);
            
            const dataTimeout = setTimeout(() => {
                console.warn('🚨 Timeout no carregamento de dados, forçando isDataLoaded = true');
                dispatch({ type: 'SET_DATA_LOADED', payload: true });
            }, 15000);
            
            return () => clearTimeout(dataTimeout);
        }
    }, [user, state.isDataLoaded, fetchData]);

    const providerValue = {
        ...state,
        persistData,
        completeMission,
        handleFullReset,
        handleImportData,
        questNotification, setQuestNotification,
        systemAlert, setSystemAlert,
        showOnboarding, setShowOnboarding,
        setMissionFeedback,
        timers,
    };

    return (
        <PlayerDataContext.Provider value={providerValue}>
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
