const express = require('express')
const router = require('express').Router()
const { spawn } = require('child_process')

const DOCKER_BIN = '/usr/bin/docker'

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

// GET /api/logs/:service
router.get('/api/logs/:service', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  res.flushHeaders()

  const name = `microlab-${req.params.service}-1`

  const proc = runDocker([
    'logs',
    '--follow',
    '--tail',
    '80',
    name
  ])

  function send(data) {
    data
      .toString()
      .split('\n')
      .filter(Boolean)
      .forEach(line => {
        res.write(`data: ${line}\n\n`)
      })
  }

  proc.stdout.on('data', send)
  proc.stderr.on('data', send)

  proc.on('close', () => {
    res.end()
  })

  proc.on('error', err => {
    res.write(`data: ERROR: ${err.message}\n\n`)
    res.end()
  })

  req.on('close', () => {
    proc.kill()
  })
})

module.exports = router