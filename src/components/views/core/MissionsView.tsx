

"use client";

import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Circle, CheckCircle, Timer, Sparkles, History, GitMerge, LifeBuoy, Link, Undo2, ChevronsDown, ChevronsUp, RefreshCw, Gem, Plus, Eye, EyeOff, LoaderCircle, AlertTriangle, Search, PlusCircle, Trophy, MessageSquare } from 'lucide-react';
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
import { generateMissionSuggestion } from '@/ai/flows/generate-mission-suggestion';
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

// Type definitions
interface SubTask {
  name: string;
  target: number;
  unit: string;
  current: number;
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{dialogTitles[feedbackType]}</DialogTitle>
                    <DialogDescription>{dialogDescriptions[feedbackType]}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Forneça mais detalhes aqui..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "A enviar..." : "Enviar Feedback"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ContributionDialog: React.FC<ContributionDialogProps> = ({ open, onOpenChange, subTask, onContribute }) => {
    const [amount, setAmount] = useState('');
    
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contribuir para: {subTask.name}</DialogTitle>
                    <DialogDescription>
                        Insira a quantidade que você concluiu. O seu esforço fortalece o seu progresso.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-center bg-secondary p-2 rounded-md">
                        Progresso atual: <span className="font-bold text-primary">{subTask.current || 0} / {subTask.target}</span>
                    </p>
                    <div>
                        <Label htmlFor="contribution-amount">Nova Contribuição</Label>
                        <Input
                            id="contribution-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Ex: 5 (Máx: ${remaining})`}
                            min="1"
                            max={remaining}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleContribute} disabled={!amount || parseInt(amount, 10) <= 0 || parseInt(amount, 10) > remaining}>
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
      description: 'A missão foi simples demais, preciso de mais desafio',
      icon: <TrendingDown className="h-4 w-4 text-green-500" />,
      color: 'border-green-200 hover:border-green-400',
    },
    {
      value: 'perfect',
      label: 'Perfeita',
      description: 'A dificuldade estava ideal para o meu nível',
      icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
      color: 'border-blue-200 hover:border-blue-400',
    },
    {
      value: 'too_hard',
      label: 'Muito Difícil',
      description: 'A missão foi desafiadora demais, preciso de passos menores',
      icon: <TrendingUp className="h-4 w-4 text-red-500" />,
      color: 'border-red-200 hover:border-red-400',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Feedback da Missão
          </DialogTitle>
          <DialogDescription>
            Como foi completar "<span className="font-semibold text-foreground">{missionName}</span>"?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div>
            <Label className="text-sm font-medium">Dificuldade da Missão</Label>
            <RadioGroup value={difficulty as string} onValueChange={(value) => setDifficulty(value as DifficultyType | '')} className="mt-2">
              {difficultyOptions.map((option) => (
                <div 
                  key={option.value} 
                  className={`flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${option.color} ${difficulty === option.value ? 'bg-secondary/50' : 'hover:bg-secondary/20'}`}
                  onClick={() => setDifficulty(option.value as DifficultyType | '')}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5 pointer-events-none" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <Label htmlFor={option.value} className="font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {difficulty && (
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm font-medium">
                Comentário Adicional (Opcional)
              </Label>
              <Textarea
                id="comment"
                placeholder={`Descreva o que ${difficulty === 'too_easy' ? 'foi muito simples' : difficulty === 'too_hard' ? 'foi muito desafiador' : 'funcionou bem'} nesta missão...`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSubmit}
            disabled={!difficulty || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};



const MissionsViewComponent = () => {
    const { profile, missions, metas, completeMission, generatingMission, missionFeedback, setMissionFeedback, persistData, generatePendingDailyMissions } = usePlayerDataContext() as {
        profile: Profile;
        missions: RankedMission[];
        metas: Meta[];
        completeMission: (params: { rankedMissionId: string | number; dailyMissionId: string | number; subTask: SubTask; amount: number; feedback: string | null }) => Promise<void>;
        generatingMission: string | number | null;
        missionFeedback: Record<string | number, string>;
        setMissionFeedback: (missionId: string | number, feedback: string) => void;
        persistData: (key: string, data: any) => Promise<void>;
        generatePendingDailyMissions?: () => Promise<void>;
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
    
    const handleOpenFeedbackModal = (mission: DailyMission, type: FeedbackType) => {
        setFeedbackModalState({ open: true, mission, type });
    };
    
    const handleMissionFeedback = async (feedbackType: FeedbackType, userText: string) => {
        const { mission } = feedbackModalState;
        if (!mission) return;
        
        try {
            const result = await generateMissionSuggestion({
                missionName: mission.nome,
                missionDescription: Array.isArray(mission.subTasks) ? mission.subTasks.map(st => st.name).join(', ') : '',
                feedbackType,
                userText: userText,
            });

            toast({
                title: "Feedback do Sistema",
                description: result.suggestion,
            });

            if (feedbackType === 'too_hard' || feedbackType === 'too_easy') {
                const feedbackValue = userText 
                    ? `O utilizador sinalizou que a missão foi '${feedbackType === 'too_hard' ? 'muito difícil' : 'muito fácil'}' com o seguinte comentário: "${userText}"`
                    : `O utilizador sinalizou que a missão foi '${feedbackType === 'too_hard' ? 'muito difícil' : 'muito fácil'}'`;
                
                const rankedMission = missions.find((rm: RankedMission) => rm.missoes_diarias.some((dm: DailyMission) => dm.id === mission.id));
                if (rankedMission) {
                     setMissionFeedback(rankedMission.id, feedbackValue);
                }
            }
        } catch (error) {
            handleToastError(error);
        }
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
                    description: "Obrigado pelo feedback! A próxima missão manterá a dificuldade similar." 
                });
            } else {
                const adjustmentText = feedbackData.difficulty === 'too_easy' 
                    ? 'mais desafiadora' 
                    : 'mais acessível';
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
    }
    
    const visibleMissions = useMemo(() => {
        const activeEpicMissions = [];
        const missionsByGoal = missions.reduce((acc: Record<string, RankedMission[]>, mission: RankedMission) => {
            if (!acc[mission.meta_associada]) {
                acc[mission.meta_associada] = [];
            }
            acc[mission.meta_associada].push(mission);
            return acc;
        }, {});

        for (const goalName in missionsByGoal) {
            const goalMissions = missionsByGoal[goalName]
                .filter((m: RankedMission) => !m.concluido)
                .sort((a: RankedMission, b: RankedMission) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));

            if (goalMissions.length > 0) {
                activeEpicMissions.push(goalMissions[0]);
            }
        }
        
        const completedEpicMissions = missions.filter((m: RankedMission) => m.concluido);
        const manualMissions = (profile.manual_missions || []).map((m: RankedMission) => ({...m, isManual: true, rank: 'M'}));

        let missionsToDisplay = [];
        if (statusFilter === 'active') {
            missionsToDisplay = [...activeEpicMissions, ...manualMissions.filter((m: RankedMission) => !m.concluido)];
        } else if (statusFilter === 'completed') {
            missionsToDisplay = [...completedEpicMissions, ...manualMissions.filter((m: RankedMission) => m.concluido)];
        } else {
            missionsToDisplay = [...activeEpicMissions, ...completedEpicMissions, ...manualMissions];
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
                <div className="bg-secondary/30 border-2 border-dashed border-primary/50 rounded-lg p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 h-48">
                    <Sparkles className="h-10 w-10 text-primary animate-pulse-slow mb-4"/>
                    <p className="text-lg font-bold text-foreground">A gerar nova missão...</p>
                    <p className="text-sm text-muted-foreground">O Sistema está a preparar o seu próximo desafio.</p>
                </div>
            );
        }
        
        if (activeDailyMission) {
            return (
                <div className="bg-secondary/50 border-l-4 border-primary rounded-r-lg p-4 animate-in fade-in-50 slide-in-from-top-4 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-grow">
                            <p className="text-lg font-bold text-foreground">{activeDailyMission.nome}</p>
                            <p className="text-sm text-muted-foreground mt-1">{activeDailyMission.descricao}</p>
                        </div>
                        <div className="text-right ml-0 sm:ml-4 flex-shrink-0 flex items-center gap-2">
                            <div className="flex flex-col items-end">
                                {activeDailyMission && 'xp_conclusao' in activeDailyMission && (
                                <p className="text-sm font-semibold text-primary">+{activeDailyMission.xp_conclusao} XP</p>
                            )}
                            {activeDailyMission && 'fragmentos_conclusao' in activeDailyMission && (
                                <p className="text-sm font-semibold text-amber-500 flex items-center">
                                    <Gem className="w-4 h-4 mr-1" />
                                    +{activeDailyMission.fragmentos_conclusao || 0}
                                </p>
                            )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" aria-label="Opções da missão">
                                        <LifeBuoy className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => handleOpenFeedbackModal(activeDailyMission as DailyMission, 'hint')}>Preciso de uma dica</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleOpenFeedbackModal(activeDailyMission as DailyMission, 'too_hard')}>Está muito difícil</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleOpenFeedbackModal(activeDailyMission as DailyMission, 'too_easy')}>Está muito fácil</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                        {activeDailyMission.subTasks?.map((st: SubTask, index: number) => {
                            const isCompleted = (st.current || 0) >= st.target;
                            return(
                                <div key={index} className={cn("bg-background/40 p-3 rounded-md transition-all duration-300", isCompleted && "bg-green-500/10")}>
                                    <div className="flex justify-between items-center text-sm mb-1 gap-2">
                                        <p className={cn("font-semibold text-foreground flex-1", isCompleted && "line-through text-muted-foreground")}>{st.name}</p>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="font-mono text-muted-foreground">[{st.current || 0}/{st.target}] {st.unit}</span>
                                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setContributionModalState({open: true, subTask: st, mission: activeDailyMission as DailyMission})} disabled={isCompleted} aria-label={`Adicionar progresso para ${st.name}`}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Progress value={((st.current || 0) / st.target) * 100} className="h-2"/>
                                </div>
                            )
                        })}
                    </div>
                    {sortedDailyMissions && sortedDailyMissions.length > 1 && (
                         <Collapsible className="mt-4">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="text-xs text-muted-foreground w-full">Ver missões diárias concluídas ({sortedDailyMissions.filter(dm => dm.concluido).length})</Button>
                            </CollapsibleTrigger>
                             <CollapsibleContent className="space-y-2 mt-2">
                                 {sortedDailyMissions.filter(dm => dm.concluido).map((dm: DailyMission) => (
                                    <div key={dm.id} className="p-2 bg-secondary/30 rounded-md text-sm text-muted-foreground flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="line-through">{dm.nome}</span>
                                    </div>
                                 ))}
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                    {activeDailyMission && 'learningResources' in activeDailyMission && activeDailyMission.learningResources && activeDailyMission.learningResources.map((link: string, index: number) => (
                        <a href={link} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm bg-secondary p-2 rounded-md mt-3">
                            <Link className="h-4 w-4"/>
                            <span className="truncate">{link}</span>
                        </a>
                    ))}
                </div>
            );
        }

        return (
            <div className="bg-secondary/30 border-2 border-dashed border-red-500/50 rounded-lg p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 h-48">
                <AlertTriangle className="h-10 w-10 text-red-500 mb-4"/>
                <p className="text-lg font-bold text-foreground">Nenhuma Missão Ativa</p>
                <p className="text-sm text-muted-foreground">O sistema irá gerar uma nova missão à meia-noite.</p>
            </div>
        );
    };


    return (
        <div className={cn("h-full overflow-y-auto p-4 md:p-6", accordionSpacing)}>
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary font-cinzel tracking-wider text-center md:text-left flex-grow">Diário de Missões</h1>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsPanelVisible(!isPanelVisible)}
                                    className="text-muted-foreground hover:text-foreground flex-shrink-0 self-center md:self-auto"
                                >
                                    {isPanelVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Mostrar/Ocultar painel de filtros e estatísticas</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <Collapsible open={isPanelVisible} onOpenChange={setIsPanelVisible} className="mt-4">
                    <CollapsibleContent className="space-y-6">
                        <MissionStatsPanel />
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-grow min-w-[200px]">
                                <Input 
                                    placeholder="Procurar missão..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-card"
                                />
                            </div>
                            <div className="flex gap-4 flex-grow sm:flex-grow-0">
                                <Select value={rankFilter} onValueChange={setRankFilter}>
                                    <SelectTrigger className="flex-1 md:w-[180px]"><SelectValue placeholder="Filtrar por Rank" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Ranks</SelectItem>
                                        {rankOrder.map(r => <SelectItem key={r} value={r}>Rank {r}</SelectItem>)}
                                        <SelectItem value="M">Manual</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="flex-1 md:w-[180px]"><SelectValue placeholder="Filtrar por Status" /></SelectTrigger>
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
            
            <Accordion 
                type="single" 
                collapsible 
                className={cn("w-full", accordionSpacing)}
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
                        <AccordionItem value={`item-${mission.id}`} key={mission.id} className="bg-card/60 border border-border rounded-lg data-[state=open]:border-primary/50 transition-colors relative">
                            <div className={cn("p-4 transition-all duration-300", generatingMission === mission.id ? 'opacity-50' : '')}>
                                <div className="flex flex-col p-4 gap-4">
                                    <div className="flex items-center gap-4">
                                        <TriggerWrapper>
                                            <div className="flex-1 text-left min-w-0 flex items-center gap-4">
                                                <div className={cn("w-16 h-16 flex-shrink-0 flex items-center justify-center font-cinzel text-4xl font-bold", getRankColor(mission.rank))}>
                                                    {mission.rank}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <p className={cn("text-xl font-bold text-foreground break-words", "font-cinzel")}>
                                                            {mission.nome}
                                                        </p>
                                                    </div>
                                                    {associatedMeta && !isManualMission && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                            <Link className="h-3 w-3" />
                                                            <span>{associatedMeta.nome}</span>
                                                        </div>
                                                    )}
                                                     <p className="text-sm text-muted-foreground mt-1 break-words">{mission.descricao}</p>
                                                </div>
                                            </div>
                                        </TriggerWrapper>
                                        <div className="flex items-center space-x-2 self-start flex-shrink-0 sm:ml-4">
                                            {!isManualMission && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleShowProgression(mission)}} aria-label="Ver árvore de progressão">
                                                    <GitMerge className="h-5 w-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                   {!isManualMission && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger className="w-full">
                                                    <Progress value={missionProgress} className="h-2" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{completedDailyMissions.length} de {mission.total_missoes_diarias} missões diárias concluídas.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                   )}
                                </div>
                                <AccordionContent className="px-4 pb-4 space-y-4">
                                    {renderActiveMissionContent(mission)}
                                </AccordionContent>
                            </div>
                            {generatingMission === mission.id ? (
                                <div className="absolute inset-0 bg-secondary/50 rounded-lg p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                                    <Sparkles className="h-10 w-10 text-primary animate-pulse mb-4"/>
                                    <p className="text-lg font-bold text-foreground">A gerar nova missão...</p>
                                </div>
                            ) : wasCompletedToday ? (
                                <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-secondary/95 flex flex-col items-center justify-center p-4">
                                    <Timer className="h-16 w-16 text-cyan-400 mb-4 mx-auto animate-pulse"/>
                                    <p className="text-lg font-bold text-foreground">Nova Missão em</p>
                                    <p className="text-4xl font-mono text-cyan-400 font-bold tracking-wider">{timeUntilMidnight}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Missão concluída hoje!</p>
                                </div>
                            ) : null}
                        </AccordionItem>
                    )
                })}
                 {visibleMissions.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                        <Search className="h-16 w-16 mb-4" />
                        <p className="font-semibold text-lg">Nenhuma Missão Encontrada</p>
                        <p className="text-sm mt-1">Tente ajustar os seus filtros ou adicione novas metas para gerar missões.</p>
                    </div>
                )}
            </Accordion>
            
            <MissionCompletionAnimation
                isOpen={animationState.showAnimation}
                onClose={() => setAnimationState(prev => ({ ...prev, showAnimation: false }))}
                missionName={animationState.missionName}
                xpGained={animationState.xpGained}
                fragmentsGained={animationState.fragmentsGained}
                levelUp={animationState.levelUp}
                newLevel={animationState.newLevel}
            />

            <MissionFeedbackDialog 
                open={feedbackModalState.open} 
                onOpenChange={(open) => setFeedbackModalState(prev => ({ ...prev, open }))}
                onSubmit={handleMissionFeedback}
                mission={feedbackModalState.mission as DailyMission}
                feedbackType={feedbackModalState.type as FeedbackType}
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
                    mission={dialogState.mission}
                    isManual={dialogState.isManual}
                    onContribute={(subTask, amount, mission) => {
                        onContributeToQuest(subTask, amount, mission);
                    }}
                    onSave={(missionData) => handleSaveManualMission(missionData as unknown as RankedMission)}
                    onDelete={(missionId) => handleDeleteManualMission(missionId)}
                />
            }

            <Dialog open={showProgressionTree} onOpenChange={setShowProgressionTree}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-primary text-2xl">Árvore de Progressão da Missão</DialogTitle>
                        <DialogDescription>
                            Esta é a sequência de missões épicas para a meta "{selectedGoalMissions[0]?.meta_associada}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                        {selectedGoalMissions.map((m: RankedMission, index: number) => (
                             <div key={m.id} className={`p-4 rounded-lg border-l-4 ${m.concluido ? 'border-green-500 bg-secondary/50 opacity-70' : 'border-primary bg-secondary'}`}>
                                <div className="flex justify-between items-center">
                                    <p className={`font-bold ${m.concluido ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{m.nome}</p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRankColor(m.rank)}`}>Rank {m.rank}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{m.descricao}</p>
                                {m.concluido && (
                                     <div className="flex items-center text-green-400 text-sm mt-2">
                                        <CheckCircle className="h-4 w-4 mr-2" />
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

export const MissionsView = memo(MissionsViewComponent);
