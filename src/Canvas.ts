
import { PDFdocument } from "./components/PDFdocument";
import { tools } from "./components/Tools/Tool";
import { fabric } from "fabric";
import { ImageAnnotation, PathAnnotation, SignAnnotation } from "@/Annotation";
import eventHub from "./Mixins/EventHub";
import { Tool } from "./@types";
import store from './Store';
import { emojiRegex } from "./components/Tools/Util";
export class Canvas extends fabric.Canvas {
    Clear(): void {
        try {
            super.dispose();
        }
        catch (e) {
            return;
        }
    }
    static toolbarRef: any;
    static active: boolean = true;
    creating: fabric.Object | null = null;
    pageIndex = 0;
    drawnShapes: fabric.Path[] = [];
    static selectedTool: Tool<fabric.IObjectOptions> | undefined = undefined;
    initialized = false;
    constructor(el: any, public pdf: PDFdocument, private page: number) {
        super(el);
        this.selection = false;
        eventHub.$on('tool:select', (tool: Tool<fabric.IObjectOptions>) => Canvas.selectedTool = tool);
    }


    setScale(viewportSize: { width: number, height: number }) {
        if (this.pdf.modifyRef) {
            const { width } = this.pdf.modifyRef.getPage(this.page).getSize();
            this.setZoom(viewportSize.width / width);
        }
        else {
            setTimeout(() => {
                this.setScale(viewportSize);
            }, 10);
        }
    }

