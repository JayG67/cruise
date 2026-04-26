const mockSelectGet = (db, value) => {
  const getMock = jest.fn().mockResolvedValue(value)
  const whereMock = jest.fn().mockReturnValue({ get: getMock })
  const fromMock = jest.fn().mockReturnValue({ where: whereMock })

  db.select.mockReturnValueOnce({
    from: fromMock
  })

  return { getMock, whereMock, fromMock }
}

const mockSelectAll = (db, value) => {
  const allMock = jest.fn().mockResolvedValue(value)
  const fromMock = jest.fn().mockReturnValue({ all: allMock })

  db.select.mockReturnValueOnce({
    from: fromMock
  })

  return { allMock, fromMock }
}

const mockSelectWhereAll = (db, value) => {
  const allMock = jest.fn().mockResolvedValue(value)
  const whereMock = jest.fn().mockReturnValue({ all: allMock })
  const fromMock = jest.fn().mockReturnValue({ where: whereMock })

  db.select.mockReturnValueOnce({
    from: fromMock
  })

  return { allMock, whereMock, fromMock }
}

const mockInsertGet = (db, value) => {
  const getMock = jest.fn().mockResolvedValue(value)
  const returningMock = jest.fn().mockReturnValue({ get: getMock })
  const valuesMock = jest.fn().mockReturnValue({ returning: returningMock })

  db.insert.mockReturnValueOnce({
    values: valuesMock
  })

  return { getMock, returningMock, valuesMock }
}

const mockUpdateRun = (db) => {
  const runMock = jest.fn().mockResolvedValue()
  const whereMock = jest.fn().mockReturnValue({ run: runMock })
  const setMock = jest.fn().mockReturnValue({ where: whereMock })

  db.update.mockReturnValueOnce({
    set: setMock
  })

  return { runMock, whereMock, setMock }
}

const mockDeleteRun = (db) => {
  const runMock = jest.fn().mockResolvedValue()
  const whereMock = jest.fn().mockReturnValue({ run: runMock })

  db.delete.mockReturnValueOnce({
    where: whereMock
  })

  return { runMock, whereMock }
}

module.exports = {
  mockSelectGet,
  mockSelectAll,
  mockSelectWhereAll,
  mockInsertGet,
  mockUpdateRun,
  mockDeleteRun
}