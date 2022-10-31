<template>
  <li
    class="list-group-item"        
    :class="{
      'list-group-item-action': !selected,
      selected: selected,
      opened: document && document.opened,
    }"
  >
    <div
      v-if="document != null"
      :class="{
        row: showPDFPreview,
        'w-100': !showPDFPreview,
      }"
    >
      <b-overlay :show="documentBusy" no-wrap> </b-overlay>
      <div class="col-5" v-if="showPDFPreview">
        <b-card body-class="p-0">
          <b-skeleton-wrapper :loading="pdfUrl == null">
            <template #loading>
              <b-skeleton-img card-img="top"></b-skeleton-img>
            </template>
            <img :src="pdfUrl" alt="preview" />
          </b-skeleton-wrapper>
        </b-card>
      </div>
      <div :class="{ 'col-7': showPDFPreview, 'w-100': !showPDFPreview }">
        <div class="text-left overflow-hidden mw-100" :id="documentID + 'name'">
          <h5 class="d-inline pr-1 mr-2 border-right">
            {{ index }}
          </h5>
          <h5 class="d-inline">
            {{ document.riesitel }}
          </h5>
          <b-popover
            triggers="hover"
            :target="documentID + 'name'"
            placement="top"
            >{{ document.riesitel }}</b-popover
          >
        </div>
        <div class="p-3 grid">
          <b-row class="border-bottom">
            <b-col class="border-right">
              <b-badge
                style="background: var(--cyan)"
                class="badge badge-secondary mr-1"
                >{{ document.kategoria }}</b-badge
              >
            </b-col>
            <b-col>
              <div v-if="!hasComment">
                <span
                  :id="'commentNotDone' + document.id"
                  class="material-icons"
                  :class="{
                    'text-danger': document.scoring && document.scoring.final,
                  }"
                  >chat_bubble_outline</span
                >
                <b-tooltip
                  :target="'commentNotDone' + document.id"
                  triggers="hover"
                >
                  Toto riesenie ešte nemá komentár
                </b-tooltip>
              </div>
              <div v-else>
                <span class="material-icons" :id="'commentDone' + document.id"
                  >chat</span
                >
                <b-tooltip
                  :target="'commentDone' + document.id"
                  triggers="hover"
                >
                  Toto riesenie už má napísaný komentár
                </b-tooltip>
              </div>
            </b-col>
          </b-row>
          <b-row>
            <b-col class="border-right">
              <div v-if="document.scoring">{{ document.scoring.points }}B</div>
              <div v-else>?B</div>
            </b-col>
            <b-col
              ><div v-if="document.scoring" class="points-text d-inline">
                <span
                  class="material-icons text-success"
                  v-if="document.scoring.final"
                  >check</span
                >
                <span class="material-icons text-danger" v-else>close</span>
              </div>
              <div v-else class="points-text text-danger d-inline">
                <span class="material-icons text-danger">close</span>
              </div></b-col
            >
          </b-row>
        </div>
        <div cols="8" class="text-left">
          <transition-group name="tags">
            <b-badge
              v-for="tag in document.tags"
              :key="tag.id"
              :style="getTagStyle(tag.id)"
              style="transition: 500ms"
              class="m-1"
              >{{ tag.meno }}</b-badge
            >
          </transition-group>
        </div>
        <div class="stopwatch" v-if="showTimer && document.opened">
          <span>{{ stopwatchText }}</span
          ><span class="material-icons">hourglass_empty</span>
        </div>
      </div>
    </div>
    <div v-else>
      <b-spinner variant="primary" label="Načítavam..."></b-spinner>
      <p>Načítavam...</p>
    </div>
  </li>
</template>

<script lang="ts">
import { Database } from "@/Db";
import Color from "color";
import Vue from "vue";
import type { Document, Tag } from "@/@types";
import Component from "vue-class-component";
import { getDocument } from "pdfjs-dist";
import { Prop } from "vue-property-decorator";

@Component
export default class DocumentPreview extends Vue {
  @Prop() showTimer!: boolean;
  @Prop() documentID!: number;
  @Prop() showPDFPreview!: boolean;
  @Prop() index!: number;
  document: Document | undefined;
  hasComment: boolean = false;
  documentBusy: boolean = false;
  pdfKey: boolean = false;
  tags: Tag[] = [];
  pdf: any;
  pdfUrl: string | null = null;
  selected: boolean = false;
  stopwatchText: string = "0:00:00";

