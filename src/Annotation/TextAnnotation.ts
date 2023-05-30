import {Canvas} from "@/Canvas";
import {Annotation} from "./Annotation";
import {EmbedFont} from "@/components/Fonts";
import {getViewedDocument} from "@/Documents/DocumentManager";
import Color from "color";
import {fabric} from "fabric";
import {
    concatTransformationMatrix,
    PDFFont,
    PDFPage,
    PDFPageDrawTextOptions,
    popGraphicsState,
    pushGraphicsState,
    rgb,
    scale,
    translate
} from "pdf-lib";
import { parsePointsAttribute } from "fabric/fabric-impl";

export class TextAnnotation extends Annotation {
    static toolOptions: any;
    static font: PDFFont;
    get textbox(): fabric.Textbox {
        return this.object as fabric.Textbox;
    }
    constructor(page: number, options: fabric.ITextboxOptions, canvas: Canvas) {
        options.originX = 'left';
        options.originY = 'top';
        super(page, new fabric.Textbox(options.text || 'text', options), canvas, 'Text');
        (this.object as any).tool = TextAnnotation.toolOptions;
        canvas.setActiveObject(this.object);
        this.textbox.selectAll();
        this.object._controlsVisibility = {
            bl: false,
            br: false,
            mtr: true,
            tl: false,
            tr: false,
            mb: false,
            mt: false,
        };
        // TODO: show emoji control, that brings up a menu with emojis
        // this.object.controls.emoji = new fabric.Control({
        //     // getVisibility: (obj:fabric.Textbox) => obj.isEditing || false,
        //     x: 0.5,
        //     y: -0.5,
        //     offsetY: -15,
        //     cursorStyle: 'pointer',
        //     render: (ctx, left, top, styleOverride, fabricObject) => {
        //         const size = 24;
        //         const deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";
        //         const img = new Image();
        //         img.src = deleteIcon;
        //         ctx.save();
        //         ctx.translate(left, top);
        //         ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));
        //         ctx.drawImage(img, -size/2, -size/2, size, size);
        //         ctx.restore();
        //     }
        // })

    }
    async bake(page: PDFPage) {
        /*
         <g transform="matrix(1 0 0 1 200.67 340.73)" style=""  >
            <text xml:space="preserve" font-family="Helvetica" font-size="155" font-style="normal" font-weight="normal" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(28,160,133); fill-rule: nonzero; opacity: 1; white-space: pre;" ><tspan x="-146.52" y="-52.9" >text</tspan><tspan x="-146.52" y="150.28" >ahoj</tspan></text>
        </g>
         */
        const font = (this.object as fabric.Textbox).fontFamily || 'Open Sans';
        const doc = getViewedDocument();
        const height = page.getHeight();
        if (this.object == null || this.object.top == null || this.object.left == null || this.textbox.fontSize == null) return;
        const fontSize: number = this.textbox.fontSize || 14;
        const color = Color((this.object.fill as string).substring(0, 7)).object();
        const parser = new DOMParser(),
            data = parser.parseFromString(this.object.toSVG(), "image/svg+xml"),
            transform = data.querySelector('g')?.getAttribute('transform')?.match(/-?[0-9]+(\.[0-9]*)?/gm)?.map(e => parseFloat(e)) || [1, 0, 0, 0, 1, 0];
        
        page.pushOperators(
            pushGraphicsState(),
            translate(0, height),
            scale(1, -1),
            concatTransformationMatrix(transform[0], transform[1], transform[2], transform[3], transform[4], transform[5])
        );
        
        for (const tspan of data.querySelectorAll('tspan').values()) {
            const translation = new fabric.Point(parseFloat(tspan.getAttribute('x') || '0') + parseFloat(tspan.getAttribute('dx') || '0'), 
            parseFloat(tspan.getAttribute('y') || '0') + parseFloat(tspan.getAttribute('dy') || '0'));
            const textStyle = this.parseTextStyle(tspan.getAttribute('style') || '');
            const fontStyle = this.getFontFromParsedStyle(textStyle);
            const fontFamily = textStyle['font-family'] || this.textbox.fontFamily;
            if(textStyle['font-size'] != undefined){
                textStyle['font-size'] = parseFloat(textStyle['font-size'].substring(0, textStyle['font-size'].length - 2));
            }
            await EmbedFont(doc, fontFamily, fontStyle);
            page.pushOperators(
                pushGraphicsState(),
                translate(translation.x, translation.y),
                scale(1, -1)
            );
            const options = <PDFPageDrawTextOptions>{
                x: 0,
                y: 0,
                size: textStyle['font-size'] || fontSize,
                font: doc?.embeddedResources[fontFamily+fontStyle],
                color: rgb(color.r / 255, color.g / 255, color.b / 255),
                lineHeight: this.textbox._fontSizeMult * fontSize,
                opacity: parseInt((this.object.fill as string).substring(7, 9), 16) / 255 || 1,
            }
    
            // unescape html in tspan.innerHTML
            const dom = new DOMParser().parseFromString(tspan.innerHTML, 'text/html');
            const text = dom.body.textContent || '';
    
            page.drawText(text, options);
            page.pushOperators(popGraphicsState());
        }
        page.pushOperators(popGraphicsState());
    }
    serialize(): any {
        return {
            text: this.textbox.text,
            top: this.object.top,
            left: this.object.left,
            fontFamily: this.textbox.fontFamily,
            fontSize: this.textbox.fontSize,
            fill: this.textbox.fill,
            width: this.object.width,
            height: this.object.height,
            hasControls: this.object.hasControls,
            editable: this.textbox.editable,
            angle: this.textbox.angle,
            styles: this.textbox.styles
        };
    }

    parseTextStyle(style: string): any {
        // style = style.replaceAll(' ', '');
        style = style.replaceAll('\'', '');
        const ret: any = {};
        for (const s of style.split(';')) {
            if(s == '') continue;
            const data = s.split(':');
            if(data[0].length == 1 || data[1].length == 1)
                continue;
            if(data[0].startsWith(' '))
                data[0] = data[0].substring(1);
            if(data[1].startsWith(' '))
                data[1] = data[1].substring(1);
            ret[data[0]] = data[1];
        }
        return ret;
    }

    getFontFromParsedStyle(parsedStyle: any): 'normal' | 'bold' | 'italic' | 'boldItalic' {
        if(parsedStyle['font-style'] == 'italic' && parsedStyle['font-weight'] == '600')
            return 'boldItalic';
        else if (parsedStyle['font-style'] == 'italic')
            return 'italic';
        else if (parsedStyle['font-weight'] == '600')
            return 'bold';
        else
            return 'normal'
    }
}
