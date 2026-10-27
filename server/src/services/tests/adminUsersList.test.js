const test = require('node:test')
const assert = require('node:assert/strict')

const User = require('../../models/User')
const { listUsers } = require('../../controllers/adminController')

const buildQueryChain = () => ({
  select: () => ({
    sort: () => ({
      lean: async () => [],
    }),
  }),
})

test('admin user list only includes non-admin users', async () => {
  const calls = []
  const originalFind = User.find
  User.find = (...args) => {
    calls.push(args)
    return buildQueryChain()
  }

  try {
    await listUsers({}, { json: () => {} }, () => {})
    assert.deepEqual(calls[0], [{ role: 'user' }])
  } finally {
    User.find = originalFind
  }
})
