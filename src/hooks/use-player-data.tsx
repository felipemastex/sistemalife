
"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useReducer } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc, DocumentReference, DocumentData } from "firebase/firestore";
import { useToast } from './use-toast';
import * as mockData from '@/lib/data';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { generateNextDailyMission } from '@/ai/flows/generate-next-daily-mission';
import { generateSkillExperience } from '@/ai/flows/generate-skill-experience';
import { differenceInCalendarDays, isToday, endOfDay, parseISO } from 'date-fns';
import { statCategoryMapping } from '@/lib/mappings';
import { usePlayerNotifications } from './use-player-notifications';

// Type definitions
interface SubTask {
  name: string;
  target: number;
  unit: string;
  current: number;
}

interface DailyMission {
  id: string | number;
  nome: string;
  descricao: string;
  xp_conclusao: number;
  fragmentos_conclusao: number;
  concluido: boolean;
  tipo: string;
  subTasks: SubTask[];
  learningResources?: string[];
  completed_at?: string;
}

interface RankedMission {
  id: string | number;
  nome: string;
  descricao: string;
  concluido: boolean;
  rank: string;
  level_requirement: number;
  meta_associada: string;
  total_missoes_diarias: number;
  ultima_missao_concluida_em: string | null;
  missoes_diarias: DailyMission[];
  isManual?: boolean;
  subTasks?: SubTask[];
}

interface Meta {
  id: string | number;
  nome: string;
  categoria?: string;
  habilidade_associada_id?: string | number;
  prazo?: string;
  concluida: boolean;
  detalhes_smart?: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  };
}

interface Skill {
  id: string | number;
  nome: string;
  categoria: string;
  nivel_atual: number;
  nivel_maximo: number;
  xp_atual: number;
  xp_para_proximo_nivel: number;
  pre_requisito?: string | number | null;
  nivel_minimo_para_desbloqueio?: number | null;
  ultima_atividade_em: string;
}

interface ActiveEffect {
  itemId: string;
  type: string;
  expires_at: string;
  multiplier?: number;
}

interface Achievement {
  achievementId: string;
  date: string;
}

interface UserSettings {
    mission_view_style: 'inline' | 'popup';
    ai_personality: 'balanced' | 'mentor' | 'strategist' | 'friendly';
    theme_accent_color: string;
    reduce_motion: boolean;
    layout_density: 'compact' | 'default' | 'comfortable';
    suggestion_frequency: 'low' | 'medium' | 'high';
    notifications: {
        daily_briefing: boolean;
        goal_completed: boolean;
        level_up: boolean;
        quiet_hours: {
            enabled: boolean;
            start: string;
            end: string;
        };
    };
    privacy_settings: {
        profile_visibility: 'public' | 'private';
        analytics_opt_in: boolean;
        };
    gamification: {
        progress_feedback_intensity: 'subtle' | 'default' | 'celebratory';
    }
}


interface Profile {
  id?: string;
  email?: string;
  primeiro_nome?: string;
  apelido?: string;
  nome_utilizador?: string;
  avatar_url?: string;
  nivel: number;
  xp: number;
  xp_para_proximo_nivel: number;
  fragmentos: number;
  inventory: any[];
  active_effects: ActiveEffect[];
  estatisticas: {
    forca: number;
    inteligencia: number;
    destreza: number;
    constituicao: number;
    sabedoria: number;
    carisma: number;
  };
  genero?: string;
  nacionalidade?: string;
  status?: string;
  missoes_concluidas_total: number;
  achievements: Achievement[];
  generated_achievements?: any[];
  streak_atual: number;
  best_streak?: number;
  ultimo_dia_de_missao_concluida: string | null;
  guild_id?: string | null;
  guild_role?: string | null;
  onboarding_completed?: boolean;
  user_settings: UserSettings;
  manual_missions?: RankedMission[];
  recommended_shop_items?: any[];
  shop_last_generated_at?: string;

}

interface Guild {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  member_count: number;
  created_at: string;
}

interface PlayerState {
  profile: Profile | null;
  metas: Meta[];
  missions: RankedMission[];
  skills: Skill[];
  routine: Record<string, any>;
  routineTemplates: Record<string, any>;
  allUsers: any[];
  guilds: Guild[];
  isDataLoaded: boolean;
  missionFeedback: Record<string | number, string>;
  generatingMission: string | number | null;
}

interface PlayerAction {
  type: string;
  payload?: any;
}

