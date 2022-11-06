<template>
  <div class="viewportSpace">
    <div class="loadingOverlay" v-if="!loaded">
      <div>
        <b-spinner variant="primary" label="loading..."></b-spinner>
        <p>Načítavam...</p>
      </div>
    </div>

    <div class="viewport" @contextmenu="openCtxMenu">
      <context-menu
        id="context-menu"
        ref="ctxMenu"
        class="list-group ctxmenu"
      >
        <li class="list-group-item-action p-1" @click="deleteSelected">
          Zmazať
        </li>
        <li class="list-group-item-action p-1" @click="moveToFront">
          Presunúť dopredu
        </li>
        <li class="list-group-item-action p-1" @click="moveToBack">
          Presunúť dozadu
        </li>
        <li class="list-group-item-action p-1" @click="eventHub.$emit('shortcut:copy')">
          Kopírovať
        </li>
        <li class="list-group-item-action p-1" @click="eventHub.$emit('shortcut:paste')" v-if="$store.state.Clipboard.object !== null">
          Prilepiť
        </li>
        <li class="list-group-item-action p-1" @click="eventHub.$emit('shortcut:cut')">
          Vystrihnúť
        </li>
      </context-menu>
      <div class="pdf" ref="pdf">
        <div
          v-for="i in pageCount"
          :key="i"
          class="page-wrapper"
          ref="pages"
          v-b-visible="(visible) => changeActivePage(i, visible)"
          :style="getPageStyle(i - 1)"
        >
          <pdf
              :key="i.toString() + id.toString()"
              :src="src"
              :page="i"
              :rotate="(rotation[i - 1] || 0) * 90"
              :text="false"
              class="card page-data"
              :style="{ transform: `translate(-50%, -50%) scale(${scale})` }"
              ref="pagePDFs"
              @error="err"
              @loading="(loading) => documentLoaded(!loading, i - 1)"
            >
            <!-- <template #loading>
              <b-skeleton-img width="100%" height="100%" class="position-relative"/>
              <div>loading</div>
            </template> -->
          </pdf>
            <div class="pageAnnot">
              <canvas ref="canvases"></canvas>
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
import { getViewedDocument } from "@/Documents/DocumentManager";
import Vue from "vue";
import { Database } from "@/Db";
import Component from "vue-class-component";
const contextMenu = require("vue-context-menu");

var pdfDocument = null;

const ViewportProps = Vue.extend({
  props: ["pdf"],
});
@Component({
  components: {
    pdf: pdf.default,
    contextMenu,
  },
})
export default class Viewport extends ViewportProps {
  loaded: (boolean | null)[] = [];
  src: any;
  pageCount: number = 0;
  rotation: number[] = [];
  activePage: number = 0;
  scale: number = 1;
  id: number = -1;
  pageDimensions: { width: number, height: number }[] = []

  $refs!: {
    pages: HTMLElement[];
    pagePDFs: Vue[];
    canvases: HTMLCanvasElement[];
    ctxMenu: typeof contextMenu;
  }

  get allPagesLoaded(): boolean {
    return this.loaded.every(e => e) && this.loaded.length > 0;
  }

