<template>
  <div id="app">
    <nav class="navbar sticky-top navbar-light bg-primary" style="padding: 0">
      <topbar @save="save" @select="selectDir" class="pdf"></topbar>
    </nav>
    <div class="d-flex main">
      <div class="right-bar bg-secondary">
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Search Documents ..." ref="searchInput" @input="search">
          <div class="input-group-append">
            <button class="btn btn-success" @click="search"><span class="material-icons">search</span></button>
          </div>
        </div>
        <ul class="list-group">
          <document-preview ref="documentList" class="list-group-item" v-for="document in matchedDocuments" :key="document.id" :documentID="document.id" :isSelected="selectedIndex == document.index+1" @click.native="selectIndex(document.index-1)"></document-preview>
          <li v-if="matchedDocuments.length == 0">
            <p class="text-danger">No matching documents</p>
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
    <div v-shortkey.once="['ctrl', 'arrowup']" @shortkey="selectDir(-1)"></div>
    <div v-shortkey.once="['ctrl', 'arrowdown']" @shortkey="selectDir(1)"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Viewport from '../components/Viewport.vue';
import Topbar from '../components/Topbar.vue';
import Toolbar from '../components/Tools/Toolbar.vue';
import DocumentPreview from '../components/DocumentPreview.vue';
import { functions, getViewedDocument, metaDatas, selectedDocumentIndex, setPdf } from "../DocumentManager";


// TODO: fix misterious disapearance of documents on reload
@Component({
  components: {
    Viewport,
    Topbar,
    Toolbar,
    DocumentPreview
  },
  data(){
    metaDatas.sort((a,b)=> a.index - b.index);
    return {
      pdf: getViewedDocument(),
      source: getViewedDocument()?.pageCount,
      matchedDocuments: metaDatas,
      selectedIndex: selectedDocumentIndex
    }
  },
  mounted(){
    if(getViewedDocument() == null){
      setPdf(0).catch(()=>{
        this.$router.back();
      })
    }
    functions.updateUI = ()=>{
      this.$data.selectedIndex = selectedDocumentIndex;
      this.$data.pdf = getViewedDocument();
      this.$data.source = getViewedDocument()?.pageCount;
    }
  },
  methods:{
    save() {
      this.$data.pdf.save();
      (this as any).UpdateCurrentPreview();
    },
    selectDir(dir: number){
      setPdf(selectedDocumentIndex + dir).then(()=>{
        (this as any).UpdateCurrentPreview();
      })
    },
    selectIndex(index: number){
      setPdf(index).catch(()=>{
        this.$router.back();
      }).then(()=>{
        (this as any).UpdateCurrentPreview();
      });
    },
    search() {
      const query = (this.$refs.searchInput as any).value;
      this.$data.matchedDocuments = [];
      metaDatas.forEach(e => {
        if(e.riesitel.match(query) != null){
          this.$data.matchedDocuments.push(e);
        }
      });
    },
    UpdateCurrentPreview() {
      const editing=(this.$refs.documentList as Vue[]).find(e => e.$data.document.id==this.$data.pdf.id) as any;
      setTimeout(() => {
        editing.updatePreview();
      }, 500);
    }
  }
})

// function 

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
  overflow-x: hidden;
  overflow-y: scroll;
}
.pdf-tab{
  width: 100%;
}
.viewportWrapper{
  height: 93.5%;
}
</style>
