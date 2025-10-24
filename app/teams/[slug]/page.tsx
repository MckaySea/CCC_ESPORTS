// app/team/[slug]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
// Import the database pool client
import pool from "@/lib/db";

// --- TypeScript Interfaces ---

// Used for client-side rendering/component props
interface Player {
  name: string;
  role: string;
  image: string;
}

interface TeamData {
  game: string;
  logo: string;
  description: string;
  players: Player[];
  slug: string;
}

// Interfaces for the data returned directly from PostgreSQL
interface GameDBRow {
  game_id: number;
  name: string;
  player_count: number; // For description field
}

interface PlayerDBRow {
  name: string;
  role: string;
  team_name: string;
  discord_id: string; // BIGINT is read as string
}

// --- Role-Based Image Mapping ---

// Define role-to-image mapping using files from the public directory
// app/team/[slug]/page.tsx (Updated ROLE_IMAGE_MAP)

const ROLE_IMAGE_MAP: Record<string, string> = {
  // MOBA Roles (all keys converted to UPPERCASE)
  TOP: "/college-student-playing-league-of-legends-competit.jpg",
  JUNGLE: "/competitive-gamer-with-headset.jpg",
  MID: "/esports-team-captain.jpg",
  ADC: "/esports-player-in-team-jersey.jpg",
  SUPPORT: "/college-esports-team-member.jpg",

  // FPS Roles
  AWPER: "/counter-strike-player-at-lan-event.jpg",
  ENTRY_FRAGGER: "/cs2-competitive-player.jpg",
  CONTROLLER: "/focused-esports-player-at-gaming-setup.jpg",
  SENTINEL: "/esports-player-with-gaming-mouse.jpg",
  DUELIST: "/focused-valorant-competitor.jpg",

  // General/Fallback Roles
  CAPTAIN: "/esports-team-captain.jpg",
  FLEX: "/focused-esports-player-at-gaming-setup.jpg",
  STRIKER: "/placeholder.svg?height=400&width=400",
  MIDFIELDER: "/placeholder.svg?height=400&width=400",
  GOALKEEPER: "/placeholder.svg?height=400&width=400",
  TANK: "/placeholder.svg?height=400&width=400",
  DAMAGE: "/placeholder.svg?height=400&width=400",
  HEALS: "/placeholder.svg?height=400&width=400",
  FRAGGER: "/placeholder.svg?height=400&width=400",
  SCOUT: "/placeholder.svg?height=400&width=400",
  IN_GAME_LEADER: "/esports-team-captain.jpg",
  LURKER: "/focused-cs2-player.jpg",

  // Default fallback image
  DEFAULT: "/placeholder.svg?height=400&width=400",
};

// --- Data Fetching Functions ---

// 1. Fetch ALL Game Slugs for static generation
export async function generateStaticParams() {
  const query = "SELECT name FROM Games";

  try {
    const result = await pool.query(query);
    // Explicitly type 'row' to avoid the implicit 'any' error
    return result.rows.map((row: { name: string }) => ({
      // Convert game names to URL-friendly slugs
      slug: row.name.toLowerCase().replace(/\s/g, "-"),
    }));
  } catch (error) {
    console.error("Error fetching static params:", error);
    return [];
  }
}

// 2. Fetch data for the specific team page
async function getTeamData(slug: string): Promise<TeamData | null> {
  // Convert the URL slug into a lowercase string with spaces instead of hyphens
  const lowerSlug = slug.toLowerCase().replace(/-/g, " ");

  // 1. Fetch Game Details using LOWER() for case-insensitive matching
  const gameQuery = `
    SELECT game_id, name, player_count
    FROM Games 
    -- FIX: Convert the stored name to lowercase for a reliable match against the slug
    WHERE LOWER(name) = $1 
  `;

  // Use the interface to type the expected result
  // The revalidation is applied by the 'export const revalidate = 30' below.
  const gameResult = await pool.query<GameDBRow>(gameQuery, [lowerSlug]);

  if (gameResult.rows.length === 0) {
    return null; // Game not found (results in 404)
  }

  const game = gameResult.rows[0];
  const gameId = game.game_id;

  // 2. Fetch Players for that Game (joining Teams -> Players)
  const playersQuery = `
    SELECT p.name, p.role
    FROM Players p
    JOIN Teams t ON p.team_id = t.team_id
    WHERE t.game_id = $1
    ORDER BY p.role
  `;

  // Use the interface to type the expected result
  const playersResult = await pool.query<PlayerDBRow>(playersQuery, [gameId]);

  // 3. Map DB results to the required Player structure and assign image based on role
  const players: Player[] = playersResult.rows.map((row: PlayerDBRow) => {
    const upperCaseRole = row.role.toUpperCase();
    const imagePath =
      ROLE_IMAGE_MAP[upperCaseRole] || ROLE_IMAGE_MAP["DEFAULT"];
    return {
      name: row.name,
      role: row.role,
      image: imagePath, // Use the dynamically selected path
    };
  });

  // 4. Construct the final TeamData object
  return {
    game: game.name, // Use the actual name returned from DB for display
    logo: "/placeholder.svg?height=200&width=200",
    description: `Competing in ${game.name}. Required roster size: ${game.player_count} players.`,
    players: players,
    slug: slug,
  };
}

// --- Next.js Revalidation Setting ---
// This tells Next.js to revalidate the page data at most every 30 seconds (ISR).
export const revalidate = 30;

// --- Main Next.js Component ---

export default async function TeamPage({
  params,
}: {
  params: { slug: string };
}) {
  const awaitedParams = await params;
  const team = await getTeamData(awaitedParams.slug); // Fetch data

  if (!team) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 bg-background">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Games
            </Link>

            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <Image
                  src={team.logo || "/placeholder.svg"}
                  alt={`${team.game} logo`}
                  width={128}
                  height={128}
                  className="object-contain"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-black uppercase mb-4">
                  {team.game}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {team.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Players Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-12 text-center">
              Meet the <span className="text-primary">Roster</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.players.map((player, index) => (
                <div
                  key={index}
                  className="group bg-card border-2 border-primary/20 rounded-lg overflow-hidden hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={player.image || "/placeholder.svg"}
                      alt={player.name}
                      width={400}
                      height={400}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-60" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black uppercase mb-1 group-hover:text-primary transition-colors">
                      {player.name}
                    </h3>
                    <p className="text-sm text-primary font-semibold">
                      {player.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {team.players.length === 0 && (
              <p className="text-center text-muted-foreground mt-8">
                No players currently listed for this team.
              </p>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
