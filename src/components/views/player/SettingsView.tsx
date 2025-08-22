
"use client";

import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { generateHunterAvatar } from '@/ai/flows/generate-hunter-avatar';
import { LoaderCircle, Wand2, Bell, BellOff, List, Square } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const getProfileRank = (level) => {
    if (level <= 5) return 'Novato (F)';
    if (level <= 10) return 'Iniciante (E)';
    if (level <= 20) return 'Adepto (D)';
    if (level <= 30) return 'Experiente (C)';
    if (level <= 40) return 'Perito (B)';
    if (level <= 50) return 'Mestre (A)';
    if (level <= 70) return 'Grão-Mestre (S)';
    if (level <= 90) return 'Herói (SS)';
    return 'Lendário (SSS)';
};

// Componente para um campo de informação/edição estilizado
const InfoField = ({ label, value, editable = false, onChange, placeholder, className = "" }) => (
    <div className={`flex flex-col gap-1 ${className}`}>
        <Label className="text-sm text-cyan-300/70 tracking-wider uppercase">{label}</Label>
        {editable ? (
            <Input 
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="bg-transparent border-0 border-b-2 border-cyan-400/30 rounded-none px-1 py-1 text-lg text-white focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-cyan-400 transition-colors h-auto"
            />
        ) : (
            <p className="text-lg text-white font-semibold h-10 flex items-center">{value}</p>
        )}
    </div>
);


