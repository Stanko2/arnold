<template>
  <div class="tags">
    <div class="position-relative">
      <h4 class="btn btn-warning" @click="ukazMenu = !ukazMenu">
        Kategorie
        <span class="material-icons d-inline position-absolute">{{
          ukazMenu ? "expand_more" : "expand_less"
        }}</span>
      </h4>
      <transition name="slide">
        <div v-if="ukazMenu" class="tagy_okno bg-warning">
          <div class="d-flex flex-wrap" v-if="doc">
            <h6
              v-for="tag in dostupneTagy"
              :key="tag.id"
              class="m-1"
              @click="toggleDocumentTag(tag.meno)"
            >
              <b-badge
                size="lg"
                :style="{
                  background: tag.color,
                  color: getContrastColor(tag.color),
                  opacity:
                    doc.tags.findIndex((e) => e == tag.meno) == -1 ? 0.5 : 1,
                }"
              >
                {{ tag.meno }}
              </b-badge>
            </h6>
          </div>
          <b-button class="m-2 d-block" variant="secondary" v-b-modal.tag-modal
            >Upravit kategorie</b-button
          >
        </div>
      </transition>
      <b-modal
        size="lg"
        id="tag-modal"
        title="Upravit kategorie"
        @ok="updateTagov"
      >
        <b-list-group>
          <b-list-group-item
            pill
            v-for="(tag, i) in dostupneTagy"
            :key="tag.id"
            class="d-flex flex-row align-items-center justify-content-between"
            :style="{ background: lighten(tag.color) }"
          >
            <b-input-group class="mr-3 d-flex align-items-center">
              <b-form-input
                class="w-75 tag-edit"
                type="text"
                v-model="tag.meno"
                placeholder="Zadaj meno kategorie"
                :style="{ color: getContrastColor(tag.color) }"
              />
              <b-input-group-append>
                <v-swatches v-model="tag.color" />
              </b-input-group-append>
            </b-input-group>
            <b-btn-close @click="removeTag(i)"></b-btn-close>
          </b-list-group-item>
        </b-list-group>
        <b-button block @click="pridajTag()">Pridat novu kategoriu</b-button>
      </b-modal>
    </div>
  </div>
</template>

<script lang="ts">
import { Database } from "@/Db";
// eslint-disable-next-line no-unused-vars
import { Document, eventHub as DocEventHub } from "@/DocumentManager";
import Color from "color";
import Vue from "vue";
// eslint-disable-next-line no-unused-vars
import { PDFdocument } from "./PDFdocument";
const VSwatches = require("vue-swatches");
export default Vue.extend({
  components: {
    VSwatches,
  },
  mounted() {
    this.$data.dostupneTagy = JSON.parse(localStorage.getItem("tags") || "[]");
    DocEventHub.$on("documentChanged", (pdf: any, document: Document) => {
      this.$data.doc = document;
      const tagy = this.dostupneTagy.map((e: any) => e.meno);
      let i = 0;
      while (i < document.tags.length) {
        const tag = document.tags[i];
        if (tagy.find((e) => e == tag) == undefined) {
          document.tags.splice(i, 1);
        } else i++;
      }
      Database.updateDocument(document.id, document);
    });
  },
  data() {
    return {
      ukazMenu: false,
      dostupneTagy: [],
      doc: undefined,
    };
  },
  methods: {
    updateTagov() {
      localStorage.setItem("tags", JSON.stringify(this.$data.dostupneTagy));
    },
    pridajTag() {
      this.$data.dostupneTagy.push({
        id: Math.random().toString(36).substr(2, 9),
        meno: "",
        color: "blue",
      });
    },
    zistiTagy(doc: Document) {
      this.$data.doc = doc;
    },
    removeTag(i: number) {
      this.dostupneTagy.splice(i, 1);
    },
    lighten(color: string) {
      const c = new Color(color);
      return c.lighten(0.5).hex();
    },
    getContrastColor(color: string) {
      const c = new Color(color);
      return c.isDark() ? "#ffffff" : "#000000";
    },
    toggleDocumentTag(tag: string) {
      const a = this.$data.doc.tags.findIndex((e: string) => e == tag);
      if (a != -1) {
        this.$data.doc.tags.splice(a, 1);
      } else {
        this.$data.doc.tags.push(tag);
      }
      this.$data.doc.tags.sort();
      Database.updateDocument(this.$data.doc.id, this.$data.doc);
    },
  },
});
</script>

<style scoped>
.tags {
  position: fixed;
  right: 0;
  top: 60%;
  color: whitesmoke;
  border-radius: 0 25px;
  transition: all 0.3s;
}
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.tags h4 {
  position: absolute;
  transform: rotate(-90deg) translate(-60%, 0);
  transform-origin: bottom left;
  height: 48px;
  border-radius: 10px 10px 0 0;
  top: 0;
  left: 0;
  margin-bottom: 0;
  padding-right: 28px;
}
.tags .tagy_okno {
  width: 300px;
  padding: 15px;
}
.tag-edit {
  background: transparent;
  border: none;
}
h6 {
  cursor: pointer;
  user-select: none;
}
/* .slide-leave-active,
.slide-enter-active {
  transition: 1s;
}
.slide-enter {
  transform: translate(100%, 0);
}
.slide-leave-to {
  transform: translate(100%, 0);
} */
</style>