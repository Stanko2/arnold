<template>
  <div class="container">
    <b-jumbotron
      bg-variant="success"
      text-variant="white"
      border-variant="dark"
    >
      <template #header>Vitaj v Arnoldovi</template>

      <template #lead>
        Arnold je jednoduchá aplikácia na pomoc pri opravovaní riešení v
        korešpodenčných seminároch Pikomat a Pikofyz.
      </template>

      <hr class="my-4">

      <p>
        <strong>Chceš opravovať?</strong>
        Stiahni zip s riešeniami z interných, vlož ho sem a môžme sa do toho
        hneď pustiť 😎.
      </p>
      <p>
        Potrebuješ s niečím pomôcť? Klikni
        <router-link to="Help">sem</router-link>
      </p>
      <p>
        Pri zapnutí po dlhšom čase ma nezabudni
        <b-link @click="reload()">aktualizovať</b-link>
      </p>
      <changelog class="p-2" />
    </b-jumbotron>
    <!-- <label for="mainInput" class="inputWrapper"> </label> -->
    <b-alert :show="getDocumentCount() > 120" dismissible variant="warning">
      Pri takýchto vysokých počtoch riešení som nestabilný a spomalený. Prosím
      otvor radšej menej kategórii naraz a potom ich môžeš prepnúť cez túto
      stránku.
    </b-alert>
    <b-card v-if="hasDocuments" header="Vyber si kategórie, ktoré ideš opravovať" header-tag="h3" header-bg-variant="primary">
      <b-row v-if="$store.state.loadedProblems.size > 1" class="mb-3" align-v="center">
        <b-col :cols="4"><h5 class="m-auto">Úloha:</h5></b-col>
        <b-col :cols="8">
          <b-form-select v-model="problem">
            <b-form-select-option v-for="p in $store.state.loadedProblems" :key="p" :value="p">{{ p }}</b-form-select-option>
          </b-form-select>
        </b-col>
      </b-row>
      <div v-if="categories !== undefined && categories[problem] !== undefined">
        <b-list-group >
          <b-list-group-item
            :active="category.enabled"
            v-for="category in categories[problem].filter((e) => e.count > 0)"
            :key="problem + category.name"
            @click="toggleCategory(category)"
          >
            <div class="categoryEntry">
              <div>{{ category.name }}</div>
              <div>{{ category.count }} riešení</div>
            </div>
          </b-list-group-item>
        </b-list-group>
        <p>
          Vybrané {{ categories[problem].filter((e) => e.enabled).length }} kategórie,
          dokopy
          {{ getDocumentCount() }}
          riešení
        </p>
      </div>
    </b-card>
    <div v-if="hasDocuments == null" class="text-center">
      <b-spinner variant="primary"></b-spinner>
    </div>
    <b-card header="Pridať novú úlohu" header-tag="h2" header-bg-variant="secondary">
      <p>{{ fileName }}</p>
      <b-form-file
        v-model="fileInput"
        accept=".zip"
        id="mainInput"
        size="lg"
        placeholder="Vlož zip, v ktorom sú všetky riešenia"
      />
      <b-button @click="start">Načítaj</b-button>
    </b-card>
    <hr>
    <b-button
      :disabled="getDocumentCount() === 0"
      size="lg"
      block
      variant="primary"
      class="text"
      @click="openEditor()"
      >Opravovať {{ problem }}</b-button
    >
  </div>
</template>

<script lang="ts">
import {Database} from "@/Db";
import Vue from "vue";
import {loadFromDatabase} from "../Documents/DocumentManager";
import {readZip} from "../Documents/Serializer";
import {Document, DocumentParser} from "@/@types";
import {PMatParser} from "@/Documents/DocumentParser";
import Component from "vue-class-component";
import Changelog from "@/components/Changelog.vue";

interface Category {
  name: string;
  count: number;
  enabled: boolean;
}

@Component({ components: { Changelog } })
export default class Home extends Vue {
  fileName: string = "Vlož Zip s PDFkami na opravovanie";
  hasFile = false;
  fileInput: File | null = null;
  backupInput: File | undefined = undefined;
  hasDocuments: boolean | null = null;
  get problem(): string {
    return this.$store.state.currentProblem;
  }
  set problem(val: string) {
    this.$store.commit('setActiveProblem', val);
  }
  categories: Record<string, Array<Category>> = {};

  mounted() {
    this.requestStorage();
    this.$store.commit('loadData');
    Database.getAllDocuments().then((docs) => {
      this.hasDocuments = docs.length > 0;
      if (this.hasDocuments) {
        const parser = new PMatParser(this.problem);
        this.getCategories(docs, parser);
      }
    });
    this.eventHub.$emit("editor:setDocument", -1);
  }

  toggleCategory(category: Category){
    category.enabled = !category.enabled;
    this.$forceUpdate();
  }

  getCategories(docs: Document[], parser: DocumentParser) {
    for (const problem of this.$store.state.loadedProblems) {
      this.categories[problem] = parser.kategorie.map((e) => {
        return {
          name: e,
          enabled: false,
          count: 0,
        };
      });
      for (let i = 0; i < parser.kategorie.length; i++) {
        const category = this.categories[problem][i];
        category.count = docs.filter(
          (e) => e.kategoria == category.name && e.problem == problem
        ).length;
        this.categories[problem][i] = category;
      }
    }
    console.log(this.categories);
  }
  async start() {
    const file = this.fileInput;


    if (file != null) {
      this.fileName = file["name"];
      this.hasFile = true;
      this.hasDocuments = null;
      const currDocs = await Database.getAllDocuments();
      const val = await readZip(file);
      this.hasDocuments = val.docs.length > 0;
      this.getCategories(val.docs.concat(currDocs), val.parser);
      this.$forceUpdate();
    }
  }
  openEditor() {
    const categoriesEnabled = this.categories[this.problem]
      .filter((e) => e.enabled)
      .map((e) => e.name);
    localStorage.setItem("categories", JSON.stringify(categoriesEnabled));
    return new Promise<void>((resolve, reject) => {
      loadFromDatabase(this.$store.state.currentProblem)
        .then((docs) => {
          this.$router
            .push({
              name: "Editor",
              params: {
                doc: '-1',
              },
            })
            .then(() => {
              resolve();
            }).catch((err) => console.error(err));
        })
        .catch((err) => console.error(err));
    });
  }
  getDocumentCount() {
    let count = 0;
    const categories = this.categories[this.problem] || []
    for (const cat of categories) {
      if (cat.enabled) {
        count += cat.count;
      }
    }
    return count;
  }
  reload() {
    (window.location as any).reload(true);
  }
  requestStorage() {
    if (navigator.storage) {
      navigator.storage.persisted().then((isPersisted) => {
        if (!isPersisted) {
          navigator.storage.persist().then((accepted) => {
            if (!accepted) {
              this.$bvModal.msgBoxOk(`Nepodarilo sa mi dostať povolenie na persistentné ukladanie riešení na disku.
                V prípade málo miesta môžu byť rozopravované riešenia zmazané bez upozornenia.
                Ak si v Chrome, uisti sa, že som nainštalovaný, mám povolené notifikácie a som pridaný do záložiek.
                Ak si vo Firefoxe, tak si mi nepovolil persistent storage.`, {
                okVariant: 'warning'
              });
            }
          })
        }
      });
    }
    else {
      this.$bvModal.msgBoxOk(`Nemám Storage, nebudem vedieť nič ukladať`, {});
    }
  }
}
</script>

<style>
.text {
  color: black;
}
img {
  margin: 0 auto;
}
input[type="file"] {
  display: none;
}
.categoryEntry {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
