import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { fetchGitHubContributions } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const response = NextResponse.redirect(
    new URL(code ? "/?success=true" : "/?error=no_code", requestUrl.origin)
  );

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Échanger le code contre une session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("Error exchanging code for session:", sessionError);
      return NextResponse.redirect(
        new URL(
          `/?error=${encodeURIComponent(sessionError.message)}`,
          requestUrl.origin
        )
      );
    }

    if (session?.user) {
      try {
        // Récupérer les informations utilisateur
        const githubUsername =
          session.user.user_metadata.user_name ||
          session.user.user_metadata.preferred_username;

        // Logs de diagnostic
        console.log('🔍 Session data:', {
          hasProviderToken: !!session.provider_token,
          providerTokenLength: session.provider_token?.length || 0,
          userId: session.user.id,
          username: githubUsername
        })
        
        // Vérifier les prérequis
        if (!githubUsername) {
          console.error("❌ No GitHub username found in user_metadata");
        }
        
        if (!session.provider_token) {
          console.error('❌ PROBLEM: provider_token is missing from session!')
          console.error('This usually means:')
          console.error('1. GitHub provider in Supabase is not configured to return the provider token')
          console.error('2. Check Dashboard > Authentication > Providers > GitHub > Enable Provider Refresh Token')
        }

        // Vérifier si c'est une première connexion
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, created_at")
          .eq("id", session.user.id)
          .single();

        const isFirstTime =
          !existingProfile ||
          (existingProfile &&
            new Date(existingProfile.created_at).getTime() >
              Date.now() - 60000); // Créé il y a moins d'1 minute

        // Récupérer et mettre à jour les contributions
        if (githubUsername && session.provider_token) {
          const contributions = await fetchGitHubContributions(
            githubUsername,
            session.provider_token
          );

          const totalContributions = Object.values(contributions).reduce(
            (sum, count) => sum + count,
            0
          );

          console.log(
            "✅ Contributions fetched:",
            Object.keys(contributions).length,
            "days, total:",
            totalContributions
          );

          // Créer un client admin pour bypasser RLS lors de l'UPDATE
          // Cela évite les problèmes de timing où auth.uid() n'est pas encore disponible
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          
          if (!supabaseServiceKey) {
            console.error("⚠️ SUPABASE_SERVICE_ROLE_KEY not configured, falling back to anon key (may fail due to RLS)");
          }

          const supabaseAdmin = supabaseServiceKey 
            ? createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                supabaseServiceKey,
                {
                  auth: {
                    autoRefreshToken: false,
                    persistSession: false
                  }
                }
              )
            : supabase; // Fallback to regular client if service key not available

          // Mettre à jour le profil avec les contributions (using admin client to bypass RLS)
          const { error: updateError, data: updateData } = await supabaseAdmin
          .from('profiles')
          .update({
            contributions_data: contributions,
            total_contributions: totalContributions,
            last_updated: new Date().toISOString(),
          })
          .eq('id', session.user.id)

          if (updateError) {
            console.error("❌ Error updating contributions:", updateError);
            console.error(
              "❌ Error details:",
              JSON.stringify(updateError, null, 2)
            );
          } else {
            console.log("✅ Update successful, total contributions:", totalContributions);
          }

          // Si c'est une première connexion, ajouter un paramètre dans l'URL
          if (isFirstTime) {
            const redirectUrl = new URL(
              "/?success=true&firstTime=true",
              requestUrl.origin
            );
            return NextResponse.redirect(redirectUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching contributions:", error);
        // Continue même si la récupération des contributions échoue
      }
    }
  }

  return response;
}
