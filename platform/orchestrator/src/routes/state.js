const express = require('express')
const router  = express.Router()
const fs      = require('fs')

const STATE_FILE = process.env.STATE_FILE || '/app/.lab-state.json'

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }
  catch { return {} }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

// GET /state — estado completo de progresso
router.get('/state', (req, res) => res.json(readState()))

// POST /state/:lab/complete/:challengeId — marcar desafio como concluído
router.post('/state/:lab/complete/:challengeId', (req, res) => {
  const state = readState()
  const lab   = req.params.lab
  const id    = Number(req.params.challengeId)

  if (!state[lab]) state[lab] = { completedChallenges: [] }
  if (!state[lab].completedChallenges.includes(id)) {
    state[lab].completedChallenges.push(id)
  }
  writeState(state)
  res.json({ ok: true, state: state[lab] })
})

// DELETE /state/:lab — limpar progresso de um lab
router.delete('/state/:lab', (req, res) => {
  const state = readState()
  delete state[req.params.lab]
  writeState(state)
  res.json({ ok: true })
})

module.exports = router
