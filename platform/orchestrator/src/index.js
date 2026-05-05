const express = require('express')
const cors    = require('cors')
const app     = express()

app.use(cors())
app.use(express.json())

// rotas
app.use('/', require('./routes/labs'))
app.use('/', require('./routes/files'))
app.use('/', require('./routes/tests'))
app.use('/', require('./routes/logs'))
app.use('/', require('./routes/chaos'))
app.use('/', require('./routes/state'))

app.listen(4000, () => console.log('[orchestrator] :4000'))
