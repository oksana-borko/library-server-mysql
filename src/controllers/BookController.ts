import {Response, Request} from "express";
import {LibService} from "../services/libService.ts";
import {libServiceEmbedded} from "../services/libServiceImplEmbedded.ts";
import {Book, BookDto} from "../model/Book.ts";
import {HttpError} from "../errorHandler/HttpError.ts";
import {convertBookDtoToBook} from "../utils/tools.js";

export class BookController {
    private libService: LibService = libServiceEmbedded;

    async getAllBooks(req: Request, res: Response) {
        const result = await this.libService.getAllBooks();
        res.json(result);
    }

    async addBook(req: Request, res: Response) {
        const dto = req.body as BookDto;
        const book: Book = convertBookDtoToBook(dto);
        const result = await this.libService.addBook(book);
        if (result)
            res.status(201).json(book)
        else throw new HttpError(409, 'Book not added. Id conflict')
    }
}