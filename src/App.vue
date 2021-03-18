<template>
  <div id="app">
    <nav class="navbar sticky-top navbar-light bg-primary">
      <Toolbar @save="save" @select="select" class="pdf"></Toolbar>
    </nav>
    <div class="d-flex main">
      <div class="right-bar bg-secondary">
        prava lista - asi pojde list rieseni
      </div>
      <Viewport :pdf="pdf" :key="source"></Viewport>
    </div>
    
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Viewport from './components/Viewport.vue';
import Toolbar from './components/Toolbar.vue'
import { PDFdocument } from './components/PDFdocument';

var sources = [
  'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf',
  'http://www.africau.edu/images/default/sample.pdf',
  'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-download-10-mb.pdf',
  'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-with-images.pdf'
];
var index = 3;
// var pdfs: PDFdocument[] = [];

// for (const pdf of sources) {
//   pdfs.push(new PDFdocument(pdf));
// }

@Component({
  components: {
    Viewport,
    Toolbar
  },
  data(){
    var pdf = new PDFdocument(sources[index]);
    return {
      pdf: pdf,
      source: sources[index],
    }
  },
  methods:{
    save() {
      this.$data.pdf.save();
    },
    select(dir: number){
      if(index + dir < sources.length && index + dir >= 0){
        index += dir;
        console.log(index);
        this.$data.source = sources[index];
        this.$data.pdf = new PDFdocument(sources[index]);
      }
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
</style>
