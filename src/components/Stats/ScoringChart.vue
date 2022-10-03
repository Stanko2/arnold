<template>
  <b-row>
    <b-col v-if="scoringChartData">
      <pie-chart
        class="pie-chart"
        :data="scoringChartData.chartData"
        :options="scoringChartData.chartOptions"
      />
    </b-col>
    <b-col>
      <div class="numberStats">
        <h2>{{ averagePoints }}</h2>
        <p>Priemerný počet bodov</p>
      </div>
      <div class="numberStats">
        <h2>{{ formatTime(averageTime) }}</h2>
        <p>Priemerný čas na jedno riešenie</p>
      </div>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Document } from '@/@types';
import Color from 'color';
import PieChart from "./PieChart.js";

@Component({
  components: {
    PieChart,
  }
})
export default class ScoringChart extends Vue {
  scoringChartData: any = null;
  averagePoints = "";
  averageTime = 0;
  mounted() {
    this.generateScoringChartData([]);
    this.$on('statsUpdate', (stats: Document[]) => {
      this.scoringChartData = null;
      this.$nextTick().then(() => {
        this.generateScoringChartData(stats);
      })
    });
  }

  generateScoringChartData(Documents: Document[]) {
    console.log("generateScoringChartData");
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
    let sum = 0;
    let sumTime = 0;
    for (const doc of Documents) {
      sum += doc.scoring?.points || 0;
      sumTime += doc.timeOpened || 0;
    }
    this.averagePoints = (sum / Documents.length).toFixed(2);
    this.averageTime = sumTime / Documents.length;
  }
  randomColor(seed: string): string {
    return Color.hsl(Math.random() * 360, 90, 50).hex();
  }

  formatTime(timeStamp: number): string {
    const date = new Date(timeStamp);
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const f = function (x: number) {
      return x < 10 ? "0" + x : x;
    };
    return `${f(minutes)}:${f(seconds)}`;
  }
}
</script>

<style scoped>
.pie-chart {
  width: 400px;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.numberStats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50%;
}
.numberStats h2 {
  font-size: 5em;
  font-weight: bold;
}
</style>