    initEvents() {
        this.uniformScaling = false;
        this.on('mouse:down', async (e) => {
            if (e.absolutePointer == null) return;
            if (this.isDrawingMode) return;
            eventHub.$emit('canvas:tap', this, e.e);
            if(!Canvas.active) return;
            // for (const annotation of this.pdf.annotations) {
            //     if (annotation.object.containsPoint(e.absolutePointer)) {
            //         return;
            //     }
            // }
            if (Canvas.selectedTool && Canvas.selectedTool.name != 'Select' && this.getActiveObjects().length == 0 && Canvas.selectedTool.defaultOptions) {
                var options = Canvas.selectedTool.defaultOptions as fabric.IObjectOptions;
                const width = Canvas.selectedTool.defaultOptions.width || 0;
                const height = Canvas.selectedTool.defaultOptions.height || 0;
                options.top = e.absolutePointer?.y - height / 2;
                options.left = e.absolutePointer?.x - width / 2;
                Canvas.selectedTool.defaultOptions = options;
                const pointerPos = this.getPointer(e.e);
                if (Canvas.selectedTool.name == 'Arrow') {
                    (Canvas.selectedTool.defaultOptions as fabric.ILineOptions).x1 = pointerPos.x;
                    (Canvas.selectedTool.defaultOptions as fabric.ILineOptions).y1 = pointerPos.y;
                }
                else {
                    try{
                        this.creating = await Canvas.selectedTool.click?.(this.pdf, this.page, pointerPos);
                        this.setActiveObject(this.creating);
                        this.requestRenderAll();
                        eventHub.$emit('tool:select', tools[7]);
                    }
                    catch(err){
                        eventHub.$emit('canvas:error', err);   
                    }
                }
            }

        });
        this.on('mouse:up', async (e) => {
            if (this.isDrawingMode) return;
            const pointerPos = e.absolutePointer || new fabric.Point(0, 0);
            if (Canvas.selectedTool && Canvas.selectedTool.name == 'Arrow') {
                (Canvas.selectedTool.defaultOptions as fabric.ILineOptions).x2 = pointerPos.x;
                (Canvas.selectedTool.defaultOptions as fabric.ILineOptions).y2 = pointerPos.y;
                
                this.creating = await Canvas.selectedTool.click?.(this.pdf, this.page, pointerPos);
                this.setActiveObject(this.creating);
                this.requestRenderAll();
            }
        })
        this.on('object:scaling', (e) => {
            if (e.target?.type == 'textbox' || e.target?.type == 'activeSelection') {
                e.target?.setOptions({ scaleX: 1, scaleY: 1 });
            }
            const scaleX = e.target?.scaleX || 1;
            const scaleY = e.target?.scaleY || 1;
            if (e.target?.type === 'rect') {
                e.target?.set({
                    scaleX: 1,
                    scaleY: 1,
                    width: (e.target?.width || 0) * scaleX,
                    height: (e.target?.height || 0) * scaleY
                })
            }
            else if (e.target?.type === 'ellipse'){
                const ellipse = e.target as fabric.Ellipse
                ellipse.set({
                    scaleX: 1,
                    scaleY: 1,
                    rx: (ellipse.rx || 0) * scaleX,
                    ry: (ellipse.ry || 0) * scaleY
                })
            }
        });
        this.on('selection:cleared', (e) => {
            if (Canvas.selectedTool && Canvas.selectedTool.name == 'Select') {
                Canvas.selectedTool.defaultOptions = {};
                Canvas.toolbarRef.$data.selectedTool.defaultOptions = {};
                Canvas.toolbarRef.$data.selectedOptions = {
                    hasFill: false,
                    hasStroke: false,
                    hasStrokeWidth: false,
                    hasText: false,
                };
            }
        });
        this.on('text:changed', (e) => {
            if(e.target instanceof fabric.Textbox){
                this.resetStylesForBlankCharacters(e.target)
                this.setFontForEmojis(e.target)
            }
        });
        this.on('mouse:move', (e) => {
            const mouse = e.absolutePointer;
            store.commit('Clipboard/setMousePos', { pos:{x: mouse?.x, y: mouse?.y }, page: this.page });
            
        })
        this.on('object:scaled', (e) => {
            if (e.target != null && e.target.type != 'group' && e.target.type != 'ellipse' && e.target.type != 'image') {
                const obj: fabric.Object = e.target,
                    w = (obj.width || 0) * (obj.scaleX || 0),
                    h = (obj.height || 0) * (obj.scaleY || 0);

                obj.set({
                    'height': h,
                    'width': w,
                    'scaleX': 1,
                    'scaleY': 1
                });
            }
            else if (e.target && e.target.type == 'ellipse') {
                const obj: fabric.Ellipse = e.target as fabric.Ellipse,
                    w = (obj.rx || 0) * (obj.scaleX || 0),
                    h = (obj.ry || 0) * (obj.scaleY || 0);

                obj.set({
                    'ry': h,
                    'rx': w,
                    'scaleX': 1,
                    'scaleY': 1
                });
            }
        });
        this.on('selection:updated', this.HandleSelectionChanged);
        this.on('selection:created', this.HandleSelectionChanged);



        setTimeout(() => {
            this.on('object:added', (e) => {
                var obj = e.target;
                if (obj instanceof fabric.Path && this.isDrawingMode) {
                    this.pdf.addAnnotation(new PathAnnotation(this.page, obj, this));
                }
                if (obj instanceof fabric.Group && !this.getObjects().some(e => e.type == 'group' && e.name == obj?.name && e != obj)) {
                    console.log((obj as any).sign);
                    this.pdf.addAnnotation(new SignAnnotation(this.page, obj as any, this));
                }
            })
            this.initialized = true;
            this.discardActiveObject();
        }, 100);
    }
    HandleSelectionChanged() {
        if (this.selection) {
            const activeObject = this.getActiveObject();

            if (activeObject.type == 'activeSelection') return;
            PDFdocument.activeObject = activeObject;

            if (activeObject.type == 'path') {
                Canvas.toolbarRef.$data.selectedTool.defaultOptions = { stroke: activeObject.stroke, strokeWidth: activeObject.strokeWidth };
                Canvas.toolbarRef.$data.selectedOptions = { hasStrokeWidth: true, hasStroke: true, hasText: false, hasFill: false };
                return;
            }
            else if (activeObject.type == 'group') {
                const obj = (activeObject as fabric.Group).getObjects()[0];
                Canvas.toolbarRef.$data.selectedTool.defaultOptions = { stroke: obj.stroke, strokeWidth: obj.strokeWidth };
                Canvas.toolbarRef.$data.selectedOptions = { hasStrokeWidth: true, hasStroke: true, hasText: false, hasFill: false };
                return;
            }
            var activeObjectTool = (activeObject as any).tool;
            if (activeObjectTool != null) {
                Canvas.toolbarRef.$data.selectedTool.defaultOptions = {
                    stroke: activeObject.stroke,
                    strokeWidth: activeObject.strokeWidth,
                    fill: activeObject.fill,
                    fontFamily: (activeObject as fabric.Textbox).fontFamily,
                    fontSize: (activeObject as fabric.Textbox).fontSize
                };
                Canvas.toolbarRef.$data.selectedOptions = activeObjectTool.options;
            }
            this.pdf.pageCanvases.forEach(e => {
                if (e != this) {
                    e.discardActiveObject();
                    e.renderAll();
                }
            })
        }
        else {
            PDFdocument.activeObject = undefined;
        }
    }

