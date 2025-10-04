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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const gamificationFormSchema = z.object({
    progress_feedback_intensity: z.enum(['subtle', 'default', 'celebratory']),
});

export default function GamificationSettingsTab() {
    const { profile, persistData, isDataLoaded } = usePlayerDataContext();
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const form = useForm<z.infer<typeof gamificationFormSchema>>({
        resolver: zodResolver(gamificationFormSchema),
        defaultValues: {
            progress_feedback_intensity: 'default',
        },
    });

    useEffect(() => {
        if (profile?.user_settings?.gamification) {
            form.reset({
                progress_feedback_intensity: profile.user_settings.gamification.progress_feedback_intensity || 'default',
            });
        }
    }, [profile, form, isDataLoaded]);

    const onSubmit = async (data: z.infer<typeof gamificationFormSchema>) => {
        setIsSaving(true);
        try {
            const updatedProfile = {
                ...profile,
                user_settings: {
                    ...profile.user_settings,
                    gamification: {
                        ...profile.user_settings?.gamification,
                        ...data,
                    }
                }
            };
            await persistData('profile', updatedProfile);
            toast({
                title: "Preferências de Gamificação Salvas!",
                description: "As suas personalizações foram guardadas com sucesso.",
            });
            form.reset(data);
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
        } catch (error) {
            console.error("Erro ao salvar preferências de gamificação:", error);
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
                        <CardTitle className={isMobile ? "text-lg" : ""}>Gamificação</CardTitle>
                        <CardDescription className={isMobile ? "text-xs" : ""}>
                            Personalize os elementos lúdicos e de recompensa da sua experiência no Sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className={cn("space-y-6", isMobile && "space-y-4 p-3")}>
                       <FormField
                            control={form.control}
                            name="progress_feedback_intensity"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel className={isMobile ? "text-sm" : ""}>Intensidade do Feedback de Progresso</FormLabel>
                                <FormDescription className={isMobile ? "text-xs" : ""}>
                                    Escolha o quão "celebratório" o sistema deve ser ao completar missões ou subir de nível.
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
                                                )} data-state={field.value === 'subtle' ? 'checked' : 'unchecked'} onClick={() => field.onChange('subtle')}>
                                                    <RadioGroupItem value="subtle" id="intensity-subtle" className="sr-only"/>
                                                    <FormLabel htmlFor="intensity-subtle" className={cn("font-normal cursor-pointer w-full text-center", isMobile ? "text-xs" : "")}>
                                                        Subtil
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
                                                    <RadioGroupItem value="default" id="intensity-default" className="sr-only"/>
                                                    <FormLabel htmlFor="intensity-default" className={cn("font-normal cursor-pointer w-full text-center", isMobile ? "text-xs" : "")}>
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
                                                )} data-state={field.value === 'celebratory' ? 'checked' : 'unchecked'} onClick={() => field.onChange('celebratory')}>
                                                    <RadioGroupItem value="celebratory" id="intensity-celebratory" className="sr-only"/>
                                                    <FormLabel htmlFor="intensity-celebratory" className={cn("font-normal cursor-pointer w-full text-center", isMobile ? "text-xs" : "")}>
                                                        Celebratório
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
                         <Separator className={isMobile ? "my-2" : ""} />
                         <div className={cn(
                            "flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg",
                            isMobile ? "h-32 p-4 text-xs" : "h-48 p-8"
                         )}>
                            <p className={cn("font-semibold", isMobile ? "text-sm" : "text-lg")}>Mais Opções em Breve</p>
                            <p className={cn("mt-1", isMobile ? "text-xs" : "text-sm")}>
                                Estamos a trabalhar para trazer mais personalizações, como emblemas, títulos e temas sazonais.
                            </p>
                        </div>
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