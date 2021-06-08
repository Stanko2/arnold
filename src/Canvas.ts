
import { PDFdocument } from "./components/PDFdocument";
import { selectedTool } from "./components/Tool";
import { fabric } from "fabric";
import { PathAnnotation } from "./components/Annotation";

interface Point{
    x: number;
    y: number;
}

export class Canvas extends fabric.Canvas{
    static toolbarRef: any;

    dragStart: fabric.Point = new fabric.Point(0, 0);
    creating: fabric.Object | null = null;
    pageIndex = 0;
    drawnShapes: fabric.Path[] = [];
    constructor(el:any,private pdf: PDFdocument, private page: number){
        super(el);
        this.selection = false;
    }

    setScale(viewportSize: DOMRect){
        if(this.pdf.modifyRef){
            const { width, height} = this.pdf.modifyRef?.getPage(this.page).getSize();
            this.setZoom(viewportSize.width / width);
            this.setHeight(this.getWidth() * height / width);
        }
    }

    initEvents(){   
        this.on('mouse:move', (e)=>{
            if(this.creating != null){
                console.log(this.creating);
                var position = this.getPointer(e.e);
                if(this.creating.type == 'line'){
                    (this.creating as fabric.Line).y2 = this.dragStart.y - position.y;
                    (this.creating as fabric.Line).x2 = this.dragStart.x - position.x;
                    return;
                }
                this.creating.set({
                    'height': Math.abs(this.dragStart.y - (position.y || 0)),
                    'width': Math.abs(this.dragStart.x - (position.x || 0)),
                })
            }
        });
        this.on('mouse:down', (e)=>{
            if(e.absolutePointer == null) return;
            if(this.isDrawingMode) return;
            for (const annotation of this.pdf.annotations) {
                if(annotation.object.containsPoint(e.absolutePointer)){
                    return;
                }
            }
            if(selectedTool.name != 'select' && this.getActiveObjects().length == 0 && selectedTool.defaultOptions != null){
                var options = selectedTool.defaultOptions as fabric.IObjectOptions;
                const width = selectedTool.defaultOptions.width || 0;
                const height = selectedTool.defaultOptions.height || 0;
                options.top = e.absolutePointer?.y - height / 2;
                options.left = e.absolutePointer?.x - width /2;
                selectedTool.defaultOptions = options;
                var pointerPos = this.getPointer(e.e);
                this.dragStart = new fabric.Point(pointerPos.x, pointerPos.y);
                this.creating = selectedTool.click?.(this.pdf, this.page, pointerPos);
                if(selectedTool.name == 'Arrow'){
                    (selectedTool.defaultOptions as fabric.ILineOptions).x1 = pointerPos.x;
                    (selectedTool.defaultOptions as fabric.ILineOptions).y1 = pointerPos.y;
                }
            }
            
        });
        this.on('object:scaling', (e)=>{
            if(e.target?.type == 'textbox' || e.target?.type == 'activeSelection' || e.target?.type == 'path'){
                e.target?.setOptions({ scaleX: 1, scaleY: 1});
            }
            
        });
        this.on('object:scaled', (e)=>{
            if(e.target != null){    
                var obj: fabric.Object = e.target,
                w = (obj.width || 0) * (obj.scaleX || 0),
                h = (obj.height || 0) * (obj.scaleY || 0),
                s = obj.strokeWidth || 0;
        
                obj.set({
                    'height'     : h,
                    'width'      : w,
                    'scaleX'     : 1,
                    'scaleY'     : 1
                });
            }
        });
        
        this.on('mouse:up', (e) =>{
            this.creating = null;
            this.dragStart = new fabric.Point(0, 0);
        });
        this.on('selection:created', (e) =>{
            if(selectedTool.name == 'Select'){
                console.log(this.getActiveObject().type);
                
                if(this.getActiveObject().type == 'activeSelection') return;
                PDFdocument.activeObject = this.getActiveObject();
                if(this.getActiveObject().type == 'path'){
                    Canvas.toolbarRef.$data.selectedTool.defaultOptions = {stroke: this.getActiveObject().stroke, strokeWidth: this.getActiveObject().strokeWidth};
                    Canvas.toolbarRef.$data.selectedOptions = { hasStrokeWidth: true, hasStroke: true, hasText: false, hasFill: false };
                    return;
                }
                var activeObjectTool = (this.getActiveObject() as any).tool;
                if(activeObjectTool != null){
                    Canvas.toolbarRef.$data.selectedTool.defaultOptions = activeObjectTool?.defaultOptions;
                    Canvas.toolbarRef.$data.selectedOptions = activeObjectTool.options;
                }
                this.pdf.pageCanvases.forEach(e=>{
                    if(e != this){
                        e.discardActiveObject();
                        e.renderAll();
                    }
                })
            }
        });
        this.on('object:added', (e)=>{
            var obj = e.target;
            if(obj instanceof fabric.Path && this.isDrawingMode){
                this.pdf.addAnnotation(new PathAnnotation(this.page, obj, this));
            }
        })
    }

    updateObjectProps(newProps: fabric.IObjectOptions){
        var obj = this.getActiveObject();
        newProps.top = obj.top;
        newProps.left = obj.left;
        newProps.width = obj.width;
        newProps.height = obj.height;
        obj.set(newProps);
    }
}