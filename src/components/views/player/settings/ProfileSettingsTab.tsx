
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { generateHunterAvatar } from '@/ai/flows/generate-hunter-avatar';
import { LoaderCircle, Wand2, Check } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const getProfileRank = (level: number) => {
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

const profileFormSchema = z.object({
    primeiro_nome: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).max(30),
    apelido: z.string().min(2, { message: "O apelido deve ter pelo menos 2 caracteres." }).max(30),
    genero: z.string().max(30).optional(),
    nacionalidade: z.string().max(50).optional(),
    avatar_url: z.string().url({ message: "Por favor, insira um URL válido." }).or(z.literal('')),
    privacy_settings: z.object({
        profile_visibility: z.enum(['public', 'private']),
        analytics_opt_in: z.boolean(),
    })
});

export default function ProfileSettingsTab() {
    const { profile, persistData } = usePlayerDataContext();
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            primeiro_nome: '',
            apelido: '',
            genero: '',
            nacionalidade: '',
            avatar_url: '',
            privacy_settings: {
                profile_visibility: 'public',
                analytics_opt_in: true,
            }
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
                privacy_settings: {
                    profile_visibility: profile.user_settings?.privacy_settings?.profile_visibility || 'public',
                    analytics_opt_in: profile.user_settings?.privacy_settings?.analytics_opt_in !== false,
                }
            });
        }
    }, [profile, form]);

    const onSubmit = async (data: z.infer<typeof profileFormSchema>) => {
        setIsSaving(true);
        try {
             const updatedProfile = {
                ...profile,
                primeiro_nome: data.primeiro_nome,
                apelido: data.apelido,
                genero: data.genero,
                nacionalidade: data.nacionalidade,
                avatar_url: data.avatar_url,
                user_settings: {
                    ...profile.user_settings,
                    privacy_settings: data.privacy_settings,
                }
            };
            await persistData('profile', updatedProfile);

            toast({
                title: "Perfil Atualizado!",
                description: "Os seus dados foram alterados com sucesso.",
            });
            form.reset(data); // Re-sync form state
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
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

    const handleGenerateAvatar = async () => {
        setIsGeneratingAvatar(true);
        try {
            const stats = Object.entries(profile.estatisticas)
                .sort(([, a], [, b]) => (b as number) - (a as number))
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
                <Card>
                    <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Informações do Caçador</CardTitle>
                        <CardDescription className={isMobile ? "text-xs" : ""}>Edite os seus dados de identificação.</CardDescription>
                    </CardHeader>
                    <CardContent className={cn("grid gap-4", isMobile ? "gap-3" : "gap-8", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
                        <div className={cn("flex flex-col items-center gap-3", isMobile ? "gap-2" : "gap-4", isMobile ? "" : "md:col-span-1")}>
                            <div className={cn("w-full border-2 border-border p-1 bg-secondary relative", isMobile ? "max-w-[120px] aspect-[4/5]" : "max-w-[200px] aspect-[4/5]")}>
                                <Avatar className="w-full h-full rounded-none">
                                    <AvatarImage src={watchedAvatarUrl} alt={form.getValues('primeiro_nome')} className="object-cover" />
                                    <AvatarFallback className="bg-muted rounded-none text-muted-foreground text-4xl">
                                        {form.getValues('primeiro_nome')?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {isGeneratingAvatar && (
                                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                        <LoaderCircle className={cn("text-primary animate-spin", isMobile ? "h-6 w-6" : "h-10 w-10")} />
                                    </div>
                                )}
                            </div>
                            <Button type="button" onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className={cn("w-full", isMobile ? "max-w-[120px] h-8 text-xs" : "max-w-[200px]")}>
                                <Wand2 className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                {isGeneratingAvatar ? (isMobile ? "Gerando..." : "A gerar...") : "Gerar com IA"}
                            </Button>
                            <FormField
                                control={form.control}
                                name="avatar_url"
                                render={({ field }) => (
                                    <FormItem className={cn("w-full", isMobile ? "max-w-[120px]" : "max-w-[200px]")}>
                                        <FormLabel className={isMobile ? "text-xs" : ""}>URL do Avatar</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} className={isMobile ? "h-8 text-xs" : ""} />
                                        </FormControl>
                                        <FormMessage className={isMobile ? "text-xs" : ""} />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className={cn("grid gap-4", isMobile ? "gap-3" : "gap-6", isMobile ? "grid-cols-1" : "md:col-span-2 grid-cols-1 sm:grid-cols-2")}>
                            <FormField
                                control={form.control}
                                name="primeiro_nome"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={isMobile ? "text-xs" : ""}>Primeiro Nome</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Seu nome" {...field} className={isMobile ? "h-8 text-sm" : ""} />
                                        </FormControl>
                                        <FormMessage className={isMobile ? "text-xs" : ""} />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="apelido"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={isMobile ? "text-xs" : ""}>Apelido</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Seu apelido" {...field} className={isMobile ? "h-8 text-sm" : ""} />
                                        </FormControl>
                                        <FormMessage className={isMobile ? "text-xs" : ""} />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="genero"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={isMobile ? "text-xs" : ""}>Género</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Não especificado" {...field} className={isMobile ? "h-8 text-sm" : ""} />
                                        </FormControl>
                                        <FormMessage className={isMobile ? "text-xs" : ""} />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nacionalidade"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={isMobile ? "text-xs" : ""}>Nacionalidade</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Não especificada" {...field} className={isMobile ? "h-8 text-sm" : ""} />
                                        </FormControl>
                                        <FormMessage className={isMobile ? "text-xs" : ""} />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Privacidade & Visibilidade</CardTitle>
                        <CardDescription className={isMobile ? "text-xs" : ""}>Controle como os seus dados são vistos e utilizados.</CardDescription>
                    </CardHeader>
                    <CardContent className={cn("space-y-3", isMobile ? "space-y-2 p-3" : "space-y-4")}>
                        <FormField
                            control={form.control}
                            name="privacy_settings.profile_visibility"
                            render={({ field }) => (
                                <FormItem className={cn("flex items-center justify-between rounded-lg border", isMobile ? "p-2" : "p-4")}>
                                    <div className="space-y-0.5">
                                        <FormLabel className={isMobile ? "text-sm" : "text-base"}>Perfil Público</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value === 'public'}
                                            onCheckedChange={(checked) => field.onChange(checked ? 'public' : 'private')}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="privacy_settings.analytics_opt_in"
                            render={({ field }) => (
                                <FormItem className={cn("flex items-center justify-between rounded-lg border", isMobile ? "p-2" : "p-4")}>
                                    <div className="space-y-0.5">
                                        <FormLabel className={isMobile ? "text-sm" : "text-base"}>Análise de Dados do Sistema</FormLabel>
                                        <FormDescription className={isMobile ? "text-xs" : ""}>
                                           Permitir que o Sistema utilize os seus dados de progresso para melhorar os algoritmos de sugestão.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>


                <div className="flex justify-end">
                     <Button type="submit" disabled={isSaving || !form.formState.isDirty || justSaved} className={isMobile ? "h-8 text-sm" : ""}>
                        {isSaving ? <LoaderCircle className={cn("animate-spin", isMobile ? "h-4 w-4" : "")} /> : justSaved ? <Check className={isMobile ? "h-4 w-4" : ""} /> : (isMobile ? "Salvar" : "Salvar Alterações")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
