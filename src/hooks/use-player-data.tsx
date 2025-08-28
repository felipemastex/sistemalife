
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
  isNemesisChallenge?: boolean;
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

interface Nemesis {
    name: string;
    description: string;
    maxHealth: number;
    currentHealth: number;
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
  nemesis?: Nemesis;
}

interface Skill {
  id: string | number;
  nome: string;
  descricao: string;
  categoria: string;
  nivel_atual: number;
  nivel_maximo: number;
  xp_atual: number;
  xp_para_proximo_nivel: number;
  pre_requisito?: string | number | null;
  nivel_minimo_para_desbloqueio?: number | null;
  ultima_atividade_em: string;
  dungeon?: {
    current_room: number;
    highest_room: number;
    active_challenge: any;
    completed_challenges: any[];
  }
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

interface TowerChallengeRequirement {
  type: 'missions_completed' | 'skill_level_reached' | 'streak_maintained' | 'guild_activity' | 'level_reached' | 'missions_in_category_completed';
  value: any;
  target: number;
  current?: number;
}

interface ActiveTowerChallenge {
  id: string;
  title: string;
  startedAt: string;
  timeLimit: number; // in hours
  requirements: TowerChallengeRequirement[];
  rewards: { xp: number; fragments: number; premiumFragments?: number };
  floor: number;
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

interface TowerProgress {
  currentFloor: number;
  highestFloor: number;
  lives: number;
  maxLives: number;
  lastLifeRegeneration: string; // ISO String
  dailyChallengesAvailable: number;
}

interface RecurringTask {
    id: number;
    name: string;
    days: string[]; // e.g., ['segunda', 'quarta', 'sexta']
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
  active_tower_challenges?: ActiveTowerChallenge[];
  available_tower_challenges?: any[];
  tower_progress?: TowerProgress;
  dungeon_lives?: number;
  dungeon_max_lives?: number;
  dungeon_last_life_regeneration?: string;
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
  last_task_completion_date?: string | null;
  guild_id?: string | null;
  guild_role?: string | null;
  onboarding_completed?: boolean;
  user_settings: UserSettings;
  manual_missions?: RankedMission[];
  recommended_shop_items?: any[];
  shop_last_generated_at?: string;
  recurring_tasks?: RecurringTask[];
  completed_tasks_today?: { [taskId: string]: boolean };
  event_contribution?: {
    eventId: string;
    contribution: number;
  };
  last_known_level?: number;
  routineTemplates?: Record<string, any>; // Adicionando a propriedade routineTemplates ao tipo Profile
}

interface Guild {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  member_count: number;
  created_at: string;
}

interface WorldEvent {
  id: string;
  name: string;
  description: string;
  type: 'CORRUPTION_INVASION';
  effects: { type: string; value: number }[];
  goal: { type: string; category: string; target: number };
  progress: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  rewards: { type: string; multiplier?: number; duration_hours?: number; amount?: number }[];
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
  worldEvents: WorldEvent[];
  isDataLoaded: boolean;
  missionFeedback: Record<string | number, string>;
  generatingMission: string | number | null;
}

interface PlayerAction {
  type: string;
  payload?: any;
}

type DataKey = 'profile' | 'metas' | 'metas' | 'missions' | 'skills' | 'routine' | 'routineTemplates' | 'guilds' | 'allUsers' | 'worldEvents';

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
    worldEvents: [],
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
        case 'SET_WORLD_EVENTS':
            return { ...state, worldEvents: action.payload };
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
    const { user, authState } = useAuth();
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
        handleShowGoalCompletedNotification,
        handleShowSkillDecayNotification,
        handleShowSkillAtRiskNotification
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
            worldEvents: 'SET_WORLD_EVENTS'
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
            worldEvents: 'world_events'
        };

