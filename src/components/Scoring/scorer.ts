import {Document, IScoring} from '@/@types';
import {Database} from '@/Db';
import {getViewedDocument} from '@/Documents/DocumentManager';
import store from '@/Store';
import eventHub from '@/Mixins/EventHub';
import {Annotation, ImageAnnotation, SignAnnotation, TextAnnotation} from '@/Annotation';
import {PDFdocument} from '../PDFdocument';
import {Canvas} from '@/Canvas';

class Scorer {
    activeDoc: Document | undefined;
    pdf: PDFdocument | null = null;
    adding = false;
    cancelled = false;

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

    async finalizeScoring(): Promise<string>{
        this.pdf = getViewedDocument();
        return new Promise<string>((resolve, reject)=>{
            if(!this.pdf || this.adding || this.activeDoc?.scoring?.annotName) reject('');
            this.adding = true;
            eventHub.$once('canvas:tap', (canvas: Canvas, e: Event) => {
                if(!this.activeDoc || !this.activeDoc.scoring || this.activeDoc.scoring.points == undefined){
                    reject('No points to add');
                    return;
                }
                this.onCanvasClicked(canvas, e, this.activeDoc.scoring.points).then((id)=>{
                    if(id == 'cancelled')
                        reject(id);
                    else 
                        resolve(id);
                })
            });
            Canvas.active = false;
        })
    }

    cancel(){
        if(this.adding){
            this.cancelled = true;
        }
    }

    async onCanvasClicked(canvas: Canvas, e: Event, points: number): Promise<string> {
        console.log(this.activeDoc);
        const pos = canvas.getPointer(e);
        this.adding = false;
        if(this.cancelled){
            Canvas.active = true;
            return 'cancelled';    
        }
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
            } else if(template.type === 'Sign') {
                const signStyle = store.state.scoringStyle;
                return new SignAnnotation(page, {
                    top: options.top,
                    left: options.left,
                    stroke: signStyle.strokeColor,
                    fill: signStyle.strokeColor,
                    strokeWidth: signStyle.strokeWidth,
                    sign: template.id,
                    create: false
                }, this.pdf.pageCanvases[page]);
            }
        }
        throw new Error('Invalid Annotation type')
    }

    removeFinalScoring(){
        this.pdf = getViewedDocument();
        if(!this.activeDoc || this.activeDoc.scoring?.annotName == undefined || !this.pdf){
            console.log(this.activeDoc);
            throw new Error('trying to remove unexistent scoring');
        }
        this.pdf.deleteAnnotation(this.activeDoc.scoring.annotName);
        this.activeDoc.scoring.final = false;
        delete this.activeDoc.scoring.annotName;
        Database.updateDocument(this.activeDoc.id, this.activeDoc);
    }
}

const scorer = new Scorer();
export default scorer;