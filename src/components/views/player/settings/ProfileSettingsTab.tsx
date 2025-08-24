
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateHunterAvatar } from '@/ai/flows/generate-hunter-avatar';
import { LoaderCircle, Wand2 } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';

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

const profileFormSchema = z.object({
    primeiro_nome: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).max(30),
    apelido: z.string().min(2, { message: "O apelido deve ter pelo menos 2 caracteres." }).max(30),
    genero: z.string().max(30).optional(),
    nacionalidade: z.string().max(50).optional(),
    avatar_url: z.string().url({ message: "Por favor, insira um URL válido." }).or(z.literal('')),
});

export default function ProfileSettingsTab() {
    const { profile, persistData } = usePlayerDataContext();
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            primeiro_nome: '',
            apelido: '',
            genero: '',
            nacionalidade: '',
            avatar_url: '',
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
            });
        }
    }, [profile, form]);

    const onSubmit = async (data: z.infer<typeof profileFormSchema>) => {
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

    const handleGenerateAvatar = async () => {
        setIsGeneratingAvatar(true);
        try {
            const stats = Object.entries(profile.estatisticas)
                .sort(([, a], [, b]) => b - a)
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Caçador</CardTitle>
                        <CardDescription>Edite os seus dados de identificação.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 flex flex-col items-center gap-4">
                            <div className="w-full max-w-[200px] aspect-[4/5] border-2 border-border p-1 bg-secondary relative">
                                <Avatar className="w-full h-full rounded-none">
                                    <AvatarImage src={watchedAvatarUrl} alt={form.getValues('primeiro_nome')} className="object-cover" />
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
                                <Wand2 className="mr-2 h-4 w-4" />
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
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                        {isSaving ? <LoaderCircle className="animate-spin" /> : "Salvar Alterações"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
