const express = require('express')
const router  = express.Router()
const fs      = require('fs')
const path    = require('path')

const LABS_PATH = process.env.LABS_PATH || '/app/labs'

function getChallenges(lab) {
  const file = path.join(LABS_PATH, `lab-${lab}`, 'challenges.json')
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function canRead(lab, filePath) {
  const c = getChallenges(lab)
  if (!c) return false
  const all = [...(c.editableFiles || []), ...(c.readonlyFiles || [])]
  return all.some(f => filePath === f || filePath.endsWith(f))
}

function canWrite(lab, filePath) {
  const c = getChallenges(lab)
  if (!c) return false
  return (c.editableFiles || []).some(f => filePath === f || filePath.endsWith(f))
}

// GET /api/files/:lab/*
router.get('/api/files/:lab/*', (req, res) => {
  const lab      = req.params.lab
  const filePath = req.params[0]
  const full     = path.join(LABS_PATH, `lab-${lab}`, filePath)

  if (!canRead(lab, filePath)) {
    return res.status(403).json({ error: 'arquivo não permitido' })
  }
  if (!fs.existsSync(full)) {
    return res.status(404).json({ error: 'arquivo não encontrado' })
  }
  res.type('text/plain').send(fs.readFileSync(full, 'utf8'))
})

// PUT /api/files/:lab/*
router.put('/api/files/:lab/*',
  express.text({ type: '*/*', limit: '1mb' }),
  (req, res) => {
    const lab      = req.params.lab
    const filePath = req.params[0]
    const full     = path.join(LABS_PATH, `lab-${lab}`, filePath)

    if (!canWrite(lab, filePath)) {
      return res.status(403).json({ error: 'arquivo somente leitura' })
    }
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, req.body, 'utf8')
    res.json({ ok: true })
  }
)

module.exports = router
