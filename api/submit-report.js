export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  let originHost;
  try { originHost = new URL(req.headers.origin).host; } catch {}
  if (!originHost || originHost !== req.headers.host) {
    return res.status(403).json({ error: 'Submit from the HevrutAI website.' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    return res.status(503).json({ error: "The review queue is not available. Save or export your case." });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch(e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (!body || !body.fields) {
    return res.status(422).json({ error: "No fields provided" });
  }
  const fields = {};
  const allowed = {'Case ID':200,'URL':2000,'Platform':200,'Claim Type':200,'Description':30000,'Counter Source':2000,'Context':80000,'Submitter Handle':200};
  for (const [key, max] of Object.entries(allowed)) {
    const value = body.fields[key] ?? '';
    if (typeof value !== 'string' || value.length > max) return res.status(422).json({error:'Invalid submission fields.'});
    fields[key] = value;
  }
  if (fields.Description.trim().length < 20 || !/^https?:\/\//i.test(fields.URL)) return res.status(422).json({error:'Supply a source URL and at least 20 characters of testimony.'});
  fields.Status = 'Pending';
  fields['Submitted At'] = new Date().toISOString();

  try {
  const airtableRes = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Submissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields }),
      signal: AbortSignal.timeout(15000)
    }
  );

  const data = await airtableRes.json();

  if (!airtableRes.ok) {
    return res.status(502).json({ error: 'The review service did not confirm receipt.' });
  }

  return res.status(200).json({ success: true });
  } catch {
    return res.status(502).json({ error: 'Receipt could not be confirmed. Check the review queue before resending.' });
  }
}
