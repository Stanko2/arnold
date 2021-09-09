<template>
  <div class="viewportSpace">
    <div class="loadingOverlay" v-if="!loaded">
      <div>
        <b-spinner variant="primary" label="loading..."></b-spinner>
        <p>Loading...</p>
      </div>
    </div>

    <div class="viewport" @contextmenu="openCtxMenu">
      <context-menu
        id="context-menu"
        ref="ctxMenu"
        class="list-group"
        style="user-select: none"
      >
        <li class="list-group-item-action p-1" @click="deleteSelected">
          Zmazat
        </li>
        <li class="list-group-item-action p-1" @click="moveToFront">
          Presunut dopredu
        </li>
        <li class="list-group-item-action p-1" @click="moveToBack">
          Presunut dozadu
        </li>
      </context-menu>
      <div class="pdf" ref="pdf">
        <div v-for="i in pageCount" :key="i" class="page-wrapper">
          <pdf
            :key="i.toString() + id.toString()"
            :src="src"
            :page="i"
            :scale.sync="scale"
            class="card page-data"
            @error="err"
            @loading="documentLoaded"
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
const pdf = require("pdfvuer");
import { Canvas } from "../Canvas";
import { PDFdocument } from "./PDFdocument";
import { getViewedDocument } from "@/DocumentManager";
import Vue from "vue";
import { Database } from "@/Db";
const contextMenu = require("vue-context-menu");

var pdfDocument = null;

export default Vue.extend({
  props: ["pdf"],
  components: {
    pdf: pdf.default,
    contextMenu,
  },
  data() {
    pdfDocument = getViewedDocument();
    return {
      src: pdfDocument?.viewref,
      pageCount: pdfDocument?.pageCount,
      id: pdfDocument?.id,
      pagesLoaded: 0,
      loaded: false,
      scale: 1,
    };
  },
  activated() {
    const doc = getViewedDocument();
    if (doc) {
      this.createCanvases(doc);
    }
  },
  deactivated() {
    const doc = getViewedDocument();
    doc?.pageCanvases.forEach((e) => e.dispose());
  },
  mounted() {
    this.eventHub.$on("viewport:scale", this.setScale);
    window.addEventListener("resize", this.resize);
    PDFdocument.initDocument = (task: any) => {
      this.$data.loaded = false;
      if (task) this.src = task;
      this.src.then((pdf: any) => {
        this.pageCount = pdf.numPages;
      });
    };
    PDFdocument.viewport = this;
  },
  methods: {
    err(err: any) {
      console.log(err);
    },
    createCanvases(document: PDFdocument) {
      const pageCanvases: Canvas[] = [];
      // setTimeout musi byt, lebo z nejakych dovodov sa to pdfko resizne na co canvas nevie reagovat
      // nepodarilo sa mi vyriesit lepsie
      setTimeout(() => {
        if (document.pageCanvases.length > 0) return;

        const pages = this.$refs.page as Element[];
        const PDFpages = (this.$refs.pdf as Element).children;
        for (var i = 0; i < pages.length; i++) {
          const page = pages[i];
          const canvas = new Canvas(page, document, i);
          const pagePDF = PDFpages[i].querySelector(".page") as HTMLElement;
          const dimensions = {
            width: parseInt(pagePDF.style.width),
            height: parseInt(pagePDF.style.height),
          };
          (PDFpages[i] as HTMLElement).style.width = dimensions.width + "px";
          canvas.setHeight(dimensions?.height);
          canvas.setWidth(dimensions?.width);
          canvas.setScale(dimensions);
          canvas.pageIndex = i;
          pageCanvases.push(canvas);
        }

        document.pageCanvases = pageCanvases;
        document.initCanvases();
        this.$data.loaded = true;
        this.eventHub.$emit("tool:initCurrent");
      }, 50);
    },
    deleteSelected() {
      const doc = getViewedDocument();
      if (doc == null) return;
      for (const cnv of doc.pageCanvases) {
        cnv.deleteSelected();
      }
    },
    moveToFront() {
      // TODO: move active object to front & its annotation to the beginning
      const doc = getViewedDocument();
      const data = doc?.annotations;
      if (data == null) return;
      for (const obj of this.getActiveObjects()) {
        let index = data.findIndex((e) => e.object.name === obj.name);
        obj.canvas?.bringToFront(obj);
        data.push(data.splice(index, 1)[0]);
      }
    },
    moveToBack() {
      // TODO: move active object to back & its annotation to the end
      const doc = getViewedDocument();
      const data = doc?.annotations;
      if (data == null) return;

      for (const obj of this.getActiveObjects()) {
        let index = data.findIndex((e) => e.object.name === obj.name);
        obj.canvas?.sendToBack(obj);
        data.unshift(data.splice(index, 1)[0]);
      }
    },
    documentLoaded(loading: boolean) {
      this.$data.loaded = !loading;
      if (!loading) {
        const document = getViewedDocument();
        if (document) this.createCanvases(document);
      }
    },
    openCtxMenu(e: Event) {
      const doc = getViewedDocument();
      if (doc?.pageCanvases.some((f) => f.canOpenCtxMenu(e))) {
        (this.$refs.ctxMenu as any).open();
      }
      e.preventDefault();
    },
    getActiveObjects() {
      const doc = getViewedDocument();
      var active: fabric.Object[] = [];
      doc?.pageCanvases.forEach((e) => {
        e.getActiveObjects().forEach((f) => active.push(f));
      });
      return active;
    },
    setScale(mult: number) {
      this.$data.scale += mult;
      this.resize();
    },
    resize() {
      setTimeout(() => {
        try {
          const pdf = this.$refs.pdf as HTMLElement;
          const pages = pdf.children;

          for (let i = 0; i < pages.length; i++) {
            const page = pages[i].querySelector(".page") as HTMLElement;
            console.log(page);
            const dimensions = {
              width: parseInt(page.style.width),
              height: parseInt(page.style.height),
            };
            console.log(dimensions);
            (pages[i] as HTMLElement).style.width = dimensions.width + "px";
            if (page) {
              var canvas: Canvas = getViewedDocument()?.pageCanvases[
                i
              ] as Canvas;
              canvas.setWidth(dimensions.width);
              canvas.setHeight(dimensions.height);
              canvas.setScale(dimensions);
            }
          }
        } catch (e) {
          return;
        }
      }, 20);
    },
    async refresh() {
      const viewedDoc = getViewedDocument();
      if (!viewedDoc) return;
      const doc = await Database.getDocument(viewedDoc.id);
      viewedDoc.init(doc.initialPdf);
    },
  },
});
</script>
<style scoped>
.pageAnnot {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  grid-row: 1;
  grid-column: 1;
}
.page-wrapper {
  display: grid;
  margin: 10px;
  transform-origin: center center;
}
.page-data {
  grid-row: 1;
  grid-column: 1;
}
.viewport {
  position: absolute;
  overflow-y: scroll;
  width: 100%;
  max-height: 100%;
  background: silver;
}
.pdf {
  margin: auto;
  max-width: 75vw;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.loadingOverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: -1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.viewportSpace {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>