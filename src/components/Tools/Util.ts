import {PDFdocument} from "@/components/PDFdocument";
import {Util} from "@/@types";
import {Annotation} from "@/Annotation";
import store from '@/Store';

/*
   TODO:
    - copying to different page
 */

export const emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug;
export const loadingSpinner = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48c3R5bGU+LnNwaW5uZXJfRVV5MXthbmltYXRpb246c3Bpbm5lcl9ncm0zIDEuMnMgaW5maW5pdGV9LnNwaW5uZXJfZjZvU3thbmltYXRpb24tZGVsYXk6LjFzfS5zcGlubmVyX2czblh7YW5pbWF0aW9uLWRlbGF5Oi4yc30uc3Bpbm5lcl9udkVze2FuaW1hdGlvbi1kZWxheTouM3N9LnNwaW5uZXJfTWFOTXthbmltYXRpb24tZGVsYXk6LjRzfS5zcGlubmVyXzRubGV7YW5pbWF0aW9uLWRlbGF5Oi41c30uc3Bpbm5lcl9aRVRNe2FuaW1hdGlvbi1kZWxheTouNnN9LnNwaW5uZXJfSFh1T3thbmltYXRpb24tZGVsYXk6LjdzfS5zcGlubmVyX1lhUW97YW5pbWF0aW9uLWRlbGF5Oi44c30uc3Bpbm5lcl9HT3gxe2FuaW1hdGlvbi1kZWxheTouOXN9LnNwaW5uZXJfNHZ2OXthbmltYXRpb24tZGVsYXk6MXN9LnNwaW5uZXJfTlRzOXthbmltYXRpb24tZGVsYXk6MS4xc30uc3Bpbm5lcl9hdUpKe3RyYW5zZm9ybS1vcmlnaW46Y2VudGVyO2FuaW1hdGlvbjpzcGlubmVyX1QzTzYgNnMgbGluZWFyIGluZmluaXRlfUBrZXlmcmFtZXMgc3Bpbm5lcl9ncm0zezAlLDUwJXthbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOmN1YmljLWJlemllciguMjcsLjQyLC4zNywuOTkpO3I6MXB4fTI1JXthbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOmN1YmljLWJlemllciguNTMsMCwuNjEsLjczKTtyOjJweH19QGtleWZyYW1lcyBzcGlubmVyX1QzTzZ7MCV7dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpfTEwMCV7dHJhbnNmb3JtOnJvdGF0ZSgwZGVnKX19PC9zdHlsZT48ZyBjbGFzcz0ic3Bpbm5lcl9hdUpKIj48Y2lyY2xlIGNsYXNzPSJzcGlubmVyX0VVeTEiIGN4PSIxMiIgY3k9IjMiIHI9IjEiLz48Y2lyY2xlIGNsYXNzPSJzcGlubmVyX0VVeTEgc3Bpbm5lcl9mNm9TIiBjeD0iMTYuNTAiIGN5PSI0LjIxIiByPSIxIi8+PGNpcmNsZSBjbGFzcz0ic3Bpbm5lcl9FVXkxIHNwaW5uZXJfTlRzOSIgY3g9IjcuNTAiIGN5PSI0LjIxIiByPSIxIi8+PGNpcmNsZSBjbGFzcz0ic3Bpbm5lcl9FVXkxIHNwaW5uZXJfZzNuWCIgY3g9IjE5Ljc5IiBjeT0iNy41MCIgcj0iMSIvPjxjaXJjbGUgY2xhc3M9InNwaW5uZXJfRVV5MSBzcGlubmVyXzR2djkiIGN4PSI0LjIxIiBjeT0iNy41MCIgcj0iMSIvPjxjaXJjbGUgY2xhc3M9InNwaW5uZXJfRVV5MSBzcGlubmVyX252RXMiIGN4PSIyMS4wMCIgY3k9IjEyLjAwIiByPSIxIi8+PGNpcmNsZSBjbGFzcz0ic3Bpbm5lcl9FVXkxIHNwaW5uZXJfR094MSIgY3g9IjMuMDAiIGN5PSIxMi4wMCIgcj0iMSIvPjxjaXJjbGUgY2xhc3M9InNwaW5uZXJfRVV5MSBzcGlubmVyX01hTk0iIGN4PSIxOS43OSIgY3k9IjE2LjUwIiByPSIxIi8+PGNpcmNsZSBjbGFzcz0ic3Bpbm5lcl9FVXkxIHNwaW5uZXJfWWFRbyIgY3g9IjQuMjEiIGN5PSIxNi41MCIgcj0iMSIvPjxjaXJjbGUgY2xhc3M9InNwaW5uZXJfRVV5MSBzcGlubmVyXzRubGUiIGN4PSIxNi41MCIgY3k9IjE5Ljc5IiByPSIxIi8+PGNpcmNsZSBjbGFzcz0ic3Bpbm5lcl9FVXkxIHNwaW5uZXJfSFh1TyIgY3g9IjcuNTAiIGN5PSIxOS43OSIgcj0iMSIvPjxjaXJjbGUgY2xhc3M9InNwaW5uZXJfRVV5MSBzcGlubmVyX1pFVE0iIGN4PSIxMiIgY3k9IjIxIiByPSIxIi8+PC9nPjwvc3ZnPg==';

