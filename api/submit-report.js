export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body;

    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = "Submissions";

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: "Missing Airtable environment variables" });
    }

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      return res.status(airtableRes.status).json({
        error: "Airtable error",
        detail: data
      });
    }

    return res.status(200).json({ success: true, airtable: data });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
}
