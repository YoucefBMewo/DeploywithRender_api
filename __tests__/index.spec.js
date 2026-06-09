const request = require('supertest')

// Mock de pg avant le require de l'app
const mockQuery = jest.fn()
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({ query: mockQuery }))
}))

const app = require('../index')

beforeEach(() => {
  mockQuery.mockReset()
})

describe('GET /users', () => {
  it('retourne la liste des users en JSON', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] })

    const res = await request(app).get('/users')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])
  })

  it('retourne une liste vide si aucun user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const res = await request(app).get('/users')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })

  it('retourne 500 si la base de données échoue', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'))

    const res = await request(app).get('/users')

    expect(res.statusCode).toBe(500)
    expect(res.text).toBe('DB error')
  })
})

describe('GET /init', () => {
  it('crée la table et répond 200', async () => {
    mockQuery
      .mockResolvedValueOnce({}) // CREATE TABLE
      .mockResolvedValueOnce({}) // INSERT

    const res = await request(app).get('/init')

    expect(res.statusCode).toBe(200)
    expect(res.text).toContain('Table users')
  })

  it('retourne 500 si la création de table échoue', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Table error'))

    const res = await request(app).get('/init')

    expect(res.statusCode).toBe(500)
    expect(res.text).toBe('Table error')
  })
})

describe('simple test', () => {
  it('should pass', () => {
    expect(true).toBe(true)
  })
})
