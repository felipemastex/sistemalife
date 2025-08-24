
"use client";

import { useState } from 'react';
import { GuildHeader } from './GuildHeader';
import { GuildMembers } from './GuildMembers';
import { GuildChat } from './GuildChat';
import { JoinRequests } from './JoinRequests';
import { GuildQuests } from './GuildQuests';
import { GuildAnnouncements } from './GuildAnnouncements';
import { Card, CardContent } from '../ui/card';
import { GuildOverview } from './GuildOverview';
import { GuildStats } from './GuildStats';
import { MemberLeaderboard } from './MemberLeaderboard';
import { GuildNotifications } from './GuildNotifications';
import { GuildRewards } from './GuildRewards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, Users, MessageSquare, Shield } from 'lucide-react';


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

     const handleAnnouncementsUpdate = (updatedAnnouncements) => {
        const updatedGuild = { ...guildData, announcements: updatedAnnouncements };
        setGuildData(updatedGuild);
        onGuildUpdate(updatedGuild);
    };
    
    return (
        <div className="h-full flex flex-col">
            <GuildHeader guild={guildData} onEdit={onEdit} onLeave={onLeaveGuild} isLeader={isLeader} />
            
             <Tabs defaultValue="overview" className="mt-6 flex-grow">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4"/>Visão Geral</TabsTrigger>
                    <TabsTrigger value="members"><Users className="mr-2 h-4 w-4"/>Membros</TabsTrigger>
                    <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4"/>Chat</TabsTrigger>
                    {canManage && <TabsTrigger value="management"><Shield className="mr-2 h-4 w-4"/>Gestão</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GuildOverview 
                            guild={guildData}
                            announcements={guildData.announcements || []}
                            quests={guildData.quests || []}
                        />
                         <div className="flex flex-col gap-6">
                             <GuildQuests 
                                quests={guildData.quests}
                                onQuestsUpdate={handleQuestsUpdate}
                                canManage={canManage}
                                guildData={guildData}
                                userProfile={profile}
                            />
                            <GuildAnnouncements 
                                announcements={guildData.announcements || []}
                                onUpdate={handleAnnouncementsUpdate}
                                canManage={canManage}
                                userProfile={profile}
                            />
                             <GuildStats />
                         </div>
                    </div>
                </TabsContent>

                 <TabsContent value="members" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7">
                            <MemberLeaderboard />
                        </div>
                        <div className="lg:col-span-5">
                             <GuildMembers 
                                members={members}
                                guildMembersMeta={guildData.membros}
                                onMemberUpdate={handleMemberUpdate} 
                                currentUserProfile={profile}
                                allUsers={allUsers}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-6 h-[calc(100vh-280px)]">
                     <Card className="h-full">
                       <GuildChat guildId={guildData.id} userProfile={profile} />
                    </Card>
                </TabsContent>

                 {canManage && (
                    <TabsContent value="management" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GuildRewards />
                            <GuildNotifications />
                            <JoinRequests
                                requests={guildData.join_requests || []}
                                allUsers={allUsers}
                                onAccept={handleAcceptRequest}
                                onDecline={handleDeclineRequest}
                            />
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};
