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
});

export default function AISettingsTab() {
    const { profile, persistData } = usePlayerDataContext();
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof aiSettingsFormSchema>>({
        resolver: zodResolver(aiSettingsFormSchema),
        defaultValues: {
            mission_view_style: 'inline',
            ai_personality: 'balanced',
            theme_accent_color: '198 90% 55%',
            reduce_motion: false,
        },
    });

    useEffect(() => {
        if (profile?.user_settings) {
            form.reset({
                mission_view_style: profile.user_settings.mission_view_style || 'inline',
                ai_personality: profile.user_settings.ai_personality || 'balanced',
                theme_accent_color: profile.user_settings.theme_accent_color || '198 90% 55%',
                reduce_motion: profile.user_settings.reduce_motion || false,
            });
        }
    }, [profile, form]);

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>IA & Interface</CardTitle>
                        <CardDescription>Personalize como você interage com o Sistema e a interface da aplicação.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="theme_accent_color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tema Visual</FormLabel>
                                    <FormDescription>Escolha a cor de destaque para a interface do Sistema.</FormDescription>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                                        {themeColors.map((color) => (
                                            <div key={color.value}>
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(color.value)}
                                                    className={cn(
                                                        "w-full h-16 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                                                        field.value === color.value ? "border-foreground" : "border-transparent hover:border-muted-foreground/50"
                                                    )}
                                                    style={{ backgroundColor: `hsl(${color.value})`}}
                                                >
                                                    {field.value === color.value && <Check className="h-6 w-6 text-white mix-blend-difference" />}
                                                </button>
                                                <p className="text-center text-sm mt-2 text-muted-foreground">{color.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator/>

                         <FormField
                            control={form.control}
                            name="ai_personality"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Personalidade do Sistema</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma personalidade" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="balanced">Equilibrado (Padrão)</SelectItem>
                                            <SelectItem value="mentor">Mentor Sábio</SelectItem>
                                            <SelectItem value="strategist">Estratega Frio</SelectItem>
                                            <SelectItem value="friendly">Parceiro Amigável</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Escolha como o "Arquiteto" (IA) deve comunicar consigo.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator/>

                        <FormField
                            control={form.control}
                            name="mission_view_style"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Visualização de Missão em Pop-up</FormLabel>
                                        <FormDescription>
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
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Reduzir Animações</FormLabel>
                                        <FormDescription>
                                            Ative para desativar ou reduzir as animações da interface.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.checked}
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
