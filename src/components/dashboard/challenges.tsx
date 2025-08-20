import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { challenges } from "@/lib/data";

export function Challenges() {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Challenges</CardTitle>
                <CardDescription>Take on challenges to earn rewards and level up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {challenges.map((challenge) => (
                    <div key={challenge.id} className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors">
                        <challenge.Icon className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold">{challenge.title}</h3>
                                <Badge variant={
                                    challenge.difficulty === 'Easy' ? 'secondary' :
                                    challenge.difficulty === 'Medium' ? 'outline' : 'default'
                                }>{challenge.difficulty}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                            <div className="flex justify-between items-center mt-4">
                               <span className="text-sm font-medium text-accent">+{challenge.points} pts</span>
                               <Button size="sm">Accept</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
