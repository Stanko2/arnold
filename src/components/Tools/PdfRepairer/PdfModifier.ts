import { Database } from '@/Db';
import { degrees, PageSizes, PDFDocument, PDFName, PDFRawStream, PDFRef } from 'pdf-lib';
import pdfjs, { PDFPageProxy } from '@bundled-es-modules/pdfjs-dist';
import eventHub from '@/Mixins/EventHub';

export interface PDFImage {
    ref: PDFRef;
    width: number;
    height: number;
    url: string;
    id: string;
    rotation: number;
}

export async function ExtractImages(pdfbytes: ArrayBuffer): Promise<PDFImage[]> {
    const imagesInDoc: PDFImage[] = [];
    const pdf = await PDFDocument.load(pdfbytes);
    const stream = pdf.context.enumerateIndirectObjects()
    let objectIdx = 0;
    for (const [ref, obj] of stream) {
        if (obj instanceof PDFRawStream) {
            const dict = obj.dict;
            const smaskRef = dict.get(PDFName.of('SMask'));
            const colorSpace = dict.get(PDFName.of('ColorSpace'));
            const subtype = dict.get(PDFName.of('Subtype'));
            const width = dict.get(PDFName.of('Width'));
            const height = dict.get(PDFName.of('Height'));
            const name = dict.get(PDFName.of('Name'));
            const bitsPerComponent = dict.get(
                PDFName.of('BitsPerComponent')
            );
            const filter = dict.get(PDFName.of('Filter'));

            const type = filter === PDFName.of('DCTDecode') ? 'data:image/jpeg;base64,' : 'data:image/png;base64,';

            if (subtype == PDFName.of('Image')) {
                imagesInDoc.push({
                    ref,
                    //@ts-ignore
                    width: width!.numberValue!,
                    //@ts-ignore
                    height: height!.numberValue!,
                    //@ts-ignore
                    url: type + await bufferToBase64(obj.contents),
                    //@ts-ignore
                    name: name ? name.key : `Object${objectIdx}`,
                    rotation: 0,
                });
                objectIdx++;
            }
        }
    };

    return imagesInDoc
}

async function bufferToBase64(buffer: ArrayBuffer) {
    // use a FileReader to generate a base64 data URI:
    const base64url = await new Promise(r => {
        const reader = new FileReader()
        reader.onload = () => r(reader.result)
        reader.readAsDataURL(new Blob([buffer]))
    });
    // remove the `data:...;base64,` part from the start
    //@ts-ignore
    return base64url.slice(base64url.indexOf(',') + 1);
}

export async function GeneratePDF(images: PDFImage[], emptyPage: boolean, id: number) {
    const doc = await PDFDocument.create();
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const res = await fetch(img.url);
        const type = res.headers.get('content-type');
        const image = await res.arrayBuffer();
        const dims: [number, number] = PageSizes.A4;
        dims[1] = Math.max(dims[1], img.rotation % 2 === 0 ? img.height : img.width);
        const positions = [{ x: 0, y: 0 }, { x: 0, y: dims[1] }, { x: dims[0], y: dims[1] }, { x: dims[0], y: 0 }];
        const page = doc.addPage(dims);
        const PdfImg = type === 'image/png' ? await doc.embedPng(image) : await doc.embedJpg(image);
        let verticalSpaceAvailable = dims[1] - (img.rotation % 2 === 0 ? img.height : img.width);
        if (img.rotation === 1 || img.rotation === 2) {
            verticalSpaceAvailable = -verticalSpaceAvailable;
        }
        page.drawImage(PdfImg, {
            x: positions[img.rotation % 4].x,
            y: positions[img.rotation % 4].y + verticalSpaceAvailable / 2,
            width: img.width,
            height: img.height,
            rotate: degrees(360 - img.rotation * 90)
        });
    }
    if (emptyPage) {
        doc.addPage(PageSizes.A4);
    }

    const pdfBytes = await doc.save();
    await updateDocument(id, pdfBytes);
    setTimeout(() => {
        eventHub.$emit("viewport:refresh", pdfBytes);
    }, 500);
}

export async function AddTrailingPage(id: number) {
    const data = await Database.getDocument(id);
    const doc = await PDFDocument.load(data.initialPdf);
    doc.addPage(PageSizes.A4);


    data.initialPdf = await doc.save();
    Database.updateDocument(id, data);
    setTimeout(() => {
        eventHub.$emit("viewport:refresh", data.initialPdf);
    }, 500);
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
