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
import { usePlayerNotifications } from '@/hooks/use-player-notifications';
import { useEffect, useState } from 'react';
import { LoaderCircle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, BellOff } from 'lucide-react';

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
    const { 
        pushNotificationSupported, 
        pushNotificationEnabled, 
        enablePushNotifications, 
        disablePushNotifications 
    } = usePlayerNotifications(profile);
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [enablingPush, setEnablingPush] = useState(false);
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
                    notifications: data
                }
            };
            
            await persistData('profile', updatedProfile);
            
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
            
            toast({
                title: "Configurações atualizadas",
                description: "As suas preferências de notificação foram guardadas.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível guardar as configurações. Por favor, tente novamente.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnablePushNotifications = async () => {
        setEnablingPush(true);
        try {
            const success = await enablePushNotifications();
            if (success) {
                toast({
                    title: "Notificações ativadas",
                    description: "As notificações push foram ativadas com sucesso.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Não foi possível ativar as notificações push. Por favor, verifique as permissões do seu navegador.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Ocorreu um erro ao ativar as notificações push.",
            });
        } finally {
            setEnablingPush(false);
        }
    };

    const handleDisablePushNotifications = async () => {
        try {
            const success = await disablePushNotifications();
            if (success) {
                toast({
                    title: "Notificações desativadas",
                    description: "As notificações push foram desativadas.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Ocorreu um erro ao desativar as notificações push.",
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Notificações Push</CardTitle>
                    <CardDescription>
                        Receba notificações mesmo quando o aplicativo estiver fechado ou em segundo plano.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!pushNotificationSupported ? (
                        <Alert variant="destructive">
                            <AlertTitle>Notificações não suportadas</AlertTitle>
                            <AlertDescription>
                                O seu navegador ou dispositivo não suporta notificações push. 
                                Atualize o seu navegador ou utilize um dispositivo compatível.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg">
                            <div className="space-y-1">
                                <h4 className="font-medium">Notificações Push</h4>
                                <p className="text-sm text-muted-foreground">
                                    {pushNotificationEnabled 
                                        ? "Notificações ativadas" 
                                        : "Ative para receber notificações mesmo com o app fechado"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {pushNotificationEnabled ? (
                                    <Button 
                                        variant="outline" 
                                        onClick={handleDisablePushNotifications}
                                        disabled={enablingPush}
                                    >
                                        <BellOff className="mr-2 h-4 w-4" />
                                        Desativar
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={handleEnablePushNotifications}
                                        disabled={enablingPush}
                                    >
                                        {enablingPush ? (
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Bell className="mr-2 h-4 w-4" />
                                        )}
                                        Ativar Notificações
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {pushNotificationEnabled && (
                        <Alert>
                            <Bell className="h-4 w-4" />
                            <AlertTitle>Notificações Ativadas</AlertTitle>
                            <AlertDescription>
                                Você receberá notificações push para eventos importantes como:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Conclusão de missões</li>
                                    <li>Aumento de nível</li>
                                    <li>Desbloqueio de conquistas</li>
                                    <li>Alertas de habilidades em risco</li>
                                    <li>Bônus de sequência</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferências de Notificação</CardTitle>
                    <CardDescription>
                        Escolha quais tipos de notificações deseja receber.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="daily_briefing"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Briefing Diário
                                            </FormLabel>
                                            <FormDescription>
                                                Receber notificações com as suas missões diárias.
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
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Meta Concluída
                                            </FormLabel>
                                            <FormDescription>
                                                Notificação quando completar uma meta.
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
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Aumento de Nível
                                            </FormLabel>
                                            <FormDescription>
                                                Notificação quando subir de nível.
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
                            
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium">Horário Silencioso</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Defina um período em que não deseja receber notificações.
                                    </p>
                                </div>
                                
                                <FormField
                                    control={form.control}
                                    name="quiet_hours.enabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    Ativar Horário Silencioso
                                                </FormLabel>
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
                                
                                {form.watch("quiet_hours.enabled") && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-2">
                                        <FormField
                                            control={form.control}
                                            name="quiet_hours.start"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Início</FormLabel>
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
                                                    <FormLabel>Fim</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : justSaved ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Guardado!
                                        </>
                                    ) : (
                                        "Guardar Preferências"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}