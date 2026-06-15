export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    console.error("[submit-report] Missing env vars: AIRTABLE_TOKEN=%s AIRTABLE_BASE_ID=%s",
      AIRTABLE_TOKEN ? "set" : "MISSING",
      AIRTABLE_BASE_ID ? "set" : "MISSING"
    );
    return res.status(500).json({ error: "Missing environment variables" });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch(e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (!body || !body.fields) {
    return res.status(422).json({ error: "No fields provided", received: body });
  }

  const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Submissions`;
  const airtablePayload = { fields: body.fields };

  console.log("[submit-report] POST", airtableUrl);
  console.log("[submit-report] payload fields:", JSON.stringify(Object.keys(body.fields)));

  const airtableRes = await fetch(airtableUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(airtablePayload)
  });

  const data = await airtableRes.json();

  console.log("[submit-report] Airtable status:", airtableRes.status);

  if (!airtableRes.ok) {
    // Log full error body (no secrets — token is in the header, not here)
    console.error("[submit-report] Airtable error body:", JSON.stringify(data));
    return res.status(airtableRes.status).json({ error: data });
  }

  return res.status(200).json({ success: true });
}
