/**
 * Seed script — builds a realistic, self-contained Naano demo:
 *  - demo accounts (company, creator, brand agency, creator agency)
 *  - ~40 vetted marketplace creators with audience composition
 *  - campaigns with briefs, bookings across the pipeline, metric history,
 *    identifiable leads, and payouts
 *
 * Deterministic (seeded PRNG) so re-seeding produces stable data for demos.
 * Run with: npm run db:seed
 */
import {
  PrismaClient,
  type BookingStatus,
  type Prisma,
} from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { computeFitScore } from "../src/lib/fit-score";
import {
  AUDIENCE_FUNCTIONS,
  AUDIENCE_SENIORITIES,
  VERTICALS,
  PRICE_BANDS,
  MIN_POST_PRICE,
  MAX_POST_PRICE,
} from "../src/lib/constants";

const prisma = new PrismaClient();

// --- deterministic PRNG (mulberry32) ---------------------------------------
function makeRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260911);
const rand = (min: number, max: number) => min + rng() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)];
const chance = (p: number) => rng() < p;

// --- data pools ------------------------------------------------------------
const FIRST_NAMES = [
  "Alexis", "Thomas", "Maya", "Liam", "Sofia", "Noah", "Elena", "Lucas",
  "Priya", "Marco", "Amara", "Jonas", "Clara", "Diego", "Nina", "Omar",
  "Freya", "Ravi", "Ingrid", "Mateo", "Yuki", "Hannah", "Pavel", "Lena",
  "Samuel", "Chloe", "Andre", "Zoe", "Felix", "Aisha", "Karl", "Beatriz",
  "Viktor", "Sara", "Idris", "Emma", "Tobias", "Nadia", "Hugo", "Leah",
];
const LAST_NAMES = [
  "Jarre", "Lambert", "Nowak", "Rossi", "Silva", "Kowalski", "Meyer", "Dubois",
  "Kaur", "Fischer", "Okafor", "Berg", "Moreau", "Costa", "Andersen", "Hassan",
  "Larsen", "Sharma", "Bianchi", "Vega", "Tanaka", "Wagner", "Novak", "Schmidt",
  "Mensah", "Laurent", "Petrov", "Haas", "Ferreira", "Khan",
];
const LOCATIONS = ["FR", "UK", "DE", "US", "NL", "ES", "SE", "IE", "PT", "CA"];
const HEADLINES = [
  "Turning LinkedIn into revenue",
  "B2B SaaS growth, in public",
  "Helping founders sell without ads",
  "Demand gen that actually converts",
  "Building in AI, sharing the playbook",
  "GTM lessons from the trenches",
  "Fintech product & growth",
  "DevTools & developer marketing",
  "RevOps, pipeline & forecasting",
  "Future of work & hiring",
];
const BIO_TEMPLATES = [
  "I write about {topic} for busy B2B operators. No fluff, just what works.",
  "{years}+ years in {topic}. Sharing the frameworks I wish I'd had earlier.",
  "Ex-operator turned creator. I break down {topic} for founders and GTM teams.",
  "Daily posts on {topic}. Trusted by builders across B2B SaaS.",
];
const POST_TEMPLATES = [
  "The biggest {topic} mistake I see B2B teams make (and the 3-step fix).",
  "We 2x'd pipeline in 90 days. Here's the {topic} system that did it.",
  "Nobody talks about this {topic} lever. It quietly drives most of the results.",
  "I audited 50 B2B {topic} funnels. The same 4 leaks show up every time.",
  "Stop copying enterprise {topic} playbooks. Here's what works for lean teams.",
];
const TOPICS = [
  "demand gen", "content", "sales", "GTM", "positioning", "RevOps",
  "product marketing", "growth", "founder-led sales", "community",
];

const FULL_NAME = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

const LEAD_TITLES = [
  "VP Marketing", "Head of Growth", "Founder & CEO", "CMO", "Demand Gen Lead",
  "Head of Sales", "RevOps Manager", "Product Marketing Lead", "CTO", "COO",
];
const LEAD_COMPANIES = [
  "Northwind", "Lumen Labs", "Cobalt", "Everfield", "Baseline", "Kestrel",
  "Fathom", "Junction", "Beacon", "Tidepool", "Arcadia", "Mesa",
];

const DEMO_PASSWORD = "password123";

// --- audience map generation ------------------------------------------------
function weightedAudience(primary: string, labels: readonly string[]): Prisma.JsonObject {
  const raw: Record<string, number> = {};
  let total = 0;
  for (const label of labels) {
    const base = label === primary ? rand(2.5, 4) : rand(0.3, 1.5);
    raw[label] = base;
    total += base;
  }
  const out: Record<string, number> = {};
  for (const label of labels) out[label] = Number((raw[label] / total).toFixed(3));
  return out;
}

