const { spawn } = require('child_process')

const DOCKER_BIN = '/usr/bin/docker'

function docker(args, options = {}) {
  return spawn(
    DOCKER_BIN,
    args,
    {
      env: {
        PATH: '/usr/bin:/bin'
      },
      ...options
    }
  )
}

module.exports = { docker }