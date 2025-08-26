"use client";

import { useState, useEffect } from 'react';
import { getFCMToken, requestNotificationPermission, onForegroundMessage, saveFCMTokenToProfile } from '@/lib/notifications';

// Define types for our notifications
interface QuestNotification {
  title: string;
  description: string;
  goals: { name: string; progress: string }[];
  caution: string;
}

interface SystemAlert {
  message: string;
  position: { top: string; left: string };
}

interface UserProfile {
  user_settings?: {
    notifications?: {
      quiet_hours?: {
        enabled?: boolean;
        start?: string;
        end?: string;
      };
      [key: string]: any;
    };
  };
  [key: string]: any;
}

interface User {
  uid: string;
  [key: string]: any;
}

interface UsePlayerNotificationsProps {
  profile: UserProfile | null;
  user: User | null;
}

export function usePlayerNotifications({ profile, user }: UsePlayerNotificationsProps) {
    const [questNotification, setQuestNotification] = useState<QuestNotification | null>(null);
    const [systemAlert, setSystemAlert] = useState<SystemAlert | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [pushNotificationSupported, setPushNotificationSupported] = useState(false);
    const [pushNotificationEnabled, setPushNotificationEnabled] = useState(false);

    // Check if push notifications are supported
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setPushNotificationSupported(true);
        }
    }, []);

    // Initialize push notifications
    useEffect(() => {
        if (!pushNotificationSupported || !user) return;

        const initializePushNotifications = async () => {
            // Check if user has already enabled push notifications
            const pushEnabled = localStorage.getItem('pushNotificationsEnabled') === 'true';
            setPushNotificationEnabled(pushEnabled);
            
            if (pushEnabled) {
                await setupPushNotifications();
            }
        };

        initializePushNotifications();
    }, [pushNotificationSupported, user]);

    // Setup push notifications
    const setupPushNotifications = async () => {
        try {
            const permissionGranted = await requestNotificationPermission();
            if (permissionGranted) {
                const token = await getFCMToken();
                if (token && user?.uid) {
                    await saveFCMTokenToProfile(user.uid, token);
                    localStorage.setItem('pushNotificationsEnabled', 'true');
                    setPushNotificationEnabled(true);
                }
            }
        } catch (error) {
            console.error('Error setting up push notifications:', error);
        }
    };

    // Enable push notifications
    const enablePushNotifications = async () => {
        if (!pushNotificationSupported) return false;
        
        try {
            await setupPushNotifications();
            return true;
        } catch (error) {
            console.error('Error enabling push notifications:', error);
            return false;
        }
    };

    // Disable push notifications
    const disablePushNotifications = async () => {
        try {
            // In a real implementation, you would also remove the token from the user's profile
            localStorage.setItem('pushNotificationsEnabled', 'false');
            setPushNotificationEnabled(false);
            return true;
        } catch (error) {
            console.error('Error disabling push notifications:', error);
            return false;
        }
    };

    // Listen for foreground messages
    useEffect(() => {
        if (!pushNotificationSupported) return;

        const unsubscribe = onForegroundMessage((payload) => {
            // Handle foreground notifications
            console.log('Foreground notification received:', payload);
            // You can show a toast or update UI here
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [pushNotificationSupported]);

    const isWithinQuietHours = () => {
        if (!profile?.user_settings?.notifications?.quiet_hours?.enabled) {
            return false;
        }

        const quietHours = profile.user_settings.notifications.quiet_hours;
        if (!quietHours?.start || !quietHours?.end) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMinute] = quietHours.start.split(':').map(Number);
        const startTime = startHour * 60 + startMinute;

        const [endHour, endMinute] = quietHours.end.split(':').map(Number);
        const endTime = endHour * 60 + endMinute;

        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime < endTime;
        }
        
        // Handle same-day quiet hours (e.g., 13:00 to 15:00)
        return currentTime >= startTime && currentTime < endTime;
    };


    const checkNotificationPreference = (type: string) => {
        if (isWithinQuietHours()) return false;

        if (!profile || !profile.user_settings || !profile.user_settings.notifications) {
            return true; // Default to on if settings don't exist
        }
        return profile.user_settings.notifications[type] !== false;
    };

    const handleShowLevelUpNotification = (newLevel: number, newTitle: string, newRank: string) => {
        if (!checkNotificationPreference('level_up')) return;
        setQuestNotification({
            title: 'NÍVEL AUMENTADO!',
            description: 'Você alcançou um novo patamar de poder.',
            goals: [
                { name: '- NOVO NÍVEL', progress: `[${newLevel}]` },
                { name: '- NOVO TÍTULO', progress: `[${newTitle}]` },
                { name: '- NOVO RANK', progress: `[${newRank}]` },
            ],
            caution: 'Continue a sua jornada para desbloquear todo o seu potencial.'
        });
        
        // Send push notification if enabled
        if (pushNotificationEnabled) {
            sendPushNotification({
                title: 'NÍVEL AUMENTADO!',
                body: `Parabéns! Você alcançou o nível ${newLevel}.`,
                data: { type: 'level_up', newLevel, newTitle, newRank }
            });
        }
    };

    const handleShowNewEpicMissionNotification = (newEpicMissionName: string, newEpicMissionDescription: string) => {
        setQuestNotification({
            title: 'NOVA MISSÃO ÉPICA',
            description: 'Um novo desafio épico o aguarda.',
            goals: [
                { name: '- NOME', progress: `[${newEpicMissionName}]` },
                { name: '- OBJETIVO', progress: `[${newEpicMissionDescription}]` },
            ],
            caution: 'Prepare-se para o que vem a seguir.'
        });
        
        // Send push notification if enabled
        if (pushNotificationEnabled) {
            sendPushNotification({
                title: 'NOVA MISSÃO ÉPICA',
                body: `Desafie-se com: ${newEpicMissionName}`,
                data: { type: 'new_epic_mission', missionName: newEpicMissionName }
            });
        }
    };

    const handleShowSkillUpNotification = (skillName: string, newLevel: number, statBonuses: string[]) => {
        const goals = [
            { name: `- HABILIDADE`, progress: `[${skillName}]` },
            { name: `- NOVO NÍVEL`, progress: `[${newLevel}]` },
        ];
        if (statBonuses && statBonuses.length > 0) {
            goals.push({ name: '- BÓNUS DE ATRIBUTO', progress: `[${statBonuses.join(', ')}]` });
        }
        setQuestNotification({
            title: 'HABILIDADE AUMENTADA!',
            description: 'A sua dedicação foi recompensada.',
            goals,
            caution: 'A maestria é uma jornada sem fim.'
        });
        
        // Send push notification if enabled
        if (pushNotificationEnabled) {
            sendPushNotification({
                title: 'HABILIDADE AUMENTADA!',
                body: `Sua habilidade ${skillName} agora é nível ${newLevel}.`,
                data: { type: 'skill_up', skillName, newLevel }
            });
        }
    };

    const handleShowSkillDecayNotification = (decayedSkillsInfo: { name: string; xpLost: number }[]) => {
        setQuestNotification({
            title: 'CORRUPÇÃO DETETADA',
            description: 'Inatividade prolongada corrompeu o seu progresso.',
            goals: decayedSkillsInfo.map(info => ({ name: `- HABILIDADE`, progress: `[${info.name}] (-${info.xpLost} XP)` })),
            caution: 'A prática constante é a chave para a maestria.'
        });
        
        // Send push notification if enabled
        if (pushNotificationEnabled && decayedSkillsInfo.length > 0) {
            sendPushNotification({
                title: 'CORRUPÇÃO DETETADA',
                body: `Suas habilidades estão em risco. Pratique-as para evitar perda de XP.`,
                data: { type: 'skill_decay', skills: decayedSkillsInfo.map(s => s.name) }
            });
        }
    };

    const handleShowSkillAtRiskNotification = (atRiskSkills: { name: string; daysInactive: number }[]) => {
        setQuestNotification({
            title: 'ALERTA DO SISTEMA',
            description: 'As seguintes habilidades estão em risco de corrupção.',
            goals: atRiskSkills.map(info => ({ name: `- HABILIDADE`, progress: `[${info.name}] (${info.daysInactive} dias inativa)` })),
            caution: 'Pratique estas habilidades para evitar a perda de progresso.'
        });
        
        // Send push notification if enabled
        if (pushNotificationEnabled && atRiskSkills.length > 0) {
            sendPushNotification({
                title: 'ALERTA DO SISTEMA',
                body: `Habilidades em risco de corrupção. Pratique-as agora!`,
                data: { type: 'skill_at_risk', skills: atRiskSkills.map(s => s.name) }
            });
        }
    };

    const handleShowDailyBriefingNotification = (briefingMissions: { epicMissionName: string; nome: string }[]) => {
        if (!checkNotificationPreference('daily_briefing')) return;
        if (!briefingMissions || briefingMissions.length === 0) return;
        const goals = briefingMissions.map(mission => ({
            name: `- [${mission.epicMissionName}]`,
            progress: mission.nome
        }));
        setQuestNotification({
            title: 'BRIEFING DIÁRIO',
            description: 'Os seus objetivos para hoje foram identificados.',
            goals,
            caution: 'O sucesso é a soma de pequenos esforços.'
        });
        
        // Send push notification if enabled
        if (pushNotificationEnabled) {
            sendPushNotification({
                title: 'BRIEFING DIÁRIO',
                body: `Você tem ${briefingMissions.length} missões para hoje.`,
                data: { type: 'daily_briefing', missionCount: briefingMissions.length }
            });
        }
    };

    const handleShowGoalCompletedNotification = (goalName: string) => {
        if (!checkNotificationPreference('goal_completed')) return;
        setQuestNotification({
            title: 'META CONCLUÍDA!',
            description: 'Parabéns, Caçador! Você completou um dos seus maiores objetivos.',
            goals: [{ name: '- CONQUISTA', progress: `[${goalName}]` }],
            caution: 'Um novo horizonte de desafios aguarda.'
        });
        
        // Send push notification if enabled
        if (pushNotificationEnabled) {
            sendPushNotification({
                title: 'META CONCLUÍDA!',
                body: `Parabéns por completar: ${goalName}`,
                data: { type: 'goal_completed', goalName }
            });
        }
    };

    const handleShowAchievementUnlockedNotification = (achievementName: string) => {
        setQuestNotification({
            title: 'CONQUISTA DESBLOQUEADA!',
            description: 'O seu esforço foi reconhecido pelo Sistema.',
            goals: [{ name: '- CONQUISTA', progress: `[${achievementName}]` }],
            caution: 'Continue a sua jornada para desbloquear todos os segredos.'
        });
        
        // Send push notification if enabled
        if (pushNotificationEnabled) {
            sendPushNotification({
                title: 'CONQUISTA DESBLOQUEADA!',
                body: `Você desbloqueou: ${achievementName}`,
                data: { type: 'achievement_unlocked', achievementName }
            });
        }
    };

    const handleShowStreakBonusNotification = (streak: number, xp: number, fragments: number) => {
        setQuestNotification({
            title: `SEQUÊNCIA DE ${streak} DIAS!`,
            description: 'A sua consistência foi recompensada com um bónus!',
            goals: [
                { name: '- BÓNUS DE XP', progress: `+${xp}` },
                { name: '- BÓNUS DE FRAGMENTOS', progress: `+${fragments}` }
            ],
            caution: 'Continue assim para ganhar recompensas ainda maiores.'
        });
        
        // Send push notification if enabled
        if (pushNotificationEnabled) {
            sendPushNotification({
                title: `SEQUÊNCIA DE ${streak} DIAS!`,
                body: `Parabéns pela sequência! Você ganhou ${xp} XP e ${fragments} fragmentos.`,
                data: { type: 'streak_bonus', streak, xp, fragments }
            });
        }
    };

    // Function to send push notifications
    const sendPushNotification = async (notificationData: {
        title: string;
        body: string;
        data?: any;
    }) => {
        try {
            // In a real implementation, you would send this to your backend
            // which would then use the FCM tokens to send the actual push notification
            console.log('Would send push notification:', notificationData);
            
            // Example API call to your backend:
            /*
            await fetch('/api/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.uid,
                    ...notificationData
                }),
            });
            */
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    };


    return {
        questNotification, setQuestNotification,
        systemAlert, setSystemAlert,
        showOnboarding, setShowOnboarding,
        handleShowLevelUpNotification,
        handleShowNewEpicMissionNotification,
        handleShowSkillUpNotification,
        handleShowSkillDecayNotification,
        handleShowSkillAtRiskNotification,
        handleShowDailyBriefingNotification,
        handleShowGoalCompletedNotification,
        handleShowAchievementUnlockedNotification,
        handleShowStreakBonusNotification,
        // Push notification functions
        pushNotificationSupported,
        pushNotificationEnabled,
        enablePushNotifications,
        disablePushNotifications
    };
}