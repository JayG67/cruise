console.log('LOADING JEST INTEGRATION ENV')

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL =
  'postgres://postgres:password@127.0.0.1:5432/cruise'