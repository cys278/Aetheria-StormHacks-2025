// api/ending.ts (for Vercel / Netlify style)
// If you’re not using serverless, ignore this file.
export default async function handler(req: any, res: any) {
  const key = (req.query.key as string) || "default";

  const map: Record<string, { title: string; content: string }> = {
    regret: {
      title: "An Echo of Regret",
      content:
        "You arrive at a quiet balcony. The wind carries names you forgot to say out loud.\n\n" +
        "The city sleeps beneath you, but one window stays lit — the one you never opened.",
    },
    truth: {
      title: "A Small, Sharp Truth",
      content:
        "There was never a lock on the door, only the fear of turning the handle.\n\n" +
        "You turn it now.",
    },
    default: {
      title: "The Page Turns",
      content:
        "Endings do not end. They bend into beginnings.\n\n" +
        "Walk on, a little lighter.",
    },
  };

  res.status(200).json(map[key] || map.default);
}
