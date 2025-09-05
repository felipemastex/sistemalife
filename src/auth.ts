import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "next-auth";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
     CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        // This is where you would add your own logic to validate credentials
        // For this demo, we'll just return a mock user if credentials are provided
        if (credentials?.email && credentials?.password) {
            return { id: "1", name: "Demo User", email: credentials.email as string };
        }
        return null;
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
});
