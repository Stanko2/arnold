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
              v-model.number="$data.points"
              type="number"
              class="w-50"
              placeholder="Zadaj body ..."
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
              v-if="!final"
              variant="success"
              size="lg"
              :disabled="$data.points == undefined"
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
            Upraviť Bodovanie
          </b-button>
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
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import {Database} from "@/Db";
import type {Document, ScoringCriteria} from "@/@types";
import Vue from "vue";
import {TextAnnotation} from "@/Annotation";
import {PDFdocument} from "./PDFdocument";
import Component from "vue-class-component";
import {getViewedDocument} from "@/Documents/DocumentManager";
import {BFormInput} from "bootstrap-vue";

@Component({})
export default class Scoring extends Vue {
  pointCriterias: ScoringCriteria[] = [];
  acceptedCriteria: boolean[] = [];
  final: boolean = false;
  pdf: PDFdocument | null = null;
  points: number | null = null;
  doc: Document | null = null;
  annotName: string = "";
  showScoringPanel: boolean = false;
  $refs!: {
    pointInput: BFormInput
  }

  mounted() {
    const pointCriterias = localStorage.getItem("bodovanie");
    this.eventHub.$on("shortcut:scoring", this.toggle)
    if (pointCriterias) {
      this.pointCriterias = JSON.parse(pointCriterias);
      this.acceptedCriteria = this.pointCriterias.map(() => false);
      this.final = false;
    }
    this.pdf = getViewedDocument();
    if (this.pdf) {
      Database.getDocument(this.pdf.id).then(doc => this.doc = doc)
    }
    this.eventHub.$on(
      "editor:documentChanged",
      (pdf: PDFdocument, doc: Document) => {
        setTimeout(() => {
          this.pdf = pdf;
          this.getScoring(doc);
        }, 50);
      }
    );
  }

  toggle() {
    this.showScoringPanel = !this.showScoringPanel;
    if (this.showScoringPanel) {
      this.$nextTick().then(() => {
        this.$refs.pointInput.focus();
      });
    }
  }

  updatepointCriterias() {
    this.$store.commit('setCriteria', this.pointCriterias);
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

  calculatePoints() {
    let points = 0;
    for (let i = 0; i < this.pointCriterias.length; i++) {
      const a = this.pointCriterias[i];
      if (this.acceptedCriteria[i]) {
        points += a.points;
      }
    }
    this.points = points;
    this.saveScoring();
  }

  saveScoring() {
    console.log(this.doc);
    if (!this.doc) return;
    if (this.final) {
      this.doc.scoring = {
        points: this.points || 0,
        acceptedCriteria: this.pointCriterias.filter((e, i) => this.acceptedCriteria[i]).map((e) => e.id),
        final: this.final,
        annotName: this.annotName,
      };
    } else {
      if (this.points || this.points === 0) {
        this.doc.scoring = {
          points: this.points || 0,
          acceptedCriteria: this.pointCriterias.filter((e, i) => this.acceptedCriteria[i]).map((e) => e.id),
          final: this.final,
          annotName: this.annotName,
        };
      } else {
        delete this.doc.scoring;
      }
    }
    Database.updateDocument(this.doc.id, this.doc);
  }

  getScoring(doc: Document) {
    this.doc = doc;
    if (!doc.scoring) {
      this.points = null;
      this.acceptedCriteria = this.pointCriterias.map(() => false);
      this.final = false;
      return;
    }
    this.acceptedCriteria = this.pointCriterias.map((e) => doc.scoring?.acceptedCriteria.includes(e.id) || false);
    this.points = doc.scoring.points;
    this.annotName = doc.scoring.annotName || "";
    this.final = false;

    for (const annot of doc.changes) {
      if (annot.data.name == this.annotName) {
        this.final = true;
        break;
      }
    }
  }

  finalScoringChange() {
    if (!this.pdf) return;
    const pdf: PDFdocument = this.pdf;
    this.final = !this.final;
    if (this.final) {
      const options = JSON.parse(
        localStorage.getItem("preferences") || "{}"
      ).tools.settings.tools.find(
        (e: any) => e.name == "scoring"
      )?.defaultOptions;
      const pointsAnnot = new TextAnnotation(
        0,
        {
          ...options,
          text: `${this.points}B`,
          top: 30,
          left: 300,
          hasControls: false,
          editable: false,
        },
        pdf.pageCanvases[0]
      );
      pdf.pageCanvases[0].discardActiveObject();
      pdf.addAnnotation(pointsAnnot);
      this.annotName = pointsAnnot.object.name || "";
      this.eventHub.$emit("document:save");
    } else if (this.annotName) {
      pdf.deleteAnnotation(this.annotName);
      this.annotName = "";
      this.final = false;
    }
    this.saveScoring();
  }

  deleteCriteria(id: number) {
    const index = this.pointCriterias.findIndex((e: any) => e.id == id);
    this.pointCriterias.splice(index, 1);
  }
}
</script>

<style scoped>
.bodovanie {
  position: fixed;
  right: 0;
  top: 20%;
  color: whitesmoke;
  border-radius: 0 25px;
  transition: all 0.3s;
}
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.bodovanie h4 {
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
.bodovanie .bodovanie_okno {
  width: 300px;
  padding: 15px;
  box-shadow: 0 0 20px rgb(0 0 0 / 50%);
  border-radius: 0 0 0 10px;
}
.kriteria-body {
  text-align: right;
  width: 50px;
  display: inline;
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
