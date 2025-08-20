"use client";
import { useState, useEffect, useCallback } from 'react';
import { generateMotivationalMessage } from '@/ai/flows/generate-motivational-messages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Quote, RefreshCw } from 'lucide-react';

export function MotivationalMessage() {
    const [category, setCategory] = useState('fitness');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const handleGenerate = useCallback(async (cat: string) => {
        setLoading(true);
        setError(null);
        setMessage('');
        try {
            const result = await generateMotivationalMessage({ userName: 'Alex', category: cat });
            setMessage(result.message);
        } catch (e: any) {
            setError(e);
            setMessage(`Couldn't get a message. Please try again.`);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        handleGenerate(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                    {loading ? (
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
                    <Select value={category} onValueChange={handleCategoryChange} disabled={loading}>
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
                    <Button onClick={() => handleGenerate(category)} disabled={loading} size="icon" variant="outline">
                        <RefreshCw className="h-4 w-4"/>
                        <span className="sr-only">New Quote</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
