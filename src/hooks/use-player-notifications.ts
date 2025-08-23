
"use client";

import { useState } from 'react';

export function usePlayerNotifications() {
    const [questNotification, setQuestNotification] = useState(null);
    const [systemAlert, setSystemAlert] = useState<{ message: string; position: { top: string; left: string; } } | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const handleShowLevelUpNotification = (newLevel, newTitle, newRank) => {
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
    };

    const handleShowNewEpicMissionNotification = (newEpicMissionName, newEpicMissionDescription) => {
        setQuestNotification({
            title: 'NOVA MISSÃO ÉPICA',
            description: 'Um novo desafio épico o aguarda.',
            goals: [
                { name: '- NOME', progress: `[${newEpicMissionName}]` },
                { name: '- OBJETIVO', progress: `[${newEpicMissionDescription}]` },
            ],
            caution: 'Prepare-se para o que vem a seguir.'
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
            description: 'A sua dedicação foi recompensada.',
            goals,
            caution: 'A maestria é uma jornada sem fim.'
        });
    };

    const handleShowSkillDecayNotification = (decayedSkillsInfo) => {
        setQuestNotification({
            title: 'CORRUPÇÃO DETETADA',
            description: 'Inatividade prolongada corrompeu o seu progresso.',
            goals: decayedSkillsInfo.map(info => ({ name: `- HABILIDADE`, progress: `[${info.name}] (-${info.xpLost} XP)` })),
            caution: 'A prática constante é a chave para a maestria.'
        });
    };

    const handleShowSkillAtRiskNotification = (atRiskSkills) => {
        setQuestNotification({
            title: 'ALERTA DO SISTEMA',
            description: 'As seguintes habilidades estão em risco de corrupção.',
            goals: atRiskSkills.map(info => ({ name: `- HABILIDADE`, progress: `[${info.name}] (${info.daysInactive} dias inativa)` })),
            caution: 'Pratique estas habilidades para evitar a perda de progresso.'
        });
    };

    const handleShowDailyBriefingNotification = (briefingMissions) => {
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
    };

    const handleShowGoalCompletedNotification = (goalName) => {
        setQuestNotification({
            title: 'META CONCLUÍDA!',
            description: 'Parabéns, Caçador! Você completou um dos seus maiores objetivos.',
            goals: [{ name: '- CONQUISTA', progress: `[${goalName}]` }],
            caution: 'Um novo horizonte de desafios aguarda.'
        });
    };

    const handleShowAchievementUnlockedNotification = (achievementName) => {
        setQuestNotification({
            title: 'CONQUISTA DESBLOQUEADA!',
            description: 'O seu esforço foi reconhecido pelo Sistema.',
            goals: [{ name: '- CONQUISTA', progress: `[${achievementName}]` }],
            caution: 'Continue a sua jornada para desbloquear todos os segredos.'
        });
    };

    const handleShowStreakBonusNotification = (streak, xp, fragments) => {
        setQuestNotification({
            title: `SEQUÊNCIA DE ${streak} DIAS!`,
            description: 'A sua consistência foi recompensada com um bónus!',
            goals: [
                { name: '- BÓNUS DE XP', progress: `+${xp}` },
                { name: '- BÓNUS DE FRAGMENTOS', progress: `+${fragments}` }
            ],
            caution: 'Continue assim para ganhar recompensas ainda maiores.'
        });
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
    };
}
