const API_ROOT = 'https://api.airtable.com/v0'

function token() {
  const t = import.meta.env.VITE_AIRTABLE_TOKEN
  if (!t) {
    throw new Error(
      'Missing VITE_AIRTABLE_TOKEN. Create a .env file (see .env.example) with a ' +
        'Personal Access Token scoped to JXP-CONFIG-APP (read) and the main base\'s ' +
        'Prospects & Booking tables (read/write).'
    )
  }
  return t
}

function authHeaders() {
  return {
    Authorization: `Bearer ${token()}`,
    'Content-Type': 'application/json',
  }
}

async function parseErrorMessage(res) {
  try {
    const body = await res.json()
    return body?.error?.message || body?.error?.type || res.statusText
  } catch {
    return res.statusText
  }
}

// Fetches every record matching the given list params, following Airtable's
// offset-based pagination (max 100 records per page).
export async function listAllRecords(baseId, tableId, params = {}) {
  const records = []
  let offset

  do {
    const url = new URL(`${API_ROOT}/${baseId}/${tableId}`)
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      url.searchParams.set(key, value)
    }
    if (offset) url.searchParams.set('offset', offset)

    const res = await fetch(url, { headers: authHeaders() })
    if (!res.ok) {
      throw new Error(`Airtable list failed (${tableId}): ${await parseErrorMessage(res)}`)
    }
    const data = await res.json()
    records.push(...data.records)
    offset = data.offset
  } while (offset)

  return records
}

export async function createRecord(baseId, tableId, fields, { typecast = false } = {}) {
  const res = await fetch(`${API_ROOT}/${baseId}/${tableId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ fields, typecast }),
  })
  if (!res.ok) {
    throw new Error(`Airtable create failed (${tableId}): ${await parseErrorMessage(res)}`)
  }
  return res.json()
}

// Escapes a value for safe interpolation into an Airtable filterByFormula string literal.
export function escapeFormulaString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}
