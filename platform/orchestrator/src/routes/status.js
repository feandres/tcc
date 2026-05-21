const express = require('express')
const router = express.Router()
const fs = require('fs')
const { spawn } = require('child_process')

const ENV_FILE = '/app/.env'
const DOCKER_BIN = '/usr/bin/docker'

function getLabAtivo() {
  const env = fs.readFileSync(ENV_FILE, 'utf8')

  return (
    env.match(/LAB_ATIVO=(\S+)/)?.[1] || '01'
  )
}

function runDocker(args = []) {
  return spawn(
    DOCKER_BIN,
    args,
    {
      env: {
        PATH: '/usr/bin:/bin'
      }
    }
  )
}

// GET /api/status
router.get('/api/status', (req, res) => {
  const lab = getLabAtivo()

  const proc = runDocker([
    'ps',
    '--format',
    '{{.Names}}|{{.Status}}'
  ])

  let stdout = ''
  let stderr = ''

  proc.stdout.on('data', chunk => {
    stdout += chunk.toString()
  })

  proc.stderr.on('data', chunk => {
    stderr += chunk.toString()
  })

  proc.on('error', err => {
    if (res.headersSent) return
    return res.status(500).json({
      ok: false,
      error: err.message
    })
  })

  proc.on('close', code => {
    if (res.headersSent) return
    if (code !== 0) {
      return res.status(500).json({
        ok: false,
        error: stderr || `docker exited with code ${code}`
      })
    }

    const containers = stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter(line => line.includes('microlab'))
      .map(line => {
        const [name, ...rest] = line.split('|')

        return {
          name: name.trim(),
          status: rest.join('|').trim()
        }
      })

    return res.json({
      ok: true,
      labAtivo: lab,
      containers
    })
  })
})

module.exports = router