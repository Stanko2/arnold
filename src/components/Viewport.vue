<template>
    <div class="viewportSpace">
        <div class="loadingOverlay" v-if="!loaded">
            <div>
                <b-spinner variant="primary" label="loading..."></b-spinner>
                <p>Loading...</p>
            </div>
            
        </div>
        <div class="viewport" v-shortkey.once="['delete']" @shortkey="deleteSelected">
            <div class="pdf" ref="pdf">
                <div v-for="i in pageCount" :key="i" class="page">
                    <pdf
                        :key="i"
                        :src="src"
                        :page="i"
                        class="card page-data"
                        @error="err"
                        @loaded="documentLoaded"
                    ></pdf>
                    <div class="pageAnnot">
                        <canvas ref="page"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
var pdf = require("vue-pdf").default;
import { Canvas } from '../Canvas'
import { PDFdocument } from './PDFdocument';
import { getViewedDocument } from '@/DocumentManager';

var pdfDocument = null;

export default {
    props: ['pdf'],
    components:{
        pdf
    },
    data() {
        pdfDocument = getViewedDocument();
        return {
            src: pdfDocument?.viewref,
            pageCount: pdfDocument?.pageCount,
            pagesLoaded: 0,
            loaded: false
        }
    },
    mounted(){
        window.addEventListener("resize",()=>{
            setTimeout(() => {
                var size = (this.$refs.pdf as Element).getBoundingClientRect();
            
                for (let i = 0; i < (this.$refs.page as Element[]).length; i++) {
                    const page = (this.$refs.page as HTMLElement[])[i].getBoundingClientRect();
                    
                    // page.style.transform = `scale(${size.width / page.getBoundingClientRect().width})`;
                    // console.log(page.style.transform);
                    
                    var canvas: Canvas = getViewedDocument()?.pageCanvases[i] as Canvas;
                    canvas.setWidth(size.width);
                    canvas.setHeight(page.height);
                }    
            }, 100);
            
        });
        PDFdocument.initDocument = (task: any, document: PDFdocument) => {
            this.$data.loaded = false;
            if(task) this.src = task;
            this.src.promise.then((pdf: any)=>{
                this.pageCount = pdf.numPages;
                var pageCanvases: Canvas[] = []
                // setTimeout musi byt, lebo z nejakych dovodov sa to pdfko resizne na co canvas nevie reagovat 
                // nepodarilo sa mi vyriesit lepsie
                setTimeout(() => {
                    var dimensions: DOMRect | undefined = (this.$refs.page as Element[])[0]?.parentElement?.parentElement?.getBoundingClientRect();
                    for(var i = 0; i < (this.$refs.page as Element[]).length; i++){
                        const page = (this.$refs.page as Element[])[i];
                        const canvas = new Canvas(page, document, i);                    
                        if(dimensions != null){
                            canvas.setHeight(dimensions?.height);
                            canvas.setWidth(dimensions?.width);
                        }
                        
                        canvas.pageIndex = i;
                        pageCanvases.push(canvas);
                    }
                    var doc = getViewedDocument();
                    if(doc != null){
                        doc.pageCanvases = pageCanvases;
                        doc.initCanvases();
                    }
                    
                    this.$data.loaded = true;
                }, 50);
            });
        }  
        PDFdocument.viewport = this;
    },
    methods:{
        err(err: any){
            console.log(err);
        },
        deleteSelected(){
            console.log('delete');
        },
        documentLoaded(){
            console.log('loaded');
        },
        
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
        margin: 10px;
        transform-origin: top left;
    }
    .page-data {
        grid-row: 1;
        grid-column: 1;
    }
    .viewport{
        position: absolute;
        overflow-y: scroll;
        width: 100%;
        max-height: 100%;
        background: silver;
    }
    .pdf{
        margin: auto;
        max-width: 70vw;

    }
    .loadingOverlay{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 9999;
        display:flex;
        justify-content: center;
        align-items: center;
    }
    .viewportSpace{
        position: relative;
        width: 100%;
        height: 100%;
    }
</style>