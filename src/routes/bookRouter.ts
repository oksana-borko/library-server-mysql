import express from 'express'
import * as controller from '../controllers/bookControllerFunc.js'
import { bodyValidation } from '../validation/bodyValidation.js'
import { BookDtoSchema } from '../validation/joiSchemas.js'

export const bookRouter = express.Router()

bookRouter.get('/', controller.getAllBooks)
bookRouter.post('/', bodyValidation(BookDtoSchema), controller.addBook)
bookRouter.delete('/', controller.removeBook)
bookRouter.patch('/pickup', controller.pickUpBook)
bookRouter.patch('/return', controller.returnBook)
bookRouter.get('/genre', controller.getBooksByGenre)
bookRouter.get('/gen_st', controller.getBooksByGengreAndStatus)
