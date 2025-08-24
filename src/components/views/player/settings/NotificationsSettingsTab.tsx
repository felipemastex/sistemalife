
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

const notificationsFormSchema = z.object({
    daily_briefing: z.boolean(),
    goal_completed: z.boolean(),
    level_up: z.boolean(),
});

export default function NotificationsSettingsTab() {
    const { profile, persistData } = usePlayerDataContext();
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof notificationsFormSchema>>({
        resolver: zodResolver(notificationsFormSchema),
        defaultValues: {
            daily_briefing: true,
            goal_completed: true,
            level_up: true,
        },
    });

    useEffect(() => {
        if (profile?.user_settings?.notifications) {
            form.reset({
                daily_briefing: profile.user_settings.notifications.daily_briefing !== false,
                goal_completed: profile.user_settings.notifications.goal_completed !== false,
                level_up: profile.user_settings.notifications.level_up !== false,
            });
        }
    }, [profile, form]);

    const onSubmit = async (data: z.infer<typeof notificationsFormSchema>) => {
        setIsSaving(true);
        try {
            const updatedProfile = {
                ...profile,
                user_settings: {
                    ...profile.user_settings,
                    notifications: {
                        ...profile.user_settings?.notifications,
                        ...data,
                    }
                }
            };
            await persistData('profile', updatedProfile);
            toast({
                title: "Notificações Atualizadas!",
                description: "As suas preferências de notificação foram salvas.",
            });
            form.reset(data); 
        } catch (error) {
            console.error("Erro ao salvar notificações:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível atualizar as suas preferências.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Preferências de Notificação</CardTitle>
                        <CardDescription>Controle quais alertas do Sistema você deseja receber.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="daily_briefing"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Briefing Diário</FormLabel>
                                        <FormDescription>
                                            Receber um resumo das suas missões prioritárias no início do dia.
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
                        <FormField
                            control={form.control}
                            name="goal_completed"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Meta Concluída</FormLabel>
                                        <FormDescription>
                                            Receber um alerta especial quando uma meta de longo prazo for concluída.
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
                        <FormField
                            control={form.control}
                            name="level_up"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Nível Aumentado</FormLabel>
                                        <FormDescription>
                                            Receber um alerta de celebração quando subir de nível.
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
                    <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                         {isSaving ? <LoaderCircle className="animate-spin" /> : "Salvar Preferências"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
