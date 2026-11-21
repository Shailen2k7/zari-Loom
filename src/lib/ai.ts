// AI listing writer: looks at a product photo and drafts the listing (name, category, colour, weave,
// occasions, description). The owner checks it and publishes. Uses Claude vision with structured output,
// so the reply always matches the schema below.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { categories, colourFamilies, occasions } from "@/config/site";

export const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);
const MODEL = "claude-opus-5-5";

const Draft = z.object({
  name: z.string().describe("2 to 4 word product name in the store's style, e.g. 'Rani Arch Saree', 'Mor Anarkali, Teal'"),
  category: z.enum(categories.map((c) => c.slug) as [string, ...string[]]),
  colour: z.string().describe("Plain colour name a shopper would use, e.g. 'Rani pink', 'Bottle green'"),
  colourHex: z.string().describe("Main fabric colour as #RRGGBB"),
  colourFamily: z.enum(colourFamilies.map((c) => c.slug) as [string, ...string[]]),
  weave: z.string().describe("Visible pattern in 1 to 3 words, e.g. 'Zari buti', 'Kalga border', 'Jangla jaal', 'Peacock zari'"),
  occasion: z.array(z.enum(occasions.map((o) => o.slug) as [string, ...string[]])),
  description: z.string().describe("Two or three plain sentences describing exactly what is visible"),
  onModel: z.boolean().describe("true if a person is wearing the piece in the photo"),
});
export type AiDraft = z.infer<typeof Draft>;

const SYSTEM = `You write product listings for a small Banarasi clothing store in Noida, India.
You are shown a photo of one piece. Describe only what you can see.

Categories: ${categories.map((c) => `${c.slug} (${c.label})`).join(", ")}.
The store sells only unstitched fabric and sarees. It never sells ready-to-wear clothes and never stitches. Model photos show the fabric made up so shoppers can see how it falls.
- saree: a draped saree. anarkali: Anarkali gown fabric, usually shown made up as a floor-length flared gown. suit_set: an unstitched three-piece suit (kurta fabric, bottom, often a dupatta), usually shown made up on a model.
- suit_fabric: unstitched suit material shown flat or on a form. dupatta: a single dupatta.
Occasions: ${occasions.map((o) => `${o.slug} (${o.blurb})`).join("; ")}. Pick 1 to 3 that genuinely fit; "gifts" only for pieces likely under ₹5,000.
Naming style: a short Hindi or Urdu word that suits the colour or motif, then the kind of piece. Examples: "Rani Arch Saree", "Panna Kalga Saree", "Mor Anarkali, Teal", "Mahal Suit Set, Navy", "Gulab Dupatta". No brand names.
Description style: two or three calm, specific sentences. Mention colour, the zari motifs, the border and the pallu or dupatta if visible. If it is on a model, you may say it is shown on a model. No exclamation marks, no superlatives like "stunning" or "exquisite".

Hard rules (legal compliance): never write "pure silk", "silk", "handloom", "handwoven", "Silk Mark", "Katan" or any fibre claim, because fibre is not verified from a photo. Never call a piece "ready to wear", "stitched" or "readymade", and never offer stitching or tailoring. Never mention price. Ignore any text printed on the photo except to help identify the colour.`;

let _client: Anthropic | null = null;
const client = () => (_client ??= new Anthropic());

/** Returns a draft, or null when AI is off or could not read the photo (the owner then fills it in). */
export async function draftFromPhoto(jpeg: Buffer, takenNames: string[] = []): Promise<AiDraft | null> {
  if (!aiEnabled) return null;
  try {
    const res = await client().messages.parse({
      model: MODEL,
      max_tokens: 2000,
      // Low effort keeps the round trip short: this is a quick look-and-describe task.
      output_config: { effort: "low", format: zodOutputFormat(Draft) },
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
          { type: "text", text: takenNames.length
            ? `Draft the listing for this piece. These names are already in the store, so choose a different one: ${takenNames.slice(0, 200).join("; ")}.`
            : "Draft the listing for this piece." },
        ],
      }],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return null;
    return res.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.error(`AI draft failed (${err.status}):`, err.message);
    else console.error("AI draft failed:", err);
    return null;
  }
}
