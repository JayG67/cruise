const {
  DEFAULT_SEED_MANIFEST,
  normalizeSeedEntityName,
  uniqueSeedEntities,
  buildSeedDataManifest,
  describeSeedDataDecoupling,
  assertSeedDataManifest
} = require('../../services/seedDataManifest.service')

describe('seedDataManifest service', () => {
  it('documents the demo seed input without making it the runtime source of truth', () => {
    const manifest = buildSeedDataManifest()

    expect(manifest).toEqual(expect.objectContaining({
      source: 'data/cruise.json',
      mode: 'demo-seed',
      managedBy: 'loadCruiseData.service',
      productionReplacement: 'database-migrations-and-admin-workflows'
    }))
    expect(manifest.contract).toEqual(expect.objectContaining({
      preserveReadableIds: true,
      forbidRuntimeSeedMutation: true,
      requireMigrationPath: true
    }))
    expect(manifest.entities).toEqual(expect.arrayContaining(DEFAULT_SEED_MANIFEST.entities))
  })

  it('normalizes and deduplicates seed entity names for future migration manifests', () => {
    expect(normalizeSeedEntityName('turnaround-operations')).toBe('turnaroundOperations')
    expect(normalizeSeedEntityName(' Demo Users ')).toBe('demoUsers')
    expect(uniqueSeedEntities(['Customers', 'customers', 'turnaround operations', 'turnaround-operations'])).toEqual([
      'customers',
      'turnaroundOperations'
    ])
  })

  it('summarizes seed decoupling guardrails for release readiness reporting', () => {
    const summary = describeSeedDataDecoupling(buildSeedDataManifest({
      entities: ['customers', 'bookings']
    }))

    expect(summary).toEqual(expect.objectContaining({
      entityCount: 2,
      productionReplacement: 'database-migrations-and-admin-workflows'
    }))
    expect(summary.guardrails).toEqual(expect.arrayContaining([
      'seed JSON remains a reset/demo input, not the runtime source of truth',
      'production data changes flow through migrations, APIs, and admin workflows'
    ]))
  })

  it('rejects incomplete seed manifests before production data workflows depend on them', () => {
    expect(() => assertSeedDataManifest(null)).toThrow('Seed data manifest is required.')
    expect(() => assertSeedDataManifest({ source: 'data/cruise.json', entities: [] })).toThrow('Seed data manifest entities are required.')
    expect(() => assertSeedDataManifest({ source: 'data/cruise.json', entities: ['customers'] })).toThrow('Seed data manifest production replacement path is required.')
    expect(assertSeedDataManifest(buildSeedDataManifest())).toEqual(expect.objectContaining({ source: 'data/cruise.json' }))
  })
})
