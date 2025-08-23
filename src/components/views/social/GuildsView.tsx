
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { GuildForm } from '@/components/guilds/GuildForm';
import { SearchGuildView } from '@/components/guilds/SearchGuildView';
import { NoGuildView } from '@/components/guilds/NoGuildView';
import { GuildDashboard } from '@/components/guilds/GuildDashboard';


export const GuildsView = ({ profile, setProfile, guilds, setGuilds, metas, allUsers, setAllUsers }) => {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'search', 'create', 'edit'
    const [isLoading, setIsLoading] = useState(true);
    const [currentGuild, setCurrentGuild] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        if (profile && guilds) {
            if (profile.guild_id) {
                const foundGuild = guilds.find(g => g.id === profile.guild_id);
                setCurrentGuild(foundGuild);
                setView('dashboard');
            } else {
                setView('no-guild');
            }
        }
        setIsLoading(false);
    }, [profile, guilds]);

    const handleGuildCreated = (newGuildData) => {
        const newGuildWithId = { ...newGuildData, id: `guild_${Date.now()}`, membros: [{user_id: profile.id, role: 'Líder'}] };
        const updatedGuilds = [...guilds, newGuildWithId];
        setGuilds(updatedGuilds);
        
        const updatedProfile = { ...profile, guild_id: newGuildWithId.id, guild_role: 'Líder' };
        setProfile(updatedProfile);

        toast({ title: "Guilda Forjada!", description: `A guilda "${newGuildData.nome}" foi criada com sucesso.` });
        setView('dashboard');
    };
    
    const handleJoinRequestSent = (guildId) => {
        const updatedGuilds = guilds.map(g => {
            if (g.id === guildId) {
                const newRequest = { user_id: profile.id, nome_utilizador: profile.nome_utilizador, status: 'Pendente'};
                return { ...g, join_requests: [...(g.join_requests || []), newRequest] };
            }
            return g;
        });
        setGuilds(updatedGuilds);
        toast({ title: "Pedido Enviado!", description: "O seu pedido para se juntar à guilda foi enviado para o líder." });
    };
    
    const handleLeaveGuild = () => {
        const updatedProfile = {...profile, guild_id: null, guild_role: null};
        
        // Remove member from guild object
        const guildToLeave = guilds.find(g => g.id === profile.guild_id);
        if (guildToLeave) {
            const updatedMembers = guildToLeave.membros.filter(m => m.user_id !== profile.id);
            const updatedGuild = { ...guildToLeave, membros: updatedMembers };
            // If the leader leaves, the guild should be handled (e.g., disbanded or leadership transferred). For now, we'll just update members.
            const updatedGuilds = guilds.map(g => g.id === updatedGuild.id ? updatedGuild : g);
            setGuilds(updatedGuilds);
        }

        setProfile(updatedProfile);
        setCurrentGuild(null);
        setView('no-guild');
        toast({ title: "Você saiu da guilda."});
    };

     const handleGuildUpdate = (updatedGuildData) => {
        const updatedGuilds = guilds.map(g => g.id === updatedGuildData.id ? updatedGuildData : g);
        setGuilds(updatedGuilds);
        setCurrentGuild(updatedGuildData);
        toast({ title: "Guilda Atualizada!", description: `Os dados da guilda "${updatedGuildData.nome}" foram salvos.` });
        setView('dashboard');
    };

    if (isLoading || !profile) {
        return <div className="p-6 flex justify-center items-center h-full"><LoaderCircle className="animate-spin h-8 w-8" /></div>;
    }

    const renderContent = () => {
        if (view === 'dashboard' && currentGuild) {
            return <GuildDashboard 
                        guild={currentGuild}
                        profile={profile}
                        members={allUsers.filter(u => u.guild_id === currentGuild.id)} 
                        onGuildUpdate={handleGuildUpdate}
                        onLeaveGuild={handleLeaveGuild}
                        onEdit={() => setView('edit')}
                        allUsers={allUsers}
                        setAllUsers={setAllUsers}
                    />;
        }
        if (view === 'create') {
            return <GuildForm 
                        onSave={handleGuildCreated} 
                        userMetas={metas} 
                        onCancel={() => setView('no-guild')} 
                    />;
        }
        if (view === 'edit' && currentGuild) {
             return <GuildForm 
                        guildToEdit={currentGuild}
                        onSave={handleGuildUpdate} 
                        userMetas={metas} 
                        onCancel={() => setView('dashboard')} 
                    />;
        }
        if (view === 'search') {
            return <SearchGuildView 
                        guilds={guilds.filter(g => g.id !== profile.guild_id)}
                        profile={profile}
                        onJoinRequest={handleJoinRequestSent}
                        onBack={() => setView('no-guild')}
                    />;
        }
        return <NoGuildView onCreate={() => setView('create')} onSearch={() => setView('search')} />;
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="animate-in fade-in-50 duration-500 h-full">
              {renderContent()}
            </div>
        </div>
    );
};
