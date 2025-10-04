"use client";

import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Circle, CheckCircle, Timer, Sparkles, History, GitMerge, LifeBuoy, Link, Undo2, ChevronsDown, ChevronsUp, RefreshCw, Gem, Plus, Eye, EyeOff, LoaderCircle, AlertTriangle, Search, PlusCircle, Trophy, MessageSquare, Lock, Edit, Wand2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { MissionDetailsDialog } from './missions/MissionDetailsDialog';
import { MissionCompletionAnimation } from './missions/MissionCompletionAnimation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { MissionStatsPanel } from './missions/MissionStatsPanel';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { differenceInDays, parseISO, isToday, endOfDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';
import { generateNextDailyMission } from '@/ai/flows/generate-next-daily-mission';
import { useIsMobile } from '@/hooks/use-mobile';

// Type definitions
interface SubTask {
  name: string;
  target: number;
  unit: string;
  current: number;
}

// Add the Mission interface that matches the one in MissionDetailsDialog
interface Mission {
  id?: string | number;
  nome: string;
  descricao: string;
  xp_conclusao: number;
  fragmentos_conclusao: number;
  concluido?: boolean;
  tipo?: string;
  subTasks: SubTask[];
  learningResources?: string[];
  isManual?: boolean;
}

interface DailyMission {
  id: string | number;
  nome: string;
  descricao: string;
  xp_conclusao: number;
  fragmentos_conclusao: number;
  concluido: boolean;
  tipo: string;
  subTasks: SubTask[];
  learningResources?: string[];
  completed_at?: string;
}

interface RankedMission {
  id: string | number;
  nome: string;
  descricao: string;
  concluido: boolean;
  rank: string;
  level_requirement: number;
  meta_associada: string;
  total_missoes_diarias: number;
  ultima_missao_concluida_em: string | null;
  missoes_diarias: DailyMission[];
  isManual?: boolean;
  subTasks?: SubTask[];
}

interface Meta {
  id: string | number;
  nome: string;
  prazo?: string;
  concluida: boolean;
}

interface Profile {
  nivel: number;
  xp: number;
  xp_para_proximo_nivel: number;
  user_settings: {
    layout_density: string;
    mission_view_style: string;
  };
  manual_missions: RankedMission[];
}

type FeedbackType = 'hint' | 'too_hard' | 'too_easy';
type DifficultyType = 'too_easy' | 'perfect' | 'too_hard';

interface FeedbackModalState {
  open: boolean;
  mission: DailyMission | null;
  type: FeedbackType | null;
}

interface ContributionModalState {
  open: boolean;
  subTask: SubTask | null;
  mission: DailyMission | null;
}

interface MissionCompletionFeedbackState {
  open: boolean;
  missionName: string;
  rankedMissionId: string | number | null;
  dailyMissionId?: string | number | null;
  subTask?: SubTask | null;
  amount?: number | null;
}

interface AnimationState {
  showAnimation: boolean;
  missionName: string;
  xpGained: number;
  fragmentsGained: number;
  levelUp: boolean;
  newLevel: number;
}

interface DialogState {
  open: boolean;
  mission: DailyMission | RankedMission | null;
  isManual: boolean;
}

interface MissionFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedbackType: FeedbackType, userText: string) => void;
  mission: DailyMission;
  feedbackType: FeedbackType;
}

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subTask: SubTask;
  onContribute: (amount: number) => void;
}

interface MissionCompletionFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (feedbackData: { difficulty: DifficultyType; comment?: string }) => void;
  missionName: string;
}

interface TriggerWrapperProps {
  children: React.ReactNode;
}

