
"use client";

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, KeySquare, Sparkles, LoaderCircle, CheckCircle, Trophy, BookCopy } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { generateSkillDungeonChallenge } from '@/ai/flows/generate-skill-dungeon-challenge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const SkillDungeonView = ({ skillId, onExit }) => {
    const { profile, skills, persistData, completeDungeonChallenge } = usePlayerDataContext();
    const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
    const [submission, setSubmission] = useState('');
    const { toast } = useToast();

    const skill = useMemo(() => skills.find(s => s.id === skillId), [skills, skillId]);
    
    const handleGenerateChallenge = async (isGivingUp = false) => {
        if (!skill || !profile) return;

        if (isGivingUp) {
            toast({ variant: 'destructive', title: 'Você Desistiu!', description: 'Um novo desafio será gerado para esta sala.' });
        }

        setIsLoadingChallenge(true);
        try {
            const result = await generateSkillDungeonChallenge({
                skillName: skill.nome,
                skillDescription: skill.descricao,
                skillLevel: skill.nivel_atual,
                dungeonRoomLevel: skill.dungeon.current_room,
                previousChallenges: skill.dungeon.completed_challenges?.map(c => c.challengeName) || [],
            });

            const updatedSkill = {
                ...skill,
                dungeon: {
                    ...skill.dungeon,
                    active_challenge: result,
                }
            };
            
            const updatedSkills = skills.map(s => s.id === skillId ? updatedSkill : s);
            await persistData('skills', updatedSkills);
            
            if(!isGivingUp) {
                toast({ title: "Novo Desafio da Masmorra!", description: `O desafio "${result.challengeName}" está pronto.` });
            }

        } catch (error) {
            console.error("Error generating dungeon challenge:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível gerar um novo desafio. Tente novamente.' });
        } finally {
            setIsLoadingChallenge(false);
        }
    };
    
    const handleCompleteChallenge = async () => {
        if (!submission.trim()) {
            toast({ variant: 'destructive', title: 'Submissão Vazia', description: 'Você precisa de fornecer uma prova de conclusão.' });
            return;
        }
        await completeDungeonChallenge(skillId);
        setSubmission('');
    }

    if (!skill || !profile) {
        return (
            <div className="p-4 md:p-6 h-full flex flex-col items-center justify-center text-center">
                <p className="text-destructive text-lg">Erro: Habilidade não encontrada.</p>
                <Button onClick={onExit} className="mt-4">Voltar</Button>
            </div>
        );
    }

    const { dungeon } = skill;
    const activeChallenge = dungeon?.active_challenge;
    
    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                <Button onClick={onExit} variant="ghost" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Sair da Masmorra
                </Button>
                 <div className="text-center mb-8">
                    <div className="inline-block bg-primary/10 p-3 rounded-full border-2 border-primary/20 mb-2">
                        <KeySquare className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Masmorra: {skill.nome}</h1>
                    <p className="text-muted-foreground mt-1">
                        Aprimore a sua habilidade com desafios práticos e focados.
                    </p>
                </div>
            </div>

            <div className="mt-8 flex-grow flex items-center justify-center">
                {activeChallenge ? (
                    <Card className="w-full max-w-3xl">
                        <CardHeader className="text-center">
                             <CardDescription>Sala {dungeon?.current_room || 1}</CardDescription>
                            <div className="flex justify-center items-center gap-4">
                                <CardTitle>{activeChallenge.challengeName}</CardTitle>
                            </div>
                             <span className="text-primary font-bold text-sm">+{activeChallenge.xpReward} XP de Habilidade</span>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-center text-muted-foreground">{activeChallenge.challengeDescription}</p>
                             <div className="pt-4">
                                <Label htmlFor="challenge-submission" className="font-semibold text-muted-foreground">Prova de Conclusão</Label>
                                <Textarea
                                    id="challenge-submission"
                                    placeholder={activeChallenge.successCriteria}
                                    className="mt-2 min-h-[150px] font-mono text-sm"
                                    value={submission}
                                    onChange={(e) => setSubmission(e.target.value)}
                                />
                             </div>
                        </CardContent>
                        <CardFooter className="flex-col sm:flex-row gap-2">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="outline" className="w-full sm:w-auto">Desistir do Desafio</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Desistir do Desafio?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Isto irá descartar o desafio atual e gerar um novo para esta sala. Tem a certeza?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleGenerateChallenge(true)}>Sim, Desistir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                             <Button className="w-full sm:w-auto" onClick={handleCompleteChallenge} disabled={!submission.trim()}>Completar Desafio</Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="text-center">
                        <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold">Sala {dungeon?.current_room || 1} Concluída!</h2>
                        <p className="text-muted-foreground mt-2 mb-6">Você está pronto para o próximo desafio.</p>
                        <Button onClick={() => handleGenerateChallenge(false)} disabled={isLoadingChallenge}>
                            {isLoadingChallenge ? <LoaderCircle className="animate-spin mr-2"/> : <Sparkles className="mr-2 h-4 w-4" />}
                            Gerar Próximo Desafio
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillDungeonView;
