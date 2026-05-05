const express = require('express')
const router  = express.Router()

const TOXIPROXY = 'http://toxiproxy:8474'

async function toxi(method, path, body) {
  const res = await fetch(`${TOXIPROXY}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json().catch(() => ({}))
}

// POST /chaos/latency/:service  body: { ms: 2000 }
router.post('/chaos/latency/:service', async (req, res) => {
  const { ms = 2000 } = req.body
  try {
    await toxi('POST', `/proxies/${req.params.service}/toxics`, {
      name: 'latency', type: 'latency',
      attributes: { latency: Number(ms), jitter: 0 },
    })
    res.json({ ok: true, service: req.params.service, latency_ms: ms })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
})

// DELETE /chaos/latency/:service
router.delete('/chaos/latency/:service', async (req, res) => {
  try {
    await toxi('DELETE', `/proxies/${req.params.service}/toxics/latency`)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
})

// POST /chaos/stop/:service
router.post('/chaos/stop/:service', async (req, res) => {
  try {
    const { execSync } = require('child_process')
    execSync(`docker stop microlab-${req.params.service}-1`)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
})

// POST /chaos/restart/:service
router.post('/chaos/restart/:service', async (req, res) => {
  try {
    const { execSync } = require('child_process')
    execSync(`docker restart microlab-${req.params.service}-1`)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
})

module.exports = router
