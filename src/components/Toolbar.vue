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
    <div class="btn">
      <b-dropdown text="Font">
        <b-dropdown-item>Arial</b-dropdown-item>
        <b-dropdown-item>Calibri</b-dropdown-item>
        <b-dropdown-item>Comic Sans</b-dropdown-item>
        <b-dropdown-item>Helvetica</b-dropdown-item>
      </b-dropdown>
    </div>
    <div class="d-flex align-items-center">
      <p style="margin: 5px">Fill</p> 
      <v-swatches v-model="fill"></v-swatches>
    </div>
    <div class="d-flex align-items-center">
      <p style="margin: 5px">Stroke</p> 
      <v-swatches v-model="stroke"></v-swatches>
    </div>
  </div>
    <!-- <div> <vue-file-toolbar-menu :content="my_menu" /> </div> -->
</template>

<script>
import { selectedTool, selectTool, tools} from './Tool'

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
      fill: '#ffffff',
      stroke: '#000000'
    }
  },
  methods:{
    select(tool){
      this.$data.selectedTool = tool;
      selectTool(tool);
    }
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