function medianPriceForFollowers(followers: number): number {
  const band = PRICE_BANDS.find((b) => followers < b.maxFollowers) ?? PRICE_BANDS[PRICE_BANDS.length - 1];
  return band.median;
}

const VERTICAL_TO_FUNCTION: Record<string, string> = {
  "B2B SaaS": "Marketing",
  Fintech: "Finance/VC",
  DevTools: "Engineering/Data",
  "AI/ML": "Engineering/Data",
  "Sales/Marketing": "Sales/BD",
  "HR/Future-of-work": "HR/People",
  "E-commerce": "Marketing",
  Cybersecurity: "Engineering/Data",
  "Data/Analytics": "Product",
};

type SeededCreator = {
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  verticals: string[];
  followers: number;
  medianReach: number;
  engagementRate: number;
  avgReactions: number;
  avgComments: number;
  pricePerPost: number;
  audienceByFunction: Prisma.JsonObject;
  audienceBySeniority: Prisma.JsonObject;
  posts: { content: string; reactions: number; comments: number; postedAt: Date }[];
};

function buildCreator(): SeededCreator {
  const vertical = pick(VERTICALS);
  const secondVertical = chance(0.5) ? pick(VERTICALS) : null;
  const verticals = Array.from(new Set([vertical, secondVertical].filter(Boolean))) as string[];
  const primaryFunction = VERTICAL_TO_FUNCTION[vertical] ?? "Marketing";
  const primarySeniority = pick(AUDIENCE_SENIORITIES);

  const followers = randInt(1200, 220000);
  const engagementRate = Number(rand(0.6, 4.5).toFixed(2));
  const avgReactions = Math.round((followers * engagementRate) / 100 / rand(1.2, 2.2));
  const avgComments = Math.round(avgReactions * rand(0.2, 0.6));
  const medianReach = Math.round(followers * rand(0.5, 1.4));

  const priceVariance = rand(0.8, 1.25);
  const pricePerPost = Math.max(
    MIN_POST_PRICE,
    Math.min(MAX_POST_PRICE, Math.round((medianPriceForFollowers(followers) * priceVariance) / 10) * 10),
  );

  const topic = pick(TOPICS);
  const bio = pick(BIO_TEMPLATES)
    .replace("{topic}", topic)
    .replace("{years}", String(randInt(6, 15)));

  const posts = Array.from({ length: randInt(2, 4) }, (_, i) => {
    const reactions = Math.round(avgReactions * rand(0.6, 1.6));
    return {
      content: pick(POST_TEMPLATES).replace("{topic}", pick(TOPICS)),
      reactions,
      comments: Math.round(reactions * rand(0.15, 0.5)),
      postedAt: daysAgo(randInt(2, 60) + i),
    };
  });

  return {
    displayName: FULL_NAME(),
    headline: pick(HEADLINES),
    bio,
    location: pick(LOCATIONS),
    verticals,
    followers,
    medianReach,
    engagementRate,
    avgReactions,
    avgComments,
    pricePerPost,
    audienceByFunction: weightedAudience(primaryFunction, AUDIENCE_FUNCTIONS),
    audienceBySeniority: weightedAudience(primarySeniority, AUDIENCE_SENIORITIES),
    posts,
  };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function slug(len = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[randInt(0, chars.length - 1)];
  return out;
}

async function clearAll() {
  // Delete children before parents to satisfy FKs.
  await prisma.payout.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.postMetricDaily.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.brief.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.creatorPost.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.agencyClientWorkspace.deleteMany();
  await prisma.agencyProfile.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  // Vercel/production build sets SEED_IF_EMPTY=1 so first deploy loads demo
  // accounts, and later deploys skip instead of wiping live data.
  if (process.env.SEED_IF_EMPTY === "1") {
    const existing = await prisma.user.count();
    if (existing > 0) {
      console.log(`seed skipped (${existing} users already present)`);
      return;
    }
  }

  console.log("🌱 Seeding Naano demo data…");
  await clearAll();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // --- Marketplace creators (no logins) ------------------------------------
  const creatorProfileIds: string[] = [];
  const creatorCount = 40;
  for (let i = 0; i < creatorCount; i++) {
    const data = buildCreator();
    const created = await prisma.creatorProfile.create({
      data: {
        displayName: data.displayName,
        headline: data.headline,
        bio: data.bio,
        location: data.location,
        verticals: data.verticals,
        followers: data.followers,
        medianReach: data.medianReach,
        engagementRate: data.engagementRate,
        avgReactions: data.avgReactions,
        avgComments: data.avgComments,
        pricePerPost: data.pricePerPost,
        available: chance(0.85),
        audienceByFunction: data.audienceByFunction,
        audienceBySeniority: data.audienceBySeniority,
        statsUpdatedAt: daysAgo(randInt(1, 20)),
        posts: { create: data.posts },
      },
    });
    creatorProfileIds.push(created.id);
  }
  console.log(`  • ${creatorCount} marketplace creators`);

  // --- Demo creator (with login) -------------------------------------------
  const creatorData = buildCreator();
  const creatorUser = await prisma.user.create({
    data: {
      email: "creator@naano.test",
      name: creatorData.displayName,
      passwordHash,
      role: "CREATOR",
      creatorProfile: {
        create: {
          displayName: creatorData.displayName,
          headline: creatorData.headline,
          bio: creatorData.bio,
          location: creatorData.location,
          verticals: creatorData.verticals,
          followers: creatorData.followers,
          medianReach: creatorData.medianReach,
          engagementRate: creatorData.engagementRate,
          avgReactions: creatorData.avgReactions,
          avgComments: creatorData.avgComments,
          pricePerPost: creatorData.pricePerPost,
          available: true,
          audienceByFunction: creatorData.audienceByFunction,
          audienceBySeniority: creatorData.audienceBySeniority,
          posts: { create: creatorData.posts },
        },
      },
    },
    include: { creatorProfile: true },
  });
  const demoCreatorProfileId = creatorUser.creatorProfile!.id;

  // --- Demo company (with login) -------------------------------------------
  const companyIcp = {
    functions: ["Marketing", "Sales/BD", "Founders"],
    seniorities: ["Founder/C-level", "VP/Head/Director"],
    vertical: "B2B SaaS",
  };
  const companyUser = await prisma.user.create({
    data: {
      email: "company@naano.test",
      name: "Dana Ruiz",
      passwordHash,
      role: "COMPANY",
      companyProfile: {
        create: {
          companyName: "Acme Analytics",
          website: "https://acme-analytics.example.com",
          industry: "Analytics software",
          vertical: companyIcp.vertical,
          icpDescription:
            "Revenue and marketing leaders at B2B SaaS companies (50–500 employees) who need clearer pipeline attribution.",
          icpFunctions: companyIcp.functions,
          icpSeniorities: companyIcp.seniorities,
          plan: "SELF_SERVE",
        },
      },
    },
    include: { companyProfile: true },
  });
  const company = companyUser.companyProfile!;
  console.log("  • demo company, creator");

  // --- Campaigns for the demo company --------------------------------------
  await seedCampaign({
    company,
    icp: companyIcp,
    creatorPool: creatorProfileIds,
    name: "Q3 Pipeline Push",
    objective: "Drive qualified demo requests from RevOps and marketing leaders",
    budget: 6000,
    targetPostCount: 15,
    status: "ACTIVE",
    live: true,
    aiBrief: false,
  });
  await seedCampaign({
    company,
    icp: companyIcp,
    creatorPool: creatorProfileIds,
    name: "Launch: Insights AI",
    objective: "Announce the Insights AI module and capture waitlist signups",
    budget: 9000,
    targetPostCount: 20,
    status: "ACTIVE",
    live: true,
    aiBrief: true,
  });
  await seedCampaign({
    company,
    icp: companyIcp,
    creatorPool: creatorProfileIds,
    name: "Always-on Thought Leadership",
    objective: "Sustained brand presence with founder-led creators",
    budget: 4000,
    targetPostCount: 12,
    status: "COMPLETED",
    live: true,
    aiBrief: false,
  });
  console.log("  • 3 campaigns with briefs, bookings, metrics, leads, payouts");

  // Give the demo creator real deals across statuses so their dashboard isn't empty.
  const demoCreator = await prisma.creatorProfile.findUnique({
    where: { id: demoCreatorProfileId },
  });
  const demoCampaigns = await prisma.campaign.findMany({
    where: { companyProfileId: company.id },
    orderBy: { createdAt: "asc" },
  });
  const demoStatuses: BookingStatus[] = ["LIVE", "INVITED", "PAID"];
  for (let i = 0; i < demoCampaigns.length && demoCreator; i++) {
    await seedBooking(
      demoCampaigns[i].id,
      company.website,
      demoCreator,
      companyIcp,
      demoStatuses[i % demoStatuses.length],
    );
  }
  console.log("  • demo creator booked across LIVE / INVITED / PAID deals");

  // --- Brand agency (with login) -------------------------------------------
  const brandAgencyUser = await prisma.user.create({
    data: {
      email: "agency@naano.test",
      name: "GrowthLab Agency",
      passwordHash,
      role: "AGENCY",
      agencyProfile: {
        create: {
          agencyName: "GrowthLab",
          type: "BRAND_AGENCY",
          clientWorkspaces: {
            create: [
              { clientName: "Fintable", budget: 12000 },
              { clientName: "DeployHQ", budget: 8000 },
            ],
          },
        },
      },
    },
  });

  // --- Creator agency (with login) -----------------------------------------
  const creatorAgencyUser = await prisma.user.create({
    data: {
      email: "talent@naano.test",
      name: "Signal Talent",
      passwordHash,
      role: "AGENCY",
      agencyProfile: { create: { agencyName: "Signal Talent", type: "CREATOR_AGENCY" } },
    },
    include: { agencyProfile: true },
  });
  // Attach a managed roster (managed creators without logins).
  for (let i = 0; i < 6; i++) {
    const data = buildCreator();
    await prisma.creatorProfile.create({
      data: {
        displayName: data.displayName,
        headline: data.headline,
        bio: data.bio,
        location: data.location,
        verticals: data.verticals,
        followers: data.followers,
        medianReach: data.medianReach,
        engagementRate: data.engagementRate,
        avgReactions: data.avgReactions,
        avgComments: data.avgComments,
        pricePerPost: data.pricePerPost,
        available: true,
        audienceByFunction: data.audienceByFunction,
        audienceBySeniority: data.audienceBySeniority,
        managedByAgencyId: creatorAgencyUser.agencyProfile!.id,
        posts: { create: data.posts },
      },
    });
  }
  console.log("  • brand agency + creator agency (6 managed creators)");

  void brandAgencyUser;

  console.log("\n✅ Seed complete. Demo logins (password: password123):");
  console.log("   company@naano.test   (company dashboard)");
  console.log("   creator@naano.test   (creator dashboard)");
  console.log("   agency@naano.test    (brand agency)");
  console.log("   talent@naano.test    (creator agency)");
}

// --- campaign seeding ------------------------------------------------------
type SeedCampaignArgs = {
  company: { id: string; website: string | null };
  icp: { functions: string[]; seniorities: string[]; vertical: string };
  creatorPool: string[];
  name: string;
  objective: string;
  budget: number;
  targetPostCount: number;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  live: boolean;
  aiBrief: boolean;
};

const PIPELINE_DISTRIBUTION: BookingStatus[] = [
  "LIVE", "LIVE", "LIVE", "PAID", "PAID", "APPROVED",
  "SCHEDULED", "DRAFT_SUBMITTED", "ACCEPTED", "INVITED",
];

async function seedCampaign(args: SeedCampaignArgs) {
  const campaign = await prisma.campaign.create({
    data: {
      companyProfileId: args.company.id,
      name: args.name,
      status: args.status,
      vertical: args.icp.vertical,
      icp: `${args.icp.functions.join(", ")} · ${args.icp.seniorities.join(", ")}`,
      objective: args.objective,
      budget: args.budget,
      targetPostCount: args.targetPostCount,
      startDate: daysAgo(args.status === "COMPLETED" ? 60 : 24),
      endDate: args.status === "COMPLETED" ? daysAgo(20) : daysAgo(-14),
      brief: { create: buildBrief(args.name, args.objective, args.aiBrief) },
    },
  });

  // Pick a set of creators for this campaign, scored against the ICP.
  const chosen = pickCreatorsForCampaign(args.creatorPool, args.status === "COMPLETED" ? 8 : 6);
  const creators = await prisma.creatorProfile.findMany({
    where: { id: { in: chosen } },
  });

  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];
    const status =
      args.status === "COMPLETED"
        ? chance(0.8) ? "PAID" : "LIVE"
        : PIPELINE_DISTRIBUTION[i % PIPELINE_DISTRIBUTION.length];
    await seedBooking(campaign.id, args.company.website, creator, args.icp, status);
  }
}

