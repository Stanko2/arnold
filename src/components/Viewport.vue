<template>
  <div class="viewportSpace">
    <div
      class="viewport"
      @contextmenu="openCtxMenu"
      ref="viewport"
      :style="{
        overflow: wholeDocumentLoaded ? 'auto' : 'hidden',
      }"
    >
      <context-menu
        id="context-menu"
        ref="ctxMenu"
        class="list-group ctxmenu"
      >
        <li
          class="list-group-item-action p-1"
          @click="deleteSelected"
        >
          Zmazať
        </li>
        <li
          class="list-group-item-action p-1"
          @click="moveToFront"
        >
          Presunúť dopredu
        </li>
        <li
          class="list-group-item-action p-1"
          @click="moveToBack"
        >
          Presunúť dozadu
        </li>
        <li
          class="list-group-item-action p-1"
          @click="eventHub.$emit('shortcut:copy')"
        >
          Kopírovať
        </li>
        <li
          v-if="$store.state.Clipboard.object !== null"
          class="list-group-item-action p-1"
          @click="eventHub.$emit('shortcut:paste')"
        >
          Prilepiť
        </li>
        <li
          class="list-group-item-action p-1"
          @click="eventHub.$emit('shortcut:cut')"
        >
          Vystrihnúť
        </li>
      </context-menu>
      
      <div
        ref="pdf"
        class="pdf"
      >
        <div
          v-for="i in pageCount"
          :key="i"
          ref="pages"
          v-b-visible="(visible) => changeActivePage(i, visible)"
          class="page-wrapper"
          :style="getPageStyle(i - 1)"
        >
          <canvas 
            ref="pdfCanvas"
            class="pdfCanvas"
          />
          <div class="pageAnnot">
            <canvas ref="canvases" />
          </div>
        </div>
      </div>
      <div class="loading" v-if="!wholeDocumentLoaded">
        <div>
          <b-spinner
            variant="primary"
            label="loading..."
          />
          <p>Načítavam...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// const pdf = require("pdfvuer");
import { Canvas } from "../Canvas";
import { PDFdocument } from "./PDFdocument";
import { getViewedDocument } from "@/Documents/DocumentManager";
import Vue from "vue";
import Component from "vue-class-component";
import pdfjs from "@bundled-es-modules/pdfjs-dist/build/pdf";
// @ts-ignore
import contextMenu from "vue-context-menu";

var pdfDocument = null;

@Component({
  components: {
    // pdf: pdf.default,
    contextMenu,
  },
})
export default class Viewport extends Vue {
  loaded: (boolean | null)[] = [];
  wholeDocumentLoaded: boolean = false;
  src: ArrayBuffer | null = null;
  pageCount: number = 0;
  rotation: number[] = [];
  activePage: number = 0;
  static scale: number = 1;
  id: number = -1;
  pageDimensions: { width: number, height: number }[] = []

  $refs!: {
    pages: HTMLElement[];
    pagePDFs: Vue[];
    canvases: HTMLCanvasElement[];
    ctxMenu: typeof contextMenu;
    pdfCanvas: HTMLCanvasElement[];
    viewport: HTMLElement;
  }

  get allPagesLoaded(): boolean {
    return this.loaded.every(e => e) && this.loaded.length > 0;
  }

