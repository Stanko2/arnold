<template>
  <b-modal
    id="bodovanie"
    title="Bodovanie"
    size="lg"
    @ok="updatepointCriterias"
  >
    <ul class="list-group m-2">
      <li
        v-for="criteria in pointCriterias"
        :key="criteria.id"
        class="list-group-item"
      >
        <div
          class="
            d-flex
            flex-row
            justify-content-between
            align-items-center
            "
        >
          <div class="w-100">
            <b-form-input
              v-model.number="criteria.points"
              type="number"
              class="kriteria-body d-inline"
            />B - za
            <b-form-input
              v-model="criteria.from"
              type="text"
              style="width: 80%"
              class="form-control d-inline"
            />
          </div>
          <button
            class="btn btn-danger"
            @click="deleteCriteria(criteria.id)"
          >
            <span class="material-icons"> delete </span>
          </button>
        </div>
      </li>
    </ul>
    <button
      class="btn btn-primary btn-block"
      @click="pridajBodovanie"
    >
      Pridať ďalšie kritérium
    </button>
  </b-modal>
</template>

<script lang="ts">
import { ScoringCriteria } from '@/@types';
import Vue from 'vue'
import Component from 'vue-class-component';

@Component
export default class ScoreModal extends Vue {
  pointCriterias: ScoringCriteria[] = [];
  

  mounted() {
    this.pointCriterias = this.$store.getters.scoringCriteria;
  }

  deleteCriteria(id: string) {
    const index = this.pointCriterias.findIndex((e: any) => e.id == id);
    this.pointCriterias.splice(index, 1);
  }

  pridajBodovanie() {
    let id: string;
    do {
      id = Math.random().toString(36).substr(2, 9);
    } while (this.pointCriterias.find(c => c.id == id));

    this.pointCriterias.push({
      id,
      points: 0,
      from: "",
    });
  }

  updatepointCriterias() {
    this.$store.commit('setCriteria', this.pointCriterias);
  }
}
</script>

<style lang="scss" scoped>
input[type="number"]::-webkit-inner-spin-button {
  appearance: none;
}
.kriteria-body {
  text-align: right;
  width: 50px;
  display: inline;
}

.bodovanie {
  position: fixed;
  right: 0;
  top: 20%;
  color: whitesmoke;
  border-radius: 0 25px;
  transition: all 0.3s;

  h4 {
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
  
  .bodovanie_okno {
    width: 300px;
    padding: 15px;
    box-shadow: 0 0 20px rgb(0 0 0 / 50%);
    border-radius: 0 0 0 10px;
  }
}
</style>