    deleteSelected() {
        if (this.getActiveObjects().length == 0) return;
        for (const obj of this.getActiveObjects()) {
            if (obj.name)
                this.pdf.deleteAnnotation(obj.name);
        }
    }

    setSelectable(selection: boolean) {
        this.selection = selection;
        this.discardActiveObject();
        this.getObjects().forEach(obj => {
            obj.selectable = selection;
        });
        this.requestRenderAll();
    }

    canOpenCtxMenu(e: Event): boolean {
        var cursor = this.getPointer(e);
        var point = new fabric.Point(cursor.x, cursor.y);
        // if (this.getActiveObjects().length > 0) {
        //     return true;
        // }
        return true;
    }

    updateObjectProps(newProps: fabric.IObjectOptions) {
        var obj = this.getActiveObject();
        newProps.top = obj.top;
        newProps.left = obj.left;
        newProps.width = obj.width;
        newProps.height = obj.height;
        obj.set(newProps);
    }
    Rotate(angle: number) {
        const rads = fabric.util.degreesToRadians(angle);
        console.log(this.viewportTransform);

        const rotate = fabric.util.multiplyTransformMatrices([1, 0, 0, 1, (this.width || 0) / 2, (this.height || 0) / 2], [Math.cos(rads), Math.sin(rads), -Math.sin(rads), Math.cos(rads), 0, 0])
        if (this.viewportTransform)
            this.viewportTransform = fabric.util.multiplyTransformMatrices(this.viewportTransform || [1, 0, 0, 1, 0, 0], rotate);
        this.renderAll();
    }


    resetStylesForBlankCharacters(textbox: fabric.Textbox) {
        const styles = Object.keys(textbox.styles).map(e => parseInt(e));
        for (const row of styles) {
            const blank = [' ', '\t', '\n'];
            const text = textbox.textLines[row];
            if (text === undefined) continue;
            const rowStyles = Object.keys(textbox.styles[row]).map(e=> parseInt(e));
            for (const style of rowStyles) {
                if (blank.includes(text.charAt(style))){
                    delete textbox.styles[row][style];
                }
            }
        }
    }

    setFontForEmojis(textbox: fabric.Textbox) {
        textbox.textLines.forEach((line, i) => {
            const emojis: Set<number> = new Set();
            let emojiCount = 0;
            for (const emoji of line.matchAll(emojiRegex)) {
                console.log(emoji);
                const idx = (emoji.index || 0) - emojiCount
                emojis.add(idx)

                textbox.styles[i] = textbox.styles[i] || {};
                textbox.styles[i][idx] = textbox.styles[i][idx] || {};
                textbox.styles[i][idx] = {fontFamily: 'Emoji'}
                emojiCount++;
            }

            if(textbox.styles[i] === undefined) return;
            for (let j = 0; j < line.length; j++) {
                if (emojis.has(j)) continue;
                if (textbox.styles[i][j] === undefined) continue;
                if (textbox.styles[i][j].fontFamily === 'Emoji'){
                    delete textbox.styles[i][j].fontFamily
                }
            }
        })
        console.log(textbox);
        
        // const styles = Object.keys(textbox.styles).map(e => parseInt(e));
        // for (const row of styles) {
        //     const blank = [' ', '\t', '\n'];
        //     const text = textbox.textLines[row];
        //     const rowStyles = Object.keys(textbox.styles[row]).map(e=> parseInt(e));

    }
}