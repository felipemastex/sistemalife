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
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
    const isMobile = useIsMobile();

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
        <div className={cn("space-y-6", isMobile && "space-y-4")}>
            <Card className={isMobile ? "p-2" : ""}>
                <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                    <CardTitle className={isMobile ? "text-lg" : ""}>Notificações Push</CardTitle>
                    <CardDescription className={isMobile ? "text-xs" : ""}>
                        Receba notificações mesmo quando o aplicativo estiver fechado ou em segundo plano.
                    </CardDescription>
                </CardHeader>
                <CardContent className={cn("space-y-4", isMobile && "space-y-2 p-3")}>
                    {!pushNotificationSupported ? (
                        <Alert variant="destructive" className={isMobile ? "p-2" : ""}>
                            <AlertTitle className={isMobile ? "text-sm" : ""}>Notificações não suportadas</AlertTitle>
                            <AlertDescription className={isMobile ? "text-xs" : ""}>
                                O seu navegador ou dispositivo não suporta notificações push. 
                                Atualize o seu navegador ou utilize um dispositivo compatível.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className={cn("flex items-start justify-between gap-4 rounded-lg border p-4", isMobile ? "flex-col p-2 gap-2" : "flex-row p-4")}>
                            <div className={cn("space-y-1", isMobile && "space-y-0")}>
                                <h4 className={cn("font-medium", isMobile ? "text-sm" : "text-base")}>Notificações Push</h4>
                                <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
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
                                        className={isMobile ? "text-xs py-1 h-7" : ""}
                                    >
                                        <BellOff className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                        {isMobile ? "Desativar" : "Desativar"}
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={handleEnablePushNotifications}
                                        disabled={enablingPush}
                                        className={isMobile ? "text-xs py-1 h-7" : ""}
                                    >
                                        {enablingPush ? (
                                            <LoaderCircle className={cn("mr-2 animate-spin", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                        ) : (
                                            <Bell className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                        )}
                                        {isMobile ? "Ativar" : "Ativar Notificações"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {pushNotificationEnabled && (
                        <Alert className={isMobile ? "p-2" : ""}>
                            <Bell className={cn("h-4 w-4", isMobile ? "h-3 w-3" : "")} />
                            <AlertTitle className={isMobile ? "text-sm" : ""}>Notificações Ativadas</AlertTitle>
                            <AlertDescription className={isMobile ? "text-xs" : ""}>
                                Você receberá notificações push para eventos importantes como:
                                <ul className={cn("list-disc list-inside mt-2 space-y-1", isMobile ? "space-y-0 text-xs" : "space-y-1")}>
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

            <Card className={isMobile ? "p-2" : ""}>
                <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                    <CardTitle className={isMobile ? "text-lg" : ""}>Preferências de Notificação</CardTitle>
                    <CardDescription className={isMobile ? "text-xs" : ""}>
                        Escolha quais tipos de notificações deseja receber.
                    </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "p-3" : ""}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", isMobile && "space-y-3")}>
                            <FormField
                                control={form.control}
                                name="daily_briefing"
                                render={({ field }) => (
                                    <FormItem className={cn("flex flex-row items-center justify-between rounded-lg border p-4", isMobile && "p-2")}>
                                        <div className={cn("space-y-0.5", isMobile && "space-y-0")}>
                                            <FormLabel className={cn("text-base", isMobile && "text-sm")}>
                                                Briefing Diário
                                            </FormLabel>
                                            <FormDescription className={isMobile ? "text-xs" : ""}>
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
                                    <FormItem className={cn("flex flex-row items-center justify-between rounded-lg border p-4", isMobile && "p-2")}>
                                        <div className={cn("space-y-0.5", isMobile && "space-y-0")}>
                                            <FormLabel className={cn("text-base", isMobile && "text-sm")}>
                                                Meta Concluída
                                            </FormLabel>
                                            <FormDescription className={isMobile ? "text-xs" : ""}>
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
                                    <FormItem className={cn("flex flex-row items-center justify-between rounded-lg border p-4", isMobile && "p-2")}>
                                        <div className={cn("space-y-0.5", isMobile && "space-y-0")}>
                                            <FormLabel className={cn("text-base", isMobile && "text-sm")}>
                                                Aumento de Nível
                                            </FormLabel>
                                            <FormDescription className={isMobile ? "text-xs" : ""}>
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
                            
                            <Separator className={isMobile ? "my-2" : ""} />
                            
                            <div className={cn("space-y-4", isMobile && "space-y-2")}>
                                <div>
                                    <h3 className={cn("font-medium", isMobile ? "text-sm" : "text-lg")}>Horário Silencioso</h3>
                                    <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
                                        Defina um período em que não deseja receber notificações.
                                    </p>
                                </div>
                                
                                <FormField
                                    control={form.control}
                                    name="quiet_hours.enabled"
                                    render={({ field }) => (
                                        <FormItem className={cn("flex flex-row items-center justify-between rounded-lg border p-4", isMobile && "p-2")}>
                                            <div className={cn("space-y-0.5", isMobile && "space-y-0")}>
                                                <FormLabel className={cn("text-base", isMobile && "text-sm")}>
                                                    Ativar Horário Silencioso
                                                </FormLabel>
                                                <FormDescription className={isMobile ? "text-xs" : ""}>
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
                                    <div className={cn("gap-4 ml-2", isMobile ? "grid grid-cols-1 gap-2 ml-1" : "grid grid-cols-1 sm:grid-cols-2")}>
                                        <FormField
                                            control={form.control}
                                            name="quiet_hours.start"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={isMobile ? "text-xs" : ""}>Início</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} className={isMobile ? "text-xs py-1 h-8" : ""} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="quiet_hours.end"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={isMobile ? "text-xs" : ""}>Fim</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} className={isMobile ? "text-xs py-1 h-8" : ""} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSaving} className={isMobile ? "text-sm py-1 h-8" : ""}>
                                    {isSaving ? (
                                        <>
                                            <LoaderCircle className={cn("mr-2 animate-spin", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                            {isMobile ? "Guardando..." : "Guardando..."}
                                        </>
                                    ) : justSaved ? (
                                        <>
                                            <Check className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                            {isMobile ? "Guardado!" : "Guardado!"}
                                        </>
                                    ) : (
                                        isMobile ? "Guardar" : "Guardar Preferências"
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