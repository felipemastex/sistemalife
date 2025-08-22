
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuildHeader } from './GuildHeader';
import { GuildMembers } from './GuildMembers';
import { GuildChat } from './GuildChat';
import { JoinRequests } from './JoinRequests';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit } from 'lucide-react';


const GuildQuests = ({ quests }) => (
    <Card>
        <CardHeader>
            <CardTitle>Missões da Guilda</CardTitle>
        </CardHeader>
        <CardContent>
            {quests && quests.length > 0 ? (
                <p>{quests.length} missões ativas.</p>
            ) : (
                <p className="text-muted-foreground">Nenhuma missão de guilda ativa no momento.</p>
            )}
        </CardContent>
    </Card>
);

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

    const handleMemberUpdate = (updatedMembers) => {
        const updatedGuild = {...guildData, membros: updatedMembers };
        onGuildUpdate(updatedGuild);
    }
    
    return (
        <div className="h-full flex flex-col">
            <GuildHeader guild={guildData} onEdit={onEdit} onLeave={onLeaveGuild} isLeader={isLeader} />
            
            <div className="flex-grow mt-6 overflow-hidden">
                <Tabs defaultValue="geral" className="h-full flex flex-col md:flex-row gap-6">
                    
                    {/* Coluna Esquerda (Principal) */}
                    <div className="flex-grow h-full">
                        <TabsContent value="geral" className="h-full mt-0">
                            <GuildQuests quests={guildData.quests} />
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

                    {/* Coluna Direita (Lateral) */}
                    <div className="w-full md:w-96 md:flex-shrink-0 flex flex-col gap-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="geral">Geral</TabsTrigger>
                            <TabsTrigger value="membros">Membros</TabsTrigger>
                            <TabsTrigger value="config" disabled={!isLeader}>
                                <div className="flex items-center gap-1">
                                    <Edit className="h-3 w-3" /> Gestão
                                </div>
                            </TabsTrigger>
                        </TabsList>
                        
                         <div className="flex-grow flex flex-col gap-6 min-h-[500px]">
                            {canManage && (
                                <JoinRequests
                                    requests={guildData.join_requests || []}
                                    allUsers={allUsers}
                                    onAccept={handleAcceptRequest}
                                    onDecline={handleDeclineRequest}
                                />
                            )}
                            <GuildAnnouncements />

                            <div className="flex-grow flex flex-col bg-card border border-border rounded-lg min-h-[300px]">
                                <GuildChat guildId={guildData.id} userProfile={profile} />
                            </div>
                        </div>

                    </div>
                </Tabs>
            </div>
        </div>
    );
};
