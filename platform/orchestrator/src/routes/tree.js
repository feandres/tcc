const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

const LABS_PATH =
  process.env.LABS_PATH || '/app/labs'

function walk(dir, root, allowedFiles) {
  const IGNORE = new Set([
    '.git',
    '__pycache__',
    '.pytest_cache',
    '.idea',
    '.vscode',
    'node_modules',
  ])

  return fs
    .readdirSync(dir)
    .filter(name => !IGNORE.has(name))
    .map(name => {
      const full = path.join(dir, name)
      const stat = fs.statSync(full)

      if (stat.isDirectory()) {
        const children = walk(full, root, allowedFiles)

        // remove pasta vazia
        if (!children.length) {
          return null
        }

        return {
          name,
          type: 'dir',
          children,
        }
      }

      const relative = path.relative(root, full)

      // só expõe arquivos permitidos
      if (!allowedFiles.includes(relative)) {
        return null
      }

      return {
        name,
        type: 'file',
        path: relative,
      }
    })
    .filter(Boolean)
}

router.get('/api/tree/:lab', (req, res) => {
  const lab = req.params.lab

  const labDir = path.join(
    LABS_PATH,
    `lab-${lab}`
  )

  if (!fs.existsSync(labDir)) {
    return res
      .status(404)
      .json({ error: 'lab não encontrado' })
  }

  const challengesFile = path.join(
    labDir,
    'challenges.json'
  )

  const challenges = JSON.parse(
    fs.readFileSync(challengesFile, 'utf8')
  )

  const allowedFiles = [
    ...(challenges.editableFiles || []),
    ...(challenges.readonlyFiles || []),
  ]

  const tree = walk(
    labDir,
    labDir,
    allowedFiles
  )

  res.json(tree)
})

module.exports = router