function mockSelect(db, result) {
  const fromMock = jest.fn().mockResolvedValue(result)

  db.select = jest.fn().mockReturnValue({
    from: fromMock
  })

  return { fromMock }
}

function mockSelectWhereLimit(db, result) {
  const limitMock = jest.fn().mockResolvedValue(result)
  const whereMock = jest.fn().mockReturnValue({
    limit: limitMock
  })
  const fromMock = jest.fn().mockReturnValue({
    where: whereMock
  })

  db.select = jest.fn().mockReturnValue({
    from: fromMock
  })

  return { fromMock, whereMock, limitMock }
}

function mockSelectWhere(db, result) {
  const whereMock = jest.fn().mockResolvedValue(result)
  const fromMock = jest.fn().mockReturnValue({
    where: whereMock
  })

  db.select = jest.fn().mockReturnValue({
    from: fromMock
  })

  return { fromMock, whereMock }
}

function mockInsertReturning(db, result) {
  const returningMock = jest.fn().mockResolvedValue(result)
  const valuesMock = jest.fn().mockReturnValue({
    returning: returningMock
  })

  db.insert = jest.fn().mockReturnValue({
    values: valuesMock
  })

  return { valuesMock, returningMock }
}

function mockUpdateWhere(db) {
  const whereMock = jest.fn().mockResolvedValue()
  const setMock = jest.fn().mockReturnValue({
    where: whereMock
  })

  db.update = jest.fn().mockReturnValue({
    set: setMock
  })

  return { setMock, whereMock }
}

function mockDeleteWhere(db) {
  const whereMock = jest.fn().mockResolvedValue()

  db.delete = jest.fn().mockReturnValue({
    where: whereMock
  })

  return { whereMock }
}

module.exports = {
  mockSelect,
  mockSelectWhere,
  mockSelectWhereLimit,
  mockInsertReturning,
  mockUpdateWhere,
  mockDeleteWhere
}