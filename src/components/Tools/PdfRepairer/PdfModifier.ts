import { Database } from '@/Db';
import { degrees, PageSizes, PDFDocument } from 'pdf-lib';
//@ts-ignore
import { getDocument, SVGGraphics } from 'pdfjs-dist';

export interface PDFImage {
    width: number;
    height: number;
    url: string;
    id: string;
    rotation: number;
}

export async function ExtractImages(pdfbytes: ArrayBuffer): Promise<PDFImage[]> {
    const doc = await (getDocument({ data: new Uint8Array(pdfbytes) }).promise);
    const pageOperations = [];
    const images: PDFImage[] = [];
    console.log(doc.numPages);
    for (let index = 0; index < doc.numPages; index++) {
        pageOperations.push(doc.getPage(index + 1));
    }
    let count = 0;
    for await (const page of pageOperations) {

        // @ts-ignore
        const operators = await page.getOperatorList();
        // @ts-ignore
        const svgGfx = new SVGGraphics(page.commonObjs, page.objs);
        const viewport = page.getViewport({ scale: 1 });

        const svg = {
            w: viewport.width,
            h: viewport.height,
            doc: await svgGfx.getSVG(operators, viewport) as Document,
        };
        (window as any).svg = svg;
        console.log(svg.doc.querySelector('image'));
        svg.doc.querySelectorAll('image').forEach(e => {
            images.push({
                width: viewport.width,
                height: viewport.height,
                url: e.getAttribute('xlink:href') || '',
                id: count.toString(),
                rotation: 0
            })
            count++;
        })
    }
    return images;
}

export async function GeneratePDF(images: PDFImage[], emptyPage: boolean, id: number) {
    const doc = await PDFDocument.create();
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const image = await (await fetch(img.url)).arrayBuffer();
        const dims: [number, number] = PageSizes.A4;
        const positions = [{ x: 0, y: 0 }, { x: 0, y: dims[1] }, { x: dims[0], y: dims[1] }, { x: dims[0], y: 0 }];
        const page = doc.addPage(dims);
        const PdfImg = await doc.embedPng(image);
        page.drawImage(PdfImg, {
            x: positions[img.rotation % 4].x,
            y: positions[img.rotation % 4].y,
            width: img.width,
            height: img.height,
            rotate: degrees(360 - img.rotation * 90)
        });
    }
    if (emptyPage) {
        doc.addPage(PageSizes.A4);
    }

    await updateDocument(id, await doc.save());
}

export async function AddTrailingPage(id: number) {
    const data = await Database.getDocument(id);
    const doc = await PDFDocument.load(data.initialPdf);
    doc.addPage(PageSizes.A4);

    await updateDocument(id, await doc.save());
}

export function GetA4Dimensions() {
    return { width: PageSizes.A4[0], height: PageSizes.A4[1] };
}

async function updateDocument(id: number, PDFdata: ArrayBuffer) {
    const data = await Database.getDocument(id);

    data.initialPdf = PDFdata;
    data.changes = [];
    data.pdfData = data.initialPdf;
    Database.updateDocument(id, data, true);
}