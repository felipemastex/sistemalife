

"use client";

import { useState, useEffect, useMemo, memo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { GuildForm } from '@/components/guilds/GuildForm';
import { SearchGuildView } from '@/components/guilds/SearchGuildView';
import { NoGuildView } from '@/components/guilds/NoGuildView';
import { GuildDashboard } from '@/components/guilds/GuildDashboard';
import { usePlayerDataContext } from '@/hooks/use-player-data.tsx';


const GuildsViewComponent = () => {
    const { profile, guilds, metas, allUsers, persistData, isDataLoaded } = usePlayerDataContext();
    const [view, setView] = useState('no-guild'); 
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    const currentGuild = useMemo(() => {
        if (profile?.guild_id && guilds) {
            return guilds.find(g => g.id === profile.guild_id) || null;
        }
        return null;
    }, [profile?.guild_id, guilds]);

    useEffect(() => {
        if (isDataLoaded) {
            setIsLoading(false);
            if (currentGuild) {
                setView('dashboard');
            } else {
                setView('no-guild');
            }
        }
    }, [isDataLoaded, currentGuild]);

    const handleGuildCreated = (newGuildData) => {
        const newGuildWithId = { ...newGuildData, id: `guild_${Date.now()}`, membros: [{user_id: profile.id, role: 'Líder'}] };
        const updatedGuilds = [...(guilds || []), newGuildWithId];
        persistData('guilds', updatedGuilds);
        
        const updatedProfile = { ...profile, guild_id: newGuildWithId.id, guild_role: 'Líder' };
        persistData('profile', updatedProfile);

        toast({ title: "Guilda Forjada!", description: `A guilda "${newGuildData.nome}" foi criada com sucesso.` });
    };
    
    const handleJoinRequestSent = (guildId) => {
        const updatedGuilds = (guilds || []).map(g => {
            if (g.id === guildId) {
                const newRequest = { user_id: profile.id, nome_utilizador: profile.nome_utilizador, status: 'Pendente'};
                return { ...g, join_requests: [...(g.join_requests || []), newRequest] };
            }
            return g;
        });
        persistData('guilds', updatedGuilds);
        toast({ title: "Pedido Enviado!", description: "O seu pedido para se juntar à guilda foi enviado para o líder." });
    };
    
    const handleLeaveGuild = () => {
        const updatedProfile = {...profile, guild_id: null, guild_role: null};
        
        const guildToLeave = (guilds || []).find(g => g.id === profile.guild_id);
        if (guildToLeave) {
            const updatedMembers = guildToLeave.membros.filter(m => m.user_id !== profile.id);
            
            if (updatedMembers.length === 0) {
                 const updatedGuilds = (guilds || []).filter(g => g.id !== profile.guild_id);
                 persistData('guilds', updatedGuilds);
                 toast({ title: "Guilda Desfeita", description: "Você era o último membro e a guilda foi desfeita." });
            } else {
                let updatedGuild = { ...guildToLeave, membros: updatedMembers };
                if (profile.guild_role === 'Líder') {
                    const roleHierarchy = ['Oficial', 'Veterano', 'Membro', 'Recruta'];
                    let newLeaderAssigned = false;
                    for (const role of roleHierarchy) {
                        const newLeaderMember = updatedMembers.find(m => m.role === role);
                        if (newLeaderMember) {
                            updatedGuild.membros = updatedMembers.map(m => m.user_id === newLeaderMember.user_id ? {...m, role: 'Líder'} : m);
                            const newLeaderProfile = allUsers.find(u => u.id === newLeaderMember.user_id);
                            if (newLeaderProfile) {
                                persistData('allUsers', allUsers.map(u => u.id === newLeaderMember.user_id ? {...u, guild_role: 'Líder'} : u));
                                toast({ title: "Liderança Transferida!", description: `${newLeaderProfile.nome_utilizador} é o novo líder da guilda.` });
                            }
                            newLeaderAssigned = true;
                            break;
                        }
                    }
                }
                const updatedGuilds = (guilds || []).map(g => g.id === updatedGuild.id ? updatedGuild : g);
                persistData('guilds', updatedGuilds);
            }
        }

        persistData('profile', updatedProfile);
        setView('no-guild');
        toast({ title: "Você saiu da guilda."});
    };

     const handleGuildUpdate = (updatedGuildData) => {
        const updatedGuilds = (guilds || []).map(g => g.id === updatedGuildData.id ? updatedGuildData : g);
        persistData('guilds', updatedGuilds);
        toast({ title: "Guilda Atualizada!", description: `Os dados da guilda "${updatedGuildData.nome}" foram salvos.` });
        setView('dashboard');
    };

    if (isLoading || !profile) {
        return <div className="p-6 flex justify-center items-center h-full"><LoaderCircle className="animate-spin h-8 w-8" /></div>;
    }

    const renderContent = () => {
        if (view === 'dashboard' && currentGuild) {
            const members = (allUsers || []).filter(u => u.guild_id === currentGuild.id);
            return <GuildDashboard 
                        guild={currentGuild}
                        profile={profile}
                        members={members} 
                        onGuildUpdate={handleGuildUpdate}
                        onLeaveGuild={handleLeaveGuild}
                        onEdit={() => setView('edit')}
                        allUsers={allUsers || []}
                        setAllUsers={(updatedUsers) => persistData('allUsers', updatedUsers)}
                    />;
        }
        if (view === 'create') {
            return <GuildForm 
                        onSave={handleGuildCreated} 
                        userMetas={metas || []} 
                        onCancel={() => setView('no-guild')} 
                    />;
        }
        if (view === 'edit' && currentGuild) {
             return <GuildForm 
                        guildToEdit={currentGuild}
                        onSave={handleGuildUpdate} 
                        userMetas={metas || []} 
                        onCancel={() => setView('dashboard')} 
                    />;
        }
        if (view === 'search') {
            return <SearchGuildView 
                        guilds={(guilds || []).filter(g => g.id !== profile.guild_id)}
                        profile={profile}
                        onJoinRequest={handleJoinRequestSent}
                        onBack={() => setView('no-guild')}
                    />;
        }
        return <NoGuildView onCreate={() => setView('create')} onSearch={() => setView('search')} />;
    };

    return (
        <div className="p-4 md:p-6 h-full">
            <div className="animate-in fade-in-50 duration-500">
              {renderContent()}
            </div>
        </div>
    );
};

export const GuildsView = memo(GuildsViewComponent);

