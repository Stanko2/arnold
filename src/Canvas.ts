
import { PDFdocument } from "./components/PDFdocument";
import { selectedTool } from "./components/Tool";
import { fabric } from "fabric";

interface Point{
    x: number;
    y: number;
}

export class Canvas extends fabric.Canvas{
    static toolbarRef: any;

    dragStart = <Point>{x: 0, y: 0};
    creating: fabric.Object | null = null;
    pageIndex = 0;
    constructor(el:any,private pdf: PDFdocument, private page: number){
        super(el);
        this.selection = false;
    }

    initEvents(){
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
                this.dragStart = <Point>{x:e.absolutePointer.x, y:e.absolutePointer.y};
                this.creating = selectedTool.click?.(this.pdf, this.page);
                if(selectedTool.name == 'Arrow'){
                    (selectedTool.defaultOptions as fabric.ILineOptions).x1 = e.absolutePointer.x;
                    (selectedTool.defaultOptions as fabric.ILineOptions).y1 = e.absolutePointer.y;
                }
            }
            
        });
        this.on('object:scaling', (e)=>{
            if(e.target?.type == 'textbox' || e.target?.type == 'active selection' || e.target?.type == 'path'){
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
        this.on('mouse:move', (e)=>{
            if(this.creating != null){
                if(this.creating.type == 'line'){
                    (this.creating as fabric.Line).y2 = this.dragStart.y - (e.absolutePointer?.y || 0);
                    (this.creating as fabric.Line).x2 = this.dragStart.x - (e.absolutePointer?.x || 0);
                    return;
                }
                this.creating.set({
                    'height': Math.abs(this.dragStart.y - (e.absolutePointer?.y || 0)),
                    'width': Math.abs(this.dragStart.x - (e.absolutePointer?.x || 0)),
                })
            }
        });
        this.on('mouse:up', (e) =>{
            this.creating = null;
            this.dragStart = <Point>{x:0, y:0};
        });
        this.on('selection:created', (e) =>{
            if(selectedTool.name == 'Select'){
                console.log(this.getActiveObject().type);
                
                PDFdocument.activeObject = this.getActiveObject();
                if(this.getActiveObject().type == 'path' || this.getActiveObject().type == 'activeSelection'){
                    Canvas.toolbarRef.$data.selectedTool.defaultOptions = {stroke: this.getActiveObject().stroke, strokeWidth: this.getActiveObject().strokeWidth};
                    Canvas.toolbarRef.$data.selectedOptions = { hasStrokeWidth: true, hasStroke: true, hasText: false, hasFill: false };
                    return;
                }
                var activeObjectTool = (this.getActiveObject() as any).tool;
                Canvas.toolbarRef.$data.selectedTool.defaultOptions = activeObjectTool.defaultOptions;
                Canvas.toolbarRef.$data.selectedOptions = activeObjectTool.options;
            }
        });
        this.on('object:added', (e)=>{
            var obj = e.target;
            if(obj instanceof fabric.Path){
                obj.controls = {};
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