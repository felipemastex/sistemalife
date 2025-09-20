

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
import { generateSkillDungeonChallenge } from '@/ai/flows/generate-skill-dungeon-challenge';


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
  descricao: string;
  categoria: string;
  nivel_atual: number;
  nivel_maximo: number;
  xp_atual: number;
  xp_para_proximo_nivel: number;
  pre_requisito?: string | number | null;
  nivel_minimo_para_desbloqueio?: number | null;
  ultima_atividade_em: string;
}

interface DungeonSession {
    skillId: string | number;
    roomLevel: number;
    highestRoom: number;
    challenge: any | null; // The active challenge object
    completed_challenges: any[];
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
  dailyChallengesAvailable: number;
  tower_tickets: number;
  tower_lockout_until: string | null;
  lastLifeRegeneration?: string;
  completed_challenges_floor?: string[];
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
  hp_atual?: number;
  inventory: any[];
  active_effects: ActiveEffect[];
  active_tower_challenges?: ActiveTowerChallenge[];
  available_tower_challenges?: any[];
  tower_progress?: TowerProgress;
  dungeon_crystals?: number;
  active_dungeon_event?: {
    skillId: string | number;
    expires_at: string;
  } | null;
  dungeon_session?: DungeonSession | null;
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
  event_contribution?: {
    eventId: string;
    contribution: number;
  };
  last_known_level?: number;
  routineTemplates?: Record<string, any>; // Adicionando a propriedade routineTemplates ao tipo Profile
  last_hp_regen_date?: string;
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
  currentPage: string;
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
    currentPage: 'dashboard',
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
        case 'SET_CURRENT_PAGE':
            return { ...state, currentPage: action.payload };
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
        case 'ADJUST_DAILY_MISSION': {
             const { rankedMissionId, dailyMissionId, newDailyMission } = action.payload;
            const updatedMissions = state.missions.map(rm => {
                if (rm.id === rankedMissionId) {
                    // Remove a missão antiga e adiciona a nova
                    const newDailyMissionsList = rm.missoes_diarias.filter(dm => dm.id !== dailyMissionId);
                    if (newDailyMission) {
                        newDailyMissionsList.push(newDailyMission);
                    }
                    return { 
                        ...rm, 
                        missoes_diarias: newDailyMissionsList,
                        ultima_missao_concluida_em: null // Garante que a data de conclusão seja resetada
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

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestamps = (data: any) => {
    for (const key in data) {
        if (data[key] && typeof data[key].toDate === 'function') {
            data[key] = data[key].toDate().toISOString();
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            convertTimestamps(data[key]);
        }
    }
    return data;
};


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

    const checkAndApplyTowerRewards = useCallback(async () => {
        if (!state.isDataLoaded || !state.profile) return;
        
        let updatedProfile = JSON.parse(JSON.stringify(state.profile!));
        let profileChanged = false;
        let challengesToRemove: string[] = [];
        const completedChallengesThisRun: ActiveTowerChallenge[] = [];
    
        const stillActiveChallenges = (updatedProfile.active_tower_challenges || []).filter((challenge: ActiveTowerChallenge) => {
            if (!challenge.startedAt) return true;
            const startTime = new Date(challenge.startedAt).getTime();
            const timeLimitMillis = challenge.timeLimit * 60 * 60 * 1000;
            const isExpired = new Date().getTime() - startTime > timeLimitMillis;
    
            if (isExpired) {
                if (updatedProfile.tower_progress) {
                    const maxHP = Math.floor((updatedProfile.estatisticas.constituicao || 5) / 5) * 100;
                    const hpLost = Math.round(maxHP * 0.20);
                    updatedProfile.hp_atual = Math.max(0, (updatedProfile.hp_atual || maxHP) - hpLost);
                     if (updatedProfile.hp_atual <= 0) {
                        updatedProfile.hp_atual = maxHP; // Reset HP
                        const lockoutEndDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        updatedProfile.tower_progress.tower_lockout_until = lockoutEndDate.toISOString();
                        toast({ variant: 'destructive', title: 'Você foi Derrotado!', description: 'A sua vida chegou a zero. A Torre está bloqueada por 24 horas.' });
                    } else {
                        toast({ variant: 'destructive', title: 'Desafio da Torre Falhado!', description: `O tempo para "${challenge.title}" esgotou. Você perdeu ${hpLost} de HP.` });
                    }
                }
                challengesToRemove.push(challenge.id);
                profileChanged = true;
                return false;
            }
            return true;
        });
    
        stillActiveChallenges.forEach((challenge: ActiveTowerChallenge) => {
            let allRequirementsMet = true;
            
            challenge.requirements.forEach(req => {
                let currentProgress = req.current || 0;
                switch (req.type) {
                    case 'missions_in_category_completed':
                        const categoryGoals = state.metas.filter(m => m.categoria === req.value).map(m => m.nome);
                        currentProgress = state.missions.filter(m => categoryGoals.includes(m.meta_associada)).flatMap(m => m.missoes_diarias || []).filter(dm => dm.concluido).length;
                        break;
                    case 'streak_maintained':
                        currentProgress = updatedProfile.streak_atual || 0;
                        break;
                    case 'missions_completed':
                         currentProgress = updatedProfile.missoes_concluidas_total || 0;
                         break;
                    case 'level_reached':
                        currentProgress = updatedProfile.nivel || 1;
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
                if (!updatedProfile.tower_progress.completed_challenges_floor) {
                    updatedProfile.tower_progress.completed_challenges_floor = [];
                }
                updatedProfile.tower_progress.completed_challenges_floor.push(challenge.id);
                toast({ title: "Desafio da Torre Concluído!", description: `Você completou: ${challenge.title} e ganhou ${challenge.rewards.xp} XP!` });
            });
            
            if (updatedProfile.tower_progress.completed_challenges_floor.length >= 3) {
                 updatedProfile.tower_progress.currentFloor += 1;
                 if (updatedProfile.tower_progress.currentFloor > updatedProfile.tower_progress.highestFloor) {
                    updatedProfile.tower_progress.highestFloor = updatedProfile.tower_progress.currentFloor;
                 }
                 updatedProfile.tower_progress.completed_challenges_floor = []; // Reset for new floor
                 toast({title: "Andar da Torre Concluído!", description: `Você avançou para o andar ${updatedProfile.tower_progress.currentFloor}!`});
            }
        }
    
        if (profileChanged) {
            updatedProfile.active_tower_challenges = (updatedProfile.active_tower_challenges || []).filter((c: ActiveTowerChallenge) => !challengesToRemove.includes(c.id));
            await persistData('profile', updatedProfile);
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
        
        // Add chance to get a Tower Ticket
        if (Math.random() < 0.1) { // 10% chance
            updatedProfile.tower_progress = {
                ...updatedProfile.tower_progress!,
                tower_tickets: (updatedProfile.tower_progress?.tower_tickets || 0) + 1
            };
            toast({ title: 'Recompensa Rara!', description: 'Você encontrou um Ticket da Torre!' });
        }

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
    
    const adjustDailyMission = useCallback(async (rankedMissionId: string | number, dailyMission: DailyMission, feedback: 'too_easy' | 'too_hard') => {
        if (!state.profile || !state.missions) return;
    
        const rankedMission = state.missions.find(rm => rm.id === rankedMissionId);
        if (!rankedMission) return;
    
        const meta = state.metas.find(m => m.nome === rankedMission.meta_associada);
    
        dispatch({ type: 'SET_GENERATING_MISSION', payload: rankedMissionId });
    
        let newDailyMission = null;
        try {
            const history = rankedMission.missoes_diarias
                .filter(d => d.concluido)
                .map(d => `- ${d.nome}`)
                .join('\n');
    
            const result = await generateNextDailyMission({
                rankedMissionName: rankedMission.nome,
                metaName: meta?.nome || "Objetivo geral",
                goalDeadline: meta?.prazo,
                history: history || `O utilizador está a ajustar a missão: "${dailyMission.nome}".`,
                userLevel: state.profile.nivel,
                feedback: `O utilizador considerou a missão anterior ${feedback === 'too_easy' ? 'muito fácil' : 'muito difícil'}. Ajuste drasticamente.`
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
            };
    
            dispatch({ type: 'ADJUST_DAILY_MISSION', payload: { rankedMissionId, dailyMissionId: dailyMission.id, newDailyMission } });
             await persistData('missions', playerDataReducer(state, { type: 'ADJUST_DAILY_MISSION', payload: { rankedMissionId, dailyMissionId: dailyMission.id, newDailyMission } }).missions);

            toast({
                title: "Missão Ajustada!",
                description: `Uma nova missão, "${newDailyMission.nome}", foi gerada com base no seu feedback.`
            });
    
        } catch (error) {
            console.error("Erro ao ajustar missão diária:", error);
            toast({
                variant: 'destructive',
                title: 'Erro de IA',
                description: 'Não foi possível ajustar a sua missão. Tente novamente mais tarde.'
            });
        } finally {
            dispatch({ type: 'SET_GENERATING_MISSION', payload: null });
        }
    }, [state, persistData, toast]);
    
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
            
            const initialProfile = { ...mockData.perfis[0], id: user.uid, email: user.email, primeiro_nome: emailUsername, apelido: "Caçador", nome_utilizador: emailUsername, avatar_url: `https://placehold.co/100x100.png?text=${emailUsername.substring(0, 2).toUpperCase()}`, ultimo_login_em: new Date().toISOString(), inventory: [], active_effects: [], guild_id: null, guild_role: null, onboarding_completed: false, user_settings: defaultUserSettings, manual_missions: [], achievements: [], generated_achievements: [], recommended_shop_items: [], shop_last_generated_at: null, tower_progress: { currentFloor: 1, highestFloor: 1, dailyChallengesAvailable: 3, tower_tickets: 1, tower_lockout_until: null }, active_tower_challenges: [], available_tower_challenges: [], dungeon_crystals: 0 };
            batch.set(userRef, initialProfile);

            mockData.metas.forEach(meta => batch.set(doc(collection(userRef, 'metas'), String(meta.id)), { ...meta, prazo: meta.prazo || null, concluida: meta.concluida || false }));
            mockData.missoes.forEach(mission => batch.set(doc(collection(userRef, 'missions'), String(mission.id)), mission));
            mockData.habilidades.forEach(skill => batch.set(doc(collection(userRef, 'skills'), String(skill.id)), skill));
            batch.set(doc(userRef, 'routine', 'main'), mockData.rotina);
            batch.set(doc(userRef, 'routine', 'templates'), mockData.rotinaTemplates);
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
    
    const generateDungeonChallenge = useCallback(async () => {
        if (!state.profile?.dungeon_session) return;
        const { skillId, roomLevel, completed_challenges } = state.profile.dungeon_session;
        const skill = state.skills.find(s => s.id === skillId);

        if (!skill) return;

        if (state.profile.dungeon_session.challenge) {
            toast({ variant: 'destructive', title: 'Desafio Ativo', description: 'Complete ou desista do desafio atual antes de gerar um novo.'});
            return;
        }

        try {
            const result = await generateSkillDungeonChallenge({
                skillName: skill.nome,
                skillDescription: skill.descricao,
                skillLevel: skill.nivel_atual,
                dungeonRoomLevel: roomLevel,
                previousChallenges: completed_challenges?.map(c => c.challengeName) || [],
            });

            const updatedProfile = {
                ...state.profile,
                dungeon_session: {
                    ...state.profile.dungeon_session!,
                    challenge: result,
                },
            };
            await persistData('profile', updatedProfile);
            
        } catch (error) {
            console.error("Failed to generate dungeon challenge:", error);
            throw new Error('Não foi possível gerar um novo desafio para a masmorra.');
        }
    }, [state.profile, state.skills, persistData, toast]);


    const completeDungeonChallenge = useCallback(async (submission: string) => {
        if (!state.profile?.dungeon_session || !state.profile.dungeon_session.challenge) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum desafio ativo na masmorra.'});
            return;
        }

        const { skillId, challenge } = state.profile.dungeon_session;
        const skill = state.skills.find(s => s.id === skillId);
        if (!skill) return;
        
        let updatedSkill = { ...skill };
        updatedSkill.xp_atual = (updatedSkill.xp_atual || 0) + challenge.xpReward;

        if (updatedSkill.xp_atual >= updatedSkill.xp_para_proximo_nivel) {
            updatedSkill.nivel_atual += 1;
            updatedSkill.xp_atual -= updatedSkill.xp_para_proximo_nivel;
            updatedSkill.xp_para_proximo_nivel = Math.floor(updatedSkill.xp_para_proximo_nivel * 1.5);
            
            const statsToUpgrade = (statCategoryMapping as StatMapping)[updatedSkill.categoria] || [];
            let updatedProfileForStats = { ...state.profile };
            if (statsToUpgrade.length > 0 && updatedProfileForStats.estatisticas) {
                statsToUpgrade.forEach((stat: string) => { 
                    const statKey = stat as keyof typeof updatedProfileForStats.estatisticas;
                    updatedProfileForStats.estatisticas[statKey] = (updatedProfileForStats.estatisticas[statKey] || 0) + 1; 
                });
                await persistData('profile', updatedProfileForStats);
            }
            handleShowSkillUpNotification(updatedSkill.nome, updatedSkill.nivel_atual, statsToUpgrade.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)));
        }

        const updatedSkills = state.skills.map(s => s.id === skillId ? updatedSkill : s);
        await persistData('skills', updatedSkills);
        
        const completedChallengeRecord = { ...challenge, completedAt: new Date().toISOString(), submission };
        const newDungeonSession: DungeonSession = {
            ...state.profile.dungeon_session,
            challenge: null, // Clear active challenge
            completed_challenges: [...state.profile.dungeon_session.completed_challenges, completedChallengeRecord],
            roomLevel: state.profile.dungeon_session.roomLevel + 1,
            highestRoom: Math.max(state.profile.dungeon_session.highestRoom, state.profile.dungeon_session.roomLevel + 1),
        };
        
        const updatedProfile = { ...state.profile, dungeon_session: newDungeonSession };
        await persistData('profile', updatedProfile);

        toast({ title: `Desafio "${challenge.challengeName}" Concluído!`, description: `Você ganhou ${challenge.xpReward} XP para ${skill.nome} e avançou para a sala ${newDungeonSession.roomLevel}.` });

    }, [state.profile, state.skills, persistData, toast, handleShowSkillUpNotification]);


    const triggerDungeonEvent = useCallback(async () => {
        if (!state.profile || !state.skills || state.skills.length === 0) {
            toast({ variant: 'destructive', title: 'Impossível Iniciar Evento', description: 'Você precisa ter pelo menos uma habilidade para iniciar um evento de masmorra.' });
            return;
        }

        if (state.profile.active_dungeon_event) {
            toast({ title: 'Evento Já Ativo', description: 'Você já tem um convite para uma masmorra pendente.' });
            return;
        }

        const randomSkill = state.skills[Math.floor(Math.random() * state.skills.length)];
        const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes to accept

        const updatedProfile = {
            ...state.profile,
            active_dungeon_event: {
                skillId: randomSkill.id,
                expires_at: expires_at,
            },
        };
        await persistData('profile', updatedProfile);
        
    }, [state.profile, state.skills, persistData, toast]);
    
    const clearDungeonSession = useCallback(async (exitView: boolean = true) => {
        if (!state.profile) return;
        const updatedProfile = { ...state.profile, dungeon_session: null };
        await persistData('profile', updatedProfile);
        if (exitView) {
            dispatch({ type: 'SET_CURRENT_PAGE', payload: 'dashboard' });
        }
    }, [state.profile, persistData]);

    const acceptDungeonEvent = useCallback(async () => {
        if (!state.profile || !state.profile.active_dungeon_event) return;
    
        const { skillId } = state.profile.active_dungeon_event;
        const skill = state.skills.find(s => s.id === skillId);
        if (!skill) return;

        const newDungeonSession: DungeonSession = {
            skillId: skill.id,
            roomLevel: 1,
            highestRoom: 1,
            challenge: null,
            completed_challenges: [],
        };
        
        const updatedProfile = { 
            ...state.profile, 
            active_dungeon_event: null,
            dungeon_session: newDungeonSession,
        };
        await persistData('profile', updatedProfile);

        dispatch({ type: 'SET_CURRENT_PAGE', payload: 'dungeon' });
        
        // Immediately generate the first challenge
        await generateDungeonChallenge();
    
    }, [state.profile, state.skills, persistData, generateDungeonChallenge]);

    const declineDungeonEvent = useCallback(async () => {
        if (!state.profile) return;
        const updatedProfile = { ...state.profile, active_dungeon_event: null };
        await persistData('profile', updatedProfile);
    }, [state.profile, persistData]);

    const addDungeonCrystal = useCallback(async () => {
        if (!state.profile) return;
        const updatedProfile = {
            ...state.profile,
            dungeon_crystals: (state.profile.dungeon_crystals || 0) + 1,
        };
        await persistData('profile', updatedProfile);
        toast({ title: 'Cristal Adicionado!', description: 'Você recebeu 1 Cristal da Masmorra.' });
    }, [state.profile, persistData, toast]);
    
    const spendDungeonCrystal = useCallback(async (skillId: string | number) => {
        if (!state.profile || (state.profile.dungeon_crystals || 0) <= 0) {
            toast({ variant: 'destructive', title: 'Cristais Insuficientes', description: 'Você não tem Cristais da Masmorra para usar.' });
            return;
        }

        const newDungeonSession: DungeonSession = {
            skillId,
            roomLevel: 1,
            highestRoom: 1,
            challenge: null,
            completed_challenges: [],
        };

        const updatedProfile = {
            ...state.profile,
            dungeon_crystals: (state.profile.dungeon_crystals || 0) - 1,
            dungeon_session: newDungeonSession
        };
        await persistData('profile', updatedProfile);

        dispatch({ type: 'SET_CURRENT_PAGE', payload: 'dungeon' });
        
        toast({ title: 'Masmorra Aberta!', description: 'Você usou um cristal para forçar a entrada na masmorra.' });
        
        await generateDungeonChallenge();

    }, [state.profile, persistData, toast, generateDungeonChallenge]);
    
    const activateTestWorldEvent = useCallback(async () => {
        if (!state.worldEvents || state.worldEvents.length === 0) {
            toast({ variant: 'destructive', title: 'Nenhum Evento', description: 'Não há eventos mundiais configurados.'});
            return;
        }
        const eventToActivate = { ...state.worldEvents[0] };
        eventToActivate.isActive = true;
        eventToActivate.startDate = new Date().toISOString();
        eventToActivate.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now
        
        const updatedEvents = state.worldEvents.map(e => e.id === eventToActivate.id ? eventToActivate : e);
        await persistData('worldEvents', updatedEvents);
        toast({ title: 'Evento Mundial de Teste Ativado!', description: `"${eventToActivate.name}" começou!`});
    }, [state.worldEvents, persistData, toast]);

    // Skill Decay & Tower/Dungeon Lives & HP Reset Logic
    useEffect(() => {
        if (!state.isDataLoaded || !state.profile) return;

        const checkSystems = () => {
            let profileChanged = false;
            let updatedProfile = JSON.parse(JSON.stringify(state.profile!));
            const now = new Date();
            const activeEvent = state.worldEvents.find(e => e.isActive && new Date(e.endDate) > new Date());
            const corruptionAccelerationEffect = activeEvent?.effects.find(e => e.type === 'CORRUPTION_ACCELERATION');
            const decayDays = corruptionAccelerationEffect ? Math.floor(14 / corruptionAccelerationEffect.value) : 14;
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

            // Tower daily challenge reset
            if (updatedProfile.tower_progress) {
                const lastRegenTower = new Date(updatedProfile.tower_progress.lastLifeRegeneration || '2000-01-01');
                if (!isToday(lastRegenTower)) {
                    if (updatedProfile.tower_progress.tower_lockout_until && new Date(updatedProfile.tower_progress.tower_lockout_until) < now) {
                        updatedProfile.tower_progress.tower_lockout_until = null;
                    }
                    profileChanged = true;
                }
            }

            // HP Regen Logic
            const lastHPRegen = updatedProfile.last_hp_regen_date ? new Date(updatedProfile.last_hp_regen_date) : new Date(0);
            if (!isToday(lastHPRegen)) {
                const maxHP = Math.floor((updatedProfile.estatisticas.constituicao || 5) / 5) * 100;
                if (updatedProfile.hp_atual < maxHP) {
                    updatedProfile.hp_atual = maxHP;
                    toast({ title: 'Vida Restaurada!', description: 'A sua vida foi totalmente restaurada após um bom descanso.' });
                }
                updatedProfile.last_hp_regen_date = now.toISOString();
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
    }, [state.isDataLoaded, state.profile, state.skills, state.worldEvents, dispatch, toast, handleShowSkillDecayNotification, handleShowSkillAtRiskNotification]);

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
                let profileData = convertTimestamps(userDoc.data()) as Profile;
                let profileNeedsUpdate = false;
                
                const metasData = metasSnapshot.docs.map(d => convertTimestamps(d.data()));
                const missionsData = missionsSnapshot.docs.map(d => convertTimestamps(d.data()));
                const skillsData = skillsSnapshot.docs.map(d => convertTimestamps(d.data()));
                const routineData = routineDoc.exists() ? convertTimestamps(routineDoc.data()) : {};
                const routineTemplatesData = routineTemplatesDoc.exists() ? convertTimestamps(routineTemplatesDoc.data()) : {};
                const allUsersData = allUsersSnapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
                const guildsData = guildsSnapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
                const worldEventsData = worldEventsSnapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));

                if (!profileData.tower_progress) {
                    profileData.tower_progress = { currentFloor: 1, highestFloor: 1, dailyChallengesAvailable: 1, tower_tickets: 1, tower_lockout_until: null, completed_challenges_floor: [] };
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
                 if (!profileData.dungeon_crystals) {
                    profileData.dungeon_crystals = 0;
                    profileNeedsUpdate = true;
                 }
                 if (!profileData.last_hp_regen_date) {
                    profileData.last_hp_regen_date = new Date().toISOString();
                    profileNeedsUpdate = true;
                }
                if (profileData.hp_atual === undefined) {
                    const maxHP = Math.floor((profileData.estatisticas.constituicao || 5) / 5) * 100;
                    profileData.hp_atual = maxHP;
                    profileNeedsUpdate = true;
                }

                if (profileNeedsUpdate) {
                    await persistData('profile', profileData);
                }

                dispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        profile: profileData,
                        metas: metasData,
                        missions: missionsData,
                        skills: skillsData,
                        routine: routineData,
                        routineTemplates: routineTemplatesData,
                        allUsers: allUsersData,
                        guilds: guildsData,
                        worldEvents: worldEventsData,
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
                _isOfflineMode: true,
                hp_atual: 100,
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
        setCurrentPage: (page: string) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
        persistData,
        completeMission,
        adjustDailyMission,
        completeDungeonChallenge,
        handleFullReset,
        handleImportData,
        triggerDungeonEvent,
        acceptDungeonEvent,
        declineDungeonEvent,
        addDungeonCrystal,
        spendDungeonCrystal,
        generateDungeonChallenge,
        clearDungeonSession,
        activateTestWorldEvent,
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


    
    

    






      

    