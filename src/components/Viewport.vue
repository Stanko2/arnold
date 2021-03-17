<template>
    <div class="viewport">
        <div class="pdf">
            <div v-for="i in pageCount" :key="i" class="page">
                <pdf
                    :key="i"
                    :src="src"
                    :page="i"
                    class="card page-data"
                    @loaded="loaded"
                    @error="err"
                ></pdf>
                <div class="pageAnnot">
                    <canvas ref="page"></canvas>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import pdf from 'vue-pdf';
import { fabric } from 'fabric';
import {PDFdocument} from './PDFdocument'

// class Annotation{
//     static canvases;
    
//     annotData;
//     constructor(type, options){
//         switch (type) {
//             case 'Text':
//                 options.fill = options.color.hex();
//                 this.annotData = new fabric.Textbox(options.text, options);
//                 console.log(this.annotData);
//                 this.annotData.on('scaling', () => this.annotData.set({scaleY:1, scaleX: 1}))
//                 break;
//             default:
//                 break;
//         }
//         Annotation.canvases[options.page].add(this.annotData);
//         this.options = options;
//     }

//     save(){
//         pdfDocument.write(this);
//     }
// }

// class PDF {
//     modifyRef;
//     viewref;
//     myFont;
//     pages;
//     constructor(url){
//         this.viewref = pdf.createLoadingTask(url);
//         this.init(url)
//     }
//     async init(url){
//         var pdfbytes = await fetch(url).then(res => res.arrayBuffer());
//         this.modifyRef = await PDFDocument.load(pdfbytes);
//         this.myFont = await this.modifyRef.embedFont(StandardFonts.Helvetica);
//         this.pages = this.modifyRef.getPages();
//     }

//     write(annotation){
//         const page = this.pages[annotation.options.page];
//         const { width, height } = page.getSize();
//         const canvas = Annotation.canvases[annotation.options.page];
//         var annotRect = annotation.annotData;
//         var x = (annotRect.left) / canvas.getWidth() * width;
//         var y = height - (annotRect.top + annotRect.fontSize) / canvas.getHeight() * height;
//         var fontSize = annotation.options.fontSize / canvas.getHeight() * height;
//         console.log(`x: ${x} y: ${y}`);
//         console.log(this.myFont);
//         var color = annotation.options.color.object();
//         page.drawText(annotation.annotData.textLines.join('\n'), {
//             x: x,
//             y: y,
//             size: fontSize,
//             font: this.myFont,
//             color: rgb(color.r/255,color.g/255,color.b/255),
//             lineHeight: annotRect._fontSizeMult * fontSize,
//         })
//     }

//     async save(){
//         const pdfbytes = await this.modifyRef.save();
//         var blob = new Blob([pdfbytes], {type: 'application/pdf'});
//         var a = document.createElement("a");
//         document.body.appendChild(a);
//         a.style = "display: none";
//         var url = window.URL.createObjectURL(blob);
//         a.href = url;
//         a.download = 'opravene.pdf';
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//     }
// }


var pdfDocument = null;
// var selected = 1;

function initDocument(task){
    console.log(pdfDocument);
    if(task) this.src = task;
    this.src.promise.then(pdf=>{
        this.pageCount = pdf.numPages;
        pdfDocument.pageCanvases = []
        this.ro = []
        setTimeout(() => {
            var dimensions = this.$refs.page[0].parentNode.parentNode.getBoundingClientRect();
            for(var i = 0; i < this.$refs.page.length; i++){
                const page = this.$refs.page[i];
                const canvas = new fabric.Canvas(page);                    
                canvas.setHeight(dimensions.height);
                canvas.setWidth(dimensions.width);
                canvas.pageIndex = i;
                pdfDocument.pageCanvases.push(canvas);
                const observer = new MutationObserver((mutations)=>{
                    mutations.forEach(mutation=>{
                        if(mutation.type == 'attributes'){
                            var dimensions = page.parentNode.parentNode.getBoundingClientRect();
                            console.log(dimensions);
                            canvas.setHeight(dimensions.height);
                            canvas.setWidth(dimensions.width);                    
                        }
                    })
                });
                observer.observe(page.parentNode.parentNode, { attributes: true });
            }
            pdfDocument.initCanvases();
        }, 300);
    });
}
PDFdocument.initDocument = initDocument;        
export default {
    props: ['pdf'],
    components:{
        pdf
    },
    data() {
        pdfDocument = this.pdf;
        PDFdocument.viewport = this;
        return {
            src: pdfDocument.viewref,
            pageCount: pdfDocument.pageCount,
            pagesLoaded: 0,
            // selected: selected,
            
            // save(){
            //     pdfDocument.save();
            // },
            // select(dir){
            //     if(selected+dir < sources.length && selected + dir >= 0){
            //         pdfDocument = new PDFdocument(sources[selected+dir]);
            //         selected +=dir;
            //         this.src = pdfDocument.viewref;
            //         initDocument.call(this);
            //     }
            // }
        }
    },
    mounted() {
        initDocument.call(this);
    },
    methods:{
        loaded(){
            this.pagesLoaded++;
            if(this.pagesLoaded == this.pageCount){
                initDocument.call(this);
                console.log('pdf was loaded');
            }
        },
        err(err){
            console.log(err);
        }
    },
}
</script>
<style scoped>
    .pageAnnot{
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        grid-row: 1;
        grid-column: 1;
    }
    .page {
        display: grid;
        margin-bottom: 20px;
    }
    .page-data {
        grid-row: 1;
        grid-column: 1;
    }
    .viewport{
        overflow-y: scroll;
        width: 100%;
        max-height: 100%;
        background: silver;
    }
    .pdf{
        margin: auto;
        width: 70vw;
    }
</style>