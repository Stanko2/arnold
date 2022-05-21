<template>
  <div class="d-flex flex-column justify-content-around stats-panel">
    <stats-entry
        :max="stats.celkovo"
        :value="stats.otvorene"
        :color="color('#264653')"
        label="Otvorených"
    />
    <stats-entry
        :max="stats.celkovo"
        :value="stats.komentar"
        :color="color('#F4A261')"
        label="Komentár"
    />
    <stats-entry
        :max="stats.celkovo"
        :value="stats.obodovane"
        v-if="scoringChartData"
        :color="color('#E9C46A')"
        label="Obodované"
    ><pie-chart
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
    this.generateScoringChartData(Documents);
  }
  generateScoringChartData(Documents: Document[]) {
    const uscores: Record<string, number> = {};
    for (const doc of Documents) {
      if (doc.scoring) {
        if (uscores[`${doc.scoring.points}B`])
          uscores[`${doc.scoring.points}B`]++;
        else uscores[`${doc.scoring.points}B`] = 1;
      } else {
        if (uscores["Neobodovane"]) uscores["Neobodovane"]++;
        else uscores["Neobodovane"] = 1;
      }
    }

    const keys = Object.keys(uscores).sort((a, b) => {
      if (a === "Neobodovane") return -1;
      if (b === "Neobodovane") return 1;

      const aPoints = parseFloat(a.split("B")[0]);
      const bPoints = parseFloat(b.split("B")[0]);
      if (aPoints < bPoints) return -1;
      if (aPoints > bPoints) return 1;
      return 0;
    }).reverse();

    const scores: Record<string, number> = {};
    for (const key of keys) {
      scores[key] = uscores[key];
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