  init() {
    pdfDocument = getViewedDocument();
    this.src = pdfDocument?.viewref;
    this.pageCount = pdfDocument?.pageCount || 0;
    this.loaded = Array<boolean | null>(this.pageCount).fill(null);
    this.id = pdfDocument?.id || 0;
    this.rotation = Array<number>(pdfDocument?.pageCount || 0).fill(0);
  }
  activated() {
    const doc = getViewedDocument();
    if (doc && doc.pageCanvases.length === 0 && this.allPagesLoaded) {
      this.createCanvases(doc);
    }
  }
  deactivated() {
    const doc = getViewedDocument();
    this.pageDimensions = [];
    doc?.pageCanvases.forEach((e) => e.dispose());
    if (doc)
      doc.pageCanvases = [];
  }
  mounted() {
    this.init();
    this.eventHub.$on("viewport:scale", this.setScale);
    this.eventHub.$on("viewport:rotate", this.rotate);
    this.eventHub.$on("shortcut:zoomIn", () => this.setScale(0.1));
    this.eventHub.$on("shortcut:zoomOut", () => this.setScale(-0.1));
    this.eventHub.$on("shortcut:delete", this.deleteSelected);
    window.addEventListener("resize", this.resize);
    PDFdocument.initDocument = (task: any) => {
      if (this.allPagesLoaded) return;
      if (task) this.src = task;
      this.src.then((pdf: any) => {
        this.pageCount = pdf.numPages;
        this.loaded = Array<boolean>(this.pageCount).fill(false);
        this.rotation = Array<number>(pdf.numPages).fill(0);
      });
    };
    PDFdocument.viewport = this;
  }
  err(err: any) {
    console.log(err);
  }
  changeActivePage(i: number, visible: boolean) {
    if (!visible) return;
    this.activePage = i - 1;
  }
  createCanvases(document: PDFdocument) {
    if (this.pageCount === 0) return;
    if (document.pageCanvases.length > 0) return;

    const pageCanvases: Canvas[] = [];
    this.pageDimensions = [];
    const PDFpages = this.$refs.pagePDFs;
    // TODO: loading scaled canvases not working properly
    for (var i = 0; i < this.pageCount; i++) {
      const page = this.$refs.canvases[i];
      const canvas = new Canvas(page, document, i);
      const pagePDF = PDFpages[i];
      const dimensions = {
        width: pagePDF.$el.clientWidth,
        height: pagePDF.$el.clientHeight,
      };
      if (!dimensions) continue;
      this.pageDimensions.push(dimensions);
      canvas.setHeight(dimensions.height);
      canvas.setWidth(dimensions.width);
      canvas.setScale(dimensions);
      canvas.pageIndex = i;
      pageCanvases.push(canvas);
    }

    document.pageCanvases = pageCanvases;
    document.initCanvases(() => {
      // this is a hack to force canvas to update after annotations are loaded
      // without it signs and images are either invisible or behave weirdly or both
      // TODO: find a better solution
      let runs = 0;
      let timer = setInterval(() => {
        if (runs > 9) {
          // only works if annotations are loaded and they might not be immediately, so we try 10 times
          // reaches up to 5 seconds, by then it's probably safe to assume that annotations were loaded at some point and this function succeeded
          clearInterval(timer);
          return;
        }
        console.log("after init resize call", runs);
        this.$nextTick().then(() => {
          this.resize();
        })
        runs++;
      }, 500);
    });

    this.eventHub.$emit("tool:initCurrent");
    if (this.scale !== 1) {
      this.resize();
    }
  }
  deleteSelected() {
    const doc = getViewedDocument();
    if (doc == null) return;
    for (const cnv of doc.pageCanvases) {
      cnv.deleteSelected();
    }
  }
  moveToFront() {
    const doc = getViewedDocument();
    const data = doc?.annotations;
    if (data == null) return;

    for (const obj of this.getActiveObjects()) {
      let index = data.findIndex((e) => e.object.name === obj.name);
      obj.canvas?.bringToFront(obj);
      data.push(data.splice(index, 1)[0]);
    }
  }
  moveToBack() {
    const doc = getViewedDocument();
    const data = doc?.annotations;
    if (data == null) return;

    for (const obj of this.getActiveObjects()) {
      let index = data.findIndex((e) => e.object.name === obj.name);
      obj.canvas?.sendToBack(obj);
      data.unshift(data.splice(index, 1)[0]);
    }
  }
  documentLoaded(loading: boolean, idx: number) {
    console.log({ loading, idx });
    this.loaded[idx] = loading;
    console.log(this.loaded.every(e => e) && this.loaded.length > 0);
    if (this.loaded.every(e => e) && this.loaded.length > 0) {
      const document = getViewedDocument();
      if (document) this.createCanvases(document);
    }
  }
  openCtxMenu(e: Event) {
    const doc = getViewedDocument();
    if (doc?.pageCanvases.some((f) => f.canOpenCtxMenu(e))) {
      this.$refs.ctxMenu.open();
    }
    e.preventDefault();
  }
  getActiveObjects() {
    const doc = getViewedDocument();
    var active: fabric.Object[] = [];
    doc?.pageCanvases.forEach((e) => {
      e.getActiveObjects().forEach((f) => active.push(f));
    });
    return active;
  }
  setScale(mult: number) {
    this.scale += mult;
    this.$nextTick().then(() => {
      this.resize();
    })
  }
  resize() {
    try {
      const pages = this.$refs.pages;

      for (let i = 0; i < pages.length; i++) {
        const page = this.$refs.pages[i];
        const dimensions = {
          width: page.clientWidth,
          height: page.clientHeight
        };
        if (dimensions.width === 0 || dimensions.height === 0) return;
        console.log(dimensions);
        (pages[i] as HTMLElement).style.width = dimensions.width + "px";
        if (page) {
          var canvas: Canvas = getViewedDocument()?.pageCanvases[i] as Canvas;
          canvas.setWidth(dimensions.width);
          canvas.setHeight(dimensions.height);
          canvas.setScale(dimensions);
        }
      }
    } catch (e) {
      console.error(e);
      return;
    }
  }
  async refresh() {
    const viewedDoc = getViewedDocument();
    if (!viewedDoc) return;
    const doc = await Database.getDocument(viewedDoc.id);
    viewedDoc.init(doc.initialPdf);
  }
  rotate() {
    const doc = getViewedDocument();
    doc?.rotatePage(this.activePage);
    this.$destroy();
    // this.eventHub.$emit("editor:setDocument");
    // this.rotation[this.activePage]++;
    // const canvas = doc?.pageCanvases[this.activePage];
    // canvas?.Rotate(90);
    // canvas?.setDimensions({
    //   width: canvas.getHeight(),
    //   height: canvas.getWidth(),
    // });
    // this.$forceUpdate();
  }

  getPageStyle(idx: number) {
    if (this.pageDimensions.length === this.pageCount) {
      return {
        width: (this.pageDimensions[idx].width * this.scale).toString() + 'px',
        height: (this.pageDimensions[idx].height * this.scale).toString() + 'px'
      }
    }
    return {}
  }
}
</script>
<style scoped lang="scss">
.pageAnnot {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.page-wrapper {
  position: relative;
  margin: 10px;
  transform-origin: center center;
  box-shadow: 0 0 20px rgb(0 0 0 / 50%);
  overflow: hidden;
}
.page-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.1);
}
.viewport {
  position: absolute;
  overflow-y: auto;
  width: 100%;
  max-height: 100%;
  height: 100%;
  background: var(--bg-800);
}
.pdf {
  margin: auto;
  max-width: 95vw;
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
.ctxmenu{
  background: var(--bg-800) !important;
  color: var(--bg-100) !important;
  ul {
    bottom: auto;
  }
}
</style>