
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Mock data, to be replaced with dynamic data later
const leaderboardData = [
  { rank: 1, name: 'Líder Destemido', contribution: 2580, avatar: 'https://placehold.co/40x40.png?text=LD' },
  { rank: 2, name: 'Oficial Veloz', contribution: 2310, avatar: 'https://placehold.co/40x40.png?text=OV' },
  { rank: 3, name: 'Caçador de Elite', contribution: 2150, avatar: 'https://placehold.co/40x40.png?text=CE' },
  { rank: 4, name: 'Membro Ativo', contribution: 1890, avatar: 'https://placehold.co/40x40.png?text=MA' },
  { rank: 5, name: 'Recruta Promissor', contribution: 1540, avatar: 'https://placehold.co/40x40.png?text=RP' },
];

const rankColors = {
  1: "text-yellow-400",
  2: "text-gray-400",
  3: "text-orange-400",
};


export const MemberLeaderboard = () => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Ranking de Membros
                </CardTitle>
                 <CardDescription>Contribuição da guilda (período total).</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
               {leaderboardData.map(member => (
                    <div 
                        key={member.rank}
                        className={cn(
                            "flex items-center gap-4 p-2 rounded-md transition-colors",
                            member.rank <= 3 ? 'bg-secondary' : 'hover:bg-secondary/50'
                        )}
                    >
                        <div className="flex items-center gap-2 w-10">
                            <Trophy className={cn("h-5 w-5", rankColors[member.rank] || "text-muted-foreground")} />
                            <span className="font-bold text-lg">{member.rank}</span>
                        </div>

                        <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                             <span className="font-semibold text-sm">{member.name}</span>
                        </div>
                       
                        <div className="text-right">
                            <p className="font-bold text-base text-primary">{member.contribution.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Pontos</p>
                        </div>
                    </div>
               ))}
                {leaderboardData.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                        <p className="font-semibold">Nenhum dado de contribuição.</p>
                        <p className="text-sm mt-1">Complete missões de guilda para começar.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
