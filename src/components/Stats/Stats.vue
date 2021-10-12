<template>
  <div class="d-flex flex-column justify-content-around stats-panel">
    <stats-entry
      :max="stats.celkovo"
      :value="stats.otvorene"
      :color="color('#264653')"
      label="Otvorenych"
    />
    <stats-entry
      :max="stats.celkovo"
      :value="stats.komentar"
      :color="color('#F4A261')"
      label="Komentar"
    />
    <stats-entry
      :max="stats.celkovo"
      :value="stats.obodovane"
      :color="color('#E9C46A')"
      label="Obodovane"
      ><pie-chart
        v-if="scoringChartData"
        class="pie-chart"
        :data="scoringChartData.chartData"
        :options="scoringChartData.chartOptions"
    /></stats-entry>
    <stats-entry
      :max="stats.celkovo"
      :value="stats.hotovo"
      :color="color('#2A9D8F')"
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
import PieChart from "./PieChart.js";

@Component({
  components: {
    StatsEntry,
    PieChart,
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
  scoringChartData: any = undefined;

  mounted() {
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
  update() {
    const Documents = this.$store.state.documents;
    this.stats = {
      celkovo: Documents.length,
      otvorene: this.count(Documents, (e: Document) => e.opened),
      komentar: this.count(Documents, (e: Document) => {
        return e.changes.some(
          (f) => f.type === "Text" && !f.data.text.match(/[0-9]*(\.[0-9])?B/)
        );
      }),
      obodovane: this.count(Documents, (e: Document) => {
        return e.scoring != null;
      }),
      hotovo: this.count(Documents, (e: Document) => {
        return (
          (e.scoring?.final || false) &&
          e.changes.some(
            (f) => f.type === "Text" && !f.data.text.match(/[0-9]*(\.[0-9])?B/)
          )
        );
      }),
    };
    this.generateScoringChartData(Documents);
  }
  generateScoringChartData(Documents: Document[]) {
    const scores: Record<string, number> = {};
    for (const doc of Documents) {
      if (doc.scoring) {
        if (scores[`${doc.scoring.points}B`])
          scores[`${doc.scoring.points}B`]++;
        else scores[`${doc.scoring.points}B`] = 1;
      } else {
        if (scores["Neobodovane"]) scores["Neobodovane"]++;
        else scores["Neobodovane"] = 1;
      }
    }

    this.scoringChartData = {
      chartOptions: {
        hoverBorderWidth: 20,
      },
      chartData: {
        hoverBackgroundColor: "red",
        hoverBorderWidth: 10,
        labels: Object.keys(scores),
        datasets: [
          {
            label: "Scores",
            backgroundColor: Object.keys(scores).map((e) =>
              this.randomColor(e)
            ),
            data: Object.values(scores),
          },
        ],
      },
    };
  }
  randomColor(seed: string): string {
    return Color.hsl(Math.random() * 360, 90, 50).hex();
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