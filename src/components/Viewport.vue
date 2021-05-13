<template>
    <div class="viewport" @click="deselect" v-shortkey.once="['delete']" @shortkey="deleteSelected">
        <div class="pdf" >
            <div v-for="i in pageCount" :key="i" class="page">
                <pdf
                    :key="i"
                    :src="src"
                    :page="i"
                    class="card page-data"
                    @loaded="loaded"
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
</template>

<script>
import pdf from 'vue-pdf';
import { Canvas } from '../Canvas'
import {PDFdocument} from './PDFdocument'

var pdfDocument = null;

function initDocument(task, document){
    if(task) this.src = task;
    this.src.promise.then(pdf=>{
        this.pageCount = pdf.numPages;
        pdfDocument.pageCanvases = []
        this.ro = []
        setTimeout(() => {
            var dimensions = this.$refs.page[0].parentNode.parentNode.getBoundingClientRect();
            for(var i = 0; i < this.$refs.page.length; i++){
                const page = this.$refs.page[i];
                const canvas = new Canvas(page, document, i);                    
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
if(PDFdocument != null){
    PDFdocument.initDocument = initDocument;        
}

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
        }
    },
    mounted() {
        // initDocument.call(this);
    },
    methods:{
        loaded(){
            // this.pagesLoaded++;
            // if(this.pagesLoaded == this.pageCount){
            //     initDocument.call(this);
            //     console.log('pdf was loaded');
            // }
        },
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