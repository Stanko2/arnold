<template>
  <div class="d-flex flex-column justify-content-around stats-panel">
    <stats-entry
      :min="0"  
      :max="stats.celkovo"
      :value="stats.otvorene"
      :color="color('#0dcaf0')"
      label="Otvorených"
    />
    <stats-entry
      :min="0"
      :max="stats.celkovo"
      :value="stats.komentar"
      :color="color('#ffc107')"
      label="Komentár"
    />
    <stats-entry
      :min="0"
      :max="stats.celkovo"
      :value="stats.obodovane"
      :color="color('#6610f2')"
      label="Obodované"
      @click.native="updateScoringData"
    >
      <scoring-chart
        ref="scoringChart"
        :stats="stats"
      />
    </stats-entry>
    <stats-entry
      :min="0"
      :max="stats.celkovo"
      :value="stats.hotovo"
      :color="color('#20c997')"
      label="Hotovo"
    />
  </div>
</template>

<script lang="ts">
import { Document } from "@/@types";
import { Database } from "@/Db";
import Color from "color";
import Vue from "vue";
import Component from "vue-class-component";
import StatsEntry from "./StatsEntry.vue";
import ScoringChart from "./ScoringChart.vue";


@Component({
  components: {
    StatsEntry,
    ScoringChart
  },
})
export default class Stats extends Vue {
  stats!: {
    celkovo: number;
    otvorene: number;
    komentar: number;
    obodovane: number;
    hotovo: number;
  };

  $refs!: {
    scoringChart: ScoringChart;
  }

  mounted() {
    this.$store.subscribe((mutation) => {
      if (mutation.type === 'updateDocument') {
        this.update();
      }
    })
    this.update();
  }
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
  }
  updateScoringData() {
    const Documents = this.$store.state.documents;
    if (this.$refs.scoringChart)
      this.$refs.scoringChart.$emit('statsUpdate', Documents);
  }

  update() {
    const Documents = this.$store.state.documents;
    this.stats = {
      celkovo: Documents.length,
      otvorene: this.count(Documents, (e: Document) => e.opened),
      komentar: this.count(Documents, (e: Document) => {
        return e.changes.some(
          (f) => f.type === "Text" && f.data.hasControls
        );
      }),
      obodovane: this.count(Documents, (e: Document) => {
        return e.scoring != null;
      }),
      hotovo: this.count(Documents, (e: Document) => {
        return (
          (e.scoring?.final || false) &&
          e.changes.some(
            (f) => f.type === "Text" && f.data.hasControls
          )
        );
      }),
    };
  }

  count(arr: any[], fn: (e: any) => boolean): number {
    let out = 0;
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      if (fn(el)) out++;
    }
    return out;
  }
  color(hex: string): Color {
    return Color(hex, "hex");
  }
}
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
  overflow: auto;
}
.pie-chart {
  width: 400px;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stats-panel::-webkit-scrollbar {
  display: none;
}
.stats p {
  display: block;
  margin-left: 1rem;
}
.stats h3 {
  font-size: 2.5rem;
}
</style>