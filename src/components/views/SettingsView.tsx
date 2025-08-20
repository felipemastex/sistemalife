
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

export const SettingsView = ({ profile, setProfile, onReset }) => {
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
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
    
    const handleReset = async () => {
        setIsResetting(true);
        await onReset();
        // The component will unmount and remount with new data, so no need to set isResetting to false
    }

    if (!profile) {
        return <div className="p-6">A carregar configurações...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">Configurações</h1>
            
            <div className="max-w-2xl space-y-8">
                <Card className="bg-gray-800/50 border-gray-700 text-gray-200">
                    <CardHeader>
                        <CardTitle>Perfil</CardTitle>
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

                 <Card className="border-red-500/50 bg-gray-800/50 text-gray-200">
                    <CardHeader>
                        <CardTitle className="text-red-400">Zona de Perigo</CardTitle>
                        <CardDescription>Estas ações são destrutivas e não podem ser revertidas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="flex justify-between items-center">
                           <div>
                               <p className="font-bold">Resetar a sua conta</p>
                               <p className="text-sm text-gray-400">Isto irá apagar permanentemente todos os seus dados.</p>
                           </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isResetting}>
                                        {isResetting ? "A resetar..." : "Resetar Conta"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação é irreversível. Todos os seus dados, incluindo perfil, metas, missões e habilidades, serão apagados permanentemente. Não será possível recuperar a sua conta.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                            Sim, quero resetar a conta
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                       </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

    