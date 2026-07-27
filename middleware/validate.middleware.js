function toValidationErrors(error, source = 'body') {
  const issues = Array.isArray(error?.issues)
    ? error.issues
    : Array.isArray(error?.errors)
      ? error.errors
      : []

  if (issues.length === 0) {
    return [{ field: source, message: `Request ${source} did not match the expected schema` }]
  }

  return issues.map((issue) => ({
    field: Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.join('.') : source,
    message: issue.message || 'Invalid value'
  }))
}

module.exports = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      return res
        .status(400)
        .type('application/json')
        .json({
          message: 'Validation failed',
          errors: toValidationErrors(result.error, source)
        })
    }

    req[source] = result.data
    next()
  }
}
