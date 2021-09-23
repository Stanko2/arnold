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
        <div
          v-for="i in pageCount"
          :key="i"
          class="page-wrapper"
          v-b-visible="(visible) => changeActivePage(i, visible)"
        >
          <pdf
            :key="i.toString() + id.toString()"
            :src="src"
            :page="i"
            :scale.sync="scale"
            :rotate="(rotation[i - 1] || 0) * 90"
            :text="false"
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
  loaded: boolean = false;
  src: any;
  pageCount: number = 0;
  rotation: number[] = [];
  activePage: number = 0;
  scale: number = 1;

  data() {
    pdfDocument = getViewedDocument();
    return {
      src: pdfDocument?.viewref,
      pageCount: pdfDocument?.pageCount,
      id: pdfDocument?.id,
      pagesLoaded: 0,
      loaded: false,
      scale: 1,
      rotation: Array<number>(pdfDocument?.pageCount || 0).map(() => 0),
      activePage: 0,
    };
  }
  activated() {
    const doc = getViewedDocument();
    if (doc) {
      this.createCanvases(doc);
    }
  }
  deactivated() {
    const doc = getViewedDocument();
    doc?.pageCanvases.forEach((e) => e.dispose());
  }
  mounted() {
    this.eventHub.$on("viewport:scale", this.setScale);
    this.eventHub.$on("viewport:rotate", this.rotate);
    window.addEventListener("resize", this.resize);
    PDFdocument.initDocument = (task: any) => {
      this.loaded = false;
      if (task) this.src = task;
      this.src.then((pdf: any) => {
        this.pageCount = pdf.numPages;
        this.rotation = Array<number>(pdf.numPages).fill(0);
        // console.log(this.rotation);
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
      this.loaded = true;
      this.eventHub.$emit("tool:initCurrent");
    }, 50);
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
  documentLoaded(loading: boolean) {
    this.loaded = !loading;
    if (!loading) {
      const document = getViewedDocument();
      if (document) this.createCanvases(document);
    }
  }
  openCtxMenu(e: Event) {
    const doc = getViewedDocument();
    if (doc?.pageCanvases.some((f) => f.canOpenCtxMenu(e))) {
      (this.$refs.ctxMenu as any).open();
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
    this.resize();
  }
  resize() {
    setTimeout(() => {
      try {
        const pdf = this.$refs.pdf as HTMLElement;
        const pages = pdf.children;

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i].querySelector(".page") as HTMLElement;
          // console.log(page);
          const dimensions = {
            width: parseInt(page.style.width),
            height: parseInt(page.style.height),
          };
          // console.log(dimensions);
          (pages[i] as HTMLElement).style.width = dimensions.width + "px";
          if (page) {
            var canvas: Canvas = getViewedDocument()?.pageCanvases[i] as Canvas;
            canvas.setWidth(dimensions.width);
            canvas.setHeight(dimensions.height);
            canvas.setScale(dimensions);
          }
        }
      } catch (e) {
        return;
      }
    }, 20);
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
    // console.log(this.rotation);
    // console.log(this.activePage);
    // this.rotation[this.activePage]++;
    // const canvas = doc?.pageCanvases[this.activePage];
    // canvas?.Rotate(90);
    // canvas?.setDimensions({
    //   width: canvas.getHeight(),
    //   height: canvas.getWidth(),
    // });
    // this.$forceUpdate();
  }
}
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