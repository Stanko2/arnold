//@ts-ignore
import {getDocument, OPS, PDFPageProxy} from 'pdfjs-dist';

export interface PDFPage {
    id: number;
    rotation: number; // 0, 1, 2, 3 clockwise
    isNew: boolean;
    page: PDFPageProxy|null;
    rendered: boolean;
}

export async function getPages(pdfbytes: ArrayBuffer): Promise<PDFPage[]> {
    const doc = await (getDocument({ data: new Uint8Array(pdfbytes) }).promise);
    const docPages = [];
    const pages = [] as PDFPage[];
    console.log(doc.numPages);
    for (let index = 0; index < doc.numPages; index++) {
        docPages.push(doc.getPage(index + 1));
    }
    let count = 0;
    for await (const page of docPages) {
        pages[count] = {
            id: count,
            rotation: 0,
            isNew: false,
            page: page,
            rendered: false
        };
        count++;
    }
    return pages;
}