export const utils: Util[] = [
    <Util>{
        name: 'copy',
        icon: 'content_copy',
        tooltip: 'Kopírovať',
        shortcut: 'ctrl+c',
        style: 'primary',
        use(pdf: PDFdocument, page: number) {
            const selected = pdf?.pageCanvases[page]?.getActiveObjects();
            console.log(selected);
            if (selected == null  || selected.length === 0) return;
            const annotations: Annotation[] = [];
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
            pdf.pageCanvases[page].discardActiveObject();
            store.commit('Clipboard/set', annotations);
            console.log(annotations.length);
            return annotations;
        }
    },
    <Util>{
        name: 'paste',
        icon: 'content_paste',
        tooltip: 'Prilepiť',
        shortcut: 'ctrl+v',
        style: 'primary',
        use(pdf: PDFdocument, page: number, useMouse: boolean = false) {
            store.dispatch('Clipboard/paste', {
                useMouse,
                pdf,
                page
            });
        }
    },
    <Util>{
        name: 'cut',
        icon: 'content_cut',
        tooltip: 'Vystrihnúť',
        shortcut: 'ctrl+x',
        style: 'danger',
        use(pdf: PDFdocument, page: number) {
            const objects = utils[0].use(pdf, page);
            if(objects) {
                for (const obj of objects) {
                    obj.delete();
                }
            }
        }
    }
];

// const X_OFFSET = 10;
// const Y_OFFSET = 10;

// function pasteObject(pdf: PDFdocument, page: number, obj: ClipboardObject) {
//     const canvas = pdf.pageCanvases[obj.page];
//     console.log(obj);
//     canvas.discardActiveObject();
//     switch(obj.type) {
//         case 'Sign':
//             // TODO: Pasting signature throws duplicate ID error
//             // @ts-ignore
//             obj.data.left += X_OFFSET; obj.data.top += Y_OFFSET;
//             break;
//         case 'Rect':
//         case 'Ellipse':
//         case 'Text':
//             // @ts-ignore
//             obj.data.left += X_OFFSET; obj.data.top += Y_OFFSET;
//             break;
//         case 'Line':
//             // @ts-ignore
//             obj.data.x1 += X_OFFSET; obj.data.y1 += Y_OFFSET; obj.data.x2 += X_OFFSET; obj.data.y2 += Y_OFFSET;
//             break;
//     }
//     const annot = getAnnotation(obj, canvas);
//     console.log(annot);
//     pdf.addAnnotation(annot);

//     canvas.setActiveObject(annot.object);
//     canvas.requestRenderAll();
//     return obj;
// }

// function getAnnotation(obj: ClipboardObject, canvas: Canvas): Annotation {
//     switch (obj.type) {
//         case 'Rect':
//             return new RectAnnotation(obj.page, obj.data, canvas);
//         case 'Ellipse':
//             return new EllipseAnnotation(obj.page, obj.data, canvas);
//         case 'Line':
//             return new LineAnnotation(obj.page, obj.data, canvas);
//         case 'Text':
//             return new TextAnnotation(obj.page, obj.data, canvas);
//         case 'Image':
//             return new ImageAnnotation(obj.page, obj.data, canvas);
//         case 'Path':
//             return new PathAnnotation(obj.page, obj.data as { path: string, options: fabric.IPathOptions }, canvas);
//         case 'Sign':
//             return new SignAnnotation(obj.page, obj.data, canvas);
//         default:
//             throw new Error('Unknown annotation type');
//     }
// }
