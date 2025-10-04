"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { useEffect, useState } from 'react';
import { LoaderCircle, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useIsMobile } from '@/hooks/use-mobile';

const themeColors = [
    { name: 'Ciano (Padrão)', value: '198 90% 55%' },
    { name: 'Púrpura', value: '262 84% 59%' },
    { name: 'Verde Esmeralda', value: '142 71% 45%' },
    { name: 'Laranja Ardente', value: '25 95% 53%' },
    { name: 'Rosa Elétrico', value: '330 81% 60%' },
    { name: 'Amarelo Dourado', value: '45 93% 47%' },
];

const aiSettingsFormSchema = z.object({
    mission_view_style: z.enum(['inline', 'popup']),
    ai_personality: z.enum(['balanced', 'mentor', 'strategist', 'friendly']),
    theme_accent_color: z.string(),
    reduce_motion: z.boolean(),
    layout_density: z.enum(['compact', 'default', 'comfortable']),
});

export default function AISettingsTab() {
    const { profile, persistData, isDataLoaded } = usePlayerDataContext();
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const form = useForm<z.infer<typeof aiSettingsFormSchema>>({
        resolver: zodResolver(aiSettingsFormSchema),
        defaultValues: {
            mission_view_style: 'inline',
            ai_personality: 'balanced',
            theme_accent_color: '198 90% 55%',
            reduce_motion: false,
            layout_density: 'default',
        },
    });

    useEffect(() => {
        if (profile?.user_settings) {
            form.reset({
                mission_view_style: profile.user_settings.mission_view_style || 'inline',
                ai_personality: profile.user_settings.ai_personality || 'balanced',
                theme_accent_color: profile.user_settings.theme_accent_color || '198 90% 55%',
                reduce_motion: profile.user_settings.reduce_motion || false,
                layout_density: profile.user_settings.layout_density || 'default',
            });
        }
    }, [profile, form, isDataLoaded]);
    
    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            if (name === 'theme_accent_color' && value.theme_accent_color) {
                document.documentElement.style.setProperty('--theme-accent-color', value.theme_accent_color);
            }
             if (name === 'reduce_motion') {
                document.body.classList.toggle('reduce-motion', !!value.reduce_motion);
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    const onSubmit = async (data: z.infer<typeof aiSettingsFormSchema>) => {
        setIsSaving(true);
        try {
            const updatedProfile = {
                ...profile,
                user_settings: {
                    ...profile.user_settings,
                    ...data,
                }
            };
            await persistData('profile', updatedProfile);
            toast({
                title: "Preferências Atualizadas!",
                description: "As suas preferências de IA e interface foram salvas.",
            });
            form.reset(data); // Re-sync form state
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
        } catch (error) {
            console.error("Erro ao salvar preferências:", error);
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
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", isMobile && "space-y-4")}>
                <Card className={isMobile ? "p-2" : ""}>
                    <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                        <CardTitle className={isMobile ? "text-lg" : ""}>IA & Interface</CardTitle>
                        <CardDescription className={isMobile ? "text-xs" : ""}>
                            Personalize como você interage com o Sistema e a interface da aplicação.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className={cn("space-y-6", isMobile && "space-y-4 p-3")}>
                        <FormField
                            control={form.control}
                            name="theme_accent_color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={isMobile ? "text-sm" : ""}>Tema Visual</FormLabel>
                                    <FormDescription className={isMobile ? "text-xs" : ""}>
                                        Escolha a cor de destaque para a interface do Sistema.
                                    </FormDescription>
                                    <div className={cn("grid gap-4 pt-2", isMobile ? "grid-cols-3 gap-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4")}>
                                        {themeColors.map((color) => (
                                            <div key={color.value}>
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(color.value)}
                                                    className={cn(
                                                        "w-full rounded-md border-2 flex items-center justify-center transition-all duration-200",
                                                        isMobile ? "h-12" : "h-16",
                                                        field.value === color.value ? "border-foreground" : "border-transparent hover:border-muted-foreground/50"
                                                    )}
                                                    style={{ backgroundColor: `hsl(${color.value})`}}
                                                >
                                                    {field.value === color.value && <Check className={cn("text-white mix-blend-difference", isMobile ? "h-4 w-4" : "h-6 w-6")} />}
                                                </button>
                                                <p className={cn("text-center mt-2 text-muted-foreground", isMobile ? "text-xs mt-1" : "text-sm")}>{color.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator className={isMobile ? "my-2" : ""}/>
                        
                         <FormField
                            control={form.control}
                            name="layout_density"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel className={isMobile ? "text-sm" : ""}>Densidade do Layout</FormLabel>
                                <FormDescription className={isMobile ? "text-xs" : ""}>
                                    Ajuste o espaçamento na interface para corresponder às suas preferências visuais.
                                </FormDescription>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                    className={cn("grid gap-4 pt-2", isMobile ? "grid-cols-1 gap-2" : "grid-cols-1 sm:grid-cols-3")}
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <div className={cn(
                                                    "flex w-full items-center justify-center rounded-md border border-muted-foreground cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 transition-colors",
                                                    isMobile ? "p-2" : "p-4"
                                                )} data-state={field.value === 'compact' ? 'checked' : 'unchecked'} onClick={() => field.onChange('compact')}>
                                                    <RadioGroupItem value="compact" id="density-compact" className="sr-only"/>
                                                    <FormLabel htmlFor="density-compact" className={cn("font-normal cursor-pointer w-full text-center", isMobile ? "text-xs" : "")}>
                                                        Compacto
                                                    </FormLabel>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                             <FormControl>
                                                <div className={cn(
                                                    "flex w-full items-center justify-center rounded-md border border-muted-foreground cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 transition-colors",
                                                    isMobile ? "p-2" : "p-4"
                                                )} data-state={field.value === 'default' ? 'checked' : 'unchecked'} onClick={() => field.onChange('default')}>
                                                    <RadioGroupItem value="default" id="density-default" className="sr-only"/>
                                                    <FormLabel htmlFor="density-default" className={cn("font-normal cursor-pointer w-full text-center", isMobile ? "text-xs" : "")}>
                                                        Padrão
                                                    </FormLabel>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <div className={cn(
                                                    "flex w-full items-center justify-center rounded-md border border-muted-foreground cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 transition-colors",
                                                    isMobile ? "p-2" : "p-4"
                                                )} data-state={field.value === 'comfortable' ? 'checked' : 'unchecked'} onClick={() => field.onChange('comfortable')}>
                                                    <RadioGroupItem value="comfortable" id="density-comfortable" className="sr-only"/>
                                                    <FormLabel htmlFor="density-comfortable" className={cn("font-normal cursor-pointer w-full text-center", isMobile ? "text-xs" : "")}>
                                                        Confortável
                                                    </FormLabel>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />


                        <Separator className={isMobile ? "my-2" : ""}/>

                         <FormField
                            control={form.control}
                            name="ai_personality"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={isMobile ? "text-sm" : ""}>Personalidade do Sistema</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={isMobile ? "text-sm py-1 h-8" : ""}>
                                                <SelectValue placeholder="Selecione uma personalidade" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="balanced" className={isMobile ? "text-sm py-1" : ""}>Equilibrado (Padrão)</SelectItem>
                                            <SelectItem value="mentor" className={isMobile ? "text-sm py-1" : ""}>Mentor Sábio</SelectItem>
                                            <SelectItem value="strategist" className={isMobile ? "text-sm py-1" : ""}>Estratega Frio</SelectItem>
                                            <SelectItem value="friendly" className={isMobile ? "text-sm py-1" : ""}>Parceiro Amigável</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className={isMobile ? "text-xs" : ""}>
                                        Escolha como o "Arquiteto" (IA) deve comunicar consigo.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Separator className={isMobile ? "my-2" : ""}/>

                        <FormField
                            control={form.control}
                            name="mission_view_style"
                            render={({ field }) => (
                                <FormItem className={cn("flex items-center justify-between rounded-lg border p-4", isMobile && "p-2")}>
                                    <div className="space-y-0.5">
                                        <FormLabel className={cn("text-base", isMobile && "text-sm")}>Visualização de Missão em Pop-up</FormLabel>
                                        <FormDescription className={isMobile ? "text-xs" : ""}>
                                            Ative para que os detalhes da missão diária abram num pop-up em vez de expandir na lista.
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
                        <FormField
                            control={form.control}
                            name="reduce_motion"
                            render={({ field }) => (
                                <FormItem className={cn("flex items-center justify-between rounded-lg border p-4", isMobile && "p-2")}>
                                    <div className="space-y-0.5">
                                        <FormLabel className={cn("text-base", isMobile && "text-sm")}>Reduzir Animações</FormLabel>
                                        <FormDescription className={isMobile ? "text-xs" : ""}>
                                            Ative para desativar ou reduzir as animações da interface.
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
                    <Button type="submit" disabled={isSaving || !form.formState.isDirty || justSaved} className={isMobile ? "text-sm py-1 h-8" : ""}>
                         {isSaving ? <LoaderCircle className={cn("animate-spin", isMobile ? "h-4 w-4" : "")} /> : justSaved ? <Check className={isMobile ? "h-4 w-4" : ""} /> : "Salvar Preferências"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}