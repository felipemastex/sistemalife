
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, ArrowLeft, Send, Clock, Ban } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const SearchGuildView = ({ guilds, profile, onJoinRequest, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredGuilds = guilds.filter(g => 
        g &&
        (g.nome && g.nome.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (g.tag && g.tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getIconComponent = (iconName) => {
        const Icon = LucideIcons[iconName];
        return Icon ? <Icon className="h-8 w-8 text-white" /> : <Users className="h-8 w-8 text-white" />;
    };
    
    const hasPendingRequest = (guild) => {
        return guild.join_requests?.some(req => req.user_id === profile.id && req.status === 'Pendente');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Button onClick={onBack} variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Portal
            </Button>
            <h2 className="text-2xl font-bold text-primary mb-2">Encontrar uma Guilda</h2>
            <p className="text-muted-foreground mb-6">Procure por nome ou tag para encontrar o seu clã.</p>
            
            <div className="mb-6">
                <Input
                    type="text"
                    placeholder="Procurar guilda..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-secondary"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGuilds.map(guild => (
                    <Card key={guild.id} className="bg-card/80">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className={`h-16 w-16 rounded-md ${guild.emblema_bg}`}>
                                <div className="flex items-center justify-center h-full w-full">
                                    {getIconComponent(guild.emblema_icon)}
                                </div>
                                <AvatarFallback>{guild.tag}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-xl">{guild.nome} [{guild.tag}]</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Users className="h-4 w-4" /> 
                                    {guild.membros?.length || 0} Membros
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{guild.descricao}</p>
                        </CardContent>
                        <CardFooter>
                           {profile.guild_id === guild.id ? (
                                <Button variant="outline" disabled className="w-full">
                                    <Ban className="h-4 w-4 mr-2"/>
                                    Você já está nesta Guilda
                                </Button>
                           ) : hasPendingRequest(guild) ? (
                                <Button variant="outline" disabled className="w-full">
                                    <Clock className="h-4 w-4 mr-2"/>
                                    Pedido Pendente
                                </Button>
                            ) : (
                                <Button onClick={() => onJoinRequest(guild.id)} className="w-full">
                                    <Send className="h-4 w-4 mr-2"/>
                                    Pedir para Entrar
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

             {filteredGuilds.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">Nenhuma guilda encontrada.</p>
                    <p className="text-muted-foreground/70 text-sm">Tente um termo de pesquisa diferente.</p>
                </div>
            )}
        </div>
    );
};
