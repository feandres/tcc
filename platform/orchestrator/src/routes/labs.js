const express = require('express')
const router  = express.Router()
const fs      = require('fs')
const path    = require('path')
const { exec } = require('child_process')

const ENV_FILE    = '/app/.env'
const LABS_PATH   = process.env.LABS_PATH || '/app/labs'

function getLabAtivo() {
  const env = fs.readFileSync(ENV_FILE, 'utf8')
  return (env.match(/LAB_ATIVO=(\S+)/) || [])[1] || '01'
}

function setLabAtivo(num) {
  let env = fs.readFileSync(ENV_FILE, 'utf8')
  env = env.replace(/LAB_ATIVO=\S+/, `LAB_ATIVO=${num}`)
  fs.writeFileSync(ENV_FILE, env)
}

function run(cmd) {
  return new Promise((res, rej) =>
    exec(cmd, (err, stdout, stderr) => err ? rej(stderr) : res(stdout))
  )
}

// GET /status — lab ativo + containers rodando
router.get('/status', async (req, res) => {
  const lab = getLabAtivo()
  let containers = []
  try {
    const out = await run("docker ps --format '{{.Names}}|{{.Status}}' 2>/dev/null")
    containers = out.trim().split('\n').filter(Boolean).map(line => {
      const [name, ...rest] = line.split('|')
      return { name, status: rest.join('|') }
    }).filter(c => c.name.includes('microlab'))
  } catch (_) {}
  res.json({ labAtivo: lab, containers })
})

// GET /challenges/:lab — retorna challenges.json do lab
router.get('/challenges/:lab', (req, res) => {
  const file = path.join(LABS_PATH, `lab-${req.params.lab}`, 'challenges.json')
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'lab não encontrado' })
  res.json(JSON.parse(fs.readFileSync(file, 'utf8')))
})

// GET /diagram/:lab — retorna diagram.mmd do lab
router.get('/diagram/:lab', (req, res) => {
  const file = path.join(LABS_PATH, `lab-${req.params.lab}`, 'diagram.mmd')
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'diagrama não encontrado' })
  res.type('text/plain').send(fs.readFileSync(file, 'utf8'))
})

// POST /lab/:num — troca o lab ativo
router.post('/lab/:num', async (req, res) => {
  const atual = getLabAtivo()
  const novo  = req.params.num.padStart(2, '0')
  try {
    await run(`docker compose --profile lab-${atual} down 2>/dev/null || true`)
    setLabAtivo(novo)
    await run(`docker compose --profile lab-${novo} up -d --build`)
    res.json({ ok: true, labAtivo: novo })
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) })
  }
})

// POST /reset/:lab — git reset --hard origin/main
router.post('/reset/:lab', async (req, res) => {
  const labDir = path.join(LABS_PATH, `lab-${req.params.lab}`)
  if (!fs.existsSync(path.join(labDir, '.git'))) {
    return res.status(404).json({ error: 'repositório git não encontrado' })
  }
  try {
    await run(`cd "${labDir}" && git reset --hard origin/main && git clean -fd`)
    await run(`docker compose --profile lab-${req.params.lab} restart 2>/dev/null || true`)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) })
  }
})

module.exports = router