// O componente principal da vista de Configurações
export const SettingsView = ({ profile, setProfile, onReset }) => {
    const [profileData, setProfileData] = useState({
        primeiro_nome: '',
        apelido: '',
        genero: '',
        nacionalidade: '',
        avatar_url: '',
        mission_view_style: 'inline',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const { toast } = useToast();
    const [notificationPermission, setNotificationPermission] = useState('default');


    useEffect(() => {
        if (profile) {
            setProfileData({
                primeiro_nome: profile.primeiro_nome || '',
                apelido: profile.apelido || '',
                genero: profile.genero || 'Não especificado',
                nacionalidade: profile.nacionalidade || 'Não especificada',
                avatar_url: profile.avatar_url || '',
                mission_view_style: profile.mission_view_style || 'inline',
            });
        }
         if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, [profile]);
    
    const handleNotificationToggle = async (enabled) => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            toast({ variant: 'destructive', title: 'Navegador não suportado', description: 'O seu navegador não suporta notificações push.' });
            return;
        }

        if (enabled) {
            if (Notification.permission === 'granted') {
                setNotificationPermission('granted');
                return;
            }
            if (Notification.permission === 'denied') {
                toast({ variant: 'destructive', title: 'Permissão Bloqueada', description: 'Você precisa de permitir as notificações nas configurações do seu navegador.' });
                return;
            }
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                toast({ title: 'Notificações Ativadas!', description: 'Você receberá alertas do Sistema.' });
                // Aqui seria o local para registar o token de push no backend
            } else {
                 toast({ title: 'Permissão Recusada', description: 'Você não receberá notificações.' });
            }
        } else {
            // A desativação é gerida no backend, removendo o token de subscrição.
            // Por agora, apenas atualizamos a UI.
            setNotificationPermission('default');
            toast({ title: 'Notificações Desativadas', description: 'Você não receberá mais alertas.' });
        }
    };


    const hasChanges = () => {
        if (!profile) return false;
        return (
            profileData.primeiro_nome !== profile.primeiro_nome ||
            profileData.apelido !== profile.apelido ||
            profileData.genero !== profile.genero ||
            profileData.nacionalidade !== profile.nacionalidade ||
            profileData.avatar_url !== profile.avatar_url ||
            profileData.mission_view_style !== profile.mission_view_style
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
        setIsResetting(false);
    };

    const handleGenerateAvatar = async () => {
        setIsGeneratingAvatar(true);
        try {
            const stats = Object.entries(profile.estatisticas)
                .sort(([,a],[,b]) => b - a)
                .slice(0, 2)
                .map(([key]) => key);

            const result = await generateHunterAvatar({
                level: profile.nivel,
                rank: getProfileRank(profile.nivel),
                gender: profileData.genero,
                topStats: stats,
            });

            if (result.avatarDataUri) {
                setProfileData(prev => ({ ...prev, avatar_url: result.avatarDataUri }));
                toast({
                    title: "Avatar Gerado!",
                    description: "Um novo avatar foi criado para si. Não se esqueça de salvar as alterações."
                });
            }
        } catch (error) {
            console.error("Erro ao gerar avatar:", error);
            toast({
                variant: "destructive",
                title: "Falha na Geração",
                description: "Não foi possível gerar um avatar. Tente novamente mais tarde.",
            });
        } finally {
            setIsGeneratingAvatar(false);
        }
    }

    if (!profile) {
        return <div className="p-6">A carregar configurações...</div>;
    }

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-primary mb-6 font-cinzel tracking-wider">Ficha de Caçador</h1>
            
            <form onSubmit={handleSave}>
                <Card className="bg-gray-900/50 border border-cyan-400/30 p-6 backdrop-blur-sm mb-6">
                    <CardContent className="p-0">
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-6">
                            {/* Profile Picture */}
                            <div className="md:col-span-4 flex flex-col items-center justify-start">
                                <div className="w-full max-w-[200px] aspect-[4/5] border-2 border-cyan-400/50 p-1 bg-black/20 relative">
                                    <Avatar className="w-full h-full rounded-none">
                                        <AvatarImage src={profileData.avatar_url} alt={profile.primeiro_nome} className="object-cover"/>
                                        <AvatarFallback className="bg-gray-800 rounded-none text-cyan-400 text-4xl">
                                            {profileData.primeiro_nome?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {isGeneratingAvatar && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                            <LoaderCircle className="h-10 w-10 text-cyan-400 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <Button type="button" onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className="w-full max-w-[200px] mt-2">
                                    {isGeneratingAvatar ? "A gerar..." : "Gerar Novo Avatar"}
                                    <Wand2 className="ml-2 h-4 w-4"/>
                                </Button>
                                <InfoField
                                    label="URL do Avatar"
                                    value={profileData.avatar_url}
                                    editable
                                    onChange={(e) => setProfileData({...profileData, avatar_url: e.target.value})}
                                    placeholder="https://..."
                                    className="mt-2 w-full max-w-[200px]"
                                />
                            </div>

                            {/* Profile Data */}
                            <div className="md:col-span-8 flex flex-col justify-between">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
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
                                    <InfoField label="Classe" value={getProfileRank(profile.nivel)} />
                                    <InfoField label="Status" value={profile.status || 'Ativo'} />
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
                                <div className="flex justify-end items-end mt-6">
                                <Button type="submit" disabled={isSaving || !hasChanges()}>
                                        {isSaving ? "A salvar..." : "Salvar Alterações"}
                                    </Button>
                                </div>
                            </div>
                       </div>
                    </CardContent>
                </Card>
            </form>
            
             <Card className="bg-gray-900/50 border border-cyan-400/30 p-6 backdrop-blur-sm mb-6">
                <CardContent className="p-0 space-y-4">
                     <div>
                        <h2 className="text-xl font-bold text-cyan-400">Preferências</h2>
                        <p className="text-cyan-400/70 text-sm mb-4">Personalize a sua experiência no Sistema.</p>
                        <div className="flex items-center justify-between bg-black/20 p-4 rounded-lg">
                           <div className="flex items-center gap-3">
                                {profileData.mission_view_style === 'popup' ? <Square className="h-5 w-5 text-green-400"/> : <List className="h-5 w-5 text-green-400"/>}
                                 <div>
                                    <p className="font-semibold text-white">Visualização de Missão Diária</p>
                                    <p className="text-xs text-gray-400">
                                        Estilo atual: <span className="font-bold">{profileData.mission_view_style === 'popup' ? 'Pop-up' : 'Inline'}</span>
                                    </p>
                                 </div>
                           </div>
                           <Switch
                                checked={profileData.mission_view_style === 'popup'}
                                onCheckedChange={(checked) => setProfileData(prev => ({...prev, mission_view_style: checked ? 'popup' : 'inline'}))}
                           />
                        </div>
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-cyan-400">Notificações</h2>
                        <p className="text-cyan-400/70 text-sm mb-4">Receba alertas proativos do Sistema.</p>
                        <div className="flex items-center justify-between bg-black/20 p-4 rounded-lg">
                           <div className="flex items-center gap-3">
                                {notificationPermission === 'granted' ? <Bell className="h-5 w-5 text-green-400"/> : <BellOff className="h-5 w-5 text-red-400"/>}
                                 <div>
                                    <p className="font-semibold text-white">Notificações Push</p>
                                    <p className="text-xs text-gray-400">
                                        Estado atual: <span className="font-bold">{notificationPermission === 'granted' ? 'Ativo' : 'Inativo'}</span>
                                    </p>
                                 </div>
                           </div>
                           <Switch
                                checked={notificationPermission === 'granted'}
                                onCheckedChange={handleNotificationToggle}
                                disabled={notificationPermission === 'denied'}
                           />
                        </div>
                        {notificationPermission === 'denied' && (
                            <p className="text-xs text-yellow-500 mt-2">As notificações foram bloqueadas no seu navegador. Você precisa de as ativar manualmente nas configurações do site.</p>
                        )}
                     </div>
                </CardContent>
            </Card>

            <div className="mt-8">
                 <Card className="bg-red-900/30 border border-red-500/30">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold text-red-400">Zona de Perigo</h2>
                        <p className="text-red-400/70 text-sm mb-4">Ações nesta secção são permanentes e não podem ser desfeitas.</p>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <p className="font-bold text-gray-200">Resetar a sua conta</p>
                                <p className="text-sm text-muted-foreground">Isto irá apagar permanentemente todos os seus dados.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isResetting} className="w-full sm:w-auto">
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
