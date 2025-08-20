
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export const SettingsView = ({ profile, setProfile }) => {
    const [username, setUsername] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (profile) {
            setUsername(profile.nome_utilizador);
        }
    }, [profile]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!username.trim() || username.trim() === profile.nome_utilizador) {
            return;
        }

        setIsSaving(true);
        try {
            const updatedProfile = { ...profile, nome_utilizador: username.trim() };
            await setProfile(updatedProfile);
            toast({
                title: "Perfil Atualizado!",
                description: "O seu nome de utilizador foi alterado com sucesso.",
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
                        
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving || username === profile.nome_utilizador}>
                                {isSaving ? "A salvar..." : "Salvar Alterações"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

    