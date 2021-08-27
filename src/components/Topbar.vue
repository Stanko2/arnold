<template>
  <div class="d-flex justify-content-between w-100">
    <div>
      <b-button variant="danger" v-b-modal.sessionDestroy
        >Uzavriet opravovanie</b-button
      >
      <b-modal
        id="sessionDestroy"
        title="Naozaj uzavriet opravovanie?"
        ok-variant="danger"
        cancel-variant="primary"
        centered
        @ok="destroySession"
      >
        <p>Pri uzavreti opravovania sa zmazu nasledovne veci</p>
        <ul>
          <li>
            Riesenia a vsetko co s nimi suvisi - ak si ich chces nechat musis
            ich stiahnut na svoj pocitac
          </li>
          <li>Bodovacie kriteria</li>
        </ul>
        Ak to potvrdis, svoje stiahnute opravene riesenia uz nebudes vediet
        menit

        <template #modal-footer="{ ok, cancel }">
          <div class="float-left">
            <b-button variant="primary" @click="cancel()"> Close </b-button>
            <b-button
              variant="success"
              :disabled="downloading"
              @click="downloadAll"
            >
              <div v-if="downloading">
                <b-spinner
                  variant="secondary"
                  label="loading..."
                  v-if="downloading"
                  small
                ></b-spinner>
                Compressing
              </div>
              <div v-else>Download all</div>
            </b-button>
            <b-button variant="danger" @click="ok()">
              Uzavriet opravovanie
            </b-button>
          </div>
        </template>
      </b-modal>
      <button class="btn btn-success" @click="save">Save</button>
      <b-button variant="success" :disabled="downloading" @click="downloadAll">
        <div v-if="downloading">
          <b-spinner
            variant="secondary"
            label="loading..."
            v-if="downloading"
            small
          ></b-spinner>
          Compressing
        </div>
        <div v-else>Download all</div>
      </b-button>
      <button class="btn btn-success" @click="download">Download</button>
      <b-button variant="success" v-b-modal.noveRiesenie
        >Pridat dalsie riesenie</b-button
      >
      <b-modal
        id="noveRiesenie"
        size="lg"
        title="Pridat nove riesenie"
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
      <b-button variant="success" v-b-modal.stats>Statistiky</b-button>
      <b-modal id="stats" title="Statistiky" centered size="xl" ok-only
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
    </div>
    <div class="bottom-progress-bar" v-if="downloading">
      <b-progress max="100" show-progress animated class="h-100 w-100">
        <b-progress-bar :value="progress" animated>
          <span v-if="progress > 50"
            >Progress: {{ progress.toFixed(2) }}% | File: {{ file }}</span
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
  // eslint-disable-next-line no-unused-vars
  Document,
  Documents,
  eventHub as DocEventHub,
} from "@/DocumentManager";
import { Database } from "@/Db";
import Stats from "./Stats.vue";
import Preferences from "./Preferences.vue";

export default Vue.extend({
  components: { Stats, Preferences },
  mounted() {
    DocEventHub.$on("downloaded", () => (this.$data.downloading = false));
    DocEventHub.$on("zip-progress", (progress: number, file: string) => {
      this.$data.progress = progress;
      this.$data.file = file;
    });
    this.updateStats();
  },
  data() {
    return {
      downloading: false,
      progress: 0,
      file: "",
      noveRiesenia: [],
    };
  },
  methods: {
    save() {
      this.$emit("save");
    },
    select(dir: number) {
      this.$emit("select", dir);
    },
    download() {
      this.$emit("download");
    },
    downloadAll() {
      DocEventHub.$emit("downloadZip");
      this.$data.downloading = true;
      this.$data.progress = 0;
      this.$data.file = "";
    },
    updateStats() {},

    destroySession() {
      console.log("Destroy");
      Database.clearAllDocuments().then(() => {
        this.$router.push("/");
      });
    },
    formatNames(files: File[]) {
      return files.map((e) => activeParser.parse(e.name).riesitel).join(", ");
    },
    pridajRiesenia() {
      console.log("pridavam");

      const addOperations: Promise<void>[] = [];
      const baseLength = Documents.length;
      for (let i = 0; i < this.$data.noveRiesenia.length; i++) {
        const riesenie = this.$data.noveRiesenia[i] as File;
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
    },
  },
});
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
  transform-origin: bottom;
  height: 3vw;
  background: red;
}
</style>