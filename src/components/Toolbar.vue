<template>
  <div class="toolbar d-flex flex-row justify-content-start align-items-center">
    <div :key="tool.name" v-for="tool in tools">
      <button :id="tool.name" class="btn "
       :class="{'btn-primary': selectedTool.name == tool.name, 
       'btn-outline-primary': selectedTool.name != tool.name}" @click="select(tool)">
        <span class="material-icons">{{ tool.icon }}</span>
      </button>
      <b-tooltip :target="tool.name" triggers="hover">
        {{ tool.tooltip }}
      </b-tooltip>
    </div>
    <div class="btn" v-if="selectedOptions.hasText">
      <b-dropdown v-model="selectedTool.defaultOptions.fontFamily" text="Font">
        <b-dropdown-item>Arial</b-dropdown-item>
        <b-dropdown-item>Calibri</b-dropdown-item>
        <b-dropdown-item>Comic Sans</b-dropdown-item>
        <b-dropdown-item>Helvetica</b-dropdown-item>
      </b-dropdown>
    </div>
    <div class="form-inline" v-if="selectedOptions.hasText">
      <p class="d-flex align-items-center">Font Size</p>
      <input class="form-control" style="width:100px" type="number" v-model="selectedTool.defaultOptions.fontSize">
    </div>
    <div v-if="selectedOptions.hasFill" class="d-flex align-items-center">
      <p style="margin: 5px">Fill</p> 
      <v-swatches v-model="selectedTool.defaultOptions.fill"></v-swatches>
    </div>
    <div v-if="selectedOptions.hasStroke" class="d-flex align-items-center">
      <p style="margin: 5px">Stroke</p> 
      <v-swatches v-model="selectedTool.defaultOptions.stroke"></v-swatches>
    </div>
  </div>
</template>

<script>
import { selectedTool, selectTool, tools, init } from './Tool'
import { PDFdocument } from './PDFdocument';

import VSwatches from 'vue-swatches'

// Import the styles too, globally
import "vue-swatches/dist/vue-swatches.css"

export default {
  components: {
    VSwatches
  },
  data(){
    return{
      tools: tools,
      selectedTool: selectedTool,
      selectedOptions: selectedTool.options,
      fill: '#ffffff',
      stroke: '#000000'
    }
  },
  mounted() {
    init(this);
    PDFdocument.toolbarRef = this;
  },
  methods:{
    select(tool){
      this.$data.selectedTool = tool;
      selectTool(tool);
    }
  },
  created(){
    this.$watch('selectedTool.defaultOptions', ()=>{

      if(this.$data.selectedTool.name == 'Select'){
        console.log(this.$data.selectedTool.defaultOptions);
        this.$data.selectedTool.defaultOptions.width = null;
        this.$data.selectedTool.defaultOptions.height = null;
        this.$data.selectedTool.defaultOptions.top = PDFdocument.activeObject.top;
        this.$data.selectedTool.defaultOptions.left = PDFdocument.activeObject.left;
        PDFdocument.activeObject.set(this.$data.selectedTool.defaultOptions);
        PDFdocument.activeObject.canvas?.renderAll();
      }
    }, {deep: true});
  }
}
</script>

<style scoped>
  .toolbar{
    position: relative;
    top: 0;
    left: 0;
    width: 100%;    
    height: 6vh;
    padding: 5px;
  }
  .btn{
    margin: 0 2px;
  }
  b-dropdown{
    margin: 0 2px;
  }
</style>