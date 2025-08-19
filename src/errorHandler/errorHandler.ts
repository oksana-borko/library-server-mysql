import { Request, Response, NextFunction } from 'express'
import { HttpError } from './HttpError.js'

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HttpError) res.status(err.status).send(err.message)
    else res.status(500).send('Unknown server error! ' + err.message)
}
