import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { STYLISTS, STYLIST_IDS, type StylistId } from "./stylists";

const Input = z.object({
  stylist: z.enum(["elise", "maya", "clara"]),
  message: z.string().min(1).max(2000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(12),
  wardrobe: z.array(z.object({ id: z.string(), d: z.string() })).max(400),
  excludeDresses: z.boolean(),
});

export const askStylist = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }) => {
    const { generateChatCompletion } = await import("@lovable.dev/ai-gateway");
    const s = STYLISTS[data.stylist];
    const system = `${s.persona}
Tu conseilles une étudiante en médecine à Kinshasa (RDC). Réponds toujours en français.
RÈGLE ABSOLUE : tu ne peux recommander QUE des articles de la liste DRESSING ci-dessous, cités par leur identifiant exact. N'invente jamais de vêtement. S'il manque une pièce, dis-le simplement sans l'inventer.
${data.excludeDresses ? "Elle ne porte pas de robes ni de jupes : privilégie pantalons cargos, amples, à pinces, jeans, vestes, cardigans, chemises, superpositions." : ""}
Réponds UNIQUEMENT en JSON : {"reply": "ton conseil (max 120 mots)", "itemIds": ["id1","id2"]} — itemIds = la tenue proposée (vide si non pertinent).
DRESSING (id: description) :
${data.wardrobe.map((w) => `${w.id}: ${w.d}`).join("\n") || "(vide)"}`;
    const messages = [
      { role: "system" as const, content: system },
      ...data.history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user" as const, content: data.message },
    ];
    const order: StylistId[] = [data.stylist, ...STYLIST_IDS.filter((x) => x !== data.stylist)];
    const errors: string[] = [];
    for (const id of order) {
      const model = STYLISTS[id].model as "google/gemini-3.8-flash";
      try {
        const res = await generateChatCompletion({ model, messages } as Parameters<typeof generateChatCompletion<"google/gemini-3.8-flash">>[0], { maxRetries: 1 });
        const text = String((res as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content ?? "");
        const m = text.match(/\{[\s\S]*\}/);
        let parsed: { reply?: unknown; itemIds?: unknown } = {};
        try { parsed = m ? JSON.parse(m[0]) : {}; } catch { parsed = { reply: text }; }
        return { ok: true as const, reply: String(parsed.reply ?? text), itemIds: Array.isArray(parsed.itemIds) ? parsed.itemIds.map(String) : [], servedBy: id, relay: id !== data.stylist };
      } catch (e) {
        errors.push(`${id}: ${e instanceof Error ? e.message : "erreur"}`);
      }
    }
    return { ok: false as const, reply: "", itemIds: [] as string[], servedBy: data.stylist, relay: false, error: errors.join(" ; ") };
  });
