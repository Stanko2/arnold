<template>
    <div class="viewportSpace">
        <div class="loadingOverlay" v-if="!loaded">
            <div>
                <b-spinner variant="primary" label="loading..."></b-spinner>
                <p>Loading...</p>
            </div>
            
        </div>
        <div class="viewport" @click="deselect" v-shortkey.once="['delete']" @shortkey="deleteSelected">
            <div class="pdf" >
                <div v-for="i in pageCount" :key="i" class="page">
                    <pdf
                        :key="i"
                        :src="src"
                        :page="i"
                        class="card page-data"
                        @error="err"
                    ></pdf>
                    <div class="pageAnnot" 
                        @mouseover="pdf.hovering[i] = true" 
                        @mouseleave="pdf.hovering[i] = false">
                            <canvas ref="page"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import pdf from 'vue-pdf';
import { Canvas } from '../Canvas'
import {PDFdocument} from './PDFdocument'
import { getViewedDocument } from '@/DocumentManager';

var pdfDocument = null;

function initDocument(task, document){
    this.$data.loaded = false;
    if(task) this.src = task;
    this.src.promise.then(pdf=>{
        this.pageCount = pdf.numPages;
        var pageCanvases = []
        this.ro = []
        // setTimeout musi byt, lebo z nejakych dovodov sa to pdfko resizne na co canvas nevie reagovat 
        // nepodarilo sa mi vyriesit v nejakom normalnom case
        setTimeout(() => {
            var dimensions = this.$refs.page[0].parentNode.parentNode.getBoundingClientRect();
            for(var i = 0; i < this.$refs.page.length; i++){
                const page = this.$refs.page[i];
                const canvas = new Canvas(page, document, i);                    
                canvas.setHeight(dimensions.height);
                canvas.setWidth(dimensions.width);
                canvas.pageIndex = i;
                pageCanvases.push(canvas);

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
            getViewedDocument().pageCanvases = pageCanvases;
            getViewedDocument().initCanvases();
            this.$data.loaded = true;
        }, 50);
    });
}
if(PDFdocument != null){
    PDFdocument.initDocument = initDocument;        
}

export default {
    props: ['pdf'],
    components:{
        pdf
    },
    data() {
        pdfDocument = getViewedDocument();
        PDFdocument.viewport = this;
        return {
            src: pdfDocument.viewref,
            pageCount: pdfDocument.pageCount,
            pagesLoaded: 0,
            loaded: false
        }
    },
    methods:{
        err(err){
            console.log(err);
        },
        deselect(){
            for (const canvas of pdfDocument.pageCanvases) {
                if(!pdfDocument.mouseOverDocument){
                    canvas.discardActiveObject().renderAll();
                }
                
            }
        },
        deleteSelected(){
            console.log('delete');
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
        margin: 10px;
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
        width: 70vw;
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