        if (multiDocCollections[key]) {
             const collectionName = multiDocCollections[key];
             const isGlobalCollection = ['guilds', 'allUsers', 'worldEvents'].includes(key);
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
        const newProfile = { ...currentProfile, nivel: newLevel, xp: newXp, xp_para_proximo_nivel: newXpToNextLevel, last_known_level: newLevel };
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
            // Usando uma cópia do perfil atual em vez de currentProfile diretamente
            const updatedProfile = { ...currentProfile, generated_achievements: updatedAchievements };
            persistData('profile', updatedProfile);
        }
    }, [state.metas, state.missions, handleShowAchievementUnlockedNotification, persistData]);


    useEffect(() => {
        if (state.isDataLoaded && state.profile) {
            // Passando uma cópia do perfil para evitar referências circulares
            const profileCopy = JSON.parse(JSON.stringify(state.profile));
            checkAndUnlockAchievements(profileCopy);
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

    const checkAndApplyTowerRewards = useCallback(() => {
        if (!state.isDataLoaded || !state.profile?.active_tower_challenges) return;
    
        let profileChanged = false;
        let updatedProfile = { ...state.profile! };
        let challengesToRemove: string[] = [];
        const completedChallengesThisRun: any[] = [];
    
        const stillActiveChallenges = (updatedProfile.active_tower_challenges || []).filter(challenge => {
            if (!challenge.startedAt) return true;
            const startTime = new Date(challenge.startedAt).getTime();
            const timeLimitMillis = challenge.timeLimit * 60 * 60 * 1000;
            const isExpired = new Date().getTime() - startTime > timeLimitMillis;
    
            if (isExpired) {
                if (updatedProfile.tower_progress) {
                    updatedProfile.tower_progress.lives = Math.max(0, updatedProfile.tower_progress.lives - 1);
                }
                toast({ variant: 'destructive', title: 'Desafio da Torre Falhou!', description: `O tempo para "${challenge.title}" esgotou.` });
                challengesToRemove.push(challenge.id);
                profileChanged = true;
                return false;
            }
            return true;
        });
    
        stillActiveChallenges.forEach(challenge => {
            let allRequirementsMet = true;
            
            challenge.requirements.forEach(req => {
                let currentProgress = req.current || 0;
                switch (req.type) {
                    case 'missions_in_category_completed':
                        const categoryGoals = state.metas.filter(m => m.categoria === req.value).map(m => m.nome);
                        currentProgress = state.missions.filter(m => categoryGoals.includes(m.meta_associada)).flatMap(m => m.missoes_diarias || []).filter(dm => dm.concluido).length;
                        break;
                    case 'streak_maintained':
                        currentProgress = updatedProfile.streak_atual;
                        break;
                    case 'missions_completed':
                         currentProgress = updatedProfile.missoes_concluidas_total;
                         break;
                    case 'level_reached':
                        currentProgress = updatedProfile.nivel;
                        break;
                }
                req.current = currentProgress;
                if (currentProgress < req.target) {
                    allRequirementsMet = false;
                }
            });
    
            if (allRequirementsMet) {
                completedChallengesThisRun.push(challenge);
                challengesToRemove.push(challenge.id);
                profileChanged = true;
            }
        });

        if (completedChallengesThisRun.length > 0) {
            completedChallengesThisRun.forEach(challenge => {
                updatedProfile.xp += challenge.rewards.xp;
                updatedProfile.fragmentos += challenge.rewards.fragments;
                if (challenge.rewards.premiumFragments && updatedProfile.tower_progress) {
                    // Placeholder for premium currency
                }
                toast({ title: "Desafio da Torre Concluído!", description: `Você completou: ${challenge.title} e ganhou ${challenge.rewards.xp} XP!` });
            });
        }
    
        if (profileChanged) {
            updatedProfile.active_tower_challenges = (updatedProfile.active_tower_challenges || []).filter(c => !challengesToRemove.includes(c.id));
            
            const activeChallengesOnCurrentFloor = (state.profile?.active_tower_challenges || []).filter(c => c.floor === state.profile?.tower_progress?.currentFloor).length;
            const remainingChallengesOnFloor = activeChallengesOnCurrentFloor - completedChallengesThisRun.filter(c => c.floor === state.profile?.tower_progress?.currentFloor).length;

            if (updatedProfile.tower_progress && remainingChallengesOnFloor === 0 && activeChallengesOnCurrentFloor > 0) {
                 updatedProfile.tower_progress.currentFloor += 1;
                 if (updatedProfile.tower_progress.currentFloor > updatedProfile.tower_progress.highestFloor) {
                    updatedProfile.tower_progress.highestFloor = updatedProfile.tower_progress.currentFloor;
                 }
                 updatedProfile.tower_progress.dailyChallengesAvailable = 3;
                 toast({title: "Andar da Torre Concluído!", description: `Você avançou para o andar ${updatedProfile.tower_progress.currentFloor}!`});
            }
            
            persistData('profile', updatedProfile);
        }
    
    }, [state.profile, state.metas, state.missions, persistData, toast]);

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
        let xpMultiplier = (xpBoostEffect && xpBoostEffect.multiplier) ? xpBoostEffect.multiplier : 1;

        // Apply World Event Nerf
        const activeEvent = state.worldEvents.find(e => e.isActive && new Date(e.endDate) > new Date());
        const eventXpNerf = activeEvent?.effects.find(e => e.type === 'XP_NERF');
        if (eventXpNerf && activeEvent) {
            xpMultiplier *= eventXpNerf.value;
            toast({ variant: 'destructive', title: `Efeito de Evento: ${activeEvent.name}`, description: `O ganho de XP está reduzido em ${(1 - eventXpNerf.value) * 100}%.`})
        }
        
        const finalXPGained = Math.round(tempDailyMission.xp_conclusao * xpMultiplier);
        
        if (xpMultiplier !== 1 && !eventXpNerf) toast({ title: 'Bónus de XP Ativo!', description: `Você ganhou ${finalXPGained} XP (${xpMultiplier}x)!` });
        
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
        
        let currentMetas = [...state.metas];
        const meta = currentMetas.find((m: Meta) => m.nome === tempRankedMission.meta_associada);
        if (meta?.habilidade_associada_id) {
            let skillToUpdate = state.skills.find((s: Skill) => s.id === meta.habilidade_associada_id);
            if (skillToUpdate) {
                 skillToUpdate = { ...skillToUpdate, ultima_atividade_em: new Date().toISOString() };
                 if (skillToUpdate.nivel_atual !== undefined && skillToUpdate.nivel_maximo !== undefined && 
                    skillToUpdate.nivel_atual < skillToUpdate.nivel_maximo) {
                    
                    skillToUpdate.xp_atual = (skillToUpdate.xp_atual || 0) + missionSkillXp;
                    
                     if (skillToUpdate.xp_atual >= (skillToUpdate.xp_para_proximo_nivel || 0)) {
                        const statsToUpgrade = (statCategoryMapping as StatMapping)[skillToUpdate.categoria] || [];
                        handleShowSkillUpNotification(skillToUpdate.nome, (skillToUpdate.nivel_atual || 0) + 1, statsToUpgrade.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)));
                        if (statsToUpgrade.length > 0 && updatedProfile.estatisticas) {
                            statsToUpgrade.forEach((stat: string) => { 
                                const statKey = stat as keyof typeof updatedProfile.estatisticas;
                                updatedProfile.estatisticas[statKey] = (updatedProfile.estatisticas[statKey] || 0) + 1; 
                            });
                        }
                        skillToUpdate.nivel_atual = (skillToUpdate.nivel_atual || 0) + 1;
                        skillToUpdate.xp_atual = (skillToUpdate.xp_atual || 0) - (skillToUpdate.xp_para_proximo_nivel || 0);
                        skillToUpdate.xp_para_proximo_nivel = Math.floor((skillToUpdate.xp_para_proximo_nivel || 0) * 1.5);
                    }
                }
                dispatch({ type: 'UPDATE_SKILL', payload: { skillId: meta.habilidade_associada_id, updates: skillToUpdate } });
            }
        }
        
        // Damage Nemesis
        if (meta && meta.nemesis) {
            const damage = finalXPGained;
            const newHealth = Math.max(0, meta.nemesis.currentHealth - damage);
            meta.nemesis.currentHealth = newHealth;
            if (newHealth === 0) {
                 toast({ title: 'Némesis Derrotado!', description: `Você superou ${meta.nemesis.name}!` });
            }
            currentMetas = currentMetas.map(m => m.id === meta.id ? meta : m);
            dispatch({ type: 'SET_METAS', payload: currentMetas });
        }


        // Handle World Event Contribution
        if (activeEvent && activeEvent.goal.type === 'COMPLETE_MISSIONS_IN_CATEGORY' && meta?.categoria === activeEvent.goal.category) {
            let userContribution = updatedProfile.event_contribution?.eventId === activeEvent.id ? (updatedProfile.event_contribution.contribution || 0) : 0;
            userContribution++;
            updatedProfile.event_contribution = { eventId: activeEvent.id, contribution: userContribution };
            
            const updatedEvent = { ...activeEvent, progress: (activeEvent.progress || 0) + 1 };
            
            // Check for event completion
            if (updatedEvent.progress >= updatedEvent.goal.target) {
                updatedEvent.isActive = false; // Deactivate event
                toast({ title: 'Evento Mundial Concluído!', description: `Graças ao seu esforço, "${activeEvent.name}" foi superado! As recompensas serão distribuídas.` });
                
                // Add reward effects to world events (or a separate system in a real app)
                const rewardEvent = {
                    id: `reward_${activeEvent.id}`,
                    name: `Recompensa: ${activeEvent.name}`,
                    description: `Recompensas pela vitória contra ${activeEvent.name}.`,
                    type: 'REWARD',
                    effects: activeEvent.rewards.map(r => ({...r, type: r.type, expires_at: new Date(Date.now() + (r.duration_hours || 0) * 3600 * 1000).toISOString() })),
                    isActive: true,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString() // Example 48h reward period
                }
                await persistData('worldEvents', [...state.worldEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e), rewardEvent]);
            } else {
                 await persistData('worldEvents', state.worldEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e));
            }
        }

        dispatch({ type: 'SET_GENERATING_MISSION', payload: rankedMissionId });
        
        let newDailyMission = null;
        try {
            const history = tempRankedMission.missoes_diarias.filter((d: DailyMission) => d.concluido).map((d: DailyMission) => `- ${d.nome}`).join('\n');
            
            const deadline = meta?.prazo;

            const result = await generateNextDailyMission({
                rankedMissionName: tempRankedMission.nome,
                metaName: meta?.nome || "Objetivo geral",
                goalDeadline: deadline,
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
                subTasks: result.subTasks.map(st => ({...st, current: 0})),
                isNemesisChallenge: result.isNemesisChallenge,
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
                const completedGoal = currentMetas.find((m: Meta) => m.nome === tempRankedMission.meta_associada);
                if (completedGoal) {
                    persistData('metas', currentMetas.map((m: Meta) => m.id === completedGoal.id ? { ...m, concluida: true } : m));
                    handleShowGoalCompletedNotification(completedGoal.nome);
                }
            }
        }
        
        await persistData('profile', updatedProfile);
        await persistData('metas', currentMetas);
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
                    subTasks: result.subTasks.map(st => ({...st, current: 0})),
                    isNemesisChallenge: result.isNemesisChallenge,
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
    
    const resetUserSubCollections = useCallback(async (userRef: DocumentReference<DocumentData>) => {
        const batch = writeBatch(db);
        const collectionsToDelete = ['metas', 'missions', 'skills'];
        for (const coll of collectionsToDelete) {
            const snapshot = await getDocs(collection(userRef, coll));
            snapshot.forEach(doc => batch.delete(doc.ref));
        }
        await batch.commit();
    }, []);

    const handleFullReset = useCallback(async () => {
        if (!user) return;
        dispatch({ type: 'SET_DATA_LOADED', payload: false });
        try {
            const userRef = doc(db, 'users', user.uid);
            await resetUserSubCollections(userRef);

            const batch = writeBatch(db);
            const emailUsername = user.email!.split('@')[0];
            
            const defaultUserSettings = {
                mission_view_style: 'inline', // 'inline' or 'popup'
                ai_personality: 'balanced', // 'balanced', 'mentor', 'strategist', 'friendly'
                theme_accent_color: '198 90% 55%', // HSL string
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
            
            const initialProfile = { ...mockData.perfis[0], id: user.uid, email: user.email, primeiro_nome: emailUsername, apelido: "Caçador", nome_utilizador: emailUsername, avatar_url: `https://placehold.co/100x100.png?text=${emailUsername.substring(0, 2).toUpperCase()}`, ultimo_login_em: new Date().toISOString(), inventory: [], active_effects: [], guild_id: null, guild_role: null, onboarding_completed: false, user_settings: defaultUserSettings, manual_missions: [], achievements: [], generated_achievements: [], recommended_shop_items: [], shop_last_generated_at: null, tower_progress: { currentFloor: 1, highestFloor: 1, lives: 5, maxLives: 5, lastLifeRegeneration: new Date().toISOString(), dailyChallengesAvailable: 3 }, active_tower_challenges: [], available_tower_challenges: [], recurring_tasks: [], completed_tasks_today: {}, last_task_completion_date: null };
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
    }, [user, toast, resetUserSubCollections]);
    
    const handleImportData = useCallback(async (file: File) => {
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
    }, [user, resetUserSubCollections, toast]);
    
    const completeDungeonChallenge = useCallback(async (skillId: string | number) => {
        const skill = state.skills.find(s => s.id === skillId);
        if (!skill || !skill.dungeon?.active_challenge) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Desafio da masmorra não encontrado.'});
            return;
        }

        const challenge = skill.dungeon.active_challenge;
        let updatedSkill = { ...skill };

        // 1. Grant XP
        updatedSkill.xp_atual = (updatedSkill.xp_atual || 0) + challenge.xpReward;

        // 2. Check for level up
        if (updatedSkill.xp_atual >= updatedSkill.xp_para_proximo_nivel) {
            updatedSkill.nivel_atual += 1;
            updatedSkill.xp_atual -= updatedSkill.xp_para_proximo_nivel;
            updatedSkill.xp_para_proximo_nivel = Math.floor(updatedSkill.xp_para_proximo_nivel * 1.5);
            
            // Grant stat bonus
            const statsToUpgrade = (statCategoryMapping as StatMapping)[updatedSkill.categoria] || [];
            let updatedProfile = { ...state.profile! };
            if (statsToUpgrade.length > 0 && updatedProfile.estatisticas) {
                statsToUpgrade.forEach((stat: string) => { 
                    const statKey = stat as keyof typeof updatedProfile.estatisticas;
                    updatedProfile.estatisticas[statKey] = (updatedProfile.estatisticas[statKey] || 0) + 1; 
                });
                await persistData('profile', updatedProfile);
            }
            handleShowSkillUpNotification(updatedSkill.nome, updatedSkill.nivel_atual, statsToUpgrade.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)));
        }

        // 3. Update dungeon progress
        const completedChallenge = { ...challenge, completedAt: new Date().toISOString() };
        updatedSkill.dungeon = {
            ...(updatedSkill.dungeon!),
            active_challenge: null,
            completed_challenges: [...(updatedSkill.dungeon!.completed_challenges || []), completedChallenge],
            current_room: updatedSkill.dungeon!.current_room + 1,
            highest_room: Math.max(updatedSkill.dungeon!.highest_room, updatedSkill.dungeon!.current_room + 1),
        };

        // 4. Persist data
        const updatedSkills = state.skills.map(s => s.id === skillId ? updatedSkill : s);
        await persistData('skills', updatedSkills);
        
        toast({ title: `Desafio "${challenge.challengeName}" Concluído!`, description: `Você ganhou ${challenge.xpReward} XP para ${skill.nome} e avançou para a sala ${updatedSkill.dungeon.current_room}.` });

    }, [state.skills, state.profile, persistData, toast, handleShowSkillUpNotification]);

    // Skill Decay & Tower/Dungeon Lives & Task Reset Logic
    useEffect(() => {
        if (!state.isDataLoaded || !state.profile) return;

        const checkSystems = () => {
            let profileChanged = false;
            let updatedProfile = JSON.parse(JSON.stringify(state.profile!));
            const now = new Date();
            const activeEvent = state.worldEvents.find(e => e.isActive && new Date(e.endDate) > new Date());
            const corruptionAccelerationEffect = activeEvent?.effects.find(e => e.type === 'CORRUPTION_ACCELERATION');
            const decayDays = corruptionAccelerationEffect ? 14 / corruptionAccelerationEffect.value : 14;
            const atRiskDays = Math.floor(decayDays / 2);

            let skillsToUpdate: Skill[] = [];
            let atRiskSkills: { name: string; daysInactive: number }[] = [];
            let decayedSkills: { name: string; xpLost: number }[] = [];

            state.skills.forEach(skill => {
                const lastActivity = new Date(skill.ultima_atividade_em || now);
                const daysInactive = differenceInCalendarDays(now, lastActivity);

                if (daysInactive > decayDays) { 
                    const xpToLose = 5;
                    if (skill.xp_atual > 0) {
                        const newXp = Math.max(0, skill.xp_atual - xpToLose);
                        skillsToUpdate.push({ ...skill, xp_atual: newXp, ultima_atividade_em: now.toISOString() });
                        decayedSkills.push({ name: skill.nome, xpLost: xpToLose });
                    }
                } else if (daysInactive > atRiskDays) {
                    atRiskSkills.push({ name: skill.nome, daysInactive });
                }
            });

            if (skillsToUpdate.length > 0) {
                const updatedSkills = state.skills.map(s => skillsToUpdate.find(u => u.id === s.id) || s);
                dispatch({ type: 'SET_SKILLS', payload: updatedSkills });
                handleShowSkillDecayNotification(decayedSkills);
            }
            if (atRiskSkills.length > 0) {
                 handleShowSkillAtRiskNotification(atRiskSkills);
            }

            // Tower Lives & Daily Challenge Reset Logic
            if (updatedProfile.tower_progress) {
                const lastRegenTower = new Date(updatedProfile.tower_progress.lastLifeRegeneration);
                if (!isToday(lastRegenTower)) {
                    updatedProfile.tower_progress.lives = updatedProfile.tower_progress.maxLives;
                    updatedProfile.tower_progress.lastLifeRegeneration = now.toISOString();
                    updatedProfile.tower_progress.dailyChallengesAvailable = 3;
                    profileChanged = true;
                }
            }

            // Dungeon Lives Reset Logic
            if (updatedProfile.dungeon_last_life_regeneration) {
                const lastRegenDungeon = new Date(updatedProfile.dungeon_last_life_regeneration);
                if (!isToday(lastRegenDungeon)) {
                    updatedProfile.dungeon_lives = updatedProfile.dungeon_max_lives;
                    updatedProfile.dungeon_last_life_regeneration = now.toISOString();
                    profileChanged = true;
                }
            }
            
            // Task Reset Logic
             if (updatedProfile.last_task_completion_date && !isToday(new Date(updatedProfile.last_task_completion_date))) {
                updatedProfile.completed_tasks_today = {};
                profileChanged = true;
            }

            if (profileChanged) {
                const currentProfileString = JSON.stringify(state.profile);
                const updatedProfileString = JSON.stringify(updatedProfile);
                
                if (currentProfileString !== updatedProfileString) {
                    dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
                }
            }
        };

        const intervalId = setInterval(checkSystems, 1000 * 60 * 60); // Check once an hour
        checkSystems(); 

        return () => clearInterval(intervalId);
    }, []); 

    // Narrative event trigger
    useEffect(() => {
        if (!state.isDataLoaded || !state.profile || !state.profile.last_known_level) return;

        const currentLevel = state.profile.nivel;
        const lastKnownLevel = state.profile.last_known_level || currentLevel;

        if (currentLevel > lastKnownLevel) {
            console.log("Narrative Trigger: Level Up");
            const { rank, title } = getProfileRank(currentLevel);
            generateSystemAdvice({
                userName: state.profile.nome_utilizador || 'Caçador',
                profile: JSON.stringify(state.profile),
                metas: JSON.stringify(state.metas),
                routine: JSON.stringify(state.routine),
                missions: JSON.stringify(state.missions.filter(m => !m.concluido)),
                query: `O Caçador acabou de atingir o nível ${currentLevel} (Rank: ${rank} - ${title}). Gere uma mensagem curta, épica e narrativa sobre a sua crescente reputação.`,
                personality: state.profile.user_settings?.ai_personality || 'balanced',
            }).then(result => {
                setSystemAlert({ message: result.response, position: { top: '10%', left: '50%' } });
            });
            persistData('profile', { ...state.profile, last_known_level: currentLevel });
        }
    }, [state.profile?.nivel, state.isDataLoaded, state.profile, state.metas, state.routine, state.missions, persistData, setSystemAlert]);


    const fetchData = useCallback(async (userId: string) => {
        dispatch({ type: 'SET_DATA_LOADED', payload: false });
        console.log('📋 Iniciando fetchData para userId:', userId);
        try {
            const userDocRef = doc(db, 'users', userId);
            console.log('📋 Fazendo queries ao Firestore...');
            const [
                userDoc, 
                metasSnapshot, 
                missionsSnapshot, 
                skillsSnapshot, 
                routineDoc, 
                routineTemplatesDoc, 
                allUsersSnapshot, 
                guildsSnapshot,
                worldEventsSnapshot
            ] = await Promise.all([
                getDoc(userDocRef),
                getDocs(collection(userDocRef, 'metas')),
                getDocs(collection(userDocRef, 'missions')),
                getDocs(collection(userDocRef, 'skills')),
                getDoc(doc(db, 'users', userId, 'routine', 'main')),
                getDoc(doc(db, 'users', userId, 'routine', 'templates')),
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'guilds')),
                getDocs(collection(db, 'world_events'))
            ]);

            console.log('📋 Queries completadas. UserDoc exists:', userDoc.exists());
            if (userDoc.exists()) {
                let profileData = userDoc.data() as Profile;
                let profileNeedsUpdate = false;
                
                 const skillsData = skillsSnapshot.docs.map(d => {
                    const skill = d.data();
                    if (!skill.dungeon) {
                        profileNeedsUpdate = true;
                        return { 
                            ...skill, 
                            dungeon: {
                                current_room: 1,
                                highest_room: 1,
                                active_challenge: null,
                                completed_challenges: [],
                            }
                        };
                    }
                    return skill;
                });

                if (!profileData.tower_progress) {
                    profileData.tower_progress = { currentFloor: 1, highestFloor: 1, lives: 5, maxLives: 5, lastLifeRegeneration: new Date().toISOString(), dailyChallengesAvailable: 3 };
                    profileNeedsUpdate = true;
                }
                if (!profileData.active_tower_challenges) {
                    profileData.active_tower_challenges = [];
                    profileNeedsUpdate = true;
                }
                 if (!profileData.available_tower_challenges) {
                    profileData.available_tower_challenges = [];
                    profileNeedsUpdate = true;
                }
                
                if (!profileData.routineTemplates) {
                    profileData.routineTemplates = {}; // Adicionado para evitar undefined
                }
                if (!profileData.last_known_level) {
                     profileData.last_known_level = profileData.nivel;
                     profileNeedsUpdate = true;
                }

                 if (!profileData.dungeon_lives) {
                    profileData.dungeon_lives = 5;
                    profileData.dungeon_max_lives = 5;
                    profileData.dungeon_last_life_regeneration = new Date().toISOString();
                    profileNeedsUpdate = true;
                }

                if (profileNeedsUpdate) {
                    await persistData('profile', profileData);
                    if (skillsData.some(s => !s.dungeon)) {
                        await persistData('skills', skillsData);
                    }
                }

                dispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        profile: profileData,
                        metas: metasSnapshot.docs.map(d => d.data()),
                        missions: missionsSnapshot.docs.map(d => d.data()),
                        skills: skillsData,
                        routine: routineDoc.exists() ? routineDoc.data() : {},
                        routineTemplates: routineTemplatesDoc.exists() ? routineTemplatesDoc.data() : {},
                        allUsers: allUsersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
                        guilds: guildsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
                        worldEvents: worldEventsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
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
                    worldEvents: mockData.worldEvents,
                }
            });
            
            setShowOnboarding(true);
            toast({ 
                variant: 'destructive', 
                title: "Modo Offline Ativo", 
                description: "Usando dados locais. Algumas funcionalidades podem estar limitadas." 
            });
        }
    }, [user, toast, handleFullReset, setShowOnboarding, resetUserSubCollections, persistData]);
    
    useEffect(() => {
        if (authState === 'authenticated' && user && !state.isDataLoaded) {
            fetchData(user.uid);
        }
    }, [user, authState, state.isDataLoaded, fetchData]);

    const providerValue = {
        ...state,
        persistData,
        completeMission,
        completeDungeonChallenge,
        handleFullReset,
        handleImportData,
        questNotification, setQuestNotification,
        systemAlert, setSystemAlert,
        showOnboarding, setShowOnboarding,
        setMissionFeedback,
        generatePendingDailyMissions,
        checkAndApplyTowerRewards,
        addDailyMission: (payload: { rankedMissionId: string | number; newDailyMission: DailyMission; }) => dispatch({ type: 'ADD_DAILY_MISSION', payload }),
        setGeneratingMission: (id: string | number | null) => dispatch({ type: 'SET_GENERATING_MISSION', payload: id }),
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
