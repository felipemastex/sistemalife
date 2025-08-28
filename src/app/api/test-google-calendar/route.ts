'use server';

import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

// Esta é a configuração que você já tem em outro ficheiro
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: "https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code&scope=openid%20https%3A//www.googleapis.com/auth/userinfo.email%20https%3A//www.googleapis.com/auth/userinfo.profile%20https%3A//www.googleapis.com/auth/calendar",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session
    }
  }
};


export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Não autorizado ou token de acesso em falta." }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;

  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro da API da Google:", errorData);
        return NextResponse.json({ error: `Falha ao conectar à API do Google Calendar: ${errorData.error.message}` }, { status: response.status });
    }

    const data = await response.json();
    const calendarCount = data.items?.length || 0;

    return NextResponse.json({ success: true, message: `Conexão bem-sucedida! Encontrados ${calendarCount} calendários.` });

  } catch (error) {
    console.error("Erro ao tentar conectar à API da Google:", error);
    return NextResponse.json({ error: "Ocorreu um erro interno ao tentar conectar." }, { status: 500 });
  }
}