

"use client";

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, KeySquare, Sparkles, LoaderCircle, CheckCircle, Trophy } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const SkillDungeonView = ({ onExit }) => {
    const { profile, skills, generateDungeonChallenge, completeDungeonChallenge, clearDungeonSession } = usePlayerDataContext();
    const [isLoading, setIsLoading] = useState(false);
    const [submission, setSubmission] = useState('');
    const { toast } = useToast();

    const dungeonSession = profile?.dungeon_session;
    const skill = useMemo(() => skills.find(s => s.id === dungeonSession?.skillId), [skills, dungeonSession]);
    
    const handleGenerateChallenge = useCallback(async () => {
        if (!skill) return;
        setIsLoading(true);
        try {
            await generateDungeonChallenge(skill.id);
            toast({ title: "Novo Desafio Gerado!", description: "O seu próximo desafio na masmorra está pronto."});
        } catch (error) {
            console.error("Error generating dungeon challenge:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível gerar um novo desafio. Tente novamente.' });
        } finally {
            setIsLoading(false);
        }
    }, [skill, generateDungeonChallenge, toast]);

    const handleGiveUp = async () => {
        if (!dungeonSession?.challenge) return;
        toast({ variant: 'destructive', title: 'Você Desistiu!', description: 'Um novo desafio será gerado para esta sala.' });
        await generateDungeonChallenge(dungeonSession.skillId);
    }

    const handleCompleteChallenge = async () => {
        if (!submission.trim()) {
            toast({ variant: 'destructive', title: 'Submissão Vazia', description: 'Você precisa de fornecer uma prova de conclusão.' });
            return;
        }
        setIsLoading(true);
        await completeDungeonChallenge(submission);
        setSubmission('');
        setIsLoading(false);
    }

    if (!dungeonSession || !skill) {
        return (
            <div className="p-4 md:p-6 h-full flex flex-col items-center justify-center text-center">
                <p className="text-destructive text-lg">Erro: Sessão da masmorra inválida.</p>
                <Button onClick={onExit} className="mt-4">Voltar</Button>
            </div>
        );
    }
    
    const { roomLevel, challenge } = dungeonSession;

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                <Button onClick={clearDungeonSession} variant="ghost" className="mb-4">
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
                {isLoading ? (
                     <div className="text-center">
                        <LoaderCircle className="h-16 w-16 text-primary animate-spin mx-auto mb-4"/>
                        <h2 className="text-2xl font-bold">Processando...</h2>
                    </div>
                ) : challenge ? (
                    <Card className="w-full max-w-3xl">
                        <CardHeader className="text-center">
                             <CardDescription>Sala {roomLevel}</CardDescription>
                            <div className="flex justify-center items-center gap-4">
                                <CardTitle>{challenge.challengeName}</CardTitle>
                            </div>
                             <span className="text-primary font-bold text-sm">+{challenge.xpReward} XP de Habilidade</span>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-center text-muted-foreground">{challenge.challengeDescription}</p>
                             <div className="pt-4">
                                <Label htmlFor="challenge-submission" className="font-semibold text-muted-foreground">Prova de Conclusão</Label>
                                <Textarea
                                    id="challenge-submission"
                                    placeholder={challenge.successCriteria}
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
                                        <AlertDialogAction onClick={handleGiveUp}>Sim, Desistir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                             <Button className="w-full sm:w-auto" onClick={handleCompleteChallenge} disabled={!submission.trim()}>Completar Desafio</Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="text-center">
                        <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold">Sala {roomLevel -1} Concluída!</h2>
                        <p className="text-muted-foreground mt-2 mb-6">Você está pronto para o próximo desafio.</p>
                        <Button onClick={handleGenerateChallenge}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Ir para a Sala {roomLevel}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillDungeonView;


    