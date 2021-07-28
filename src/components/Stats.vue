<template>
  <div class="d-flex flex-column justify-content-around stats-panel">
    <b-card class="stats" bg-variant="secondary" text-variant="light">
      <div class="d-flex flex-row justify-content-between align-items-end">
        <h4>Otvorenych</h4>
        <h3>{{ ((stats.otvorene / stats.celkovo) * 100).toFixed(2) }}%</h3>
      </div>
      <b-progress class="mt-2" :max="stats.celkovo">
        <b-progress-bar
          :value="stats.otvorene"
          :label="`${stats.otvorene} / ${stats.celkovo}`"
        ></b-progress-bar>
      </b-progress>
    </b-card>
    <b-card class="stats" bg-variant="danger" text-variant="light">
      <div class="d-flex flex-row justify-content-between align-items-end">
        <h4>Komentar</h4>
        <h3>{{ ((stats.komentar / stats.celkovo) * 100).toFixed(2) }}%</h3>
      </div>
      <b-progress class="mt-2" :max="stats.celkovo">
        <b-progress-bar
          :value="stats.komentar"
          :label="`${stats.komentar} / ${stats.celkovo}`"
        ></b-progress-bar>
      </b-progress>
    </b-card>
    <b-card class="stats" bg-variant="warning" text-variant="dark">
      <div class="d-flex flex-row justify-content-between align-items-end">
        <h4>Obodovanych</h4>
        <h3>{{ ((stats.obodovane / stats.celkovo) * 100).toFixed(2) }}%</h3>
      </div>
      <b-progress class="mt-2" :max="stats.celkovo">
        <b-progress-bar
          :value="stats.obodovane"
          :label="`${stats.obodovane} / ${stats.celkovo}`"
        ></b-progress-bar>
      </b-progress>
    </b-card>
    <b-card class="stats" bg-variant="success" text-variant="dark">
      <div class="d-flex flex-row justify-content-between align-items-end">
        <h4>Hotovo</h4>
        <h3>{{ ((stats.hotovo / stats.celkovo) * 100).toFixed(2) }}%</h3>
      </div>
      <b-progress class="mt-2" :max="stats.celkovo">
        <b-progress-bar
          :value="stats.hotovo"
          :label="`${stats.hotovo} / ${stats.celkovo}`"
        ></b-progress-bar>
      </b-progress>
    </b-card>
  </div>
</template>

<script lang="ts">
// eslint-disable-next-line no-unused-vars
import { Document } from "@/DocumentManager";
import { Database } from "@/Db";
import Vue from "vue";
export default Vue.extend({
  mounted() {
    this.update();
  },
  data() {
    return {
      stats: {
        celkovo: 0,
        otvorene: 0,
        komentar: 0,
        obodovane: 0,
        hotovo: 0,
      },
    };
  },
  methods: {
    update() {
      Database.getAllDocuments().then((Documents) => {
        this.$data.stats = {
          celkovo: Documents.length,
          otvorene: this.count(Documents, (e: Document) => e.otvorene),
          komentar: this.count(Documents, (e: Document) => {
            return e.changes.some(
              (f) =>
                f.type === "Text" && !f.data.text.match(/[0-9]*(\.[0-9])?B/)
            );
          }),
          obodovane: this.count(Documents, (e: Document) => {
            return e.hodnotenie?.final || false;
          }),
          hotovo: this.count(Documents, (e: Document) => {
            return (
              (e.hodnotenie?.final || false) &&
              e.changes.some(
                (f) =>
                  f.type === "Text" && !f.data.text.match(/[0-9]*(\.[0-9])?B/)
              )
            );
          }),
        };
      });
    },
    count(arr: any[], fn: (e: any) => boolean): number {
      let out = 0;
      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        if (fn(el)) out++;
      }
      return out;
    },
  },
});
</script>

<style scoped>
.stats {
  user-select: none;
  display: inline;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  width: 100%;
  align-items: center;
}
.stats-panel {
  width: 100%;
  height: 45vh;
}
.stats p {
  display: block;
  margin-left: 1rem;
}
.stats h3 {
  font-size: 2.5rem;
}
</style>