import express from 'express'
import { bookRouter } from './bookRouter.ts'
export const libRouter = express.Router()
libRouter.use('/books', bookRouter)
