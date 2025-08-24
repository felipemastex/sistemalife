"use client";

import { useState, useEffect, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateHunterAvatar } from '@/ai/flows/generate-hunter-avatar';
import { LoaderCircle, Wand2, Bell, BellOff, List, Square, User, Settings as SettingsIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { usePlayerDataContext } from '@/hooks/use-player-data.tsx';

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

const settingsFormSchema = z.object({
    primeiro_nome: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).max(30),
    apelido: z.string().min(2, { message: "O apelido deve ter pelo menos 2 caracteres." }).max(30),
    genero: z.string().max(30).optional(),
    nacionalidade: z.string().max(50).optional(),
    avatar_url: z.string().url({ message: "Por favor, insira um URL válido." }).or(z.literal('')),
    mission_view_style: z.enum(['inline', 'popup']),
});


const SettingsViewComponent = () => {
    const { profile, persistData, handleFullReset } = usePlayerDataContext();
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const { toast } = useToast();
    const [notificationPermission, setNotificationPermission] = useState('default');

     const form = useForm<z.infer<typeof settingsFormSchema>>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            primeiro_nome: '',
            apelido: '',
            genero: '',
            nacionalidade: '',
            avatar_url: '',
            mission_view_style: 'inline',
        },
    });

    useEffect(() => {
        if (profile) {
            form.reset({
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
    }, [profile, form]);
    
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
            } else {
                 toast({ title: 'Permissão Recusada', description: 'Você não receberá notificações.' });
            }
        } else {
            setNotificationPermission('default');
            toast({ title: 'Notificações Desativadas', description: 'Você não receberá mais alertas.' });
        }
    };

    const onSubmit = async (data: z.infer<typeof settingsFormSchema>) => {
        setIsSaving(true);
        try {
            await persistData('profile', { ...profile, ...data });
            toast({
                title: "Perfil Atualizado!",
                description: "Os seus dados foram alterados com sucesso.",
            });
            form.reset(data); // Re-sync form state
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
        await handleFullReset();
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
                gender: form.getValues('genero'),
                topStats: stats,
            });

            if (result.avatarDataUri) {
                form.setValue('avatar_url', result.avatarDataUri, { shouldDirty: true });
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
    
    const watchedAvatarUrl = form.watch('avatar_url');

    if (!profile) {
        return <div className="p-6">A carregar configurações...</div>;
    }

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Ficha de Caçador</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    Edite os seus dados pessoais, personalize a sua experiência e gira a sua conta no Sistema.
                </p>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User />Informações do Caçador</CardTitle>
                            <CardDescription>Edite os seus dados de identificação.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-1 flex flex-col items-center gap-4">
                                 <div className="w-full max-w-[200px] aspect-[4/5] border-2 border-border p-1 bg-secondary relative">
                                    <Avatar className="w-full h-full rounded-none">
                                        <AvatarImage src={watchedAvatarUrl} alt={form.getValues('primeiro_nome')} className="object-cover"/>
                                        <AvatarFallback className="bg-muted rounded-none text-muted-foreground text-4xl">
                                            {form.getValues('primeiro_nome')?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {isGeneratingAvatar && (
                                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                            <LoaderCircle className="h-10 w-10 text-primary animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <Button type="button" onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className="w-full max-w-[200px]">
                                    <Wand2 className="mr-2 h-4 w-4"/>
                                    {isGeneratingAvatar ? "A gerar..." : "Gerar com IA"}
                                </Button>
                                 <FormField
                                    control={form.control}
                                    name="avatar_url"
                                    render={({ field }) => (
                                        <FormItem className="w-full max-w-[200px]">
                                        <FormLabel>URL do Avatar</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                            </div>
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="primeiro_nome"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Primeiro Nome</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Seu nome" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={form.control}
                                    name="apelido"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Apelido</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Seu apelido" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                 <FormField
                                    control={form.control}
                                    name="genero"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Género</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Não especificado" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={form.control}
                                    name="nacionalidade"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Nacionalidade</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Não especificada" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2"><SettingsIcon />Preferências</CardTitle>
                            <CardDescription>Personalize a sua experiência no Sistema.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <FormField
                                control={form.control}
                                name="mission_view_style"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Visualização de Missão Diária</FormLabel>
                                            <FormDescription>
                                                Mudar para o estilo pop-up abre a missão num diálogo, em vez de expandir na lista.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value === 'popup'}
                                                onCheckedChange={(checked) => field.onChange(checked ? 'popup' : 'inline')}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="flex items-center justify-between rounded-lg border p-4">
                               <div className="space-y-0.5">
                                    <Label className="text-base">Notificações Push</Label>
                                    <p className="text-sm text-muted-foreground">Receba alertas proativos do Sistema sobre a sua jornada.</p>
                                    {notificationPermission === 'denied' && (
                                        <p className="text-xs text-yellow-500 pt-1">As notificações foram bloqueadas no seu navegador.</p>
                                    )}
                                 </div>
                               <Switch
                                   checked={notificationPermission === 'granted'}
                                   onCheckedChange={handleNotificationToggle}
                                   disabled={notificationPermission === 'denied'}
                               />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                            {isSaving ? <LoaderCircle className="animate-spin" /> : "Salvar Alterações"}
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="mt-12">
                 <Card className="border-red-500/30">
                    <CardHeader>
                        <CardTitle className="text-red-400">Zona de Perigo</CardTitle>
                        <CardDescription>Ações nesta secção são permanentes e não podem ser desfeitas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-lg border border-red-500/30 p-4">
                            <div>
                                <p className="font-bold text-foreground">Resetar a sua conta</p>
                                <p className="text-sm text-muted-foreground">Isto irá apagar permanentemente todos os seus dados.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isResetting} className="w-full sm:w-auto">
                                        {isResetting ? <LoaderCircle className="animate-spin" /> : "Resetar Conta"}
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

export const SettingsView = memo(SettingsViewComponent);