  init() {
    pdfDocument = getViewedDocument();
    // this.src = pdfDocument?.viewref;
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
    this.eventHub.$on("viewport:refresh", (src: ArrayBuffer) => {
      this.src = src;
      this.refresh();
    });
    this.eventHub.$on("shortcut:zoomIn", () => this.setScale(1));
    this.eventHub.$on("shortcut:zoomOut", () => this.setScale(-1));
    this.eventHub.$on("shortcut:delete", this.deleteSelected);
    this.eventHub.$on("canvas:error", this.showError);
    window.addEventListener("resize", this.resize);
    PDFdocument.initDocument = async (task: ArrayBuffer) => {
      if (this.allPagesLoaded) return;
      this.src = task;
      const src = new ArrayBuffer(task.byteLength);
      new Uint8Array(src).set(new Uint8Array(task));

      const pdfDoc = await pdfjs.getDocument(src).promise
      this.pageCount = pdfDoc.numPages;
      this.loaded = Array<boolean>(this.pageCount).fill(false);
      const pagePromise = [];
      for (let i = 0; i < this.pageCount; i++) {
        const page = await pdfDoc.getPage(i + 1);
        const viewport = page.getViewport({ scale: Viewport.scale });
        const width = viewport.width;
        const height = viewport.height;
        const canvas = this.$refs.pdfCanvas[i];
        canvas.width = width;
        canvas.height = height;
        this.pageDimensions.push({ width, height });
        await this.$nextTick();

        pagePromise.push(page.render({
          canvasContext: this.$refs.pdfCanvas[i].getContext('2d')!,
          viewport,
        }).promise.then(() => {
          this.documentLoaded(true, i);
        }))
      }        
      await Promise.all(pagePromise);
      await pdfDoc.destroy();
      this.wholeDocumentLoaded = true;
    };
    PDFdocument.viewport = this;
  }
  showError(err: Error) {
    this.$bvToast.toast(`${err.message}`, {
      variant: 'danger',
      title: "Chyba pri pridaní objektu",
      autoHideDelay: 1000
    })
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
    for (var i = 0; i < this.pageCount; i++) {
      const page = this.$refs.canvases[i];
      const canvas = new Canvas(page, document, i);
      const pagePDF = this.$refs.pdfCanvas[i];
      const dimensions = {
        width: pagePDF.width,
        height: pagePDF.height,
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
    document.initCanvases();
    this.eventHub.$emit("tool:initCurrent");
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
    this.loaded[idx] = loading;
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
    Viewport.scale = mult;
    this.$nextTick().then(() => {
      this.resize();
    })
  }
  
  resize() {
    try {
      this.refresh().then(()=> {
        const pages = this.$refs.pages;
        for (let i = 0; i < pages.length; i++) {
          const page = this.$refs.pages[i];
          const dimensions = {
            width: page.clientWidth,
            height: page.clientHeight
          };
          if (dimensions.width === 0 || dimensions.height === 0) return;
          if (page) {
            var canvas: Canvas = getViewedDocument()?.pageCanvases[i] as Canvas;
            canvas.setWidth(dimensions.width);
            canvas.setHeight(dimensions.height);
            canvas.setScale(dimensions);
          }
        }
      });
    } catch (e) {
      console.error(e);
      return;
    }
  }
  async refresh() {
    this.$refs.viewport.scrollTo(0, 0);
    this.wholeDocumentLoaded = false;
    const src = new ArrayBuffer(this.src!.byteLength);
    new Uint8Array(src).set(new Uint8Array(this.src!));


    const pdfDoc = await pdfjs.getDocument(src).promise
    this.pageCount = pdfDoc.numPages;
    this.loaded = Array<boolean>(this.pageCount).fill(false);
    const pagePromise = [];
    this.pageDimensions = [];
    for (let i = 0; i < this.pageCount; i++) {
      const page = await pdfDoc.getPage(i + 1);
      const viewport = page.getViewport({ scale: Viewport.scale });
      const width = viewport.width;
      const height = viewport.height;
      const canvas = this.$refs.pdfCanvas[i];
      canvas.width = width;
      canvas.height = height;

      this.pageDimensions.push({ width, height });
      await this.$nextTick();

      pagePromise.push(page.render({
        canvasContext: this.$refs.pdfCanvas[i].getContext('2d')!,
        viewport,
      }).promise.then(() => {
        this.documentLoaded(true, i);
      }))
    }        
    await Promise.all(pagePromise);
    await pdfDoc.destroy();
    this.wholeDocumentLoaded = true;
  }

  getPageStyle(idx: number) {
    if (this.pageDimensions.length === this.pageCount) {
      return {
        width: this.pageDimensions[idx].width.toString() + 'px',
        height: this.pageDimensions[idx].height.toString() + 'px'
      }
    }
    return {}
  }
}
</script>
<style scoped lang="scss">
.pageAnnot {
  position: relative;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.page-wrapper {
  position: relative;
  margin: 20px;
  transform-origin: center center;
  box-shadow: 0 0 20px rgb(0 0 0 / 50%);
}
.page-data {
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.1);
}
.viewport {
  position: absolute;
  overflow: auto;
  width: 100%;
  max-height: 100%;
  height: 100%;
  background: var(--bg-800);
}
.pdf {
  margin: auto;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: max-content;
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
.pdfCanvas {
  transform-origin: left top;
  position: absolute;
  top: 0;
  left: 0;
  width:100%;
}

.loading {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items:center;
  background: var(--bg-800);
  z-index: 80;
  top: 0;
}
</style>