
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Terminal } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [typedTitle, setTypedTitle] = useState('');
    const titleText = "SISTEMA";

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        setTypedTitle('');
        const interval = setInterval(() => {
            setTypedTitle(prev => {
                if (prev.length < titleText.length) {
                    return titleText.substring(0, prev.length + 1);
                }
                clearInterval(interval);
                return prev;
            });
        }, 150);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast({
                title: "Login bem-sucedido!",
                description: "A redirecionar para o seu dashboard...",
            });
            router.push('/');
        } catch (err) {
            let friendlyMessage = "Ocorreu um erro ao fazer login. Verifique as suas credenciais.";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                friendlyMessage = "Email ou senha inválidos. Por favor, tente novamente.";
            } else if (err.code === 'auth/invalid-email') {
                friendlyMessage = "O formato do email é inválido.";
            }
            setError(friendlyMessage);
            toast({
                variant: "destructive",
                title: "Falha no Login",
                description: friendlyMessage,
            });
            setLoading(false);
        }
    };
    
    if (authLoading || (!authLoading && user)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-primary">
                <LoaderCircle className="animate-spin h-10 w-10 mr-4" />
                <span className="text-xl font-cinzel">A CARREGAR...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
            <div className="absolute inset-0 bg-grid-cyan-400/10 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
            <Card className="w-full max-w-md bg-card/80 backdrop-blur-lg border-cyan-400/20 text-card-foreground shadow-2xl shadow-cyan-500/10 animate-in fade-in-50 duration-700">
                <CardHeader className="text-center">
                    <CardTitle className="font-cinzel text-5xl font-bold text-primary tracking-widest min-h-[60px]">
                        {typedTitle}
                        <span className="animate-pulse">_</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">A sua vida, gamificada. Inicie a sessão para continuar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email do Utilizador</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="utilizador@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-secondary border-border focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Palavra-passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-secondary border-border focus:border-primary"
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wider" disabled={loading}>
                            {loading ? <LoaderCircle className="animate-spin" /> : "INICIAR SESSÃO"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}