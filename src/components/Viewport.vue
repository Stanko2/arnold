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
        <div v-for="i in pageCount" :key="i" class="page">
          <pdf
            :key="i.toString() + id.toString()"
            :src="src"
            :page="i"
            class="card page-data"
            @error="err"
            @loaded="documentLoaded"
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
var pdf = require("vue-pdf").default;
import { Canvas } from "../Canvas";
import { PDFdocument } from "./PDFdocument";
import { getViewedDocument } from "@/DocumentManager";
import { eventHub } from "./Tools/Tool";
import Vue from "vue";
import { Database } from "@/Db";
const contextMenu = require("vue-context-menu");

var pdfDocument = null;

export default Vue.extend({
  props: ["pdf"],
  components: {
    pdf,
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
    window.addEventListener("resize", () => {
      this.refresh();
      setTimeout(() => {
        try {
          const size = (this.$refs.pdf as Element).getBoundingClientRect();
          const pages = this.$refs.page as HTMLElement[];
          for (let i = 0; i < pages.length; i++) {
            const page = pages[i].getBoundingClientRect();

            var canvas: Canvas = getViewedDocument()?.pageCanvases[i] as Canvas;
            canvas.setWidth(size.width);
            canvas.setHeight(page.height);
            canvas.setScale(size);
          }
        } catch (e) {
          return;
        }
      }, 100);
    });
    PDFdocument.initDocument = (task: any) => {
      this.$data.loaded = false;
      if (task) this.src = task;
      this.src.promise.then((pdf: any) => {
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
        var dimensions: DOMRect | undefined = (
          this.$refs.page as Element[]
        )[0]?.parentElement?.parentElement?.getBoundingClientRect();
        if (document.pageCanvases.length > 0) return;

        const pages = this.$refs.page as Element[];
        for (var i = 0; i < pages.length; i++) {
          const page = pages[i];
          const canvas = new Canvas(page, document, i);
          if (dimensions != null) {
            canvas.setHeight(dimensions?.height);
            canvas.setWidth(dimensions?.width);
            canvas.setScale(dimensions);
          }

          canvas.pageIndex = i;
          pageCanvases.push(canvas);
        }

        document.pageCanvases = pageCanvases;
        document.initCanvases();
        this.$data.loaded = true;
        eventHub.$emit("initCurrent");
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
    documentLoaded() {
      this.$data.loaded = true;
      const document = getViewedDocument();
      if (document) this.createCanvases(document);
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
    async refresh() {
      const viewedDoc = getViewedDocument();
      if (!viewedDoc) return;
      const doc = await Database.getDocument(viewedDoc.id);
      viewedDoc.init(doc.pdfData);
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
.page {
  display: grid;
  margin: 10px;
  transform-origin: top left;
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
  max-width: 70vw;
}
.loadingOverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 100;
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