const express  = require('express')
const router   = express.Router()
const { exec } = require('child_process')

// POST /api/tests/:lab — executa pytest no container e retorna JSON estruturado
router.post('/api/tests/:lab', (req, res) => {
  const lab       = req.params.lab.padStart(2, '0')
  const container = `microlab-lab-${lab}-1`

  exec(
    `docker exec ${container} pytest tests/ -v --tb=short --no-header -q 2>&1`,
    { timeout: 60000 },
    (err, stdout) => {
      const output  = stdout || ''
      const results = parseOutput(output)
      const passed  = results.filter(r => r.passed).length
      const failed  = results.filter(r => !r.passed).length
      res.json({ lab, passed, failed, results, raw: output })
    }
  )
})

function parseOutput(output) {
  const results = []
  const lines   = output.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const pass = line.match(/^(test_\w+)\s+PASSED/)
    const fail = line.match(/^(test_\w+)\s+FAILED/)
    const err  = line.match(/^(test_\w+)\s+ERROR/)

    if (pass) {
      results.push({ testId: pass[1], passed: true, message: '' })
    } else if (fail) {
      // pegar a primeira linha de erro não vazia abaixo
      const msg = lines.slice(i + 1, i + 5)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('_') && !l.startsWith('-'))
        .join(' ')
        .slice(0, 200)
      results.push({ testId: fail[1], passed: false, message: msg })
    } else if (err) {
      results.push({ testId: err[1], passed: false, message: 'erro ao executar teste' })
    }
  }

  return results
}

module.exports = router
