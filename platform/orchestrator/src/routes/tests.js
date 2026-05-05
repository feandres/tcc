const express  = require('express')
const router   = express.Router()
const { exec } = require('child_process')

// POST /tests/:lab — executa pytest e retorna resultado estruturado
router.post('/tests/:lab', (req, res) => {
  const lab       = req.params.lab.padStart(2, '0')
  const container = `microlab-lab-${lab}-1`

  exec(
    `docker exec ${container} pytest tests/ -v --tb=short --no-header -q 2>&1`,
    { timeout: 60000 },
    (err, stdout) => {
      const results = parseTestOutput(stdout || '')
      const passed  = results.filter(r => r.passed).length
      const failed  = results.filter(r => !r.passed).length

      res.json({ lab, passed, failed, results })
    }
  )
})

function parseTestOutput(output) {
  const results = []
  const lines   = output.split('\n')

  for (const line of lines) {
    // linha de resultado: "test_order_service_basics PASSED" ou "FAILED"
    const passMatch = line.match(/^(test_\w+)\s+PASSED/)
    const failMatch = line.match(/^(test_\w+)\s+FAILED/)
    const errorMatch = line.match(/^(test_\w+)\s+ERROR/)

    if (passMatch) {
      results.push({ testId: passMatch[1], passed: true, message: '' })
    } else if (failMatch) {
      // capturar mensagem de falha das linhas seguintes
      const idx = lines.indexOf(line)
      const msg = lines.slice(idx + 1, idx + 4)
        .filter(l => l.trim() && !l.startsWith('_'))
        .join(' ').trim().slice(0, 200)
      results.push({ testId: failMatch[1], passed: false, message: msg })
    } else if (errorMatch) {
      results.push({ testId: errorMatch[1], passed: false, message: 'erro ao executar teste' })
    }
  }

  return results
}

module.exports = router
