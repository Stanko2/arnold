<template>
  <b-row>
    <b-col
      v-if="scoringChartData"
      class="d-flex w-100"
      cols="8"
    >
      <pie-chart
        class="pie-chart col-8"
        :data="scoringChartData.chartData"
        :options="scoringChartData.chartOptions"
      />
      <div class="d-flex flex-column justify-content-center ml-2 col-4">
        <div
          v-for="(item, i) in scoringChartData.chartData.datasets[0].data"
          :key="i"
          class="d-flex align-items-center"
        >
          <span
            :style="{ 'background-color': scoringChartData.chartData.datasets[0].backgroundColor[i] }"
            class="legend-badge"
          />
          {{ scoringChartData.chartData.labels[i] }}
        </div>
      </div>
    </b-col>
    <b-col cols="4">
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
      if (doc.scoring && doc.scoring.points !== undefined) {
        if (uscores[`${doc.scoring.points}B`])
          uscores[`${doc.scoring.points}B`]++;
        else uscores[`${doc.scoring.points}B`] = 1;
      } else {
        if (uscores["Neobodované"]) uscores["Neobodované"]++;
        else uscores["Neobodované"] = 1;
      }
    }

    const keys = Object.keys(uscores).sort((a, b) => {
      if (a === "Neobodované") return -1;
      if (b === "Neobodované") return 1;

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
      color: '#000',
      chartOptions: {
        hoverBorderWidth: 20,
        legend: {
          display: false
        },
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
    for (const doc of Documents.filter(d=>d.opened)) {
      sum += doc.scoring?.points || 0;
      sumTime += doc.timeOpened || 0;
    }
    this.averagePoints = (sum / Documents.filter(d=>d.scoring?.points != undefined).length).toFixed(2);
    if(this.averagePoints == 'NaN') this.averagePoints = '0.00';
    this.averageTime = sumTime / Documents.filter(d=>d.opened).length;
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin: .5rem;
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
.legend-badge {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  margin-right: .5rem;
  border: 2px solid #fff;
}
</style>
