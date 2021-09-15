<template>
  <li
    style="font-size: 1.3rem"
    :class="{
      'list-group-item-action': !selected,
      active: selected,
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
        <div class="card">
          <div
            v-if="pdf == undefined"
            class="d-flex align-items-center justify-content-center text-danger"
          >
            Nepodarilo sa nacitat preview
          </div>
          <div v-else>
            <pdf
              :key="pdfKey"
              :src="pdf"
              :page="1"
              style="display: inline-block; width: 100%"
            ></pdf>
          </div>
        </div>
      </div>
      <div :class="{ 'col-7': showPDFPreview, 'w-100': !showPDFPreview }">
        <div class="text-left overflow-hidden mw-100">
          <h5 class="d-inline pr-1 mr-2 border-right">
            {{ document.index }}
          </h5>
          <h5 class="d-inline">{{ document.riesitel }}</h5>
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
                  Toto riesenie este nema komentar
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
                  Toto riesenie uz ma napisany komentar
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
        <p class="text-left">
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
        </p>
        <!-- <div class="text-left">
          <div
            v-if="document.opened"
            class="header-text"
            :class="{ 'd-inline': !showPDFPreview }"
          >
            {{ document.index }}. {{ document.riesitel }}
          </div>
          <strong v-else class="header-text"
            >{{ document.index }}. {{ document.riesitel }}</strong
          >
          <div class="d-inline" v-if="document.opened">
            <div v-if="document.scoring" class="points-text d-inline">
              {{ document.scoring.points }}
              <span
                class="material-icons text-success"
                v-if="document.scoring.final"
                >check</span
              >
              <span class="material-icons text-danger" v-else>close</span>
            </div>
            <div v-else class="points-text text-danger d-inline">
              Neobodovane
            </div>
          </div>
          <p>
            <b-badge
              style="background: var(--cyan)"
              class="badge badge-secondary mr-1"
              >{{ document.kategoria }}</b-badge
            >
            
          </p>
        </div> -->
      </div>
    </div>
    <div v-else>
      <b-spinner variant="primary" label="loading..."></b-spinner>
      <p>Loading...</p>
    </div>
  </li>
</template>

<script lang="ts">
import { Database } from "@/Db";
import Color from "color";
import Vue from "vue";
var pdf = require("pdfvuer");
export default Vue.extend({
  components: {
    pdf: pdf.default,
  },
  props: ["documentID", "showPDFPreview"],
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
  },
  mounted() {
    this.eventHub.$on("tags:update", (tags: any) => {
      this.$data.tags = tags;
      this.$data.document.tags = this.$data.document.tags.map((e: any) =>
        tags.find((f: { id: any }) => f.id == e)
      );
    });
    Database.getDocument(this.documentID).then((doc) => {
      this.$data.document = doc;
      this.$data.document.tags = this.$data.document.tags.map((e: any) =>
        this.$data.tags.find((f: { id: any }) => f.id == e)
      );
      setTimeout(() => {
        this.$data.pdf = pdf.createLoadingTask({
          data: new Uint8Array(doc.pdfData),
        });
      }, 500 * doc.index);
    });
    this.eventHub.$on("tags:documentTag", (id: number, tags: any) => {
      if (!this.document || this.documentID != id) return;
      this.$data.document.tags = tags;
    });
  },
  methods: {
    updatePreview() {
      Database.getDocument(this.documentID).then((doc) => {
        this.$data.documentBusy = false;
        this.$data.document.tags = doc.tags.map((e) =>
          this.$data.tags.find((f: { id: any }) => f.id == e)
        );
        this.hasComment = doc.changes.some(
          (f) => f.type === "Text" && !f.data.text.match(/[0-9]*(\.[0-9])?B/)
        );
        this.$data.document.opened = doc.opened;
        this.$data.document.scoring = doc.scoring;
        setTimeout(() => {
          this.$data.pdf = pdf.createLoadingTask({
            data: new Uint8Array(doc.pdfData),
          });
          this.pdfKey = !this.pdfKey;
        }, 30);
      });
    },
    getTagStyle(tag: string) {
      const a = this.tags.find((e: any) => e.id == tag);
      return {
        background: a.color,
        color: Color(a.color).isLight() ? "black" : "white",
      };
    },
  },
});
</script>

<style scoped>
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
.header-text {
  font-size: 1.1rem;
}
.points-text {
  font-size: 1.2rem;
}
h5 {
  font-weight: 900;
  font-size: 1.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.opened h5 {
  font-weight: normal;
}
.opened {
  background-color: rgb(243, 243, 243);
}
.active.opened {
  background-color: #007bff;
}
</style>