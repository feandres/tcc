const express = require('express')
const router  = express.Router()
const { spawn } = require('child_process')

// GET /logs/:service — stream de logs via SSE
router.get('/logs/:service', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.flushHeaders()

  const service = req.params.service
  const name    = `microlab-${service}-1`

  const proc = spawn('docker', ['logs', '--follow', '--tail', '80', name])

  const send = data => {
    data.toString().split('\n').forEach(line => {
      if (line.trim()) res.write(`data: ${line}\n\n`)
    })
  }

  proc.stdout.on('data', send)
  proc.stderr.on('data', send)
  proc.on('close', () => res.end())
  req.on('close', () => proc.kill())
})

module.exports = router
