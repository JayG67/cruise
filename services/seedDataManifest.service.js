const DEFAULT_SEED_MANIFEST = Object.freeze({
  source: 'data/cruise.json',
  mode: 'demo-seed',
  managedBy: 'loadCruiseData.service',
  productionReplacement: 'database-migrations-and-admin-workflows',
  entities: Object.freeze([
    'cruiseLines',
    'ships',
    'sailings',
    'itineraries',
    'customers',
    'bookings',
    'demoUsers',
    'turnaroundOperations'
  ])
})

const normalizeSeedEntityName = (entityName) => String(entityName || '')
  .trim()
  .replace(/[^a-zA-Z0-9]+(.)/g, (_match, chr) => chr.toUpperCase())
  .replace(/^[A-Z]/, (chr) => chr.toLowerCase())

const uniqueSeedEntities = (entities = []) => Array.from(new Set(
  entities
    .map(normalizeSeedEntityName)
    .filter(Boolean)
))

const buildSeedDataManifest = (overrides = {}) => ({
  ...DEFAULT_SEED_MANIFEST,
  ...overrides,
  entities: uniqueSeedEntities(overrides.entities || DEFAULT_SEED_MANIFEST.entities),
  contract: {
    preserveReadableIds: true,
    forbidRuntimeSeedMutation: true,
    requireMigrationPath: true,
    ...(overrides.contract || {})
  }
})

const describeSeedDataDecoupling = (manifest = buildSeedDataManifest()) => ({
  source: manifest.source,
  mode: manifest.mode,
  managedBy: manifest.managedBy,
  productionReplacement: manifest.productionReplacement,
  entityCount: manifest.entities.length,
  entities: [...manifest.entities],
  guardrails: [
    'seed JSON remains a reset/demo input, not the runtime source of truth',
    'production data changes flow through migrations, APIs, and admin workflows',
    'readable IDs remain stable while durable database identities continue hardening'
  ]
})

const assertSeedDataManifest = (manifest) => {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Seed data manifest is required.')
  }

  if (!manifest.source) {
    throw new Error('Seed data manifest source is required.')
  }

  if (!Array.isArray(manifest.entities) || manifest.entities.length === 0) {
    throw new Error('Seed data manifest entities are required.')
  }

  if (!manifest.productionReplacement) {
    throw new Error('Seed data manifest production replacement path is required.')
  }

  return manifest
}

module.exports = {
  DEFAULT_SEED_MANIFEST,
  normalizeSeedEntityName,
  uniqueSeedEntities,
  buildSeedDataManifest,
  describeSeedDataDecoupling,
  assertSeedDataManifest
}
