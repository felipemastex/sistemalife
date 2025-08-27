
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

const SkillDungeonView = ({ skillId, onExit }) => {
    const { skills, persistData } = usePlayerDataContext();
    const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
    const { toast } = useToast();

    const skill = useMemo(() => skills.find(s => s.id === skillId), [skills, skillId]);
    
    const handleGenerateChallenge = async () => {
        if (!skill) return;
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
            
            toast({ title: "Novo Desafio da Masmorra!", description: `O desafio "${result.challengeName}" está pronto.` });

        } catch (error) {
            console.error("Error generating dungeon challenge:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível gerar um novo desafio. Tente novamente.' });
        } finally {
            setIsLoadingChallenge(false);
        }
    };
    
    if (!skill) {
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
                    Voltar para Habilidades
                </Button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <KeySquare className="h-8 w-8 text-primary" />
                            <div>
                                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Masmorra: {skill.nome}</h1>
                                <p className="text-muted-foreground mt-1">
                                    Aprimore a sua habilidade com desafios práticos e focados.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                         <Card className="flex-grow bg-card/80 p-3 rounded-lg border border-border">
                             <div className="text-center">
                                <p className="font-bold text-2xl leading-none">{dungeon?.current_room || 1}</p>
                                <p className="text-xs text-muted-foreground">Sala Atual</p>
                            </div>
                        </Card>
                         <Card className="flex-grow bg-card/80 p-3 rounded-lg border border-border">
                             <div className="text-center">
                                <p className="font-bold text-2xl leading-none">{dungeon?.highest_room || 1}</p>
                                <p className="text-xs text-muted-foreground">Recorde</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex-grow flex items-center justify-center">
                {activeChallenge ? (
                    <Card className="w-full max-w-3xl">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{activeChallenge.challengeName}</CardTitle>
                                <span className="text-primary font-bold text-sm">+{activeChallenge.xpReward} XP de Habilidade</span>
                            </div>
                            <CardDescription>{activeChallenge.challengeDescription}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Label htmlFor="challenge-submission" className="font-semibold text-muted-foreground">Prova de Conclusão</Label>
                             <Textarea
                                id="challenge-submission"
                                placeholder={activeChallenge.successCriteria}
                                className="mt-2 min-h-[150px] font-mono text-sm"
                            />
                        </CardContent>
                        <CardFooter className="flex-col sm:flex-row gap-2">
                             <Button variant="outline" className="w-full sm:w-auto">Desistir (Perde 1 Vida)</Button>
                             <Button className="w-full sm:w-auto">Completar Desafio</Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="text-center">
                        <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold">Sala {dungeon?.current_room || 1} Concluída!</h2>
                        <p className="text-muted-foreground mt-2 mb-6">Você está pronto para o próximo desafio.</p>
                        <Button onClick={handleGenerateChallenge} disabled={isLoadingChallenge}>
                            {isLoadingChallenge ? <LoaderCircle className="animate-spin mr-2"/> : <Sparkles className="mr-2 h-4 w-4" />}
                            Gerar Desafio
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillDungeonView;
