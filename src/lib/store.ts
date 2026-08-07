import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Dos backends con la misma interfaz:
 *  - Supabase, si estan las variables de entorno (lo que usaras en produccion).
 *  - Un JSON en .data/, para que puedas levantar la app y probarla sin montar
 *    nada. No sirve en Vercel: el disco es de solo lectura y efimero.
 */

export type Link = {
  id: string;
  code: string;
  destination: string;
  title: string | null;
  ownerToken: string;
  active: boolean;
  views: number;
  completions: number;
  createdAt: string;
};

export type DailyStat = { day: string; views: number; completions: number };

export type LinkStats = {
  link: Link;
  uniques: number;
  daily: DailyStat[];
};

export type EventKind = "view" | "complete";

export type EventMeta = {
  visitorHash?: string;
  country?: string;
  referer?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Supabase renombro las claves: las nuevas son `sb_secret_...` (Secret key) y
// las antiguas `service_role` son JWT. Las dos valen y sirven igual, asi que
// aceptamos cualquiera de los dos nombres de variable.
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

// -----------------------------------------------------------------------------
// Backend de archivo (solo desarrollo)
// -----------------------------------------------------------------------------

type FileEvent = { code: string; kind: EventKind; visitorHash: string; day: string };
type FileShape = { links: Link[]; events: FileEvent[] };

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "links.json");

async function readFileDb(): Promise<FileShape> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as FileShape;
  } catch {
    return { links: [], events: [] };
  }
}

async function writeFileDb(data: FileShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// -----------------------------------------------------------------------------
// API publica
// -----------------------------------------------------------------------------

type SupabaseLinkRow = {
  id: string;
  code: string;
  destination: string;
  title: string | null;
  owner_token: string;
  active: boolean;
  views: number | string;
  completions: number | string;
  created_at: string;
};

function fromRow(row: SupabaseLinkRow): Link {
  return {
    id: row.id,
    code: row.code,
    destination: row.destination,
    title: row.title,
    ownerToken: row.owner_token,
    active: row.active,
    views: Number(row.views),
    completions: Number(row.completions),
    createdAt: row.created_at,
  };
}

export async function getLink(code: string): Promise<Link | null> {
  if (usingSupabase) {
    const { data, error } = await db()
      .from("links")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data as SupabaseLinkRow) : null;
  }

  const store = await readFileDb();
  return store.links.find((l) => l.code === code) ?? null;
}

export async function codeExists(code: string): Promise<boolean> {
  return (await getLink(code)) !== null;
}

export async function createLink(input: {
  code: string;
  destination: string;
  title: string | null;
  ownerToken: string;
  createdIp?: string;
}): Promise<Link> {
  if (usingSupabase) {
    const { data, error } = await db()
      .from("links")
      .insert({
        code: input.code,
        destination: input.destination,
        title: input.title,
        owner_token: input.ownerToken,
        created_ip: input.createdIp ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromRow(data as SupabaseLinkRow);
  }

  const store = await readFileDb();
  const link: Link = {
    id: crypto.randomUUID(),
    code: input.code,
    destination: input.destination,
    title: input.title,
    ownerToken: input.ownerToken,
    active: true,
    views: 0,
    completions: 0,
    createdAt: new Date().toISOString(),
  };
  store.links.push(link);
  await writeFileDb(store);
  return link;
}

export async function recordEvent(
  code: string,
  kind: EventKind,
  meta: EventMeta = {}
): Promise<void> {
  if (usingSupabase) {
    const { error } = await db().rpc("record_link_event", {
      p_code: code,
      p_kind: kind,
      p_visitor_hash: meta.visitorHash ?? null,
      p_country: meta.country ?? null,
      p_referer: meta.referer ?? null,
    });
    // Un fallo contando estadisticas no debe romper la redireccion del usuario.
    if (error) console.error("[cortix] record_link_event:", error.message);
    return;
  }

  const store = await readFileDb();
  const link = store.links.find((l) => l.code === code);
  if (!link) return;
  if (kind === "view") link.views += 1;
  else link.completions += 1;
  store.events.push({
    code,
    kind,
    visitorHash: meta.visitorHash ?? "anon",
    day: today(),
  });
  await writeFileDb(store);
}

export async function setActive(code: string, active: boolean): Promise<void> {
  if (usingSupabase) {
    const { error } = await db().from("links").update({ active }).eq("code", code);
    if (error) throw new Error(error.message);
    return;
  }
  const store = await readFileDb();
  const link = store.links.find((l) => l.code === code);
  if (link) link.active = active;
  await writeFileDb(store);
}

export async function deleteLink(code: string): Promise<void> {
  if (usingSupabase) {
    const { error } = await db().from("links").delete().eq("code", code);
    if (error) throw new Error(error.message);
    return;
  }
  const store = await readFileDb();
  store.links = store.links.filter((l) => l.code !== code);
  store.events = store.events.filter((e) => e.code !== code);
  await writeFileDb(store);
}

export async function getStats(code: string, days = 30): Promise<LinkStats | null> {
  const link = await getLink(code);
  if (!link) return null;

  if (usingSupabase) {
    const [daily, uniques] = await Promise.all([
      db().rpc("link_daily_stats", { p_code: code, p_days: days }),
      db().rpc("link_unique_visitors", { p_code: code }),
    ]);
    return {
      link,
      uniques: Number(uniques.data ?? 0),
      daily: ((daily.data as DailyStat[]) ?? []).map((d) => ({
        day: String(d.day),
        views: Number(d.views),
        completions: Number(d.completions),
      })),
    };
  }

  const store = await readFileDb();
  const events = store.events.filter((e) => e.code === code);
  const byDay = new Map<string, DailyStat>();
  for (const e of events) {
    const row = byDay.get(e.day) ?? { day: e.day, views: 0, completions: 0 };
    if (e.kind === "view") row.views += 1;
    else row.completions += 1;
    byDay.set(e.day, row);
  }
  return {
    link,
    uniques: new Set(events.filter((e) => e.kind === "view").map((e) => e.visitorHash)).size,
    daily: [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)),
  };
}

export async function listAllLinks(limit = 200): Promise<Link[]> {
  if (usingSupabase) {
    const { data, error } = await db()
      .from("links")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return ((data as SupabaseLinkRow[]) ?? []).map(fromRow);
  }
  const store = await readFileDb();
  return [...store.links]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
