
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const SettingsView = ({ profile, setProfile }) => {
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (profile) {
            setUsername(profile.nome_utilizador || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile]);

    const handleSave = async (e) => {
        e.preventDefault();
        const trimmedUsername = username.trim();
        const trimmedAvatarUrl = avatarUrl.trim();

        if (!trimmedUsername) {
            toast({ variant: 'destructive', title: "Nome de Utilizador Inválido", description: "O nome de utilizador não pode estar em branco." });
            return;
        }

        if (trimmedUsername === profile.nome_utilizador && trimmedAvatarUrl === profile.avatar_url) {
            return;
        }

        setIsSaving(true);
        try {
            const updatedProfile = { ...profile, nome_utilizador: trimmedUsername, avatar_url: trimmedAvatarUrl };
            await setProfile(updatedProfile);
            toast({
                title: "Perfil Atualizado!",
                description: "Os seus dados foram alterados com sucesso.",
            });
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível atualizar o seu perfil. Tente novamente.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!profile) {
        return <div className="p-6">A carregar configurações...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">Configurações do Perfil</h1>
            
            <Card className="max-w-2xl bg-gray-800/50 border-gray-700 text-gray-200">
                <CardHeader>
                    <CardTitle>As suas Informações</CardTitle>
                    <CardDescription>Atualize os seus dados de perfil aqui.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={avatarUrl} alt={username} />
                                <AvatarFallback>{username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 w-full">
                                <Label htmlFor="avatar_url">URL do Avatar</Label>
                                <Input
                                    id="avatar_url"
                                    type="url"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://exemplo.com/imagem.png"
                                    className="bg-gray-700 border-gray-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Nome de Utilizador</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="O seu nome no sistema"
                                className="bg-gray-700 border-gray-600"
                            />
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                disabled
                                className="bg-gray-700/50 border-gray-600 cursor-not-allowed"
                            />
                             <p className="text-xs text-gray-500">O seu email de login não pode ser alterado.</p>
                        </div>
                        
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving || (username === profile.nome_utilizador && avatarUrl === profile.avatar_url)}>
                                {isSaving ? "A salvar..." : "Salvar Alterações"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