function buildBrief(name: string, objective: string, ai: boolean): Prisma.BriefCreateWithoutCampaignInput {
  return {
    angle: `Position the product as the fastest path to ${objective.toLowerCase()}.`,
    hook: "Most B2B teams are measuring the wrong thing. Here's what actually predicts pipeline.",
    cta: "Comment 'DEMO' or tap the link to see it on your own funnel.",
    keyMessages: [
      "Attribution should tie every post to real pipeline, not vanity metrics.",
      "Creator-led distribution beats cold ads for trust.",
      "Setup takes days, not quarters.",
    ],
    audience: "RevOps and marketing leaders at 50–500 person B2B SaaS companies.",
    toneOfVoice: "Direct, practitioner-to-practitioner, lightly contrarian.",
    doList: ["Use a concrete before/after story", "Show a real number", "Write in your own voice"],
    dontList: ["Don't sound like an ad", "Don't overclaim results"],
    proofPoints: ["150% ROAS in a recent campaign", "1,500+ qualified leads tracked"],
    generatedByAI: ai,
    prompt: ai ? `Generate a brief for "${name}" — objective: ${objective}` : null,
  };
}

function pickCreatorsForCampaign(pool: string[], n: number): string[] {
  const copy = [...pool];
  const out: string[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = randInt(0, copy.length - 1);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

async function seedBooking(
  campaignId: string,
  website: string | null,
  creator: { id: string; pricePerPost: number; audienceByFunction: unknown; audienceBySeniority: unknown; verticals: string[] },
  icp: { functions: string[]; seniorities: string[]; vertical: string },
  status: BookingStatus,
) {
  const fitScore = computeFitScore(icp, {
    audienceByFunction: (creator.audienceByFunction as Record<string, number>) ?? {},
    audienceBySeniority: (creator.audienceBySeniority as Record<string, number>) ?? {},
    verticals: creator.verticals,
  });
  const trackedSlug = slug();
  const base = website ?? "https://acme-analytics.example.com";
  const targetUrl = `${base}/?utm_source=linkedin&utm_medium=creator&utm_campaign=${campaignId.slice(0, 6)}`;

  const isPublished = ["LIVE", "COMPLETED", "PAID"].includes(status);
  const publishedAt = isPublished ? daysAgo(randInt(3, 20)) : null;
  const scheduledAt = ["SCHEDULED", "LIVE", "COMPLETED", "PAID"].includes(status)
    ? daysAgo(randInt(-3, 18))
    : null;

  const booking = await prisma.booking.create({
    data: {
      campaignId,
      creatorProfileId: creator.id,
      status,
      pricePerPost: creator.pricePerPost,
      fitScore,
      trackedSlug,
      targetUrl,
      draftContent: ["DRAFT_SUBMITTED", "APPROVED", "SCHEDULED", "LIVE", "COMPLETED", "PAID"].includes(status)
        ? "Most B2B teams can't tie a single lead back to a post. We changed that. Here's the 3-step system we used to attribute €400k of pipeline to creator content last quarter…"
        : null,
      scheduledAt,
      publishedAt,
    },
  });

  if (isPublished && publishedAt) {
    await seedMetricsAndLeads(booking.id, publishedAt);
  }
  if (status === "PAID") {
    await prisma.payout.create({
      data: {
        bookingId: booking.id,
        amount: creator.pricePerPost,
        status: "PAID",
        method: "SEPA",
        paidAt: publishedAt ? new Date(publishedAt.getTime() + 24 * 3600 * 1000) : new Date(),
      },
    });
  }
}

async function seedMetricsAndLeads(bookingId: string, publishedAt: Date) {
  const daysLive = Math.max(1, Math.floor((Date.now() - publishedAt.getTime()) / (24 * 3600 * 1000)));
  const span = Math.min(daysLive, 21);
  const peakImpressions = randInt(4000, 60000);
  let totalLeads = 0;

  for (let d = 0; d < span; d++) {
    // Decaying curve: most reach in the first days.
    const decay = Math.exp(-d / 4);
    const impressions = Math.round(peakImpressions * decay * rand(0.6, 1.1));
    const clicks = Math.round(impressions * rand(0.01, 0.03));
    const leads = Math.round(clicks * rand(0.03, 0.09));
    totalLeads += leads;
    const date = dateOnly(new Date(publishedAt.getTime() + d * 24 * 3600 * 1000));
    await prisma.postMetricDaily.create({
      data: { bookingId, date, impressions, clicks, leads },
    });
  }

  const leadCount = Math.min(totalLeads, randInt(3, 12));
  for (let i = 0; i < leadCount; i++) {
    await prisma.lead.create({
      data: {
        bookingId,
        name: FULL_NAME(),
        title: pick(LEAD_TITLES),
        company: pick(LEAD_COMPANIES),
        linkedinUrl: `https://www.linkedin.com/in/${slug(8).toLowerCase()}`,
        capturedAt: new Date(publishedAt.getTime() + randInt(0, span) * 24 * 3600 * 1000),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
