
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
import { LoaderCircle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const notificationsFormSchema = z.object({
    daily_briefing: z.boolean(),
    goal_completed: z.boolean(),
    level_up: z.boolean(),
    quiet_hours: z.object({
        enabled: z.boolean(),
        start: z.string(),
        end: z.string(),
    }),
});

export default function NotificationsSettingsTab() {
    const { profile, persistData } = usePlayerDataContext();
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof notificationsFormSchema>>({
        resolver: zodResolver(notificationsFormSchema),
        defaultValues: {
            daily_briefing: true,
            goal_completed: true,
            level_up: true,
            quiet_hours: {
                enabled: false,
                start: '22:00',
                end: '08:00',
            }
        },
    });

    useEffect(() => {
        if (profile?.user_settings?.notifications) {
            form.reset({
                daily_briefing: profile.user_settings.notifications.daily_briefing !== false,
                goal_completed: profile.user_settings.notifications.goal_completed !== false,
                level_up: profile.user_settings.notifications.level_up !== false,
                quiet_hours: {
                    enabled: profile.user_settings.notifications.quiet_hours?.enabled || false,
                    start: profile.user_settings.notifications.quiet_hours?.start || '22:00',
                    end: profile.user_settings.notifications.quiet_hours?.end || '08:00',
                }
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
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
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
    
    const watchQuietHoursEnabled = form.watch('quiet_hours.enabled');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Preferências de Notificação</CardTitle>
                        <CardDescription>Controle quais alertas do Sistema você deseja receber e quando os recebe.</CardDescription>
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
                        
                        <Separator />

                        <FormField
                            control={form.control}
                            name="quiet_hours.enabled"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Modo "Não Perturbar"</FormLabel>
                                        <FormDescription>
                                            Silenciar todas as notificações durante um período específico.
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
                        {watchQuietHoursEnabled && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 ml-4">
                                <FormField
                                    control={form.control}
                                    name="quiet_hours.start"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Início do Silêncio</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="quiet_hours.end"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fim do Silêncio</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}


                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving || !form.formState.isDirty || justSaved}>
                         {isSaving ? <LoaderCircle className="animate-spin" /> : justSaved ? <Check /> : "Salvar Preferências"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
