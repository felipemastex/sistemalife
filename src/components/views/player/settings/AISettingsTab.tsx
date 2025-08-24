
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const aiSettingsFormSchema = z.object({
    mission_view_style: z.enum(['inline', 'popup']),
    ai_personality: z.enum(['balanced', 'mentor', 'strategist', 'friendly']),
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
        },
    });

    useEffect(() => {
        if (profile?.user_settings) {
            form.reset({
                mission_view_style: profile.user_settings.mission_view_style || 'inline',
                ai_personality: profile.user_settings.ai_personality || 'balanced',
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
                            name="ai_personality"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Personalidade do Sistema</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormField
                            control={form.control}
                            name="mission_view_style"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Visualização de Missão Diária em Pop-up</FormLabel>
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
