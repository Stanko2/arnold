import { Document, IScoring } from '@/@types';
import { BIconThreeDotsVertical } from 'bootstrap-vue';
import { Database } from '@/Db';
import { getViewedDocument } from '@/Documents/DocumentManager';
import store from '@/Store';
import eventHub from '@/Mixins/EventHub';
import { Annotation, TextAnnotation, ImageAnnotation } from '@/Annotation';
import { PDFdocument } from '../PDFdocument';
import { Canvas } from '@/Canvas';
import { canBeConvertedToUint8Array } from 'pdf-lib';



class Scorer {
    activeDoc: Document | undefined;
    pdf: PDFdocument | null = null;
    adding = false;
    getScoring(doc: Document): IScoring {
        this.activeDoc = doc
        
        if(doc.scoring == undefined){
            return {
                acceptedCriteria: [],
                final: false,
                points: undefined,
                annotName: ''
            }
        }
        return doc.scoring;
    }

    saveScoring(scoring: IScoring){
        if(!this.activeDoc) return;
        this.activeDoc.scoring = scoring;
        // @ts-ignore
        if(scoring.points === '')
            scoring.points = undefined;
        Database.updateDocument(this.activeDoc.id, this.activeDoc);
    }

    async finalizeScoring(){
        this.pdf = getViewedDocument();
        if(!this.pdf || this.adding || this.activeDoc?.scoring?.annotName) return;
        return new Promise((resolve, reject)=>{
            console.log('click to add');
            this.adding = true;
            eventHub.$once('canvas:tap', (canvas: Canvas, e: Event) => {
                if(!this.activeDoc || !this.activeDoc.scoring || this.activeDoc.scoring.points == undefined){
                    reject('No points to add');
                    return;
                }
                this.onCanvasClicked(canvas, e, this.activeDoc.scoring.points).then((id)=>{
                    resolve(id);
                })
            });
            Canvas.active = false;
        })
    }

    async onCanvasClicked(canvas: Canvas, e: Event, points: number): Promise<string> {
        console.log(this.activeDoc);
        const pos = canvas.getPointer(e);
        this.adding = false;
        const annot = await this.getAnnotation(points, canvas.pageIndex, { originX: 'canter', originY: 'center', top: pos.y, left: pos.x }).catch(()=>{
            throw new Error("Error finalizing scoring");
        });
        this.pdf?.addAnnotation(annot);
        Canvas.active = true;
        return annot.object.name || '';
    }

    async getAnnotation(points: number, page: number, options: fabric.IObjectOptions): Promise<Annotation> {
        if(!this.pdf) {
            throw new Error('No document loaded, cant finalize scoring')
        }
        const entry = store.state.scoringEntries.find(e => e.points == points);
        if(entry == undefined){
            return new TextAnnotation(page, { ...options, ...store.state.settings.tools.settings.tools[8].defaultOptions, editable: false, text: `${points}B`, hasControls: false }, this.pdf.pageCanvases[page]);
        }
        else {
            const template = await Database.getTemplate(entry.id);
            if(template.type ===  'Image'){
                return new ImageAnnotation(page, { ...options, ...template.templateOptions, image: template.data.img }, this.pdf.pageCanvases[page]);
            }
            // else if(template.type === 'Sign') {

            // }
        }
        throw new Error('Invalid Annotation type')
    }
}

const scorer = new Scorer();
export default scorer;