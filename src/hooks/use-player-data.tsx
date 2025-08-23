
"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useReducer } from 'react';
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
                        dm.id === dailyMissionId ? { ...dm, concluido: true } : dm
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
        default:
            return state;
    }
}


export function PlayerDataProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [state, dispatch] = useReducer(playerDataReducer, initialState);
    const { toast } = useToast();

    const [questNotification, setQuestNotification] = useState(null);
    const [systemAlert, setSystemAlert] = useState<{ message: string; position: { top: string; left: string; } } | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

    const persistData = useCallback(async (key, data) => {
        if (!user) return;
        const collections = {
            metas: 'metas',
            missions: 'missions',
            skills: 'skills',
            guilds: 'guilds',
        };
        const routineCollections = {
            routine: 'main',
            routineTemplates: 'templates',
        };

        if (key === 'profile') {
            await setDoc(doc(db, 'users', user.uid), data, { merge: true });
        } else if (collections[key]) {
            const batch = writeBatch(db);
            const ref = collection(db, collections[key] === 'guilds' ? 'guilds' : `users/${user.uid}/${collections[key]}`);
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
        } else if (routineCollections[key]) {
            await setDoc(doc(db, 'users', user.uid, 'routine', routineCollections[key]), data);
        } else if (key === 'allUsers') {
            // This is read-only, no persistence needed from client
        }
    }, [user]);

    const handleLevelUp = (currentProfile) => {
        const newLevel = currentProfile.nivel + 1;
        const newXpToNextLevel = Math.floor(currentProfile.xp_para_proximo_nivel * 1.5);
        const newXp = currentProfile.xp - currentProfile.xp_para_proximo_nivel;
        const { rank, title } = getProfileRank(newLevel);
        setQuestNotification({ title: 'NÍVEL AUMENTADO!', description: 'Você alcançou um novo patamar de poder.', goals: [{ name: '- NOVO NÍVEL', progress: `[${newLevel}]` }, { name: '- NOVO TÍTULO', progress: `[${newTitle}]` }, { name: '- NOVO RANK', progress: `[${rank}]` }], caution: 'Continue a sua jornada para desbloquear todo o seu potencial.' });
        const newProfile = { ...currentProfile, nivel: newLevel, xp: newXp, xp_para_proximo_nivel: newXpToNextLevel };
        dispatch({ type: 'SET_PROFILE', payload: newProfile });
        return newProfile;
    };
    
    const handleShowAchievementUnlockedNotification = (achievementName) => setQuestNotification({ title: 'CONQUISTA DESBLOQUEADA!', description: 'O seu esforço foi reconhecido pelo Sistema.', goals: [{ name: '- CONQUISTA', progress: `[${achievementName}]` }], caution: 'Continue a sua jornada para desbloquear todos os segredos.' });


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
            dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
            persistData('profile', updatedProfile);
        }
    }, [persistData]);

    useEffect(() => {
        if (state.isDataLoaded) {
            checkAndUnlockAchievements(state.profile, state.metas, state.skills);
        }
    }, [state.profile, state.metas, state.skills, state.isDataLoaded, checkAndUnlockAchievements]);


    const completeMission = useCallback(async ({ rankedMissionId, dailyMissionId, subTask, amount, feedback }) => {
        dispatch({ type: 'UPDATE_SUB_TASK_PROGRESS', payload: { rankedMissionId, dailyMissionId, subTaskName: subTask.name, amount } });
        
        const rankedMission = state.missions.find(rm => rm.id === rankedMissionId);
        const dailyMission = rankedMission?.missoes_diarias.find(dm => dm.id === dailyMissionId);
        
        if (!dailyMission) return;
        
        const updatedSubTask = dailyMission.subTasks.find(st => st.name === subTask.name);
        const newCurrent = (updatedSubTask.current || 0) + amount;
        
        const allSubTasksCompleted = dailyMission.subTasks.every(st =>
            st.name === subTask.name ? newCurrent >= st.target : (st.current || 0) >= st.target
        );

        if (!allSubTasksCompleted) {
             persistData('missions', state.missions.map(rm => rm.id !== rankedMissionId ? rm : { ...rm, missoes_diarias: rm.missoes_diarias.map(dm => dm.id !== dailyMissionId ? dm : { ...dm, subTasks: dm.subTasks.map(st => st.name === subTask.name ? { ...st, current: newCurrent } : st) }) }));
             return;
        }

        // --- Daily Mission is Complete ---
        let updatedProfile = { ...state.profile };
        updatedProfile.xp += dailyMission.xp_conclusao;
        updatedProfile.fragmentos = (updatedProfile.fragmentos || 0) + (dailyMission.fragmentos_conclusao || 0);
        if (updatedProfile.xp >= updatedProfile.xp_para_proximo_nivel) {
            updatedProfile = handleLevelUp(updatedProfile);
        }
        dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
        
        // IA calls can happen in parallel
        const skillPromise = generateSkillExperience({ missionText: `${dailyMission.nome}: ${dailyMission.subTasks.map(st => st.name).join(', ')}`, skillLevel: 1 });
        const nextMissionPromise = generateNextDailyMission({ rankedMissionName: rankedMission.nome, metaName: rankedMission.meta_associada, history: `Completou: ${dailyMission.nome}`, userLevel: updatedProfile.nivel, feedback });
        
        const [skillResult, nextMissionResult] = await Promise.all([skillPromise, nextMissionPromise]);

        // Update Skill
        if(skillResult) {
            const meta = state.metas.find(m => m.nome === rankedMission.meta_associada);
            if (meta?.habilidade_associada_id) {
                const updatedSkills = state.skills.map(s => {
                    if (s.id === meta.habilidade_associada_id) {
                         const newSkill = {...s, xp_atual: s.xp_atual + skillResult.xp };
                         // check for skill level up
                         return newSkill;
                    }
                    return s;
                });
                dispatch({ type: 'SET_SKILLS', payload: updatedSkills });
            }
        }
        
        // Update missions with completed daily and new daily
        if (nextMissionResult) {
             const newDailyMission = { id: Date.now(), nome: nextMissionResult.nextMissionName, xp_conclusao: nextMissionResult.xp, fragmentos_conclusao: nextMissionResult.fragments, concluido: false, tipo: 'diaria', learningResources: nextMissionResult.learningResources || [], subTasks: nextMissionResult.subTasks };
             dispatch({ type: 'COMPLETE_DAILY_MISSION', payload: { rankedMissionId, dailyMissionId, newDailyMission } });
        } else {
             dispatch({ type: 'COMPLETE_DAILY_MISSION', payload: { rankedMissionId, dailyMissionId, newDailyMission: null } });
        }

        // Persist all changes
        await persistData('profile', updatedProfile);
        await persistData('skills', state.skills); // This needs to be improved as state updates are async
        await persistData('missions', state.missions); // Same here
    }, [state, persistData]);


    const fetchData = useCallback(async (userId) => {
        try {
            const userDocRef = doc(db, 'users', userId);
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

            if (userDoc.exists()) {
                const profileData = userDoc.data();
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
                 if (profileData.onboarding_completed === false) {
                    setShowOnboarding(true);
                }
            } else {
                // Handle initial setup
            }
        } catch (error) {
             toast({ variant: 'destructive', title: "Erro de Sincronização", description: "Não foi possível carregar os seus dados." });
        }
    }, [toast]);
    
    useEffect(() => {
        if (user && !state.isDataLoaded) {
            fetchData(user.uid);
        }
    }, [user, state.isDataLoaded, fetchData]);

    const providerValue = {
        ...state,
        dispatch,
        persistData,
        completeMission,
        // Pass down other values as needed
        questNotification, setQuestNotification,
        systemAlert, setSystemAlert,
        showOnboarding, setShowOnboarding
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

    