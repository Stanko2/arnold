<template>
  <div class="bodovanie">
    <div class="position-relative">
      <h4
        class="btn btn-primary"
        @click="toggle()"
      >
        Bodovanie
        <span class="material-icons d-inline position-absolute">{{
          showScoringPanel ? "expand_more" : "expand_less"
        }}</span>
      </h4>
      <transition name="slide">
        <div
          v-if="showScoringPanel"
          class="bodovanie_okno bg-primary"
        >
          <div class="d-flex flex-row">
            <h3 class="w-50">
              Body:
            </h3>
            <b-form-input
              ref="pointInput"
              v-model.number="currentScore.points"
              type="number"
              class="w-50"
              step="0.5"
              placeholder="Zadaj body ..."
              :disabled="isFinal"
              @change="saveScoring"
            />
            <div class="d-flex flex-row mr-2" />
          </div>
          <div>
            <div
              v-for="(criteria, i) in pointCriterias"
              :key="criteria.id"
              class="form-check w-100 d-flex justify-content-between"
            >
              <b-form-checkbox
                :id="criteria.id"
                v-model="acceptedCriteria[i]"
                class="form-check-input"
                type="checkbox"
                :disabled="isFinal"
                @change="calculatePoints"
              />
              <label
                class="form-check-label"
                :for="criteria.id"
              >
                {{ criteria.from }}
                <b-badge
                  pill
                  variant="warning"
                >{{ criteria.points }}</b-badge>
              </label>
            </div>
          </div>
          <div class="m-2">
            <b-button
              v-if="currentScore && !currentScore.final"
              variant="success"
              size="lg"
              :disabled="$data.currentScore.points == undefined"
              @click="finalScoringChange()"
            >
              Zfinalizuj hodnotenie
            </b-button>
            <b-button
              v-else
              variant="danger"
              @click="finalScoringChange()"
            >
              Zruš hodnotenie
            </b-button>
          </div>
          <br>
          <b-button
            v-b-modal.bodovanie
            size="sm"
          >
            Upraviť bodovanie
          </b-button>
          <score-modal />
        </div>
      </transition>
    </div>
    <b-alert
      v-model="finalizingScoring"
      class="position-fixed fixed-top m-0 rounded-0 d-flex justify-content-center flex-column"
      style="z-index: 2000;"
      variant="success"
    >
      <p>Klikni tam, kam chceš pridať body do riešenia.</p>
      <b-button
        variant="success"
        @click="cancelFinalizing()"
      >
        Zrušiť
      </b-button>
    </b-alert>
  </div>
</template>

<script lang="ts">
import {Database} from "@/Db";
import type {Document, IScoring, ScoringCriteria} from "@/@types";
import Vue from "vue";
import {PDFdocument} from "../PDFdocument";
import Component from "vue-class-component";
import {getViewedDocument} from "@/Documents/DocumentManager";
import {BFormInput} from "bootstrap-vue";
import ScoreModal from "./ScoreModal.vue";
import Scorer from "./scorer";
import scorer from "./scorer";

@Component({
  components: {
    ScoreModal
  }
})
export default class Scoring extends Vue {
  pointCriterias: ScoringCriteria[] = [];
  acceptedCriteria: boolean[] = [];
  currentScore: IScoring | null = null;
  pdf: PDFdocument | null = null;
  doc: Document | null = null;
  showScoringPanel: boolean = false;
  finalizingScoring = false;

$refs!: {
    pointInput: BFormInput
  }

  get isFinal (): boolean {
    return this.currentScore?.final || false;
  }

  mounted() {
    console.log('mounted');
    this.updateCriteria(this.$store.getters.scoringCriteria);
    this.eventHub.$on("shortcut:scoring", this.toggle)
    this.pdf = getViewedDocument();
    if (this.pdf) {
      Database.getDocument(this.pdf.id).then(doc => {
        this.doc = doc;
        this.getScoring(doc);
      })
    }
    this.eventHub.$on(
      "editor:documentChanged",
      (pdf: PDFdocument, doc: Document) => {
        if(this.finalizingScoring){
          this.cancelFinalizing();
        }
        setTimeout(() => {
          this.pdf = pdf;
          this.getScoring(doc);
        }, 50);
      }
    );
    this.$store.subscribe((mut, state) =>{
      if(mut.type == 'setCriteria' || mut.type == 'loadData'){
        this.updateCriteria(this.$store.getters.scoringCriteria);
      }
    })
  }

  updateCriteria(criteria: ScoringCriteria[]){
    console.log(criteria);
    this.pointCriterias = criteria;
    this.acceptedCriteria = this.pointCriterias.map((e) => false);
    if(this.doc)
      this.getScoring(this.doc);
  }

  toggle() {
    this.showScoringPanel = !this.showScoringPanel;
    if (this.showScoringPanel) {
      this.$nextTick().then(() => {
        this.$refs.pointInput.focus();
      });
    }
  }

  calculatePoints() {
    if(!this.currentScore) return;
    let points = 0;
    for (let i = 0; i < this.pointCriterias.length; i++) {
      const a = this.pointCriterias[i];
      if (this.acceptedCriteria[i]) {
        points += a.points;
      }
    }
    this.currentScore.points = points;
    this.saveScoring();
  }

  saveScoring() {
    if (!this.doc || !this.currentScore) return;
    this.currentScore.acceptedCriteria = this.pointCriterias.filter((c,i) => this.acceptedCriteria[i]).map(c => c.id);
    console.log('save');

    scorer.saveScoring(this.currentScore);
  }

  getScoring(doc: Document) {
    this.doc = doc;
    this.currentScore = Scorer.getScoring(doc);
    
    if(this.currentScore == null){
      throw new Error('Current score null');
    }
    this.acceptedCriteria = this.pointCriterias.map((e) => this.currentScore?.acceptedCriteria.includes(e.id) || false);
    for (const annot of doc.changes) {
      if (annot.data.name == this.currentScore.annotName) {
        this.currentScore.final = true;
        break;
      }
    }
  }

  finalScoringChange() {
    if (!this.pdf) return;
    if(!this.isFinal){
      this.finalizingScoring = true;
      scorer.finalizeScoring().then((id: string)=>{
        this.finalizingScoring = false;
        if(this.currentScore){
          this.currentScore.final = !this.currentScore?.final;
          this.currentScore.annotName = id;
          scorer.saveScoring(this.currentScore);
        }
      }).catch(err=>console.log(err))
    }
    else {
      scorer.removeFinalScoring();
    }
  }

  cancelFinalizing(){
    this.finalizingScoring = false;
    scorer.cancel();
  }
}
</script>

<style scoped lang="scss">
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
/* .slide-leave-active,
.slide-enter-active {
  transition: 250ms;
}
.slide-enter-to,
.slide-leave {
  transform: translate(0, 0);
}
.slide-leave-to,
.slide-enter {
  transform: translate(100%, 0);
} */
</style>
