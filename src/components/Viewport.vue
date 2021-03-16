<template>
    <div class="container">
        <!-- <button class="btn btn-primary">prev</button>
        0 / {{ pageCount }}
        <button class="btn btn-primary">next</button> -->
        <button class="btn btn-success" @click="save">Save</button>
        <div v-for="i in pageCount" :key="i" class="page">
            <pdf
                :key="i"
                :src="src"
                :page="i"
                class="card page-data"
                
            ></pdf>
            <div class="pageAnnot">
                <canvas ref="page"></canvas>
            </div>
            
        </div>
        
    </div>
</template>

<script>
import pdf from 'vue-pdf';
import { fabric } from 'fabric';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
const Color = require('color');


class Annotation{
    static canvases;
    
    annotData;
    constructor(type, options){
        switch (type) {
            case 'Text':
                options.fill = options.color.hex();
                this.annotData = new fabric.Textbox(options.text, options);
                console.log(this.annotData);
                this.annotData.on('scaling', () => this.annotData.set({scaleY:1, scaleX: 1}))
                break;
            default:
                break;
        }
        Annotation.canvases[options.page].add(this.annotData);
        this.options = options;
    }

    save(){
        pdfDocument.write(this);
    }
}

class PDF {
    modifyRef;
    viewref;
    myFont;
    pages;
    constructor(url){
        this.viewref = pdf.createLoadingTask(url);
        this.init(url)
    }
    async init(url){
        var pdfbytes = await fetch(url).then(res => res.arrayBuffer());
        this.modifyRef = await PDFDocument.load(pdfbytes);
        this.myFont = await this.modifyRef.embedFont(StandardFonts.Helvetica);
        this.pages = this.modifyRef.getPages();
    }

    write(annotation){
        const page = this.pages[annotation.options.page];
        const { width, height } = page.getSize();
        const canvas = Annotation.canvases[annotation.options.page];
        var annotRect = annotation.annotData;
        var x = (annotRect.left) / canvas.getWidth() * width;
        var y = height - (annotRect.top + annotRect.fontSize) / canvas.getHeight() * height;
        var fontSize = annotation.options.fontSize / canvas.getHeight() * height;
        console.log(`x: ${x} y: ${y}`);
        console.log(this.myFont);
        var color = annotation.options.color.object();
        page.drawText(annotation.annotData.textLines.join('\n'), {
            x: x,
            y: y,
            size: fontSize,
            font: this.myFont,
            color: rgb(color.r/255,color.g/255,color.b/255),
            lineHeight: annotRect._fontSizeMult * fontSize,
        })
    }

    async save(){
        const pdfbytes = await this.modifyRef.save();
        var blob = new Blob([pdfbytes], {type: 'application/pdf'});
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = 'opravene.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}
var pdfDocument = new PDF('http://www.africau.edu/images/default/sample.pdf');
var annotations = [];
Annotation.canvases = [];

export default {
    components:{
        pdf
    },
    data() {
        return {
            src: pdfDocument.viewref,
            pageCount: pdfDocument.pageCount,
            save(){
                for(const annot of annotations){
                    annot.save();
                }
                pdfDocument.save();
            }
        }
    },
    mounted() {
        pdfDocument.viewref.promise.then(pdf=>{
        this.pageCount = pdf.numPages;
        setTimeout(() => {
            for(const page of this.$refs.page){
                var dimensions = page.parentNode.getBoundingClientRect();
                const canvas = new fabric.Canvas(page);                    
                canvas.setHeight(dimensions.height);
                canvas.setWidth(dimensions.width);
                canvas.backgroundColor = 'transparent';
                Annotation.canvases.push(canvas);
                const annot = new Annotation('Text', {
                    top: 30,
                    left: 80,
                    color: Color('#ff0000'),
                    width: 200,
                    height: 200,
                    fontSize: 12,
                    page: annotations.length,
                    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
                    hoverCursor: 'pointer',
                    fontFamily: 'Helvetica'
                });
                annotations.push(annot);
            }
        }, 30);
        });
    }
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
    }
    .page-data {
        grid-row: 1;
        grid-column: 1;
    }
</style>