
"use client";

import { useState } from 'react';
import { GuildHeader } from './GuildHeader';
import { GuildMembers } from './GuildMembers';
import { GuildChat } from './GuildChat';
import { JoinRequests } from './JoinRequests';
<<<<<<< HEAD
import { GuildQuests } from './GuildQuests';
import { GuildAnnouncements } from './GuildAnnouncements';
import { Card } from '../ui/card';
=======
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit } from 'lucide-react';
import { GuildQuests } from './GuildQuests';


const GuildAnnouncements = () => (
     <Card>
        <CardHeader>
            <CardTitle>Anúncios</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Nenhum anúncio recente.</p>
        </CardContent>
    </Card>
)
>>>>>>> 92c1f4c (Missões de Guilda (Quests) - A Maior Peça em Falta: implemente esse)


export const GuildDashboard = ({ guild, profile, members, onGuildUpdate, onLeaveGuild, onEdit, allUsers, setAllUsers }) => {
    
    const userRole = profile?.guild_role || 'Recruta';
    const isLeader = userRole === 'Líder';
    const isOfficer = userRole === 'Oficial';
    const canManage = isLeader || isOfficer;

    const [guildData, setGuildData] = useState(guild);

    const handleAcceptRequest = (requestingUser) => {
        const updatedGuild = {
            ...guildData,
            membros: [...(guildData.membros || []), { user_id: requestingUser.id, role: 'Recruta' }],
            join_requests: (guildData.join_requests || []).filter(req => req.user_id !== requestingUser.id)
        };

        const updatedUser = {...requestingUser, guild_id: guildData.id, guild_role: 'Recruta'};
        const updatedAllUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        
        setAllUsers(updatedAllUsers);
        onGuildUpdate(updatedGuild);
    };

    const handleDeclineRequest = (userId) => {
         const updatedGuild = {
            ...guildData,
            join_requests: (guildData.join_requests || []).filter(req => req.user_id !== userId)
        };
        onGuildUpdate(updatedGuild);
    };

    const handleMemberUpdate = (updatedMembersMeta, updatedUsers) => {
        const updatedGuild = {...guildData, membros: updatedMembersMeta };
        onGuildUpdate(updatedGuild);
        setAllUsers(updatedUsers);
    }
    
    const handleQuestsUpdate = (updatedQuests) => {
        const updatedGuild = { ...guildData, quests: updatedQuests };
        setGuildData(updatedGuild); // Update local state for immediate UI feedback
        onGuildUpdate(updatedGuild);
    };
<<<<<<< HEAD

     const handleAnnouncementsUpdate = (updatedAnnouncements) => {
        const updatedGuild = { ...guildData, announcements: updatedAnnouncements };
        setGuildData(updatedGuild);
        onGuildUpdate(updatedGuild);
    };
=======
>>>>>>> 92c1f4c (Missões de Guilda (Quests) - A Maior Peça em Falta: implemente esse)
    
    return (
        <div className="h-full flex flex-col">
            <GuildHeader guild={guildData} onEdit={onEdit} onLeave={onLeaveGuild} isLeader={isLeader} />
            
<<<<<<< HEAD
            <div className="flex-grow mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                
                {/* Coluna Esquerda - Conteúdo Principal */}
                <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                    <GuildQuests 
                        quests={guildData.quests}
                        onQuestsUpdate={handleQuestsUpdate}
                        canManage={canManage}
                        guildData={guildData}
                        userProfile={profile}
                    />
                    <Card className="flex-grow flex flex-col min-h-[400px]">
                       <GuildChat guildId={guildData.id} userProfile={profile} />
                    </Card>
                </div>
=======
            <div className="flex-grow mt-6 overflow-hidden">
                <Tabs defaultValue="geral" className="h-full flex flex-col md:flex-row gap-6">
                    
                    {/* Coluna Esquerda (Principal) */}
                    <div className="flex-grow h-full">
                        <TabsContent value="geral" className="h-full mt-0">
                            <GuildQuests 
                                quests={guildData.quests}
                                onQuestsUpdate={handleQuestsUpdate}
                                canManage={canManage}
                                guildData={guildData}
                            />
                        </TabsContent>
                        <TabsContent value="membros" className="h-full mt-0">
                             <GuildMembers 
                                members={members}
                                guildMembersMeta={guildData.membros}
                                onMemberUpdate={handleMemberUpdate} 
                                currentUserProfile={profile} 
                            />
                        </TabsContent>
                        <TabsContent value="config" className="h-full mt-0">
                            <p>Configurações da Guilda (Em breve)</p>
                        </TabsContent>
                    </div>
>>>>>>> 92c1f4c (Missões de Guilda (Quests) - A Maior Peça em Falta: implemente esse)

                {/* Coluna Direita - Painéis Laterais */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                    {canManage && (
                        <JoinRequests
                            requests={guildData.join_requests || []}
                            allUsers={allUsers}
                            onAccept={handleAcceptRequest}
                            onDecline={handleDeclineRequest}
                        />
                    )}
                    <GuildMembers 
                        members={members}
                        guildMembersMeta={guildData.membros}
                        onMemberUpdate={handleMemberUpdate} 
                        currentUserProfile={profile}
                        allUsers={allUsers}
                    />
                     <GuildAnnouncements 
                        announcements={guildData.announcements || []}
                        onUpdate={handleAnnouncementsUpdate}
                        canManage={canManage}
                        userProfile={profile}
                     />
                </div>
            </div>
        </div>
    );
};
