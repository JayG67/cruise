function normalizeTimestamp(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

module.exports = { normalizeTimestamp };