<template>
  <div class="container">
    <img alt="Vue logo" src="../assets/logo.png" />
    <p>Vitaj v opravovacej appke</p>
    <label for="mainInput" class="inputWrapper"> </label>
    <p>{{ fileName }}</p>
    <b-form-file
      v-model="fileInput"
      accept=".zip"
      id="mainInput"
      size="lg"
      placeholder="Vloz zip, v ktorom su vsetky riesenia"
      @input="fileAdded"
    />

    <router-link
      :disabled="!hasFile"
      tag="button"
      class="text btn btn-primary btn-lg btn-block"
      to="/edit"
      >Zacat opravovat</router-link
    >
  </div>
</template>

<script lang="ts">
import { Database } from "@/Db";
import Vue from "vue";
import { loadFromDatabase, eventHub } from "../DocumentManager";

export default Vue.extend({
  name: "Home",
  components: {},
  data() {
    return {
      fileName: "Vloz Zip s PDFkami na opravovanie",
      hasFile: false,
      fileInput: null,
    };
  },
  mounted() {
    return new Promise<void>((resolve, reject) => {
      Database.getAllDocuments().then((docs) => {
        if (docs.length > 0) {
          loadFromDatabase()
            .catch((err) => reject(err))
            .then(() => {
              this.$router.push({
                name: "Editor",
              });
              resolve();
            });
        }
      });
    });
  },
  methods: {
    fileAdded: function () {
      var file = this.fileInput;
      if (file != null) {
        eventHub.$emit("parseDocuments", file);
        this.$data.fileName = file["name"];
        this.$data.hasFile = true;
      }
    },
  },
});
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