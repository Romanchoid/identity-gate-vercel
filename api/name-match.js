const REQUIRED_KEY = process.env.REQUIRED_KEY;

// --- helpers ---
function normalizeForMatch(s) {
  if (s == null) return "";
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function similarity(a, b) {
  const aa = normalizeForMatch(a);
  const bb = normalizeForMatch(b);
  const maxLen = Math.max(aa.length, bb.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(aa, bb);
  return Math.max(0, 1 - dist / maxLen);
}

// --- handler ---
export default async function handler(req, res) {
  try {
    const apiKey =
      req.headers["x-api-key"] ||
      req.query.apiKey ||
      req.body?.apiKey;

    if (!REQUIRED_KEY || apiKey !== REQUIRED_KEY) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Use POST" });
    }

    const {
      name_norm,
      contact_name_norm,
      surname_norm,
      contact_surname_norm
    } = req.body || {};

    const full_name_similarity = similarity(name_norm, contact_name_norm);
    const surname_similarity = similarity(surname_norm, contact_surname_norm);

    return res.status(200).json({
      ok: true,
      full_name_similarity,
      surname_similarity
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

