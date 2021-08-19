<template>
  <li
    :class="{
      'list-group-item-action': !selected,
      active: selected,
    }"
  >
    <div v-if="document != null" class="row">
      <b-overlay :show="documentBusy" no-wrap> </b-overlay>
      <div class="col-5">
        <div class="card">
          <div
            v-if="pdf == undefined"
            class="d-flex align-items-center justify-content-center text-danger"
          >
            Nepodarilo sa nacitat preview
          </div>
          <div v-else>
            <pdf
              :src="pdf"
              :page="1"
              style="display: inline-block; width: 100%"
            ></pdf>
          </div>
        </div>
      </div>
      <div class="col-7">
        <div class="text-left">
          <p v-if="document.opened">
            {{ document.index }}. {{ document.riesitel }}
          </p>
          <strong v-else>{{ document.index }}. {{ document.riesitel }}</strong>
          <p>
            <span class="badge badge-secondary mr-1">{{
              document.kategoria
            }}</span>
            <transition-group name="tags">
              <b-badge
                v-for="tag in document.tags"
                :key="tag"
                :style="{ background: getTagColor(tag) }"
                class="m-1"
                >{{ tag }}</b-badge
              >
            </transition-group>
          </p>
        </div>
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
import Vue from "vue";
var pdf = require("pdfvuer");
export default Vue.extend({
  components: {
    pdf: pdf.default,
  },
  props: ["documentID", "tags"],
  data() {
    return {
      document: undefined,
      pdf: null,
      selected: false,
      documentBusy: false,
    };
  },
  mounted() {
    Database.getDocument(this.documentID).then((doc) => {
      this.$data.document = doc;
      setTimeout(() => {
        this.$data.pdf = pdf.createLoadingTask({
          data: new Uint8Array(doc.pdfData),
        });
      }, 500 * doc.index);
    });
  },
  methods: {
    updatePreview() {
      Database.getDocument(this.documentID).then((doc) => {
        this.$data.documentBusy = false;
        this.$data.document.tags = doc.tags;
        this.$data.document.opened = doc.opened;
        this.$data.pdf = pdf.createLoadingTask({
          data: new Uint8Array(doc.pdfData),
        });
      });
    },
    getTagColor(tag: string) {
      const a = this.tags.find((e: any) => e.meno == tag);
      return a.color;
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
</style>