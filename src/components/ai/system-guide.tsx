"use client";
import { useState, useEffect } from 'react';
import { useFlowState } from '@genkit-ai/next/client';
import { generatePersonalizedAdvice } from '@/ai/flows/generate-personalized-advice';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { userDataForAI } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export function SystemGuide() {
    const [query, setQuery] = useState('');
    const [advice, setAdvice] = useState('');
    const { toast } = useToast();

    const [generate, state] = useFlowState(generatePersonalizedAdvice);
    const { loading, data: result, error } = state;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAdvice('');
        generate({ userData: userDataForAI, query });
    };

    useEffect(() => {
        if (result) {
            setAdvice(result.advice);
        } else if (error) { 
             toast({
                variant: 'destructive',
                title: 'Error generating advice',
                description: 'Please try again later.'
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result, error]);


    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-primary" />
                    <CardTitle>System AI Guide</CardTitle>
                </div>
                <CardDescription>Ask for personalized advice based on your progress.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="e.g., How can I improve my running stamina?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        rows={3}
                        disabled={loading}
                        className="text-base"
                    />
                     {advice && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 flex-shrink-0 text-accent"/>
                                <p className="text-sm text-foreground">{advice}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={loading || !query} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Get Advice
                            </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
