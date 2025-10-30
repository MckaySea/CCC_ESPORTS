import { AuthOptions, User } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { JWT } from "next-auth/jwt";
import { verifyPassword } from "@/lib/auth";

interface CustomUser extends User {
  role?: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
  }
}

interface CustomSession {
  user?: CustomUser;
  expires: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Get user from users table
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.username)
            .single();

          if (userError || !userData) {
            console.error("User not found:", userError);
            return null;
          }

          // Verify password using bcrypt
          const isValidPassword = await verifyPassword(
            credentials.password,
            userData.password_hash
          );
          if (!isValidPassword) {
            console.error("Invalid password");
            return null;
          }

          if (userError || !userData) {
            console.error("User data error:", userError);
            return null;
          }

          // Return the user object that will be saved in the session
          return {
            id: userData.user_id,
            name: userData.username,
            email: userData.email,
            image: userData.image,
            role: userData.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as CustomUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id,
          role: token.role,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin", // Custom sign-in page path
    // You can add other custom pages here
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
