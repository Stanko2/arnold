import { Database } from '@/Db';
import { degrees, PageSizes, PDFDocument } from 'pdf-lib';
//@ts-ignore
import { getDocument, OPS } from 'pdfjs-dist';

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
        const viewport = page.getViewport({ scale: 1 });

        const validObjectTypes = [
            OPS.paintImageXObject, // 85
            OPS.paintImageXObjectRepeat, // 88
            OPS.paintJpegXObject //82
        ];

        for (let i = 0; i < operators.fnArray.length; i++) {
            const op = operators.fnArray[i];
            if (validObjectTypes.includes(op)) {
                const imageName = operators.argsArray[i][0];
                console.log({ imageName });
                const image = await getImageData(page, imageName);
                images.push(image);
            }
        }
    }
    return images;
}

async function getImageData(page: any, imageName: string): Promise<PDFImage> {
    return new Promise<PDFImage>((resolve, reject) => {
        page.objs.get(imageName, async (image: any) => {
            const cnv = document.createElement('canvas');
            cnv.width = image.width;
            cnv.height = image.height;
            const ctx = cnv.getContext('2d');
            console.log(image);
            const arr = addAlphaChannelToUnit8ClampedArray(image.data, image.width, image.height)
            const imageData = new ImageData(arr, image.width, image.height);
            ctx?.putImageData(imageData, 0, 0);
            resolve({
                height: image.height,
                width: image.width,
                url: cnv.toDataURL('image/jpeg', 0.5),
                id: imageName,
                rotation: 0,
            })
        });
    });
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
        console.log({ type });
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

function addAlphaChannelToUnit8ClampedArray(unit8Array: Uint8ClampedArray, imageWidth: number, imageHeight: number) {
    const newImageData = new Uint8ClampedArray(imageWidth * imageHeight * 4);

    for (let j = 0, k = 0, jj = imageWidth * imageHeight * 4; j < jj;) {
        newImageData[j++] = unit8Array[k++];
        newImageData[j++] = unit8Array[k++];
        newImageData[j++] = unit8Array[k++];
        newImageData[j++] = 255;
    }

    return newImageData;
}