
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const getProfileRank = (level) => {
    if (level <= 5) return 'F';
    if (level <= 10) return 'E';
    if (level <= 20) return 'D';
    if (level <= 30) return 'C';
    if (level <= 40) return 'B';
    if (level <= 50) return 'A';
    if (level <= 70) return 'S';
    if (level <= 90) return 'SS';
    return 'SSS';
};

export const SettingsView = ({ profile, setProfile, onReset }) => {
    const [profileData, setProfileData] = useState({
        primeiro_nome: '',
        apelido: '',
        genero: '',
        nacionalidade: '',
        avatar_url: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (profile) {
            setProfileData({
                primeiro_nome: profile.primeiro_nome || '',
                apelido: profile.apelido || '',
                genero: profile.genero || 'Não especificado',
                nacionalidade: profile.nacionalidade || 'Não especificada',
                avatar_url: profile.avatar_url || '',
            });
        }
    }, [profile]);
    
    const hasChanges = () => {
        if (!profile) return false;
        return (
            profileData.primeiro_nome !== profile.primeiro_nome ||
            profileData.apelido !== profile.apelido ||
            profileData.genero !== profile.genero ||
            profileData.nacionalidade !== profile.nacionalidade ||
            profileData.avatar_url !== profile.avatar_url
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!hasChanges()) return;

        setIsSaving(true);
        try {
            await setProfile({ ...profile, ...profileData });
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
    }

    if (!profile) {
        return <div className="p-6">A carregar configurações...</div>;
    }
    
    const InfoField = ({ label, value, editable = false, onChange, placeholder }) => (
        <div>
            <Label className="text-sm text-cyan-300/70">{label}</Label>
            {editable ? (
                <Input 
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="bg-transparent border-b border-cyan-400/50 rounded-none px-0 text-lg text-white focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-cyan-400"
                />
            ) : (
                <p className="text-lg text-white font-semibold">{value}</p>
            )}
        </div>
    );


    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-primary mb-6">Ficha de Caçador</h1>
            
            <div className="bg-gray-900/50 border border-cyan-400/30 rounded-lg p-6 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Picture */}
                <div className="md:col-span-1 flex flex-col items-center">
                    <div className="w-48 h-56 border-2 border-cyan-400/50 p-1 bg-black/20">
                         <Avatar className="w-full h-full rounded-none">
                            <AvatarImage src={profileData.avatar_url} alt={profile.primeiro_nome} className="object-cover"/>
                            <AvatarFallback className="bg-gray-800 rounded-none text-cyan-400">
                                {profileData.primeiro_nome?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <Input 
                        type="url"
                        value={profileData.avatar_url}
                        onChange={(e) => setProfileData({...profileData, avatar_url: e.target.value})}
                        placeholder="URL da Imagem"
                        className="mt-2 text-xs bg-gray-800/70 border-cyan-400/30"
                    />
                </div>

                {/* Profile Data */}
                <div className="md:col-span-2 grid grid-rows-4 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                         <InfoField 
                            label="Primeiro Nome" 
                            value={profileData.primeiro_nome}
                            editable
                            onChange={(e) => setProfileData({...profileData, primeiro_nome: e.target.value})}
                            placeholder="Seu nome"
                        />
                         <InfoField 
                            label="Apelido" 
                            value={profileData.apelido}
                            editable
                             onChange={(e) => setProfileData({...profileData, apelido: e.target.value})}
                            placeholder="Seu apelido"
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <InfoField label="Classe" value={getProfileRank(profile.nivel)} />
                        <InfoField label="Status" value={profile.status || 'Ativo'} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <InfoField 
                            label="Género" 
                            value={profileData.genero}
                            editable
                             onChange={(e) => setProfileData({...profileData, genero: e.target.value})}
                            placeholder="Ex: Masculino"
                        />
                        <InfoField 
                            label="Nacionalidade" 
                            value={profileData.nacionalidade}
                            editable
                             onChange={(e) => setProfileData({...profileData, nacionalidade: e.target.value})}
                            placeholder="Ex: Portugal"
                        />
                    </div>
                    <div className="flex justify-end items-end">
                       <Button onClick={handleSave} disabled={isSaving || !hasChanges()}>
                            {isSaving ? "A salvar..." : "Salvar Alterações"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                 <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-red-400">Zona de Perigo</h2>
                    <p className="text-red-400/70 text-sm mb-4">Ações nesta secção são permanentes e não podem ser desfeitas.</p>
                     <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-200">Resetar a sua conta</p>
                            <p className="text-sm text-muted-foreground">Isto irá apagar permanentemente todos os seus dados.</p>
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
                 </div>
            </div>

        </div>
    );
};
