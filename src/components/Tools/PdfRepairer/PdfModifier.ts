//@ts-ignore
import {getDocument, OPS, PDFPageProxy} from 'pdfjs-dist';
import {PDFdocument as PDFDocComponent} from "@/components/PDFdocument";
import {Database} from "@/Db";
import {degrees, PageSizes, PDFDocument} from "pdf-lib";

export interface PDFPage {
    id: number;
    rotation: number; // 0, 1, 2, 3 clockwise
    originalRotation: number;
    isNew: boolean;
    page: PDFPageProxy|null;
    rendered: boolean;
}

export async function getPages(pdfbytes: ArrayBuffer): Promise<PDFPage[]> {
    const doc = await (getDocument({ data: new Uint8Array(pdfbytes) }).promise);
    const doc2 = await PDFDocument.load(pdfbytes);
    const docPages = [];
    const pages = [] as PDFPage[];
    for (let index = 0; index < doc.numPages; index++) {
        docPages.push({doc: await doc.getPage(index + 1), doc2: doc2.getPage(index)});
    }
    let count = 0;
    for await (const page of docPages) {
        const rotation = page.doc2.getRotation();
        const rotationNumber = rotation.type === 'degrees' ? rotation.angle / 90 : rotation.angle / (Math.PI / 2);

        pages[count] = {
            id: count,
            rotation: rotationNumber,
            originalRotation: rotationNumber,
            isNew: false,
            page: page.doc,
            rendered: false
        };
        count++;
    }
    console.log(pages);
    return pages;
}


function rotatedCoordinates(annotation: any, page: PDFPage, pageSize: { width: number; height: number }) {
    if (page.rotation === page.originalRotation) return annotation;

    const annotationData = annotation.data;
    const newData = {...annotationData};

    const rotation = page.rotation - page.originalRotation;

    switch (annotation.type.toLowerCase()) {
        case 'image':
        case 'sign':
            newData.scaleX = annotationData.scaleY;
            newData.scaleY = annotationData.scaleX;
        // eslint-disable-next-line no-fallthrough
        case 'rect':
        case 'ellipse':
            // update data to match new rotation of page
            // fields: top, left, width, height, angle

            for (let i = 0; i < rotation; i++) {
                newData.top = annotationData.left;
                newData.left = pageSize.width - annotationData.top - annotationData.height;
                if (annotation.type.toLowerCase() !== 'sign') {
                    newData.width = annotationData.height;
                    newData.height = annotationData.width;
                }
                newData.angle = (annotationData.angle + 90) % 360;
            }

            break;
        default:
            break;
    }

    return {...annotation, data: newData};
}

export async function generate(pdfDoc: PDFDocComponent, pages: PDFPage[]) {
    const data = await Database.getDocument(pdfDoc.id);
    console.log(data);
    const doc = await PDFDocument.load(data.initialPdf);
    const newDoc = await PDFDocument.create();

    const originalChanges = data.changes;
    const changes = [];

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page.isNew) {
            await newDoc.addPage(PageSizes.A4);
        } else {
            const newPage = (await newDoc.copyPages(doc, [page.id]))[0];
            newPage.setRotation(degrees(page.rotation * 90));
            newDoc.addPage(newPage);

            const pageSize = newPage.getSize();

            const pageChanges = originalChanges.filter(c => c.page === page.id);
            for (let j = 0; j < pageChanges.length; j++) {
                // recalculate coordinates if page was rotated
                const change = pageChanges[j];
                changes.push(rotatedCoordinates(change, page, pageSize));
            }
        }
    }

    console.log(originalChanges, changes);

    data.initialPdf = await newDoc.save();
    data.pdfData = await newDoc.save();
    data.changes = changes;

    console.log(data, { get test() {
        // download pdf
        const blob = new Blob([data.initialPdf], {type: 'application/pdf'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'test.pdf';
        a.click();
        return true;
    }});

    await Database.updateDocument(pdfDoc.id, data);
}


/*
            const originalPageSize = doc.getPage(page.id).getSize();

            // convert page to image
            const canvas = document.createElement('canvas');
            const viewport = page.page!.getViewport({scale: 1, rotation: page.rotation * 90});
            canvas.width = viewport?.width || 0;
            canvas.height = viewport?.height || 0;
            const ctx = canvas.getContext('2d')!;
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            }
            await page.page!.render(renderContext).promise;

            const img = await newDoc.embedPng(canvas.toDataURL());

            const page2 = newDoc.addPage([page.rotation % 2 === 0 ? originalPageSize.width : originalPageSize.height, page.rotation % 2 === 0 ? originalPageSize.height : originalPageSize.width]);
            page2.drawImage(img, {
                x: 0,
                y: 0,
                width: page2.getWidth(),
                height: page2.getHeight()
            });
        }
 */
