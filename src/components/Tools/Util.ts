import {PDFdocument} from "@/components/PDFdocument";
import {fabric} from "fabric";
import {Clipboard, ClipboardObject, Util} from "@/@types";
import {
    Annotation,
    EllipseAnnotation,
    ImageAnnotation,
    LineAnnotation,
    PathAnnotation,
    RectAnnotation,
    SignAnnotation,
    TextAnnotation
} from "@/Annotation";
import {Canvas} from "@/Canvas";

/*
   TODO:
    - persistent clipboard
    - copying to different page
 */

export const utils: Util[] = [
    <Util>{
        name: 'Copy',
        icon: 'content_copy',
        tooltip: 'Kopírovať',
        shortcut: 'ctrl+c',
        style: 'btn-outline-primary',
        use(pdf: PDFdocument, page: number) {
            const selected = pdf.pageCanvases[page].getActiveObjects();
            if (selected.length === 0) return;
            let annotations: Annotation[] = [];
            selected.forEach(obj => {
                let found = false;
                for(const annot of pdf.annotations) {
                    if(obj.name === annot.object.name) {
                        annotations.push(annot);
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    console.error(`Could not find annotation with name ${obj.name}`);
                }
            });
            /*  TODO: multiple object copy paste
                I need to figure out how to get real object coordinates when multiple are selected
             */
            annotations = [annotations[0]];
            pdf.pageCanvases[page].setActiveObject(annotations[0].object);
            if(annotations.length == 1) {
                const serialized = annotations[0].serializeToJSON();
                delete serialized.data['name'];
                Clipboard.set(new ClipboardObject(serialized.type, serialized.page, serialized.data));
            } else if(annotations.length > 1) {
                const serialized = annotations.map(a => a.serializeToJSON());
                serialized.forEach(a => delete a.data['name']);
                Clipboard.set(serialized);
            }
            return annotations;
        }
    },
    <Util>{
        name: 'Paste',
        icon: 'content_paste',
        tooltip: 'Prilepiť',
        shortcut: 'ctrl+v',
        style: 'btn-outline-primary',
        use(pdf: PDFdocument, page: number) {
            const obj = Clipboard.get();
            if(obj === null) return;

            if(obj instanceof ClipboardObject) {
                pasteObject(pdf, page, obj);
            } else {
                obj.forEach(o => pasteObject(pdf, page, o));
            }
        }
    },
    <Util>{
        name: 'Cut',
        icon: 'content_cut',
        tooltip: 'Vystrihnúť',
        shortcut: 'ctrl+x',
        style: 'btn-outline-danger',
        use(pdf: PDFdocument, page: number) {
            const copied:void | Annotation[] = utils[0].use(pdf, page);
            if(!copied) return;
            pdf.pageCanvases[page].remove(...copied.map(c => c.object));
        }
    }
];

const X_OFFSET = 10;
const Y_OFFSET = 10;

function pasteObject(pdf: PDFdocument, page: number, obj: ClipboardObject) {
    const canvas = pdf.pageCanvases[obj.page];
    console.log(obj);
    canvas.discardActiveObject();
    switch(obj.type) {
        case 'Sign':
            // TODO: Pasting signature throws duplicate ID error
            // @ts-ignore
            obj.data.left += X_OFFSET; obj.data.top += Y_OFFSET;
            break;
        case 'Rect':
        case 'Ellipse':
        case 'Text':
            // @ts-ignore
            obj.data.left += X_OFFSET; obj.data.top += Y_OFFSET;
            break;
        case 'Line':
            // @ts-ignore
            obj.data.x1 += X_OFFSET; obj.data.y1 += Y_OFFSET; obj.data.x2 += X_OFFSET; obj.data.y2 += Y_OFFSET;
            break;
    }
    const annot = getAnnotation(obj, canvas);
    console.log(annot);
    pdf.addAnnotation(annot);

    canvas.setActiveObject(annot.object);
    canvas.requestRenderAll();
    return annot;
}

function getAnnotation(obj: ClipboardObject, canvas: Canvas): Annotation {
    switch (obj.type) {
        case 'Rect':
            return new RectAnnotation(obj.page, obj.data, canvas);
        case 'Ellipse':
            return new EllipseAnnotation(obj.page, obj.data, canvas);
        case 'Line':
            return new LineAnnotation(obj.page, obj.data, canvas);
        case 'Text':
            return new TextAnnotation(obj.page, obj.data, canvas);
        case 'Image':
            return new ImageAnnotation(obj.page, obj.data, canvas);
        case 'Path':
            return new PathAnnotation(obj.page, obj.data as { path: string, options: fabric.IPathOptions }, canvas);
        case 'Sign':
            return new SignAnnotation(obj.page, obj.data, canvas);
        default:
            throw new Error('Unknown annotation type');
    }
}
