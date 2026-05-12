const express    = require('express')
const router     = express.Router()
const { exec }   = require('child_process')
const fs         = require('fs')

const ENV_FILE = '/app/.env'

function getLabAtivo() {
  const env = fs.readFileSync(ENV_FILE, 'utf8')
  return (env.match(/LAB_ATIVO=(\S+)/) || [])[1] || '01'
}

// GET /api/status
router.get('/api/status', (req, res) => {
  const lab = getLabAtivo()

  exec("docker ps --format '{{.Names}}|{{.Status}}'", (err, stdout) => {
    const containers = (stdout || '')
      .trim()
      .split('\n')
      .filter(l => l.includes('microlab'))
      .map(l => {
        const [name, ...rest] = l.split('|')
        return { name, status: rest.join('|') }
      })

    res.json({ labAtivo: lab, containers })
  })
})

module.exports = router