// Helper Dialog for getting user feedback
const MissionFeedbackDialog: React.FC<MissionFeedbackDialogProps> = ({ open, onOpenChange, onSubmit, mission, feedbackType }) => {
    const [feedbackText, setFeedbackText] = useState('');
    const [loading, setLoading] = useState(false);
    const isMobile = useIsMobile();

    const dialogTitles: Record<FeedbackType, string> = {
        'hint': 'Precisa de uma Dica?',
        'too_hard': 'Missão Muito Difícil?',
        'too_easy': 'Missão Muito Fácil?'
    };

    const dialogDescriptions: Record<FeedbackType, string> = {
        'hint': 'Descreva onde você está bloqueado e o Sistema fornecerá uma pista.',
        'too_hard': 'Descreva por que a missão está muito difícil. O Sistema irá ajustar o próximo passo.',
        'too_easy': 'Descreva por que a missão foi muito fácil para que o Sistema possa aumentar o desafio.'
    };

    const handleSubmit = async () => {
        setLoading(true);
        await onSubmit(feedbackType, feedbackText);
        setLoading(false);
        onOpenChange(false);
        setFeedbackText('');
    };
    
    if (!mission || !feedbackType) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if(!isOpen) setFeedbackText(''); onOpenChange(isOpen);}}>
            <DialogContent className={isMobile ? "max-w-[95vw]" : ""}>
                <DialogHeader>
                    <DialogTitle className={isMobile ? "text-lg" : ""}>{dialogTitles[feedbackType]}</DialogTitle>
                    <DialogDescription className={isMobile ? "text-sm" : ""}>{dialogDescriptions[feedbackType]}</DialogDescription>
                </DialogHeader>
                <div className={cn("py-4", isMobile ? "py-2" : "")}>
                    <Textarea
                        placeholder="Forneça mais detalhes aqui..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        disabled={loading}
                        className={isMobile ? "text-sm" : ""}
                    />
                </div>
                <DialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className={isMobile ? "h-8 text-sm" : ""}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className={isMobile ? "h-8 text-sm" : ""}>
                        {loading ? "A enviar..." : "Enviar Feedback"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ContributionDialog: React.FC<ContributionDialogProps> = ({ open, onOpenChange, subTask, onContribute }) => {
    const [amount, setAmount] = useState('');
    const isMobile = useIsMobile();
    
    if (!subTask) return null;

    const remaining = subTask.target - (subTask.current || 0);

    const handleContribute = () => {
        const contribution = parseInt(amount, 10);
        if (!isNaN(contribution) && contribution > 0) {
            onContribute(contribution);
            onOpenChange(false);
            setAmount('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) setAmount(''); onOpenChange(isOpen); }}>
            <DialogContent className={isMobile ? "max-w-[95vw]" : ""}>
                <DialogHeader>
                    <DialogTitle className={isMobile ? "text-lg" : ""}>Contribuir para: {subTask.name}</DialogTitle>
                    <DialogDescription className={isMobile ? "text-sm" : ""}>
                        Insira a quantidade que você concluiu. O seu esforço fortalece o seu progresso.
                    </DialogDescription>
                </DialogHeader>
                <div className={cn("py-4 space-y-4", isMobile ? "py-2 space-y-2" : "")}>
                    <p className={cn("text-center bg-secondary p-2 rounded-md", isMobile ? "text-xs p-1" : "text-sm p-2")}>
                        Progresso atual: <span className="font-bold text-primary">{subTask.current || 0} / {subTask.target}</span>
                    </p>
                    <div>
                        <Label htmlFor="contribution-amount" className={isMobile ? "text-sm" : ""}>Nova Contribuição</Label>
                        <Input
                            id="contribution-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Ex: 5 (Máx: ${remaining})`}
                            min="1"
                            max={remaining}
                            className={isMobile ? "h-8 text-sm" : ""}
                        />
                    </div>
                </div>
                <DialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? "h-8 text-sm" : ""}>Cancelar</Button>
                    <Button onClick={handleContribute} disabled={!amount || parseInt(amount, 10) <= 0 || parseInt(amount, 10) > remaining} className={isMobile ? "h-8 text-sm" : ""}>
                        Contribuir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const MissionCompletionFeedbackDialog: React.FC<MissionCompletionFeedbackDialogProps> = ({ isOpen, onClose, onSubmitFeedback, missionName }) => {
  const [difficulty, setDifficulty] = useState<DifficultyType | ''>('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = async () => {
    if (!difficulty) return;
    
    setIsSubmitting(true);
    
    const feedbackData = {
      difficulty: difficulty as DifficultyType,
      comment: comment.trim() || undefined,
    };
    
    // Reset form and close dialog immediately
    setDifficulty('');
    setComment('');
    setIsSubmitting(false);
    onClose();
    
    // Send feedback in background
    onSubmitFeedback(feedbackData);
  };

  const handleClose = () => {
    setDifficulty('');
    setComment('');
    onClose();
  };

  const difficultyOptions = [
    {
      value: 'too_easy',
      label: 'Muito Fácil',
      description: 'A missão foi simples demais, preciso de mais desafio (+1,5% de dificuldade)',
      icon: <TrendingDown className={cn("h-4 w-4 text-green-500", isMobile ? "h-3 w-3" : "h-4 w-4")} />,
      color: 'border-green-200 hover:border-green-400',
    },
    {
      value: 'perfect',
      label: 'Perfeita',
      description: 'A dificuldade estava ideal para o meu nível (+1% de dificuldade)',
      icon: <CheckCircle2 className={cn("h-4 w-4 text-blue-500", isMobile ? "h-3 w-3" : "h-4 w-4")} />,
      color: 'border-blue-200 hover:border-blue-400',
    },
    {
      value: 'too_hard',
      label: 'Muito Difícil',
      description: 'A missão foi desafiadora demais, preciso de passos menores (-0,5% de dificuldade)',
      icon: <TrendingUp className={cn("h-4 w-4 text-red-500", isMobile ? "h-3 w-3" : "h-4 w-4")} />,
      color: 'border-red-200 hover:border-red-400',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("max-w-md", isMobile ? "max-w-[95vw]" : "")}>
        <DialogHeader className="text-center">
          <DialogTitle className={cn("flex items-center justify-center gap-2", isMobile ? "text-lg" : "")}>
            <MessageSquare className={cn("text-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            Feedback da Missão
          </DialogTitle>
          <DialogDescription className={isMobile ? "text-sm" : ""}>
            Como foi completar "<span className="font-semibold text-foreground">{missionName}</span>"?
          </DialogDescription>
        </DialogHeader>
        
        <div className={cn("py-4 space-y-4", isMobile ? "py-2 space-y-2" : "")}>
          <div>
            <Label className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>Dificuldade da Missão</Label>
            <RadioGroup value={difficulty as string} onValueChange={(value) => setDifficulty(value as DifficultyType | '')} className={cn("mt-2", isMobile ? "mt-1" : "")}>
              {difficultyOptions.map((option) => (
                <div 
                  key={option.value} 
                  className={cn(`flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${option.color} ${difficulty === option.value ? 'bg-secondary/50' : 'hover:bg-secondary/20'}`, isMobile ? "p-2 space-x-2" : "p-3 space-x-3")}
                  onClick={() => setDifficulty(option.value as DifficultyType | '')}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5 pointer-events-none" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <Label htmlFor={option.value} className={cn("font-normal cursor-pointer", isMobile ? "text-sm" : "")}>
                        {option.label}
                      </Label>
                    </div>
                    <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-xs")}>{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {difficulty && (
            <div className="space-y-2">
              <Label htmlFor="comment" className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                Comentário Adicional (Opcional)
              </Label>
              <Textarea
                id="comment"
                placeholder={`Descreva o que ${difficulty === 'too_easy' ? 'foi muito simples' : difficulty === 'too_hard' ? 'foi muito desafiador' : 'funcionou bem'} nesta missão...`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className={isMobile ? "text-sm" : ""}
              />
            </div>
          )}
        </div>

        <DialogFooter className={isMobile ? "flex-col gap-2" : ""}>
          <Button 
            onClick={handleSubmit}
            disabled={!difficulty || isSubmitting}
            className={cn("w-full", isMobile ? "h-8 text-sm" : "")}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MissionsView = () => {
    const { profile, missions, metas, completeMission, generatingMission, setGeneratingMission, missionFeedback, setMissionFeedback, persistData, generatePendingDailyMissions, addDailyMission, adjustDailyMission } = usePlayerDataContext() as {
        profile: Profile;
        missions: RankedMission[];
        metas: Meta[];
        completeMission: (params: { rankedMissionId: string | number; dailyMissionId: string | number; subTask: SubTask; amount: number; feedback: string | null }) => Promise<void>;
        generatingMission: string | number | null;
        setGeneratingMission: (id: string | number | null) => void;
        missionFeedback: Record<string | number, string>;
        setMissionFeedback: (missionId: string | number, feedback: string) => void;
        persistData: (key: string, data: any) => Promise<void>;
        generatePendingDailyMissions?: () => Promise<void>;
        addDailyMission: (payload: { rankedMissionId: string | number; newDailyMission: DailyMission }) => void;
        adjustDailyMission: (rankedMissionId: string | number, dailyMissionId: string | number, feedback: 'too_easy' | 'too_hard') => Promise<void>;
    };
    const [showProgressionTree, setShowProgressionTree] = useState(false);
    const [selectedGoalMissions, setSelectedGoalMissions] = useState<RankedMission[]>([]);
    const [feedbackModalState, setFeedbackModalState] = useState<FeedbackModalState>({ open: false, mission: null, type: null });
    const [contributionModalState, setContributionModalState] = useState<ContributionModalState>({ open: false, subTask: null, mission: null });
    const [missionCompletionFeedbackState, setMissionCompletionFeedbackState] = useState<MissionCompletionFeedbackState>({ 
        open: false, 
        missionName: '', 
        rankedMissionId: null 
    });
    const [animationState, setAnimationState] = useState<AnimationState>({
        showAnimation: false,
        missionName: '',
        xpGained: 0,
        fragmentsGained: 0,
        levelUp: false,
        newLevel: 0
    });

    const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [rankFilter, setRankFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('active');

    const [dialogState, setDialogState] = useState<DialogState>({ open: false, mission: null, isManual: false });
    const [isPanelVisible, setIsPanelVisible] = useState(false);

    const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

    // Mobile detection and bottom bar state
    const isMobile = useIsMobile();
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    
    const { toast } = useToast();
    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

    const layout = profile?.user_settings?.layout_density || 'default';
    const accordionSpacing = layout === 'compact' ? 'space-y-2' : layout === 'comfortable' ? 'space-y-6' : 'space-y-4';
    
     useEffect(() => {
        const calculateTimeUntilMidnight = () => {
            const now = new Date();
            const midnight = endOfDay(now); // Use date-fns for robust end of day calculation
            
            const diff = midnight.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeUntilMidnight('00:00:00');
                if (generatePendingDailyMissions) {
                    console.log("Generating pending missions...");
                    generatePendingDailyMissions();
                }
                return;
            }

            const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
            const minutes = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
            const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
            
            setTimeUntilMidnight(`${hours}:${minutes}:${seconds}`);
        };

        calculateTimeUntilMidnight();
        const timerId = setInterval(calculateTimeUntilMidnight, 1000);

        return () => clearInterval(timerId);
    }, [generatePendingDailyMissions]);

     useEffect(() => {
        // This effect ensures the dialog state is updated when the global state changes.
        if (dialogState.open && dialogState.mission) {
            let latestMissionData: RankedMission | DailyMission | undefined;
            if (dialogState.isManual) {
                latestMissionData = profile.manual_missions?.find(m => m.id === dialogState.mission?.id);
            } else {
                const rankedMission = missions.find(rm => rm.missoes_diarias.some(dm => dm.id === dialogState.mission?.id));
                latestMissionData = rankedMission?.missoes_diarias.find(dm => dm.id === dialogState.mission?.id);
            }
            
            if (latestMissionData) {
                setDialogState(prev => ({...prev, mission: latestMissionData as DailyMission | RankedMission}));
            }
        }
    }, [missions, profile.manual_missions, dialogState.open]);


    const handleToastError = (error: any, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };
    
    const handleMissionFeedback = async (mission: DailyMission, feedbackType: 'too_hard' | 'too_easy') => {
        if (!mission) return;
    
        const rankedMission = missions.find((rm: RankedMission) => rm.missoes_diarias.some((dm: DailyMission) => dm.id === mission.id));
        if (!rankedMission) return;
    
        await adjustDailyMission(rankedMission.id, mission.id, feedbackType);
    };
    
    const handleMissionCompletionFeedback = async (feedbackData: { difficulty: DifficultyType; comment?: string }) => {
        const { rankedMissionId, dailyMissionId, subTask, amount } = missionCompletionFeedbackState;
        
        if (profile?.user_settings?.mission_view_style === 'popup') {
            setDialogState({ open: false, mission: null, isManual: false });
        }
        
        let feedbackText = null;
        
        if (feedbackData.difficulty !== 'perfect') {
            const difficultyText: Record<DifficultyType, string> = {
                'too_easy': 'muito fácil',
                'too_hard': 'muito difícil',
                'perfect': 'perfeita'
            };
            const selectedDifficultyText = difficultyText[feedbackData.difficulty];

            feedbackText = `O utilizador considerou a missão ${selectedDifficultyText}`;
            if (feedbackData.comment) {
                feedbackText += `. Comentário adicional: "${feedbackData.comment}"`;
            }
        } else {
            // For perfect rating, we still want to pass the feedback to adjust difficulty by +1%
            feedbackText = "O utilizador considerou a missão perfeita. Ajuste a dificuldade da próxima missão com um aumento de +1%.";
            if (feedbackData.comment) {
                feedbackText += ` Comentário adicional: "${feedbackData.comment}"`;
            }
        }
        
        const missionToComplete = missions.find((rm: RankedMission) => rm.id === rankedMissionId)?.missoes_diarias?.find((dm: DailyMission) => dm.id === dailyMissionId);
        const currentLevel = profile.nivel;
        
        if (missionToComplete) {
            const currentXP = profile.xp || 0;
            const xpForNextLevel = profile.xp_para_proximo_nivel || 100;
            const willLevelUp = (currentXP + missionToComplete.xp_conclusao) >= xpForNextLevel;
            
            setAnimationState({
                showAnimation: true,
                missionName: missionToComplete.nome,
                xpGained: missionToComplete.xp_conclusao,
                fragmentsGained: missionToComplete.fragmentos_conclusao || 0,
                levelUp: willLevelUp,
                newLevel: willLevelUp ? currentLevel + 1 : currentLevel
            });
        }
        
        setTimeout(async () => {
            if (rankedMissionId !== null && dailyMissionId !== null && subTask !== null && amount !== null) {
                await completeMission({ 
                    rankedMissionId: rankedMissionId as string | number, 
                    dailyMissionId: dailyMissionId as string | number, 
                    subTask: subTask as SubTask, 
                    amount: amount as number, 
                    feedback: feedbackText 
                });
            }
        }, 500);
        
        setTimeout(() => {
            if (feedbackData.difficulty === 'perfect') {
                toast({ 
                    title: "Missão Concluída!", 
                    description: "Obrigado pelo feedback! A próxima missão manterá a dificuldade similar com um ajuste de +1%." 
                });
            } else {
                const adjustmentText = feedbackData.difficulty === 'too_easy' 
                    ? 'mais desafiadora com um aumento de +1,5% de dificuldade' 
                    : 'mais acessível com uma redução de -0,5% de dificuldade';
                toast({ 
                    title: "Missão Concluída!", 
                    description: `Obrigado pelo feedback! A próxima missão será ${adjustmentText}.` 
                });
            }
        }, 4000);
        
        setMissionCompletionFeedbackState({ open: false, missionName: '', rankedMissionId: null });
    };
    
    const handleShowProgression = (clickedMission: RankedMission) => {
        const goalMissions = missions
            .filter((m: RankedMission) => m.meta_associada === clickedMission.meta_associada)
            .sort((a: RankedMission, b: RankedMission) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
        setSelectedGoalMissions(goalMissions);
        setShowProgressionTree(true);
    };

    const getRankColor = (rank: string) => {
        switch (rank) {
            case 'F': return 'text-gray-400';
            case 'E': return 'text-green-400';
            case 'D': return 'text-cyan-400';
            case 'C': return 'text-blue-400';
            case 'B': return 'text-purple-400';
            case 'A': return 'text-red-400';
            case 'S': return 'text-yellow-400';
            case 'SS': return 'text-orange-400';
            case 'SSS': return 'text-pink-400';
            case 'M': return 'text-slate-400';
            default: return 'text-gray-500';
        }
    }

    const onContributeToQuest = (subTask: SubTask, amount: number, missionToUpdate: DailyMission | RankedMission) => {
        const isManual = 'isManual' in missionToUpdate && missionToUpdate.isManual;
        if (isManual) {
            const updatedManualMissions = (profile.manual_missions || []).map((m: RankedMission) => 
                m.id === missionToUpdate.id 
                ? {
                    ...m,
                    subTasks: m.subTasks?.map((st: SubTask) => 
                        st.name === subTask.name 
                        ? {...st, current: Math.min(st.target, (st.current || 0) + amount) } 
                        : st
                    ) || []
                }
                : m
            );
            persistData('profile', { ...profile, manual_missions: updatedManualMissions });
        } else {
            const dailyMission = missionToUpdate as DailyMission;
            const rankedMission = missions.find((rm: RankedMission) => rm.missoes_diarias.some((dm: DailyMission) => dm.id === dailyMission.id));
            if(rankedMission) {
                const tempCurrent = (subTask.current || 0) + amount;
                const willCompleteMission = dailyMission.subTasks?.every((st: SubTask) => {
                    if (st.name === subTask.name) {
                        return tempCurrent >= st.target;
                    }
                    return (st.current || 0) >= st.target;
                });
                
                if (willCompleteMission) {
                    setMissionCompletionFeedbackState({
                        open: true,
                        missionName: dailyMission.nome,
                        rankedMissionId: rankedMission.id,
                        dailyMissionId: dailyMission.id,
                        subTask,
                        amount
                    });
                } else {
                    completeMission({ rankedMissionId: rankedMission.id, dailyMissionId: dailyMission.id, subTask, amount, feedback: null });
                }
            }
        }
    };

    const handleSaveManualMission = (missionData: RankedMission) => {
        const manualMissions = profile.manual_missions || [];
        let updatedMissions;

        if (missionData.id) {
            updatedMissions = manualMissions.map((m: RankedMission) => m.id === missionData.id ? missionData : m);
        } else {
            const newMission = { ...missionData, id: `manual_${Date.now()}`, concluido: false };
            updatedMissions = [...manualMissions, newMission];
        }
        persistData('profile', { ...profile, manual_missions: updatedMissions });
        setDialogState({ open: false, mission: null, isManual: false });
    }

    const handleDeleteManualMission = (missionId: string | number) => {
        const updatedMissions = (profile.manual_missions || []).filter((m: RankedMission) => m.id !== missionId);
        persistData('profile', { ...profile, manual_missions: updatedMissions });
        setDialogState({ open: false, mission: null, isManual: false });
        toast({ title: 'Missão Manual Removida', description: 'A sua missão personalizada foi excluída com sucesso.'});
    }

    const handleUnlockMission = async (mission: RankedMission) => {
        if (!mission) return;
        setGeneratingMission(mission.id);
        try {
            const meta = metas.find(m => m.nome === mission.meta_associada);
            const history = mission.missoes_diarias.filter((d: DailyMission) => d.concluido).map((d: DailyMission) => `- ${d.nome}`).join('\n');
            const feedbackForAI = missionFeedback[mission.id] ?? `Esta é uma missão de qualificação para um rank superior. Gere uma missão diária desafiadora, mas alcançável, para provar que o Caçador está pronto para este novo nível de dificuldade.`;

            const result = await generateNextDailyMission({
                rankedMissionName: mission.nome,
                metaName: meta?.nome || "Objetivo geral",
                goalDeadline: meta?.prazo,
                history: history || `O utilizador está a tentar uma missão de rank superior.`,
                userLevel: profile.nivel,
                feedback: feedbackForAI,
            });
            
            const newDailyMission = {
                id: Date.now(),
                nome: result.nextMissionName,
                descricao: result.nextMissionDescription,
                xp_conclusao: result.xp,
                fragmentos_conclusao: result.fragments,
                concluido: false,
                tipo: 'diaria',
                learningResources: result.learningResources || [],
                subTasks: result.subTasks.map(st => ({...st, current: 0, unit: st.unit || ''})),
            };
            
            addDailyMission({ rankedMissionId: mission.id, newDailyMission });
            toast({ title: "Desafio Aceite!", description: `A sua missão de qualificação "${newDailyMission.nome}" está pronta.` });
        } catch (error) {
            handleToastError(error, 'Não foi possível gerar a missão de qualificação.');
        } finally {
            setGeneratingMission(null);
        }
    };
    
    const visibleMissions = useMemo(() => {
        const activeEpicMissions = new Map<string, RankedMission>();

        for (const mission of missions) {
            if (mission.concluido) continue;
            
            const existingMissionForGoal = activeEpicMissions.get(mission.meta_associada);
            const currentRankIndex = existingMissionForGoal ? rankOrder.indexOf(existingMissionForGoal.rank) : -1;
            const newRankIndex = rankOrder.indexOf(mission.rank);
            
            if (!existingMissionForGoal || newRankIndex < currentRankIndex) {
                 activeEpicMissions.set(mission.meta_associada, mission);
            }
        }
        
        const completedEpicMissions = missions.filter((m: RankedMission) => m.concluido);
        const manualMissions = (profile.manual_missions || []).map((m: RankedMission) => ({...m, isManual: true, rank: 'M'}));

        let missionsToDisplay = [];
        if (statusFilter === 'active') {
            missionsToDisplay = [...Array.from(activeEpicMissions.values()), ...manualMissions.filter((m: RankedMission) => !m.concluido)];
        } else if (statusFilter === 'completed') {
            missionsToDisplay = [...completedEpicMissions, ...manualMissions.filter((m: RankedMission) => m.concluido)];
        } else {
            missionsToDisplay = [...Array.from(activeEpicMissions.values()), ...completedEpicMissions, ...manualMissions];
        }

        if (rankFilter !== 'all') {
            if (rankFilter === 'M') {
                missionsToDisplay = missionsToDisplay.filter((m: RankedMission) => m.isManual);
            } else {
                missionsToDisplay = missionsToDisplay.filter((m: RankedMission) => m.rank === rankFilter);
            }
        }
        
        if (searchTerm) {
            missionsToDisplay = missionsToDisplay.filter((m: RankedMission) => m.nome.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return missionsToDisplay.sort((a, b) => {
            if (a.concluido !== b.concluido) {
                return a.concluido ? 1 : -1;
            }
            return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
        });

    }, [missions, statusFilter, rankFilter, searchTerm, rankOrder, profile.manual_missions]);

    const missionViewStyle = profile?.user_settings?.mission_view_style || 'inline';
    
    const renderActiveMissionContent = (mission: RankedMission) => {
        const activeDailyMission = mission.isManual ? mission : mission.missoes_diarias?.find((d: DailyMission) => !d.concluido);
        const sortedDailyMissions = mission.isManual ? null : [...mission.missoes_diarias].sort((a, b) => (a.concluido ? 1 : -1) - (b.concluido ? 1 : -1) || 0);
        
        if (generatingMission === mission.id) {
            return (
                <div className={cn("bg-secondary/30 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center text-center animate-in fade-in duration-300", isMobile ? "p-3 h-32" : "p-4 h-48")}>
                    <Sparkles className={cn("text-primary animate-pulse-slow mb-4", isMobile ? "h-8 w-8" : "h-10 w-10")}/>
                    <p className={cn("font-bold text-foreground", isMobile ? "text-base" : "text-lg")}>A gerar nova missão...</p>
                    <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>O Sistema está a preparar o seu próximo desafio.</p>
                </div>
            );
        }
        
        if (activeDailyMission) {
            return (
                <div className={cn("rounded-lg animate-in fade-in-50 slide-in-from-top-4 duration-500 bg-secondary/50 border-l-4 border-primary overflow-x-hidden", isMobile ? "p-2" : "p-2 md:p-4")}>
                    <div className={cn("flex flex-col gap-2", isMobile ? "md:flex-row md:items-center" : "md:flex-row md:items-center")}>
                        <div className="flex-grow min-w-0">
                            <p className={cn("font-bold text-foreground", isMobile ? "text-base" : "text-lg")}>{activeDailyMission.nome}</p>
                            <p className={cn("text-muted-foreground mt-1", isMobile ? "text-xs" : "text-sm")}>{activeDailyMission.descricao}</p>
                        </div>
                        <div className={cn("text-right ml-0 flex-shrink-0 flex items-center gap-2", isMobile ? "md:ml-2" : "md:ml-4")}>
                            <div className="flex flex-col items-end">
                                {activeDailyMission && 'xp_conclusao' in activeDailyMission && (
                                <p className={cn("font-semibold text-primary", isMobile ? "text-xs" : "text-sm")}>+{activeDailyMission.xp_conclusao} XP</p>
                            )}
                            {activeDailyMission && 'fragmentos_conclusao' in activeDailyMission && (
                                <p className={cn("font-semibold text-amber-500 flex items-center", isMobile ? "text-xs" : "text-sm")}>
                                    <Gem className={cn("mr-1", isMobile ? "w-3 h-3" : "w-4 h-4")} />
                                    +{activeDailyMission.fragmentos_conclusao || 0}
                                </p>
                            )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className={cn("text-muted-foreground hover:text-primary", isMobile ? "h-6 w-6" : "h-8 w-8")} aria-label="Opções da missão">
                                        <Wand2 className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                     <DropdownMenuItem onSelect={() => handleMissionFeedback(activeDailyMission as DailyMission, 'too_hard')}>Missão muito difícil</DropdownMenuItem>
                                     <DropdownMenuItem onSelect={() => handleMissionFeedback(activeDailyMission as DailyMission, 'too_easy')}>Missão muito fácil</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className={cn("mt-2 pt-2 border-t border-border/50 space-y-2", isMobile ? "mt-2 pt-2" : "mt-4 pt-4")}>
                        {activeDailyMission.subTasks?.map((st: SubTask, index: number) => {
                            const isCompleted = (st.current || 0) >= st.target;
                            return(
                                <div key={index} className={cn("bg-background/40 rounded-md transition-all duration-300", isCompleted && "bg-green-500/10", isMobile ? "p-1" : "p-2")}>
                                    <div className={cn("flex justify-between items-center gap-2", isMobile ? "text-xs mb-1 flex-wrap" : "text-sm mb-1")}>
                                        <p className={cn("font-semibold text-foreground flex-1 min-w-0", isCompleted && "line-through text-muted-foreground")}>
                                            <span className="truncate block">{st.name}</span>
                                        </p>
                                        <div className={cn("flex items-center gap-1 flex-shrink-0", isMobile ? "gap-1" : "gap-2")}>
                                            <span className={cn("font-mono text-muted-foreground", isMobile ? "text-xs" : "text-xs")}>[{st.current || 0}/{st.target}] {st.unit}</span>
                                            <Button size="icon" variant="outline" className={cn("text-muted-foreground hover:text-primary flex-shrink-0", isMobile ? "h-6 w-6" : "h-7 w-7")} onClick={() => setContributionModalState({open: true, subTask: st, mission: activeDailyMission as DailyMission})} disabled={isCompleted} aria-label={`Adicionar progresso para ${st.name}`}>
                                                <Plus className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                                            </Button>
                                        </div>
                                    </div>
                                    <Progress value={((st.current || 0) / st.target) * 100} className={isMobile ? "h-1.5" : "h-2"}/>
                                </div>
                            )
                        })}
                    </div>
                    {sortedDailyMissions && sortedDailyMissions.length > 1 && (
                         <Collapsible className={cn("mt-2", isMobile ? "mt-2" : "mt-4")}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className={cn("text-muted-foreground w-full", isMobile ? "text-xs" : "text-xs")}>Ver missões diárias concluídas ({sortedDailyMissions.filter(dm => dm.concluido).length})</Button>
                            </CollapsibleTrigger>
                             <CollapsibleContent className={cn("space-y-2 mt-2", isMobile ? "space-y-1 mt-1" : "")}>
                                 {sortedDailyMissions.filter(dm => dm.concluido).map((dm: DailyMission) => (
                                    <div key={dm.id} className={cn("bg-secondary/30 rounded-md flex items-center gap-2 min-w-0", isMobile ? "p-1 text-xs" : "p-2 text-sm")}>
                                        <CheckCircle className={cn("text-green-500 flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                        <span className="line-through truncate">{dm.nome}</span>
                                    </div>
                                 ))}
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                    {activeDailyMission && 'learningResources' in activeDailyMission && activeDailyMission.learningResources && activeDailyMission.learningResources.map((topic: string, index: number) => (
                        <div key={index} className={cn("flex items-center gap-2 bg-secondary p-2 rounded-md mt-2", isMobile ? "text-xs p-1" : "text-sm p-2")}>
                            <Link className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")}/>
                            <span className="truncate">Sugestão de pesquisa: {topic}</span>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className={cn("bg-secondary/30 border-2 border-dashed border-yellow-500/50 rounded-lg flex flex-col items-center justify-center text-center animate-in fade-in duration-300 overflow-x-hidden", isMobile ? "p-3 h-32" : "p-4 h-48")}>
                <Lock className={cn("text-yellow-500 mb-4", isMobile ? "h-8 w-8" : "h-10 w-10")}/>
                <p className={cn("font-bold text-foreground", isMobile ? "text-base" : "text-lg")}>Missão Bloqueada</p>
                <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>O seu nível de Caçador (Nível {profile.nivel}) é muito baixo para esta missão de Rank {mission.rank} (Requer Nível {mission.level_requirement}).</p>
                <Button variant="secondary" className={cn("mt-2", isMobile ? "text-xs h-8" : "mt-4")} onClick={() => handleUnlockMission(mission)} disabled={generatingMission === mission.id}>
                    {generatingMission === mission.id ? <LoaderCircle className="animate-spin" /> : "Tentar a Sorte (Missão de Qualificação)"}
                </Button>
            </div>
        );
    };

    return (
        <div className={cn("h-full flex flex-col w-full overflow-x-hidden", isMobile ? "p-0" : "p-2 md:p-6", accordionSpacing)}>
            <div className={cn("flex-shrink-0 mb-4 overflow-x-hidden", isMobile ? "md:mb-4" : "")}>
                <div className={cn("flex flex-col gap-4", isMobile ? "md:flex-row md:items-center" : "md:flex-row md:items-center")}>
                    <h1 className={cn("font-bold text-primary font-cinzel tracking-wider text-center overflow-x-hidden", isMobile ? "text-xl md:text-2xl" : "text-2xl md:text-3xl")}>Diário de Missões</h1>
                    <div className={cn("flex items-center justify-center gap-2 overflow-x-hidden", isMobile ? "hidden" : "hidden md:flex")}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsPanelVisible(!isPanelVisible)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {isPanelVisible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                            {isPanelVisible ? 'Ocultar Painel' : 'Mostrar Painel'}
                        </Button>
                        <Button size="sm" onClick={() => setDialogState({open: true, mission: null, isManual: true})}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Missão Manual
                        </Button>
                    </div>
                </div>

                <Collapsible open={isPanelVisible} onOpenChange={setIsPanelVisible} className="mt-4 hidden md:block overflow-x-hidden">
                    <CollapsibleContent className="space-y-6 animate-in fade-in-50 duration-300 overflow-x-hidden">
                        <MissionStatsPanel />
                        <div className={cn("flex flex-col gap-4", isMobile ? "md:flex-row" : "md:flex-row")}>
                            <div className={cn("flex-grow overflow-x-hidden", isMobile ? "min-w-[150px]" : "min-w-[200px]")}>
                                <Input 
                                    placeholder="Procurar missão..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-card"
                                />
                            </div>
                            <div className={cn("flex gap-4 flex-grow overflow-x-hidden", isMobile ? "sm:flex-grow-0" : "sm:flex-grow-0")}>
                                <Select value={rankFilter} onValueChange={setRankFilter}>
                                    <SelectTrigger className={cn("flex-1 overflow-x-hidden", isMobile ? "md:w-[120px]" : "md:w-[180px]")}>
                                        <SelectValue placeholder="Filtrar por Rank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Ranks</SelectItem>
                                        {rankOrder.map(r => <SelectItem key={r} value={r}>Rank {r}</SelectItem>)}
                                        <SelectItem value="M">Manual</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className={cn("flex-1", isMobile ? "md:w-[120px]" : "md:w-[180px]")}>
                                        <SelectValue placeholder="Filtrar por Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Status</SelectItem>
                                        <SelectItem value="active">Ativas</SelectItem>
                                        <SelectItem value="completed">Concluídas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             {generatePendingDailyMissions && (
                                <Button onClick={generatePendingDailyMissions} variant="outline" className="text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10 hover:text-yellow-300">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Gerar Missões Pendentes (Teste)
                                </Button>
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
            
            <div className={cn("flex-grow overflow-y-auto overflow-x-hidden w-full", isMobile ? "px-0" : "px-0")}>
                <Accordion 
                    type="single" 
                    collapsible 
                    className={cn("w-full overflow-x-hidden", isMobile ? "space-y-1" : accordionSpacing)}
                    value={activeAccordionItem || undefined}
                    onValueChange={(value: string) => {
                         if (missionViewStyle === 'inline') {
                            setActiveAccordionItem(value || null);
                         }
                    }}
                >
                    {visibleMissions.map(mission => {
                        const wasCompletedToday = mission.ultima_missao_concluida_em && isToday(parseISO(mission.ultima_missao_concluida_em));
                        const isManualMission = mission.isManual;
                        const completedDailyMissions = isManualMission ? [] : (mission.missoes_diarias || []).filter((d: DailyMission) => d.concluido);
                        
                        let missionProgress;
                        if (isManualMission) {
                             const totalSubs = mission.subTasks?.length || 0;
                             const completedSubs = mission.subTasks?.filter((st: SubTask) => (st.current || 0) >= st.target).length || 0;
                             missionProgress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : (mission.concluido ? 100 : 0);
                        } else {
                            missionProgress = (completedDailyMissions.length / (mission.total_missoes_diarias || 10)) * 100;
                        }
                        
                        const associatedMeta = !isManualMission ? metas.find((m: Meta) => m.nome === mission.meta_associada) : null;
                        const daysRemaining = associatedMeta && associatedMeta.prazo ? differenceInDays(parseISO(associatedMeta.prazo), new Date()) : null;
                        
                        const activeDailyMission = isManualMission ? mission : mission.missoes_diarias?.find((d: DailyMission) => !d.concluido);

                        const TriggerWrapper: React.FC<TriggerWrapperProps> = ({ children }) => {
                            if (missionViewStyle === 'inline' || isManualMission) {
                                return <AccordionTrigger className="flex-1 hover:no-underline text-left p-0 w-full">{children}</AccordionTrigger>;
                            }
                            return <div className="flex-1 text-left w-full cursor-pointer" onClick={() => setDialogState({ open: true, mission: (activeDailyMission || mission), isManual: !!isManualMission })}>{children}</div>;
                        };
                        
                        return (
                            <AccordionItem value={`item-${mission.id}`} key={mission.id} className={cn("bg-card/60 border border-border rounded-lg data-[state=open]:border-primary/50 transition-colors relative", isMobile ? "p-1 mx-0" : "mx-0")}>
                                <div className={cn("transition-all duration-300 overflow-x-hidden", generatingMission === mission.id ? 'opacity-50' : '', isMobile ? "p-1" : "p-2 md:p-4")}>
                                    <div className={cn("flex flex-col gap-2", isMobile ? "p-1" : "p-2 md:p-4")}>
                                        <div className={cn("flex items-center gap-2", isMobile ? "gap-2 flex-wrap" : "gap-4")}>
                                            <TriggerWrapper>
                                                <div className="flex-1 text-left min-w-0 flex items-center gap-2 md:gap-4 overflow-x-hidden">
                                                    <div className={cn("flex-shrink-0 flex items-center justify-center font-cinzel font-bold", getRankColor(mission.rank), isMobile ? "w-12 h-12 text-3xl" : "w-16 h-16 text-4xl")}>
                                                        {mission.rank}
                                                    </div>
                                                    <div className="flex-1 min-w-0 overflow-x-hidden">
                                                        <div className="flex justify-between items-center flex-wrap">
                                                            <p className={cn("font-bold text-foreground break-words font-cinzel", isMobile ? "text-base" : "text-xl")}>
                                                                {mission.nome}
                                                            </p>
                                                        </div>
                                                        {associatedMeta && !isManualMission && (
                                                            <div className={cn("flex items-center gap-1 text-muted-foreground mt-1", isMobile ? "text-xs gap-1" : "text-xs gap-2")}>
                                                                <Link className={isMobile ? "h-2 w-2 flex-shrink-0" : "h-3 w-3 flex-shrink-0"} />
                                                                <span className="truncate">{associatedMeta.nome}</span>
                                                            </div>
                                                        )}
                                                         <p className={cn("text-muted-foreground break-words", isMobile ? "text-xs mt-1" : "text-sm mt-1")}>{mission.descricao}</p>
                                                    </div>
                                                </div>
                                            </TriggerWrapper>
                                            <div className={cn("flex items-center space-x-1 self-start flex-shrink-0", isMobile ? "md:ml-2" : "md:ml-4")}>
                                                {isManualMission && 
                                                    <Button variant="ghost" size="icon" className={cn("text-muted-foreground hover:text-primary", isMobile ? "h-6 w-6" : "h-8 w-8")} onClick={(e) => { e.stopPropagation(); setDialogState({ open: true, mission, isManual: true }); }} aria-label="Editar missão manual">
                                                        <Edit className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                                                    </Button>
                                                }
                                                {!isManualMission && (
                                                    <Button variant="ghost" size="icon" className={cn("text-muted-foreground hover:text-primary", isMobile ? "h-6 w-6" : "h-8 w-8")} onClick={(e) => { e.stopPropagation(); handleShowProgression(mission)}} aria-label="Ver árvore de progressão">
                                                        <GitMerge className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                       {!isManualMission && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="w-full">
                                                        <Progress value={missionProgress} className={isMobile ? "h-1.5" : "h-2"} />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className={isMobile ? "text-xs" : ""}>{completedDailyMissions.length} de {mission.total_missoes_diarias} missões diárias concluídas.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                       )}
                                    </div>
                                    <AccordionContent className={cn("space-y-2 overflow-x-hidden", isMobile ? "px-1 pb-1" : "px-2 pb-2 md:px-4 md:pb-4")}>
                                        {renderActiveMissionContent(mission)}
                                    </AccordionContent>
                                </div>
                                {generatingMission === mission.id ? (
                                    <div className={cn("absolute inset-0 bg-secondary/50 rounded-lg flex flex-col items-center justify-center text-center animate-in fade-in duration-300", isMobile ? "p-2" : "p-4")}>
                                        <Sparkles className={cn("text-primary animate-pulse mb-4", isMobile ? "h-8 w-8" : "h-10 w-10")}/>
                                        <p className={cn("font-bold text-foreground", isMobile ? "text-base" : "text-lg")}>A gerar nova missão...</p>
                                    </div>
                                ) : wasCompletedToday ? (
                                    <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-secondary/95 flex flex-col items-center justify-center p-4">
                                        <Timer className={cn("text-cyan-400 mx-auto animate-pulse", isMobile ? "h-12 w-12 mb-2" : "h-16 w-16 mb-4")}/>
                                        <p className={cn("font-bold text-foreground", isMobile ? "text-base" : "text-lg")}>Nova Missão em</p>
                                        <p className={cn("font-mono text-cyan-400 font-bold tracking-wider", isMobile ? "text-2xl" : "text-4xl")}>{timeUntilMidnight}</p>
                                        <p className={cn("text-muted-foreground mt-2", isMobile ? "text-xs" : "text-xs")}>Missão concluída hoje!</p>
                                    </div>
                                ) : null}
                            </AccordionItem>
                        )
                    })}
                     {visibleMissions.length === 0 && (
                        <div className={cn("flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg", isMobile ? "p-4" : "p-8")}>
                            <Search className={isMobile ? "h-12 w-12 mb-2" : "h-16 w-16 mb-4"} />
                            <p className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>Nenhuma Missão Encontrada</p>
                            <p className={cn("mt-1", isMobile ? "text-xs" : "text-sm")}>Tente ajustar os seus filtros ou adicione novas metas para gerar missões.</p>
                        </div>
                    )}
                </Accordion>
            </div>
            
            <MissionCompletionAnimation
                isOpen={animationState.showAnimation}
                onClose={() => setAnimationState(prev => ({ ...prev, showAnimation: false }))}
                missionName={animationState.missionName}
                xpGained={animationState.xpGained}
                fragmentsGained={animationState.fragmentsGained}
                levelUp={animationState.levelUp}
                newLevel={animationState.newLevel}
            />

            <MissionCompletionFeedbackDialog
                isOpen={missionCompletionFeedbackState.open}
                onClose={() => setMissionCompletionFeedbackState(prev => ({ ...prev, open: false }))}
                onSubmitFeedback={handleMissionCompletionFeedback}
                missionName={missionCompletionFeedbackState.missionName}
            />

            <ContributionDialog
                open={contributionModalState.open}
                onOpenChange={(open) => setContributionModalState(prev => ({ ...prev, open }))}
                subTask={contributionModalState.subTask as SubTask}
                onContribute={(amount) => {
                    if (contributionModalState.subTask && contributionModalState.mission) {
                        onContributeToQuest(contributionModalState.subTask, amount, contributionModalState.mission as DailyMission);
                    }
                }}
            />

            { dialogState.open &&
                <MissionDetailsDialog
                    isOpen={dialogState.open} 
                    onClose={() => setDialogState({ open: false, mission: null, isManual: false })}
                    mission={dialogState.mission as any}
                    isManual={dialogState.isManual}
                    onContribute={(subTask, amount, mission) => {
                        onContributeToQuest(subTask, amount, mission as DailyMission | RankedMission);
                    }}
                    onSave={(missionData) => handleSaveManualMission(missionData as unknown as RankedMission)}
                    onDelete={(missionId) => handleDeleteManualMission(missionId)}
                    onAdjustDifficulty={(mission, feedback) => {
                        const rankedMission = missions.find(rm => rm.missoes_diarias?.some(dm => dm.id === mission.id));
                        if (rankedMission) {
                            adjustDailyMission(
                                rankedMission.id as string | number,
                                mission.id!,
                                feedback
                            );
                        }
                    }}
                />
            }

            <Dialog open={showProgressionTree} onOpenChange={setShowProgressionTree}>
                <DialogContent className={cn("max-w-2xl overflow-x-hidden", isMobile ? "max-w-[95vw]" : "")}>
                    <DialogHeader>
                        <DialogTitle className={cn("text-primary", isMobile ? "text-lg" : "text-2xl")}>Árvore de Progressão da Missão</DialogTitle>
                        <DialogDescription className={isMobile ? "text-sm" : ""}>
                            Esta é a sequência de missões épicas para a meta "{selectedGoalMissions[0]?.meta_associada}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className={cn("mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4 overflow-x-hidden", isMobile ? "mt-2 space-y-2" : "")}>
                        {selectedGoalMissions.map((m: RankedMission, index: number) => (
                             <div key={m.id} className={cn(`rounded-lg border-l-4 ${m.concluido ? 'border-green-500 bg-secondary/50 opacity-70' : 'border-primary bg-secondary'} overflow-x-hidden`, isMobile ? "p-2" : "p-4")}>
                                <div className="flex justify-between items-center">
                                    <p className={cn(`${m.concluido ? 'text-muted-foreground line-through' : 'text-foreground'}`, isMobile ? "font-bold text-sm" : "font-bold")}>{m.nome}</p>
                                    <span className={cn(`text-xs font-bold px-2 py-1 rounded-full ${getRankColor(m.rank)}`, isMobile ? "text-xs px-1 py-0.5" : "")}>Rank {m.rank}</span>
                                </div>
                                <p className={cn("text-muted-foreground mt-1", isMobile ? "text-xs" : "text-sm")}>{m.descricao}</p>
                                {m.concluido && (
                                     <div className={cn("flex items-center text-green-400 mt-2", isMobile ? "text-xs" : "text-sm")}>
                                        <CheckCircle className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                        <span>Concluída</span>
                                     </div>
                                )}
                             </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default memo(MissionsView);
