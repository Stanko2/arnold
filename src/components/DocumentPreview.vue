<template>
    <li class="list-group-item" :class="{ 'active': selected, 'list-group-item-action': !selected}">
        <div v-if="document != null" class="d-flex flex-row align-items-center">
            <div class="card" style="width: 200px">
                <div v-if="pdf == null" class="d-flex align-items-center justify-content-center text-danger">Save this document to load preview</div>
                <pdf :src="pdf" :page="1" style="display: inline-block; width: 100%;"></pdf>
            </div>
            <p class="ml-4">{{document.index}}. {{ document.riesitel }}  <span class="badge badge-secondary">{{ document.kategoria }}</span></p>
        </div>
        <div v-else>
            <b-spinner variant="primary" label="loading..."></b-spinner>
            <p>Loading...</p>
        </div>
        
    </li>
</template>

<script lang="ts">
import { Database } from '@/Db'
import Vue from 'vue'
var pdf = require('vue-pdf').default;
export default Vue.extend({
    components: {
        pdf
    },
    props:[
        'documentID',
        'isSelected'
    ],
    data(){
        return {
            document: null,
            pdf: null,
            selected: this.isSelected,
        }
    },
    mounted() {
        Database.getDocument(this.documentID).then(doc=>{
            this.$data.document = doc;
            // TODO: load only visible
            // this.$data.pdf = pdf.createLoadingTask(new Uint8Array(doc.pdfData));
        })
    },
    methods: {
        updatePreview(){
            console.log('updating preview');
            Database.getDocument(this.documentID).then(doc=>{
                this.$data.pdf = pdf.createLoadingTask(new Uint8Array(doc.pdfData));
            })
        }
    }
})
</script>