  data() {
    return {
      document: undefined,
      pdf: null,
      selected: false,
      documentBusy: false,
      hasComment: false,
      pdfKey: false,
      tags: JSON.parse(localStorage.getItem("tags") || "[]"),
    };
  }
  mounted() {
    this.$store.subscribe((mutation) => {
      if (mutation.type === 'updateDocument' && mutation.payload.id == this.documentID) {
        this.updatePreview();
      }
    })
    this.eventHub.$on("tags:update", (tags: any) => {
      this.tags = tags;
      if (!this.document) return;
      this.document.tags = this.document.tags.map((e: any) =>
        tags.find((f: { id: any }) => f.id == e)
      );
    });
    Database.getDocument(this.documentID).then((doc) => {
      this.document = doc;
      this.document.tags = this.document.tags.map((e: any) =>
        this.tags.find((f: { id: any }) => f.id == e)
      );
      this.hasComment = doc.changes.some(
        (f) => f.type === "Text" && f.data.hasControls
      );
      this.updateStopwatch(doc.timeOpened);
      setTimeout(() => {
        this.generatePreview(doc.pdfData);
      }, 1000 * this.index);
    });
    this.eventHub.$on("tags:documentTag", (id: number, tags: any) => {
      if (!this.document || this.documentID != id) return;
      this.document.tags = tags;
    });
  }
  updatePreview() {
    Database.getDocument(this.documentID).then((doc) => {
      this.documentBusy = false;
      if (!this.document) return;
      this.document.tags = doc.tags.map((e) =>
        this.tags.find((f: { id: any }) => f.id == e)
      );
      this.hasComment = doc.changes.some(
        (f) => f.type === "Text" && f.data.hasControls
      );
      this.document.opened = doc.opened;
      this.document.scoring = doc.scoring;
      setTimeout(() => {
        // this.pdf = pdf.createLoadingTask({
        //   data: new Uint8Array(doc.pdfData),
        // });
        this.generatePreview(doc.pdfData);
        this.pdfKey = !this.pdfKey;
      }, 30);
    });
  }
  getTagStyle(tag: string) {
    const a = this.tags.find((e: any) => e.id == tag);
    return {
      background: a?.color,
      color: Color(a?.color).isLight() ? "black" : "white",
    };
  }
  updateStopwatch(timeOpened: number) {
    const date = new Date(timeOpened);
    const f = function (func: () => number) {
      const res = func();
      if (res < 10) {
        return "0" + res.toString();
      }
      return res.toString();
    };
    this.stopwatchText = `${date.getHours() - 1}:${f(() =>
      date.getMinutes()
    )}:${f(() => date.getSeconds())}`;
  }

  async generatePreview(data: ArrayBuffer) {
    const doc = await getDocument({ data: new Uint8Array(data) }).promise;
    const page = await doc.getPage(1);
    const vp = page.getViewport({ scale: 1 });
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = (vp.height / vp.width) * 100;
    const scale = Math.min(canvas.width / vp.width, canvas.height / vp.height);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      await page.render({
        canvasContext: ctx,
        viewport: page.getViewport({ scale }),
      }).promise;
      this.pdfUrl = canvas.toDataURL();
    }
  }
}
</script>

<style scoped lang="scss">
  @import '../theme.scss';
.tags-leave-active {
  animation: bounce-in 500ms reverse;
}
.tags-enter-active {
  animation: bounce-in 500ms;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
.points-text {
  font-size: 1.2rem;
}

.stopwatch {
  position: absolute;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.list-group-item{
  background-color: var(--bg-700) !important;
  color: var(--body-color) !important;
  transition: all 100ms linear;

  h5 {
    font-weight: 900;
    font-size: 1.3rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &.selected{
    background-color: var(--primary) !important;
    color: var(--bg-700) !important;
    &:hover {
      background-color: var(--primary) !important;
      color: var(--bg-700) !important;
    }
  }
  &:hover {
    box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.1);
    background-color: var(--bg-500) !important;
  }
  &.list-group-item-action{

    &.opened{
  
      background-color: var(--bg-600) !important;
      color: var(--bg-200) !important;
      &:hover {
        background-color: var(--bg-500) !important;
        color: var(--bg-100) !important;
      }
      h5 {
        font-weight: normal;
      }
    }
  }
  .card {
    background-color: var(--bg-800);
    img {
      border-radius: 0.3rem;
    }
  }
}
</style>