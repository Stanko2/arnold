<template>
  <div class="d-flex justify-content-between w-100">
    <div>
      <b-button variant="success" @click="$router.push({ path: '/' })"
        >Domov</b-button
      >
      <b-button variant="danger" v-b-modal.sessionDestroy
        >Uzavrieť Opravovanie</b-button
      >
      <b-modal
        id="sessionDestroy"
        title="Naozaj uzavriet opravovanie?"
        ok-variant="danger"
        cancel-variant="primary"
        centered
        @ok="destroySession"
      >
        <p>Pri uzavretí opravovania sa zmažú nasledovné veci</p>
        <ul>
          <li>
            Riešenia a všetko čo s nimi súvisí - ak si ich chceš nechať musíš
            ich stiahnuť na svoj počítač
          </li>
          <li>Bodovacie kritéria</li>
        </ul>
        Ak to potvrdíš, svoje stiahnuté opravené riešenia už nebudeš vedieť
        meniť

        <template #modal-footer="{ ok, cancel }">
          <div class="float-left">
            <b-button class="m-1" variant="primary" @click="cancel()">
              Zavrieť
            </b-button>
            <b-button
              variant="success"
              :disabled="downloading"
              @click="downloadAll"
              class="m-1"
            >
              <div v-if="downloading">
                <b-spinner
                  variant="secondary"
                  label="loading..."
                  v-if="downloading"
                  small
                ></b-spinner>
                Komprimujem
              </div>
              <div v-else>Stiahnuť všetky</div>
            </b-button>
            <b-button variant="danger" @click="ok()" class="m-1">
              Uzavrieť opravovanie
            </b-button>
          </div>
        </template>
      </b-modal>
      <button class="btn btn-success" @click="eventHub.$emit('document:save')">
        Uložiť
      </button>
      <b-button variant="success" :disabled="downloading" @click="downloadAll">
        <div v-if="downloading">
          <b-spinner
            variant="secondary"
            label="loading..."
            v-if="downloading"
            small
          ></b-spinner>
          Komprimujem
        </div>
        <div v-else>Download all</div>
      </b-button>
      <button class="btn btn-success" @click="download">Download</button>
      <b-button variant="success" v-b-modal.noveRiesenie
        >Pridať ďalšie riešenie</b-button
      >
      <b-modal
        id="noveRiesenie"
        size="lg"
        title="Pridat nové riešenie"
        @ok="pridajRiesenia"
        :ok-disabled="noveRiesenia.length == 0"
      >
        <b-form-file
          accept=".pdf"
          multiple
          id="rieseniaInput"
          v-model="noveRiesenia"
          :file-name-formatter="formatNames"
        />
      </b-modal>
      <b-button variant="success" v-b-modal.stats>Štatistiky</b-button>
      <b-modal
        id="stats"
        title="Statistiky"
        centered
        size="xl"
        ok-only
        scrollable
        ><stats ref="stat"></stats
      ></b-modal>
      <b-button variant="success" v-b-modal.preferences>Nastavenia</b-button>
      <b-modal
        id="preferences"
        title="Nastavenia"
        size="xl"
        ok-only
        @ok="$refs.preferences.save()"
        ><preferences ref="preferences"></preferences
      ></b-modal>
      <b-button variant="success" @click="$router.push({ path: '/help' })"
        >Pomoc</b-button
      >
    </div>
    <div class="bottom-progress-bar" v-if="downloading">
      <b-progress max="100" show-progress animated class="h-100 w-100">
        <b-progress-bar :value="progress" animated>
          <span v-if="progress > 50"
            >Progress: {{ progress.toFixed(2) }}% | Súbor: {{ file }}</span
          >
        </b-progress-bar>
      </b-progress>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {
  activeParser,
  AddDocument,
  Documents,
  getViewedDocument,
} from "@/DocumentManager";
import { Database } from "@/Db";
import Stats from "./Stats/Stats.vue";
import Preferences from "./Preferences/Preferences.vue";
import Component from "vue-class-component";

@Component({
  components: { Stats, Preferences },
})
export default class Topbar extends Vue {
  downloading: boolean = false;
  progress: number = 0;
  file: string = "";
  noveRiesenia: File[] = [];

  mounted() {
    this.eventHub.$on("download:done", () => (this.downloading = false));
    this.eventHub.$on("download:progress", (progress: number, file: string) => {
      this.progress = progress;
      this.file = file;
    });
  }
  data() {
    return {
      downloading: false,
      progress: 0,
      file: "",
      noveRiesenia: [],
    };
  }
  download() {
    this.eventHub.$emit("editor:download", getViewedDocument()?.id);
  }
  downloadAll() {
    this.eventHub.$emit("editor:downloadZip");
    this.downloading = true;
    this.progress = 0;
    this.file = "";
  }
  destroySession() {
    console.log("Destroy");
    Database.clearAllDocuments().then(() => {
      this.$router.push("/");
    });
  }
  formatNames(files: File[]) {
    return files.map((e) => activeParser.parse(e.name).riesitel).join(", ");
  }
  pridajRiesenia() {
    console.log("pridavam");

    const addOperations: Promise<void>[] = [];
    const baseLength = Documents.length;
    for (let i = 0; i < this.noveRiesenia.length; i++) {
      const riesenie = this.noveRiesenia[i];
      addOperations.push(
        new Promise<void>((resolve, reject) => {
          const index = i;
          riesenie.arrayBuffer().then((buffer) => {
            AddDocument(riesenie.name, buffer, baseLength + index + 1)
              .then(() => resolve())
              .catch((err) => reject(err));
          });
        })
      );
    }
    Promise.all(addOperations).then(() => {
      location.reload();
    });
  }
}
</script>

<style>
.top-progress {
  margin: 0;
  width: 100%;
  height: 1.5vw;
}
.bottom-progress-bar {
  position: fixed;
  width: 100vw;
  bottom: 0;
  height: 30px;
  z-index: 10;
}
</style>