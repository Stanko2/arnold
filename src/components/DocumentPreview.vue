<template>
  <li
    :class="{
      'list-group-item-action': !selected,
      active: selected,
    }"
  >
    <div v-if="document != null" class="row">
      <div class="col-5">
        <div class="card">
          <div
            v-if="pdf == null"
            class="d-flex align-items-center justify-content-center text-danger"
          >
            Open this document to load preview
          </div>
          <pdf
            :src="pdf"
            :page="1"
            style="display: inline-block; width: 100%"
          ></pdf>
        </div>
      </div>
      <div class="col-7">
        <div class="text-left">
          <p>{{ document.index }}. {{ document.riesitel }}</p>
          <p>
            <span class="badge badge-secondary mr-1">{{
              document.kategoria
            }}</span>
            <b-badge
              v-for="tag in document.tags"
              :key="tag"
              :style="{ background: getTagColor(tag) }"
              class="m-1"
              >{{ tag }}</b-badge
            >
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
var pdf = require("vue-pdf").default;
export default Vue.extend({
  components: {
    pdf,
  },
  props: ["documentID", "tags"],
  data() {
    return {
      document: null,
      pdf: null,
      selected: false,
    };
  },
  mounted() {
    Database.getDocument(this.documentID).then((doc) => {
      this.$data.document = doc;
      setTimeout(() => {
        this.$data.pdf = pdf.createLoadingTask(new Uint8Array(doc.pdfData));
      }, 500 * doc.index);
    });
  },
  methods: {
    updatePreview() {
      Database.getDocument(this.documentID).then((doc) => {
        this.$data.document.tags = doc.tags;
        this.$data.pdf = pdf.createLoadingTask(new Uint8Array(doc.pdfData));
      });
    },
    getTagColor(tag: string) {
      const a = this.tags.find((e: any) => e.meno == tag);
      return a.color;
    },
  },
});
</script>