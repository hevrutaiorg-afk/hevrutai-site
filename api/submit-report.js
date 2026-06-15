export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
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

  const airtableRes = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Submissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields: body.fields })
    }
  );

  const data = await airtableRes.json();

  if (!airtableRes.ok) {
    return res.status(airtableRes.status).json({ error: data });
  }

  return res.status(200).json({ success: true });
}
