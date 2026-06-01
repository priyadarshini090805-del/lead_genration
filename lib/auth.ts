import { NextAuthOptions } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// ── Custom Adapter ────────────────────────────────────────────────────────────
// @auth/prisma-adapter v2 is incompatible with next-auth v4 and requires
// Account / Session / VerificationToken models that are not in our schema.
// This adapter uses the existing User + OAuthAccount models instead.

function toAdapterUser(u: {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}): AdapterUser {
  return {
    id: u.id,
    email: u.email,
    emailVerified: null,
    name: u.name,
    image: u.avatar,
  };
}

function HanexisAdapter(): Adapter {
  return {
    // ── User ──────────────────────────────────────────────────────────────
    async createUser(user: any) {
      const created = await prisma.user.create({
        data: {
          email: user.email!,
          name: user.name ?? null,
          avatar: user.image ?? null,
          isVerified: true,
        },
      });
      // Auto-create workspace for new OAuth users
      await prisma.workspace
        .create({
          data: { name: `${created.name || created.email}'s Workspace`, userId: created.id },
        })
        .catch(() => {
          /* already exists — ignore */
        });
      return toAdapterUser(created);
    },

    async getUser(id: any) {
      const u = await prisma.user.findUnique({ where: { id } });
      return u ? toAdapterUser(u) : null;
    },

    async getUserByEmail(email: any) {
      const u = await prisma.user.findUnique({ where: { email } });
      return u ? toAdapterUser(u) : null;
    },

    async getUserByAccount({ providerAccountId, provider }: any) {
      const account = await prisma.oAuthAccount.findUnique({
        where: { provider_providerId: { provider, providerId: providerAccountId } },
        include: { user: true },
      });
      return account ? toAdapterUser(account.user) : null;
    },

    async updateUser(user: any) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name ?? undefined,
          avatar: user.image ?? undefined,
        },
      });
      return toAdapterUser(updated);
    },

    async deleteUser(userId: any) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => null);
    },

    // ── Account linking ───────────────────────────────────────────────────
    async linkAccount(account: any) {
      await prisma.oAuthAccount.upsert({
        where: {
          provider_providerId: {
            provider: account.provider,
            providerId: account.providerAccountId,
          },
        },
        update: {
          accessToken: account.access_token ?? "",
          refreshToken: account.refresh_token ?? null,
          scope: account.scope ?? null,
        },
        create: {
          provider: account.provider,
          providerId: account.providerAccountId,
          accessToken: account.access_token ?? "",
          refreshToken: account.refresh_token ?? null,
          scope: account.scope ?? null,
          userId: account.userId,
        },
      });
      return account;
    },

async unlinkAccount({ providerAccountId, provider }: any) {
      await prisma.oAuthAccount
        .delete({
          where: {
            provider_providerId: { provider, providerId: providerAccountId },
          },
        })
        .catch(() => null);
    },

    // ── Session (not used — JWT strategy) ────────────────────────────────
    async createSession(session: any) {
      return session;
    },
    async getSessionAndUser(_sessionToken: any) {
      return null;
    },
    async updateSession(session: any) {
      return session;
    },
    async deleteSession(_sessionToken: any) {}

    // ── Verification token (not used) ─────────────────────────────────────
    async createVerificationToken(vt: any) {
      return vt;
    },
    async useVerificationToken(_params: any) {
      return null;
    },
  };
}

// ── NextAuth options ──────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  adapter: HanexisAdapter(),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
        },
      },
    }),
LinkedInProvider({
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,

  issuer: "https://www.linkedin.com/oauth",

  wellKnown:
    "https://www.linkedin.com/oauth/.well-known/openid-configuration",

  authorization: {
    params: {
      scope: "openid profile email",
    },
  },

  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
}),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) return null;
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "linkedin") {
        token.linkedinAccessToken = account.access_token;
      }
      if (account?.provider === "google") {
        token.googleAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string;
        (session as any).linkedinAccessToken = token.linkedinAccessToken;
        (session as any).googleAccessToken = token.googleAccessToken;
      }
      return session;
    },
    async signIn({ user, account }: any) {
      // Store integration tokens for LinkedIn / Google after OAuth sign-in.
      if (account && user.id) {
        try {
          if (account.provider === "linkedin" && account.access_token) {
            await prisma.integration.upsert({
              where: { userId_provider: { userId: user.id, provider: "linkedin" } },
              update: { accessToken: account.access_token, status: "CONNECTED" },
              create: {
                userId: user.id,
                provider: "linkedin",
                accessToken: account.access_token,
                status: "CONNECTED",
              },
            });
          }
          if (account.provider === "google" && account.access_token) {
            await prisma.integration.upsert({
              where: { userId_provider: { userId: user.id, provider: "google" } },
              update: { accessToken: account.access_token, status: "CONNECTED" },
              create: {
                userId: user.id,
                provider: "google",
                accessToken: account.access_token,
                status: "CONNECTED",
              },
            });
          }
        } catch {
          // Non-fatal: don't block sign-in if integration upsert fails
        }
      }
      return true;
    },
  },
};
