
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Swords, Check, X, KeySquare } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';

export const DungeonEventPrompt = () => {
    const { profile, skills, acceptDungeonEvent, declineDungeonEvent } = usePlayerDataContext();
    const [isVisible, setIsVisible] = useState(false);
    const [skillName, setSkillName] = useState('');

    const activeEvent = profile?.active_dungeon_event;

    useEffect(() => {
        if (activeEvent && activeEvent.skillId) {
            const skill = skills.find(s => s.id === activeEvent.skillId);
            if (skill) {
                setSkillName(skill.nome);
                setIsVisible(true);
            }
        } else {
            setIsVisible(false);
        }
    }, [activeEvent, skills]);
    
    if (!isVisible || !activeEvent) {
        return null;
    }

    return (
        <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent 
                className="max-w-md w-full bg-card/90 backdrop-blur-md border-primary/30 text-white"
                hideCloseButton={true}
            >
                <DialogHeader className="text-center items-center">
                    <DialogTitle className="sr-only">Convite para Masmorra de Habilidade</DialogTitle>
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 border-4 border-primary/30 animate-pulse">
                        <KeySquare className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-2xl font-bold font-cinzel text-primary">Get ready for the next battle</p>
                    <DialogDescription className="text-muted-foreground pt-2 text-base">
                        Uma Masmorra de Habilidade apareceu! O sistema selecionou a habilidade <strong className="text-foreground">{skillName}</strong> para um desafio intensivo.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-col sm:flex-row justify-center gap-2 mt-4">
                    <Button variant="outline" onClick={declineDungeonEvent} className="w-full sm:w-auto">
                        <X className="mr-2 h-4 w-4" />
                        Recusar
                    </Button>
                    <Button onClick={acceptDungeonEvent} className="w-full sm:w-auto">
                        <Check className="mr-2 h-4 w-4" />
                        Aceitar Desafio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
