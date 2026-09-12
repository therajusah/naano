// Local sample blog content for the marketing site. Static data only — no DB.

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date
  readingMinutes: number;
  author: { name: string; role: string };
  tag: string;
  /** Ordered body blocks rendered as prose. */
  body: BlogBlock[];
};

export type BlogBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "launch-your-first-b2b-linkedin-creator-campaign",
    title: "How to launch your first B2B LinkedIn creator campaign",
    excerpt:
      "A practical, step-by-step playbook for going from an ICP definition to your first tracked, revenue-attributed LinkedIn creator campaign.",
    date: "2026-08-28",
    readingMinutes: 6,
    author: { name: "Élodie Martin", role: "Head of Growth, Naano" },
    tag: "Playbook",
    body: [
      {
        type: "paragraph",
        text: "Creator marketing has quietly become one of the most efficient channels in B2B. The reason is simple: buyers trust people more than they trust logos. When a respected practitioner recommends your product to the exact audience you sell to, you inherit a slice of that trust. The hard part has always been operationalising it — finding the right creators, briefing them well, and proving it worked. Here's how to run your first campaign end to end.",
      },
      { type: "heading", text: "1. Start with the ICP, not the creator" },
      {
        type: "paragraph",
        text: "Before you look at a single profile, write down who you're trying to reach: the function, the seniority and the vertical. A creator with 8,000 followers who are 70% heads of RevOps at mid-market SaaS companies is worth far more to you than a generalist with 80,000 followers of mixed intent. Audience fit beats audience size every time.",
      },
      { type: "heading", text: "2. Shortlist by audience match" },
      {
        type: "paragraph",
        text: "On Naano, every creator's audience is broken down by function, seniority and vertical, and scored against your ICP. Shortlist five to ten creators whose match score is high and whose voice fits your brand. Diversity helps — a mix of reach levels lets you test messaging across audience sizes.",
      },
      { type: "heading", text: "3. Write a brief that gives creators room" },
      {
        type: "paragraph",
        text: "The best sponsored posts don't read like ads because the creator wrote them. Your brief should set the angle, the key messages, and the hard do's and don'ts — then get out of the way. Use the AI brief generator to draft this in minutes, refine it, and share it. You'll review every draft before anything goes live.",
      },
      { type: "heading", text: "4. Track everything from day one" },
      {
        type: "paragraph",
        text: "Attach a tracked link to every collaboration so you can see clicks per creator and per post, and tie any leads back to the exact source. Without attribution you're guessing; with it you know which creators to re-book and which messages to double down on.",
      },
      { type: "heading", text: "A simple first-campaign checklist" },
      {
        type: "list",
        items: [
          "Define your ICP: function, seniority, vertical",
          "Shortlist 5–10 creators by audience match, not follower count",
          "Generate and refine a brief, then get creator drafts approved",
          "Publish from creators' own profiles with tracked links",
          "Review clicks, leads and pipeline weekly and re-book your winners",
        ],
      },
      {
        type: "paragraph",
        text: "Run this loop once and you'll have a repeatable, measurable channel — one your finance team can actually reason about.",
      },
    ],
  },
  {
    slug: "naano-vs-alternatives-creator-marketplace-vs-linkedin-ads",
    title: "Naano vs alternatives: creator marketplace vs LinkedIn Ads",
    excerpt:
      "LinkedIn Ads buy impressions from a company page. A creator marketplace buys trust from people your buyers already follow. Here's when to use each.",
    date: "2026-08-14",
    readingMinutes: 7,
    author: { name: "Tomás Rivera", role: "Content Lead, Naano" },
    tag: "Comparison",
    body: [
      {
        type: "paragraph",
        text: "If you run B2B demand generation on LinkedIn, you have two broad options: pay LinkedIn to show your ad, or work with creators whose audiences already trust them. Both have a place. The mistake is treating them as the same line item — they behave very differently.",
      },
      { type: "heading", text: "What LinkedIn Ads are good at" },
      {
        type: "paragraph",
        text: "Paid ads give you precise targeting, instant scale and predictable delivery. If you need to put a specific message in front of a specific job title tomorrow, ads do that. The trade-offs are cost and credibility: CPMs are high, and audiences have learned to scroll past anything that looks like a company promoting itself.",
      },
      { type: "heading", text: "What a creator marketplace is good at" },
      {
        type: "paragraph",
        text: "Creator posts publish from personal profiles, where LinkedIn concentrates organic reach, and they carry the endorsement of someone your buyers chose to follow. That trust is hard to buy any other way. On a creator marketplace like Naano you pay a fixed price per post, book by audience fit, and track the clicks and leads each collaboration drives.",
      },
      { type: "heading", text: "A head-to-head" },
      {
        type: "list",
        items: [
          "Trust: creator posts inherit the creator's credibility; ads carry the brand's.",
          "Cost model: creators are a fixed price per post; ads are per impression or click.",
          "Reach type: creators drive organic reach; ads are paid distribution.",
          "Attribution: both can be tracked, but creators tie performance to a named person your buyers know.",
          "Longevity: a strong creator relationship compounds; an ad stops the moment you stop paying.",
        ],
      },
      { type: "heading", text: "The pragmatic answer: use both" },
      {
        type: "paragraph",
        text: "Ads are a great fit for retargeting, event pushes and tightly-timed launches. Creator campaigns are a great fit for building trust at the top of the funnel and reaching buyers who tune ads out. The teams that win usually run a small, always-on creator program and layer paid on top when they need a spike. The key is measuring both the same way — by pipeline, not impressions.",
      },
    ],
  },
  {
    slug: "what-sponsored-linkedin-posts-cost-2026",
    title: "What sponsored LinkedIn posts actually cost in 2026",
    excerpt:
      "Real benchmarks for what B2B creators charge per post, why prices scale with audience fit rather than raw follower count, and how to budget.",
    date: "2026-07-30",
    readingMinutes: 5,
    author: { name: "Élodie Martin", role: "Head of Growth, Naano" },
    tag: "Benchmarks",
    body: [
      {
        type: "paragraph",
        text: "\"What should I pay a LinkedIn creator?\" is the question we hear most from teams running their first campaign. The honest answer is that it depends — but it depends on things you can actually measure, and the ranges are more predictable than you might expect.",
      },
      { type: "heading", text: "Prices scale with reach — up to a point" },
      {
        type: "paragraph",
        text: "As a rough guide, per-post prices climb with a creator's median reach. Smaller, highly-niche creators often sit around €84 per post; mid-sized creators land in the €180–€480 range; and the largest B2B voices command €720 or more. But raw follower count is a poor proxy on its own.",
      },
      { type: "heading", text: "Audience fit is the real multiplier" },
      {
        type: "paragraph",
        text: "A creator whose audience is 80% your exact buyer is worth a premium over one with twice the followers and half the relevance. When you price by audience match, a smaller creator can deliver a far better cost-per-qualified-lead than a bigger one. That's why Naano surfaces an audience-match score alongside every price.",
      },
      { type: "heading", text: "How to build a budget" },
      {
        type: "list",
        items: [
          "Decide how many posts you want live in the campaign window.",
          "Blend reach levels: a few larger creators for scale, several niche ones for fit.",
          "Multiply expected posts by the median price in each band to get a working budget.",
          "Leave room to re-book the creators who drive the most qualified leads.",
        ],
      },
      {
        type: "paragraph",
        text: "Because every price on Naano is fixed and shown before you book — with no per-click, per-impression or per-lead fees layered on — your budget is knowable from the start. Track results, keep your winners, and let cost-per-lead, not follower count, guide where the next euro goes.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
