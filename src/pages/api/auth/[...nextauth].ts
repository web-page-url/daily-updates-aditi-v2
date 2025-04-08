import NextAuth, { AuthOptions, SessionStrategy, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import KeycloakProvider from "next-auth/providers/keycloak";
import { supabase } from "../../../lib/supabaseClient";

// Extend types for TypeScript
interface KeycloakProfile {
  realm_access?: {
    roles?: string[];
  };
  [key: string]: any;
}

// Extended Session type
interface ExtendedSession extends Session {
  accessToken?: string;
  roles?: string[];
}

// Extend JWT type to include additional properties
interface ExtendedJWT extends JWT {
  accessToken?: string;
  idToken?: string;
  roles?: string[];
}

// Function to sync user role when they login via Keycloak
async function syncUserRoleToSupabase(user: any) {
  if (!user?.email) return;

  try {
    // Check if user exists in our user_roles table
    const { data: existingUser, error: fetchError } = await supabase
      .from('aditi_user_roles')
      .select('*')
      .eq('user_email', user.email)
      .limit(1);

    if (fetchError) {
      console.error('Error checking for existing user:', fetchError);
      return;
    }

    // If user doesn't exist, create them as a member
    if (!existingUser || existingUser.length === 0) {
      // Determine role based on Keycloak roles if available
      let role = 'member'; // Default role
      
      if (user.roles && Array.isArray(user.roles)) {
        if (user.roles.includes('admin')) {
          role = 'admin';
        } else if (user.roles.includes('manager')) {
          role = 'manager';
        }
      }
      
      const { error: insertError } = await supabase
        .from('aditi_user_roles')
        .insert([{
          user_email: user.email,
          role: role
        }]);

      if (insertError) {
        console.error('Error creating user role:', insertError);
      }
    }
  } catch (error) {
    console.error('Error in syncUserRoleToSupabase:', error);
  }
}

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.roles = (profile as KeycloakProfile)?.realm_access?.roles || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as ExtendedSession).accessToken = (token as ExtendedJWT).accessToken;
        (session as ExtendedSession).roles = (token as ExtendedJWT).roles;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        // Check if user exists in Supabase
        const { data: existingUser, error: checkError } = await supabase
          .from('aditi_user_roles')
          .select('*')
          .eq('user_email', user.email)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking user:', checkError);
          return false;
        }

        if (!existingUser) {
          // Create new user in Supabase
          const { error: createError } = await supabase
            .from('aditi_user_roles')
            .insert([{
              user_email: user.email,
              role: 'user' // Default role
            }]);

          if (createError) {
            console.error('Error creating user:', createError);
            return false;
          }
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export default NextAuth(authOptions); 