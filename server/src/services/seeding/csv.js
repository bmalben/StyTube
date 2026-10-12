const parseCsvLine = (line = '') => {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values.map((value) => value.trim())
}

const parseCsvRows = (csvText = '') => {
  const trimmed = csvText.trim()
  if (!trimmed) return []

  const lines = trimmed.split(/\r?\n/).filter(Boolean)
  if (!lines.length) return []

  const headers = parseCsvLine(lines[0]).map((header) => header.trim())
  const rows = []

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i])
    const row = {}
    headers.forEach((header, index) => {
      const rawValue = values[index] ?? ''
      const normalizedKey = header.trim().replace(/^['"]|['"]$/g, '')
      const normalizedValue = rawValue.replace(/^['"]|['"]$/g, '')
      row[normalizedKey] = normalizedValue
    })
    rows.push(row)
  }

  return rows
}

module.exports = {
  parseCsvRows,
}
