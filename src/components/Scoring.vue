<template>
  <div class="bodovanie">
    <div class="position-relative">
      <h4 class="btn btn-primary" @click="toggle()">
        Bodovanie
        <span class="material-icons d-inline position-absolute">{{
          showScoringPanel ? "expand_more" : "expand_less"
        }}</span>
      </h4>
      <transition name="slide">
        <div v-if="showScoringPanel" class="bodovanie_okno bg-primary">
          <div class="d-flex flex-row">
            <h3 class="w-50">Body:</h3>
            <input
              type="number"
              class="form-control w-50"
              placeholder="Zadaj body ..."
              v-model.number="$data.points"
              @change="saveScoring"
              id="mainInput"
            />
            <div class="d-flex flex-row mr-2"></div>
          </div>
          <div>
            <div
              class="form-check w-100 d-flex justify-content-between"
              v-for="(criteria, i) in pointCriterias"
              :key="criteria.id"
            >
              <input
                class="form-check-input"
                type="checkbox"
                :id="criteria.id"
                v-model="acceptedCriteria[i]"
                @change="calculatePoints"
              />
              <label class="form-check-label" :for="criteria.id">
                {{ criteria.from }}
                <b-badge pill variant="warning">{{ criteria.points }}</b-badge>
              </label>
            </div>
          </div>
          <div class="m-2">
            <b-button
              variant="success"
              size="lg"
              @click="finalScoringChange()"
              v-if="!final"
              :disabled="$data.points == undefined"
              >Zfinalizuj hodnotenie</b-button
            >
            <b-button variant="danger" @click="finalScoringChange()" v-else
              >Zrus hodnotenie</b-button
            >
          </div>
          <br />
          <b-button v-b-modal.bodovanie size="sm">Upravit Bodovanie</b-button>
          <b-modal
            title="Bodovanie"
            id="bodovanie"
            @ok="updatepointCriterias"
            size="lg"
          >
            <ul class="list-group m-2">
              <li
                class="list-group-item"
                v-for="criteria in pointCriterias"
                :key="criteria.id"
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
                    <input
                      type="number"
                      class="kriteria-body form-control d-inline"
                      v-model.number="criteria.points"
                    />B - za
                    <input
                      type="text"
                      v-model="criteria.from"
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
            <button @click="pridajBodovanie" class="btn btn-primary btn-block">
              Pridat dalsie kriterium
            </button>
          </b-modal>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { Database } from "@/Db";
import type { Document } from "@/@types";
import Vue from "vue";
import { TextAnnotation } from "@/Annotation";
import { PDFdocument } from "./PDFdocument";
import Component from "vue-class-component";

@Component({})
export default class Scoring extends Vue {
  pointCriterias: any[] = [];
  acceptedCriteria: boolean[] = [];
  final: boolean = false;
  pdf: PDFdocument | undefined = undefined;
  points: number | undefined = undefined;
  doc: Document | undefined = undefined;
  annotName: string = "";
  showScoringPanel: boolean = false;

  mounted() {
    const pointCriterias = localStorage.getItem("bodovanie");
    if (pointCriterias) {
      this.pointCriterias = JSON.parse(pointCriterias);
      this.acceptedCriteria = this.pointCriterias.map(() => false);
      this.final = false;
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
  data() {
    return {
      showScoringPanel: false,
      acceptedCriteria: [],
      pointCriterias: [],
      points: undefined,
      final: undefined,
      annotName: undefined,
    };
  }
  toggle() {
    this.showScoringPanel = !this.showScoringPanel;
  }
  updatepointCriterias() {
    localStorage.setItem("bodovanie", JSON.stringify(this.pointCriterias));
  }
  pridajBodovanie() {
    this.pointCriterias.push({
      id: Math.random().toString(36).substr(2, 9),
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
    if (!this.doc) return;
    this.doc.scoring = {
      points: this.points || 0,
      acceptedCriteria: this.acceptedCriteria,
      final: this.final,
      annotName: this.annotName,
    };
    Database.updateDocument(this.doc.id, this.doc);
  }
  getScoring(doc: Document) {
    this.doc = doc;
    if (!doc.scoring) {
      this.points = undefined;
      this.acceptedCriteria = this.pointCriterias.map(() => false);
      this.final = false;
      return;
    }
    this.acceptedCriteria = doc.scoring.acceptedCriteria;
    this.points = doc.scoring.points;
    this.annotName = doc.scoring.annotName || "";
    this.final = false;

    for (const annot of doc.changes) {
      if (annot.data.name == this.annotName) {
        this.final = true;
        break;
      }
    }
    console.assert(this.final == doc.scoring.final);
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
}
.kriteria-body {
  text-align: right;
  width: 50px;
  display: inline;
}
/* .slide-leave-active,
.slide-enter-active {
  transition: 1s;
}
.slide-enter {
  transform: translate(100%, 0);
}
.slide-leave-to {
  transform: translate(100%, 0);
} */
</style>