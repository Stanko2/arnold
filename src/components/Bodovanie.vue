<template>
  <div class="bodovanie">
    <transition name="bodovanie">
      <div class="position-relative">
        <h4 class="btn btn-primary" @click="ukazBodovanie = !ukazBodovanie">
          Bodovanie
          <span class="material-icons d-inline position-absolute">{{
            ukazBodovanie ? "expand_more" : "expand_less"
          }}</span>
        </h4>
        <div v-if="ukazBodovanie" class="bodovanie_okno bg-primary">
          <div class="d-flex flex-row">
            <label class="align-items-center" for="mainInput">Body:</label>
            <input
              type="number"
              class="form-control w-25"
              placeholder="Body ..."
              v-model.number="$data.body"
              @change="ulozHodnotenie"
              id="mainInput"
            />
            <div class="d-flex flex-row mr-2">
              <input
                type="checkbox"
                class="form-control"
                id="final"
                v-model="final"
                @change="ulozHodnotenie"
              />
              <label for="final">Finalne hodnotenie</label>
            </div>
          </div>
          <div>
            <div
              class="form-check w-100 d-flex justify-content-between"
              v-for="(bod, i) in bodovania"
              :key="bod.id"
            >
              <input
                class="form-check-input"
                type="checkbox"
                :id="bod.id"
                v-model="splnene[i]"
                @change="prepocitajBody"
              />
              <label class="form-check-label" :for="bod.id">
                {{ bod.za }} - ({{ bod.body }})
              </label>
            </div>
          </div>
          <b-button v-b-modal.bodovanie>Upravit Bodovanie</b-button>
          <b-modal title="Bodovanie" id="bodovanie" @ok="updateBodovania">
            <ul class="list-group">
              <li
                class="list-group-item"
                v-for="bod in bodovania"
                :key="bod.id"
              >
                <input
                  type="number"
                  class="kriteria-body"
                  v-model.number="bod.body"
                />B - za
                <input type="text" v-model="bod.za" class="w-75" />
              </li>
            </ul>
            <button @click="pridajBodovanie" class="btn btn-primary">
              Pridat dalsie kriterium
            </button>
          </b-modal>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { Database } from "@/Db";
// eslint-disable-next-line no-unused-vars
import { Document, eventHub as DocEventHub } from "@/DocumentManager";
import Vue from "vue";
export default Vue.extend({
  mounted() {
    const bodovania = localStorage.getItem("bodovanie");
    if (bodovania) {
      this.$data.bodovania = JSON.parse(bodovania);
      this.$data.splnene = this.$data.bodovania.map(() => false);
      this.$data.final = false;
    }
    DocEventHub.$on("documentChanged", (pdf: any, doc: Document) => {
      this.zistiHodnotenie(doc);
    });
  },
  data() {
    return {
      ukazBodovanie: false,
      splnene: [],
      bodovania: [],
      body: undefined,
      final: undefined,
    };
  },
  methods: {
    updateBodovania() {
      localStorage.setItem("bodovanie", JSON.stringify(this.$data.bodovania));
    },
    pridajBodovanie() {
      this.$data.bodovania.push({
        id: Math.random().toString(36).substr(2, 9),
        body: 0,
        za: "",
      });
    },
    prepocitajBody() {
      let body = 0;
      for (let i = 0; i < this.$data.bodovania.length; i++) {
        const a = this.$data.bodovania[i];
        if (this.$data.splnene[i]) {
          body += a.body;
        }
      }
      this.$data.body = body;
      this.ulozHodnotenie();
    },
    ulozHodnotenie() {
      this.$data.doc.hodnotenie = {
        body: this.$data.body,
        splnene: this.$data.splnene,
        final: this.$data.final,
      };
      Database.updateDocument(this.$data.doc.id, this.$data.doc);
    },
    zistiHodnotenie(doc: Document) {
      this.$data.doc = doc;
      if (!doc.hodnotenie) {
        this.$data.body = undefined;
        this.$data.splnene = this.bodovania.map(() => false);
        this.$data.final = false;
        return;
      }
      this.$data.splnene = doc.hodnotenie.splnene;
      this.$data.body = doc.hodnotenie.body;
      this.$data.final = doc.hodnotenie.final;
    },
  },
});
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
  width: 40px;
  display: inline;
}
.bodovanie-enter-to,
.bodovanie-leave {
  transform: translateX(0);
}
.bodovanie-enter,
.bodovanie-leave-to {
  transform: translateX(-300px);
}
</style>