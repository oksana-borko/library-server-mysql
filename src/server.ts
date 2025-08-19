import express from 'express'
import morgan from 'morgan'
import * as fs from 'node:fs'
import dotenv from 'dotenv'
import { libRouter } from './routes/libRouter.ts'
import { errorHandler } from './errorHandler/errorHandler.ts'

export const launchServer = () => {
    dotenv.config()
    const app = express()
    const port = process.env.PORT || 3500

    app.use(express.json())
    app.use(morgan('dev'))
    const logStream = fs.createWriteStream('access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: logStream }))

    app.use('/api', libRouter)

    app.use((req, res) => res.status(404).send('Page not found'))
    app.use(errorHandler)

    app.listen(port, () => console.log(`Server runs at http://localhost:${port}`))
}