type DataKey = 'profile' | 'metas' | 'metas' | 'missions' | 'skills' | 'routine' | 'routineTemplates' | 'guilds' | 'allUsers';

interface CompleteMissionParams {
  rankedMissionId: string | number;
  dailyMissionId: string | number;
  subTask: SubTask;
  amount: number;
  feedback: string | null;
}

interface StreakMilestones {
  [key: number]: number;
}

interface StatMapping {
  [key: string]: string[];
}


const getProfileRank = (level: number): { rank: string; title: string } => {
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

const PlayerDataContext = createContext<any>(null);

const initialState: PlayerState = {
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

function playerDataReducer(state: PlayerState, action: PlayerAction): PlayerState {
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
            const newMissions = state.missions.map((rm: RankedMission) => 
                rm.id !== rankedMissionId ? rm : {
                    ...rm,
                    missoes_diarias: rm.missoes_diarias.map((dm: DailyMission) => 
                        dm.id !== dailyMissionId ? dm : {
                            ...dm,
                            subTasks: dm.subTasks.map((st: SubTask) => 
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
                    
                    return { 
                        ...rm, 
                        missoes_diarias: newDailyMissionsList, 
                        ultima_missao_concluida_em: new Date().toISOString() 
                    };
                }
                return rm;
            });
            return { ...state, missions: updatedMissions };
        }
        case 'ADD_DAILY_MISSION': {
            const { rankedMissionId, newDailyMission } = action.payload;
            const updatedMissions = state.missions.map((rm) => {
                if (rm.id === rankedMissionId) {
                    const newDailyMissions = [...rm.missoes_diarias, newDailyMission];
                    return {
                        ...rm,
                        missoes_diarias: newDailyMissions,
                        ultima_missao_concluida_em: null 
                    };
                }
                return rm;
            });
            return { ...state, missions: updatedMissions };
        }
        case 'COMPLETE_EPIC_MISSION': {
            const { rankedMissionId } = action.payload;
            const updatedMissions = state.missions.map((rm: RankedMission) => 
                rm.id === rankedMissionId ? { ...rm, concluido: true } : rm
            );
            return { ...state, missions: updatedMissions };
        }
        case 'UPDATE_SKILL': {
            const { skillId, updates } = action.payload;
            return {
                ...state,
                skills: state.skills.map((s: Skill) => s.id === skillId ? { ...s, ...updates } : s)
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
        handleShowLevelUpNotification,
        handleShowAchievementUnlockedNotification,
        handleShowStreakBonusNotification,
        handleShowSkillUpNotification,
        handleShowNewEpicMissionNotification,
        handleShowGoalCompletedNotification
    } = usePlayerNotifications({ profile: state.profile || null, user });

    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

    const persistData = useCallback(async (key: DataKey, data: any) => {
        if (!user) return;
        
        const singleDocCollections: Record<string, () => DocumentReference<DocumentData, DocumentData>> = {
            profile: () => doc(db, 'users', user.uid),
            routine: () => doc(db, 'users', user.uid, 'routine', 'main'),
            routineTemplates: () => doc(db, 'users', user.uid, 'routine', 'templates'),
        };

        const typeMap: Record<DataKey, string> = {
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

        const multiDocCollections: Record<string, string> = {
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
             const newIds = data.map((item: any) => String(item.id));
             
             const idsToDelete = existingIds.filter(id => !newIds.includes(id));

             idsToDelete.forEach(id => batch.delete(doc(ref, id)));
             data.forEach((item: any) => {
                const docRef = doc(ref, String(item.id));
                batch.set(docRef, item);
             });
             await batch.commit();
        }
    }, [user]);

    const handleLevelUp = (currentProfile: Profile): Profile => {
        const newLevel = currentProfile.nivel + 1;
        const newXpToNextLevel = Math.floor(currentProfile.xp_para_proximo_nivel * 1.5);
        const newXp = currentProfile.xp - currentProfile.xp_para_proximo_nivel;
        const { rank, title } = getProfileRank(newLevel);
        handleShowLevelUpNotification(newLevel, title, rank);
        const newProfile = { ...currentProfile, nivel: newLevel, xp: newXp, xp_para_proximo_nivel: newXpToNextLevel };
        dispatch({ type: 'SET_PROFILE', payload: newProfile });
        return newProfile;
    };
    
     const checkAndUnlockAchievements = useCallback((currentProfile: Profile) => {
        if (!currentProfile?.generated_achievements) return;

        let madeChanges = false;
        const updatedAchievements = currentProfile.generated_achievements.map(ach => {
            if (ach.unlocked) return ach;

            const { type, value, category } = ach.criteria;
            let current = 0;
            switch (type) {
                case 'missions_completed':
                    current = currentProfile.missoes_concluidas_total || 0;
                    break;
                case 'level_reached':
                    current = currentProfile.nivel || 1;
                    break;
                case 'goals_completed':
                     current = state.metas.filter(m => m.concluida).length;
                     break;
                case 'streak_maintained':
                    current = currentProfile.streak_atual || 0;
                    break;
                case 'missions_in_category_completed':
                    const categoryGoals = state.metas.filter(m => m.categoria === category).map(m => m.nome);
                    current = state.missions
                        .filter(m => categoryGoals.includes(m.meta_associada))
                        .flatMap(m => m.missoes_diarias || [])
                        .filter(dm => dm.concluido).length;
                    break;
            }

            if (current >= value) {
                madeChanges = true;
                handleShowAchievementUnlockedNotification(ach.name);
                return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
            }
            return ach;
        });

        if (madeChanges) {
            persistData('profile', { ...currentProfile, generated_achievements: updatedAchievements });
        }
    }, [state.metas, state.missions, handleShowAchievementUnlockedNotification, persistData]);


    useEffect(() => {
        if (state.isDataLoaded && state.profile) {
            checkAndUnlockAchievements(state.profile);
        }
    }, [state.profile, state.isDataLoaded, checkAndUnlockAchievements]);
    
     const handleStreak = (currentProfile: Profile) => {
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
                const streakRecoveryAmulet = (currentProfile.active_effects || []).find((eff: ActiveEffect) => eff.type === 'streak_recovery');
                if (streakRecoveryAmulet) {
                    newStreak++;
                    streakProtected = true;
                    toast({ title: 'Amuleto Ativado!', description: 'A sua sequência foi salva!' });
                } else {
                    newStreak = 1;
                }
            }
        }
        
        const streakMilestones: StreakMilestones = { 3: 20, 7: 50, 14: 120, 30: 300 }; 
        if (streakMilestones[newStreak as keyof StreakMilestones]) {
            const xpBonus = streakMilestones[newStreak as keyof StreakMilestones];
            const fragmentBonus = Math.round(xpBonus / 10);
            bonus = { xp: xpBonus, fragments: fragmentBonus };
            handleShowStreakBonusNotification(newStreak, xpBonus, fragmentBonus);
        }

        const updatedProfile = { 
            ...currentProfile, 
            streak_atual: newStreak, 
            ultimo_dia_de_missao_concluida: today.toISOString(),
            best_streak: Math.max(currentProfile.best_streak || 0, newStreak),
        };

        if (streakProtected) {
            updatedProfile.active_effects = updatedProfile.active_effects.filter((eff: ActiveEffect) => eff.type !== 'streak_recovery');
        }

        return { updatedProfile, streakUpdated: true, bonus };
    };

    const setMissionFeedback = (missionId: string | number, feedback: string) => {
        dispatch({ type: 'SET_MISSION_FEEDBACK', payload: { missionId, feedback } });
    };

    const completeMission = useCallback(async ({ rankedMissionId, dailyMissionId, subTask, amount, feedback: feedbackForNextMission }: CompleteMissionParams) => {
        dispatch({ type: 'UPDATE_SUB_TASK_PROGRESS', payload: { rankedMissionId, dailyMissionId, subTaskName: subTask.name, amount } });
        
        const tempState = playerDataReducer(state, { type: 'UPDATE_SUB_TASK_PROGRESS', payload: { rankedMissionId, dailyMissionId, subTaskName: subTask.name, amount } });
        const tempRankedMission = tempState.missions.find((rm: RankedMission) => rm.id === rankedMissionId);
        const tempDailyMission = tempRankedMission?.missoes_diarias.find((dm: DailyMission) => dm.id === dailyMissionId);

        if (!tempDailyMission || !tempRankedMission) return;
        
        const allSubTasksCompleted = tempDailyMission.subTasks.every((st: SubTask) => (st.current || 0) >= st.target);
        
        if (!allSubTasksCompleted) {
             persistData('missions', tempState.missions);
             return;
        }

        if (!state.profile) return;
        
        let updatedProfile = { ...state.profile };
        const { updatedProfile: profileAfterStreak, bonus: streakBonus } = handleStreak(updatedProfile);
        updatedProfile = profileAfterStreak;

        const xpBoostEffect = (updatedProfile.active_effects || []).find((eff: ActiveEffect) => eff.type === 'xp_boost' && new Date(eff.expires_at) > new Date());
        const xpMultiplier = (xpBoostEffect && xpBoostEffect.multiplier) ? xpBoostEffect.multiplier : 1;
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
            const { xp } = await generateSkillExperience({ missionText: `${tempDailyMission.nome}: ${tempDailyMission.subTasks.map((st: SubTask) => st.name).join(', ')}`, skillLevel: 1 });
            missionSkillXp = xp;
        } catch(e) { console.error("Could not get skill xp", e); }
        
        const meta = state.metas.find((m: Meta) => m.nome === tempRankedMission.meta_associada);
        if (meta?.habilidade_associada_id) {
            const skillToUpdate = state.skills.find((s: Skill) => s.id === meta.habilidade_associada_id);
            if (skillToUpdate && skillToUpdate.nivel_atual !== undefined && skillToUpdate.nivel_maximo !== undefined && 
                skillToUpdate.nivel_atual < skillToUpdate.nivel_maximo) {
                const updatedSkill = { ...skillToUpdate };
                updatedSkill.xp_atual = (updatedSkill.xp_atual || 0) + missionSkillXp;
                updatedSkill.ultima_atividade_em = new Date().toISOString();
                 if (updatedSkill.xp_atual >= (updatedSkill.xp_para_proximo_nivel || 0)) {
                    const statsToUpgrade = (statCategoryMapping as StatMapping)[updatedSkill.categoria] || [];
                    handleShowSkillUpNotification(updatedSkill.nome, (updatedSkill.nivel_atual || 0) + 1, statsToUpgrade.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)));
                    if (statsToUpgrade.length > 0 && updatedProfile.estatisticas) {
                        statsToUpgrade.forEach((stat: string) => { 
                            const statKey = stat as keyof typeof updatedProfile.estatisticas;
                            updatedProfile.estatisticas[statKey] = (updatedProfile.estatisticas[statKey] || 0) + 1; 
                        });
                    }
                    updatedSkill.nivel_atual = (updatedSkill.nivel_atual || 0) + 1;
                    updatedSkill.xp_atual = (updatedSkill.xp_atual || 0) - (updatedSkill.xp_para_proximo_nivel || 0);
                    updatedSkill.xp_para_proximo_nivel = Math.floor((updatedSkill.xp_para_proximo_nivel || 0) * 1.5);
                }
                dispatch({ type: 'UPDATE_SKILL', payload: { skillId: meta.habilidade_associada_id, updates: updatedSkill } });
            }
        }
        
        dispatch({ type: 'SET_GENERATING_MISSION', payload: rankedMissionId });
        
        let newDailyMission = null;
        try {
            const history = tempRankedMission.missoes_diarias.filter((d: DailyMission) => d.concluido).map((d: DailyMission) => `- ${d.nome}`).join('\n');
            const result = await generateNextDailyMission({
                rankedMissionName: tempRankedMission.nome,
                metaName: meta?.nome || "Objetivo geral",
                goalDeadline: meta?.prazo,
                history: history || `O utilizador acabou de completar: "${tempDailyMission.nome}".`,
                userLevel: updatedProfile.nivel,
                feedback: feedbackForNextMission ?? ''
            });

            newDailyMission = {
                id: Date.now(),
                nome: result.nextMissionName,
                descricao: result.nextMissionDescription,
                xp_conclusao: result.xp,
                fragmentos_conclusao: result.fragments,
                concluido: false,
                tipo: 'diaria',
                learningResources: result.learningResources || [],
                subTasks: result.subTasks.map(st => ({...st, current: 0}))
            };
        } catch (err) {
            console.error(err);
            toast({
                variant: 'destructive',
                title: 'Erro de IA',
                description: 'Não foi possível gerar a próxima missão diária. Por favor, tente novamente mais tarde.'
            });
        } finally {
            dispatch({ type: 'SET_GENERATING_MISSION', payload: null });
        }

        dispatch({ type: 'COMPLETE_DAILY_MISSION', payload: { rankedMissionId, dailyMissionId, newDailyMission } });

        const finalStateAfterCompletion = playerDataReducer(playerDataReducer(state, { type: 'UPDATE_SUB_TASK_PROGRESS', payload: { rankedMissionId, dailyMissionId, subTaskName: subTask.name, amount } }), { type: 'COMPLETE_DAILY_MISSION', payload: { rankedMissionId, dailyMissionId, newDailyMission } });

        const finalRankedMission = finalStateAfterCompletion.missions.find((m: RankedMission) => m.id === rankedMissionId);
        const isRankedMissionComplete = finalRankedMission && finalRankedMission.missoes_diarias.filter((d: DailyMission) => d.concluido).length >= (finalRankedMission.total_missoes_diarias || 10);
        
        if(isRankedMissionComplete && finalRankedMission) {
            dispatch({ type: 'COMPLETE_EPIC_MISSION', payload: { rankedMissionId } });
            toast({ title: "Missão Épica Concluída!", description: `Você conquistou "${tempRankedMission.nome}"!` });
            const goalMissions = finalStateAfterCompletion.missions.filter((m: RankedMission) => m.meta_associada === tempRankedMission.meta_associada).sort((a: RankedMission, b: RankedMission) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
            const currentIndex = goalMissions.findIndex((m: RankedMission) => m.id === rankedMissionId);
            const nextMission = goalMissions[currentIndex + 1];
            if (nextMission) { handleShowNewEpicMissionNotification(nextMission.nome, nextMission.descricao); }
            else {
                const completedGoal = state.metas.find((m: Meta) => m.nome === tempRankedMission.meta_associada);
                if (completedGoal) {
                    persistData('metas', state.metas.map((m: Meta) => m.id === completedGoal.id ? { ...m, concluida: true } : m));
                    handleShowGoalCompletedNotification(completedGoal.nome);
                }
            }
        }
        
        await persistData('profile', updatedProfile);
        await persistData('missions', finalStateAfterCompletion.missions);
        await persistData('skills', finalStateAfterCompletion.skills);

    }, [state, persistData, toast, handleShowStreakBonusNotification, handleLevelUp, handleShowSkillUpNotification, handleShowNewEpicMissionNotification, handleShowGoalCompletedNotification, rankOrder]);
    
    const generatePendingDailyMissions = useCallback(async () => {
        const missionsNeedingNewDaily = state.missions.filter(mission => {
            if (mission.concluido) return false;
            const hasActiveDaily = mission.missoes_diarias?.some(dm => !dm.concluido);
            const wasCompletedToday = mission.ultima_missao_concluida_em && isToday(parseISO(mission.ultima_missao_concluida_em));
            return !hasActiveDaily && !wasCompletedToday;
        });

        for (const mission of missionsNeedingNewDaily) {
            dispatch({ type: 'SET_GENERATING_MISSION', payload: mission.id });
            try {
                const meta = state.metas.find((m: Meta) => m.nome === mission.meta_associada);
                const history = mission.missoes_diarias.filter((d: DailyMission) => d.concluido).map((d: DailyMission) => `- ${d.nome}`).join('\n');
                const feedbackForAI = state.missionFeedback[mission.id];
                
                const result = await generateNextDailyMission({
                    rankedMissionName: mission.nome,
                    metaName: meta?.nome || "Objetivo geral",
                    goalDeadline: meta?.prazo,
                    history: history || `O utilizador completou missões anteriores.`,
                    userLevel: state.profile?.nivel || 1,
                    feedback: feedbackForAI ?? ''
                });
                
                const newDailyMission = {
                    id: Date.now() + Math.random(),
                    nome: result.nextMissionName,
                    descricao: result.nextMissionDescription,
                    xp_conclusao: result.xp,
                    fragmentos_conclusao: result.fragments,
                    concluido: false,
                    tipo: 'diaria',
                    learningResources: result.learningResources || [],
                    subTasks: result.subTasks.map(st => ({...st, current: 0}))
                };
                
                dispatch({ type: 'ADD_DAILY_MISSION', payload: { rankedMissionId: mission.id, newDailyMission } });
                
                if (feedbackForAI) {
                    dispatch({ type: 'CLEAR_MISSION_FEEDBACK', payload: { missionId: mission.id }});
                }
                
                toast({
                    title: "Nova Missão Disponível!",
                    description: `"${result.nextMissionName}" foi desbloqueada.`
                });
                
            } catch (error) {
                console.error('Erro ao gerar missão pendente:', error);
                 toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível gerar a próxima missão. Tente novamente mais tarde.' });
            } finally {
                dispatch({ type: 'SET_GENERATING_MISSION', payload: null });
            }
        }
        
        setTimeout(() => persistData('missions', state.missions), 500);

    }, [state.missions, state.metas, state.missionFeedback, state.profile?.nivel, dispatch, persistData, toast]);
    
    const resetUserSubCollections = async (userRef: DocumentReference<DocumentData>) => {
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
            const emailUsername = user.email!.split('@')[0];
            
            const defaultUserSettings = {
                mission_view_style: 'inline',
                ai_personality: 'balanced',
                theme_accent_color: '198 90% 55%',
                reduce_motion: false,
                layout_density: 'default',
                suggestion_frequency: 'medium',
                gamification: {
                    progress_feedback_intensity: 'default',
                },
                notifications: {
                    daily_briefing: true,
                    goal_completed: true,
                    level_up: true,
                    quiet_hours: { enabled: false, start: '22:00', end: '08:00' }
                },
                privacy_settings: {
                    profile_visibility: 'public',
                    analytics_opt_in: true,
                }
            };
            
            const initialProfile = { ...mockData.perfis[0], id: user.uid, email: user.email, primeiro_nome: emailUsername, apelido: "Caçador", nome_utilizador: emailUsername, avatar_url: `https://placehold.co/100x100.png?text=${emailUsername.substring(0, 2).toUpperCase()}`, ultimo_login_em: new Date().toISOString(), inventory: [], active_effects: [], guild_id: null, guild_role: null, onboarding_completed: false, user_settings: defaultUserSettings, manual_missions: [], achievements: [], generated_achievements: [], recommended_shop_items: [], shop_last_generated_at: null };
            batch.set(userRef, initialProfile);

            mockData.metas.forEach(meta => batch.set(doc(collection(userRef, 'metas'), String(meta.id)), { ...meta, prazo: meta.prazo || null, concluida: meta.concluida || false }));
            mockData.missoes.forEach(mission => batch.set(doc(collection(userRef, 'missions'), String(mission.id)), mission));
            mockData.habilidades.forEach(skill => batch.set(doc(collection(userRef, 'skills'), String(skill.id)), skill));
            batch.set(doc(collection(userRef, 'routine'), 'main'), mockData.rotina);
            batch.set(doc(collection(userRef, 'routine'), 'templates'), mockData.rotinaTemplates);
            await batch.commit();

            window.location.reload();

        } catch (error) {
            toast({ variant: 'destructive', title: "Erro no Reset", description: `Não foi possível apagar os seus dados. Erro: ${(error as Error).message}` });
             dispatch({ type: 'SET_DATA_LOADED', payload: true });
        }
    };
    
    const handleImportData = async (file: File) => {
        if (!user) throw new Error("Utilizador não autenticado.");
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target!.result as string);
                    
                    if (!data.profile || !data.metas || !data.missions || !data.skills) {
                        throw new Error("O ficheiro de backup está incompleto ou mal formatado.");
                    }
                    
                    dispatch({ type: 'SET_DATA_LOADED', payload: false });
                    const userRef = doc(db, 'users', user.uid);
                    await resetUserSubCollections(userRef);

                    const batch = writeBatch(db);
                    
                    const importedProfile = { ...data.profile, id: user.uid, email: user.email };
                    batch.set(userRef, importedProfile);

                    const collectionsToImport = {
                        metas: data.metas,
                        missions: data.missions,
                        skills: data.skills,
                    };
                    for (const [collName, collData] of Object.entries(collectionsToImport)) {
                        (collData as any[]).forEach((item: any) => batch.set(doc(collection(userRef, collName), String(item.id)), item));
                    }

                    if (data.routine) batch.set(doc(userRef, 'routine', 'main'), data.routine);
                    if (data.routineTemplates) batch.set(doc(userRef, 'routine', 'templates'), data.routineTemplates);
                    
                    await batch.commit();

                    toast({ title: "Importação Concluída!", description: "Os seus dados foram restaurados. A página será recarregada." });
                    setTimeout(() => window.location.reload(), 2000);
                    resolve(true);

                } catch (e) {
                    dispatch({ type: 'SET_DATA_LOADED', payload: true });
                    reject(e);
                }
            };
            reader.onerror = (e) => reject(new Error("Não foi possível ler o ficheiro."));
            reader.readAsText(file);
        });
    };


    const fetchData = useCallback(async (userId: string) => {
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
                email: user?.email || 'usuario@exemplo.com',
                primeiro_nome: user?.email?.split('@')[0] || 'Usuario',
                apelido: "Caçador",
                nome_utilizador: user?.email?.split('@')[0] || 'Usuario',
                avatar_url: `https://placehold.co/100x100.png?text=${(user?.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()}`,
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
        generatePendingDailyMissions,
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

    
