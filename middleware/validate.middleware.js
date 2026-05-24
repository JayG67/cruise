function toValidationErrors(error) {
  const issues = Array.isArray(error?.issues)
    ? error.issues
    : Array.isArray(error?.errors)
      ? error.errors
      : []

  if (issues.length === 0) {
    return [
      {
        field: 'body',
        message: 'Request body did not match the expected schema'
      }
    ]
  }

  return issues.map((issue) => ({
    field: Array.isArray(issue.path) && issue.path.length > 0
      ? issue.path.join('.')
      : 'body',
    message: issue.message || 'Invalid value'
  }))
}

module.exports = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      return res
        .status(400)
        .type('application/json')
        .json({
          message: 'Validation failed',
          errors: toValidationErrors(result.error)
        })
    }

    req.body = result.data

    next()
  }
}
