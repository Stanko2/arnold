<template>
  <div id="app">
    <nav class="navbar sticky-top navbar-light bg-primary" style="padding: 0">
      <topbar @save="save" @select="selectDir" class="pdf"></topbar>
    </nav>
    <div class="d-flex main">
      <div class="right-bar bg-secondary">
        <ul class="list-group">
          <li class="list-group-item" v-for="(document, i) in metadatas" :key="document.riesitel" :class="{ 'active': document.index == selectedIndex+1, 'list-group-item-action': document.index != selectedIndex+1}" @click="selectIndex(i)">
            <p>{{i}}. {{ document.riesitel }}  <span class="badge badge-secondary">{{ document.kategoria }}</span></p>
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
import Toolbar from '../components/Toolbar.vue';
import { functions, getViewedDocument, metaDatas, selectedDocumentIndex, setPdf } from "../DocumentManager";

@Component({
  components: {
    Viewport,
    Topbar,
    Toolbar
  },
  data(){
    return {
      pdf: getViewedDocument(),
      source: getViewedDocument()?.pageCount,
      metadatas: metaDatas,
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
    },
    selectDir(dir: number){
      setPdf(selectedDocumentIndex + dir)      
    },
    selectIndex(index: number){
      setPdf(index).catch(()=>{
        this.$router.back();
      });
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
