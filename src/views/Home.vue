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

      <hr class="my-4" />

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
    </b-jumbotron>
    <label for="mainInput" class="inputWrapper"> </label>
    <b-alert :show="getDocumentCount() > 120" dismissible variant="warning">
      Pri takychto vysokych počtoch riešení som nestabilný a spomalený. Prosím
      otvor radšej menej kategórii naraz a potom sa možeš prepnúť cez túto
      stránku.
    </b-alert>
    <div v-if="hasDocuments === false">
      <p>{{ fileName }}</p>
      <b-form-file
        v-model="fileInput"
        accept=".zip"
        id="mainInput"
        size="lg"
        placeholder="Vloz zip, v ktorom su vsetky riesenia"
      />
      <b-form-file
        v-model="backupInput"
        accept=".json"
        id="backupInput"
        size="md"
        placeholder="Backup súbor (Backup_xxxxxxx.json)"
      />
      <b-button @click="start">Načítaj</b-button>
    </div>

    <hr />
    <div v-if="hasDocuments">
      <b-list-group v-if="hasDocuments">
        <b-list-group-item variant="primary">
          <h3>Vyber si kategórie, ktoré ideš opravovať</h3>
        </b-list-group-item>
        <b-list-group-item
          :active="category.enabled"
          v-for="category in categories.filter((e) => e.count > 0)"
          :key="category.name"
          @click="category.enabled = !category.enabled"
        >
          <div class="categoryEntry">
            <div>{{ category.name }}</div>
            <div>{{ category.count }} riešení</div>
          </div>
        </b-list-group-item>
      </b-list-group>
      <p>
        Vybrate {{ categories.filter((e) => e.enabled).length }} kategórie,
        dokopy
        {{ getDocumentCount() }}
        riešení
      </p>
    </div>
    <hr />
    <b-button
      :disabled="getDocumentCount() == 0"
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
import { Database } from "@/Db";
import Vue from "vue";
import { loadFromDatabase, readZip } from "../DocumentManager";
import { Document, DocumentParser } from "@/@types";
import { PMatParser } from "@/DocumentParser";
import Component from "vue-class-component";

interface Category {
  name: string;
  count: number;
  enabled: boolean;
}

@Component
export default class Home extends Vue {
  fileName: string = "Vloz Zip s PDFkami na opravovanie";
  hasFile = false;
  fileInput: File | undefined = undefined;
  backupInput: File | undefined = undefined;
  hasDocuments: boolean = false;
  problem: string = "";
  categories: Array<Category> = [];

  mounted() {
    this.requestStorage();
    Database.getAllDocuments().then((docs) => {
      this.hasDocuments = docs.length > 0;
      if (this.hasDocuments) {
        this.problem = localStorage.getItem("uloha") || "";
        const parser = new PMatParser(this.problem);
        this.getCategories(docs, parser);
      }
    });
  }
  getCategories(docs: Document[], parser: DocumentParser) {
    this.categories = parser.kategorie.map((e) => {
      return {
        name: e,
        enabled: false,
        count: 0,
      };
    });
    for (let i = 0; i < parser.kategorie.length; i++) {
      const category = this.categories[i];
      category.count = docs.filter(
        (e) => e.kategoria == category.name
      ).length;
      this.categories[i] = category;
    }
    console.log(this.categories);
  }
  start() {
    const file = this.fileInput;
    if (file != null) {
      this.fileName = file["name"];
      this.hasFile = true;
      readZip(file, this.backupInput).then((val) => {
        this.hasDocuments = val.docs.length > 0;
        this.problem = localStorage.getItem("uloha") || "";
        this.getCategories(val.docs, val.parser);
      })
    }
  }
  openEditor() {
    const categoriesEnabled = this.categories
      .filter((e) => e.enabled)
      .map((e) => e.name);
    localStorage.setItem("categories", JSON.stringify(categoriesEnabled));
    return new Promise<void>((resolve, reject) => {
      loadFromDatabase()
        .then((docs) => {
          setTimeout(() => {
            this.$router
              .push({
                name: "Editor",
                params: {
                  doc: docs[0].id.toString(),
                },
              })
              .then(() => resolve);
          }, 500);
        })
        .catch((err) => reject(err));
    });
  }
  getDocumentCount() {
    let count = 0;
    for (const cat of this.categories) {
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
          this.$bvModal.msgBoxOk(`Nepodarilo sa mi dostať povolenie na persistentné ukladanie riešení na disku. 
            V prípade málo miesta môžu byť rozopravované riešenia zmazané bez upozornenia. 
            Ak si v chrome, uisti sa, že som nainštalovaný, mám povolené notifikácie a som pridaný do bookmarkov. 
            Ak si vo Firefoxe, tak si mi nepovolil persistent storage.`, {
            okVariant: 'warning'
          });
        }
      });
    }
    else {
      this.$bvModal.msgBoxOk(`Nemám Storage, nebudem vedieť nič ukladať`, {});
    }
  }
}
</script>

scrip

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
/* .inputWrapper {
  width: 100%;
  height: 30vh;
  background: rgba(128, 128, 128, 0.336);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.inputWrapper p {
  color: rgb(83, 81, 81);
} */
</style>