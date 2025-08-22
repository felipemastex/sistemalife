
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, ShieldCheck, Sword, PlusCircle, LoaderCircle } from 'lucide-react';
import * as mockData from '@/lib/data'; // Usaremos para os ícones
import { GuildForm } from './GuildForm';
import { SearchGuildView } from './SearchGuildView';
import { NoGuildView } from './NoGuildView';

// Este é um componente mockado que será implementado posteriormente
const GuildDashboard = ({ guild, profile, members, setGuilds, allGuilds, setProfile }) => (
    <div>
        <h2 className="text-2xl font-bold">{guild.nome} [{guild.tag}]</h2>
        <p>{guild.descricao}</p>
        <p>{members.length} membros</p>
    </div>
);


export const GuildsView = ({ profile, setProfile, guilds, setGuilds, metas, allUsers }) => {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'search', 'create'
    const [isLoading, setIsLoading] = useState(true);
    const [currentGuild, setCurrentGuild] = useState(null);
    const [guildMembers, setGuildMembers] = useState([]);
    const { toast } = useToast();

    useEffect(() => {
        if (profile) {
            if (profile.guild_id) {
                const foundGuild = guilds.find(g => g.id === profile.guild_id);
                setCurrentGuild(foundGuild);
                if(foundGuild){
                    const members = allUsers.filter(u => u.guild_id === foundGuild.id);
                    setGuildMembers(members);
                }
                setView('dashboard');
            } else {
                setView('no-guild');
            }
        }
        setIsLoading(false);
    }, [profile, guilds, allUsers]);

    const handleGuildCreated = (newGuild) => {
        const newGuildWithId = { ...newGuild, id: `guild_${Date.now()}` };
        const updatedGuilds = [...guilds, newGuildWithId];
        setGuilds(updatedGuilds);
        
        const updatedProfile = { ...profile, guild_id: newGuildWithId.id, guild_role: 'Líder' };
        setProfile(updatedProfile);

        toast({ title: "Guilda Forjada!", description: `A guilda "${newGuild.nome}" foi criada com sucesso.` });
        setView('dashboard');
    };
    
    const handleJoinRequestSent = (guildId) => {
        // Lógica para enviar um pedido para se juntar a uma guilda
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
        setProfile(updatedProfile);
        setCurrentGuild(null);
        setGuildMembers([]);
        setView('no-guild');
        toast({ title: "Você saiu da guilda."});
    }

    if (isLoading) {
        return <div className="p-6 flex justify-center items-center"><LoaderCircle className="animate-spin h-8 w-8" /></div>;
    }

    const renderContent = () => {
        if (view === 'dashboard' && currentGuild) {
            return <GuildDashboard 
                        guild={currentGuild}
                        profile={profile}
                        members={guildMembers} 
                        setGuilds={setGuilds}
                        allGuilds={guilds}
                        setProfile={setProfile}
                    />;
        }
        if (view === 'create') {
            return <GuildForm 
                        onSave={handleGuildCreated} 
                        userMetas={metas} 
                        onCancel={() => setView('no-guild')} 
                    />;
        }
        if (view === 'search') {
            return <SearchGuildView 
                        guilds={guilds}
                        profile={profile}
                        onJoinRequest={handleJoinRequestSent}
                        onBack={() => setView('no-guild')}
                    />;
        }
        return <NoGuildView onCreate={() => setView('create')} onSearch={() => setView('search')} />;
    };

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-cyan-400 font-cinzel tracking-wider">Guildas</h1>
                {currentGuild && <Button variant="destructive" onClick={handleLeaveGuild}>Sair da Guilda</Button>}
            </div>
            <div className="animate-in fade-in-50 duration-500">
              {renderContent()}
            </div>
        </div>
    );
};
