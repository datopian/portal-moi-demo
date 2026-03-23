import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).send("Missing url parameter");
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).send(`Upstream error: ${upstream.statusText}`);
    }
    const text = await upstream.text();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(text);
  } catch (e) {
    res.status(502).send(`Failed to fetch: ${String(e)}`);
  }
}
