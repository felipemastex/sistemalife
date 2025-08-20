"use client";
import { useState, useEffect, useCallback } from 'react';
import { useFlowState } from '@genkit-ai/next/client';
import { generateMotivationalMessage } from '@/ai/flows/generate-motivational-messages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Quote, RefreshCw } from 'lucide-react';

export function MotivationalMessage() {
    const [category, setCategory] = useState('fitness');
    const [message, setMessage] = useState('');

    const {run: generate, loading: generating, result} = useFlowState(generateMotivationalMessage);
    
    const handleGenerate = useCallback(async (cat: string) => {
        setMessage('');
        generate({ userName: 'Alex', category: cat });
    }, [generate]);
    
    useEffect(() => {
        handleGenerate(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (result) {
            setMessage(result.message);
        } else if (!generating && !result) {
            setMessage(`Couldn't get a message. Please try again.`);
        }
    }, [result, generating]);

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        handleGenerate(value);
    };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Daily Motivation</CardTitle>
                <CardDescription>A dose of inspiration for your journey.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg min-h-[120px] flex items-center justify-center">
                    {generating ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (message && message.trim() !== '') ? (
                        <p className="text-center italic text-foreground/80">
                            <Quote className="inline-block h-4 w-4 mr-2 -mt-2 text-accent/50"/>
                            {message}
                            <Quote className="inline-block h-4 w-4 ml-2 -mt-2 transform scale-x-[-1] text-accent/50"/>
                        </p>
                    ) : (
                       <p className="text-sm text-muted-foreground">Get your daily motivation!</p>
                    )}
                </div>
                 <div className="flex gap-2">
                    <Select value={category} onValueChange={handleCategoryChange} disabled={generating}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fitness">Fitness</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="productivity">Productivity</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => handleGenerate(category)} disabled={generating} size="icon" variant="outline">
                        <RefreshCw className="h-4 w-4"/>
                        <span className="sr-only">New Quote</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
