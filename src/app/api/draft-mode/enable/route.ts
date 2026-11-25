import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity/server";
export async function GET(request: Request) {
  const token = process.env.SANITY_API_READ_TOKEN;
  if (!client || !token)
    return new Response("Preview is not configured.", { status: 503 });
  return defineEnableDraftMode({
    client: client.withConfig({ token, useCdn: false }),
  }).GET(request);
}
