
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
import { LoaderCircle } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

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
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-cyan-400">
                <LoaderCircle className="animate-spin h-10 w-10 mr-4" />
                <span className="text-xl">A carregar...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-gray-800/80 border-gray-700 text-gray-200">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-cyan-400">SISTEMA</CardTitle>
                    <CardDescription className="text-gray-400">A sua vida, gamificada. Inicie a sessão para continuar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="utilizador@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-gray-700 border-gray-600 text-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-gray-700 border-gray-600 text-gray-200"
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500" disabled={loading}>
                            {loading ? <LoaderCircle className="animate-spin" /> : "Iniciar Sessão"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
