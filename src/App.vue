<template>
  <div id="app">
    <nav class="navbar sticky-top navbar-light bg-primary">
      <topbar @save="save" @select="selectDir" class="pdf"></topbar>
    </nav>
    <div class="d-flex main">
      <div class="right-bar bg-secondary">
        prava lista - asi pojde list rieseni
        <ul class="list-group">
          <li class="list-group-item" v-for="(name, i) in names" :key="name" :class="{ 'active': index == i, 'list-group-item-action': index != i}" @click="selectIndex(i)">
            {{i}}. {{ name }}
          </li>
        </ul>
      </div>
      <div style="width:100%">
        <toolbar :pdf="pdf"></toolbar>
        <div class="viewportWrapper" v-if="pdf != null">
          <Viewport :pdf="pdf" :key="source"></Viewport>
        </div>
      </div>
      
    </div>
    
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Viewport from './components/Viewport.vue';
import Topbar from './components/Topbar.vue';
import Toolbar from './components/Toolbar.vue';
import { PDFdocument } from "./components/PDFdocument";
import { setPdf } from "./DocumentSelector";


export var sources = [
    'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf',
    'http://www.africau.edu/images/default/sample.pdf',
    'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-download-10-mb.pdf',
    'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-with-images.pdf'
  ];
 export var names= [
    'pdf1',
    'pdf2',
    'pdf3',
    'pdf4'
  ]
  
export var index = 3;
export var pdf: PDFdocument = new PDFdocument(sources[index]);

export function select(this: any, dir: number){
    if(dir < sources.length && dir >= 0){
        index = dir;
        this.$data.index = index;
        console.log(index);
        this.$data.source = sources[index];
        this.$data.pdf = new PDFdocument(sources[index]);
        setPdf(this.$data.pdf);
        pdf = this.$data.pdf;
    }
}
  

@Component({
  components: {
    Viewport,
    Topbar,
    Toolbar
  },
  data(){
    return {
      pdf: pdf,
      source: pdf?.pageCount,
      index: index,
      names: names,
    }
  },
  methods:{
    save() {
      this.$data.pdf.save();
    },
    selectDir(dir: number){
      console.log(dir);
      
      select.call(this, dir);
    },
    selectIndex(index: number){
      select.call(this, index);
    }
  }
})
export default class App extends Vue {

}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
.main{
  height: 94vh;
  width: 100vw;
  overflow-x: hidden;
}
.pdf{
  width: 75vw;
}
.right-bar{
  width: 25vw;
}
.pdf-tab{
  width: 100%;
}
.viewportWrapper{
  height: 93.5%;
}
</style>
