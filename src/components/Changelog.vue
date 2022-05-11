<template>
  <div>
    <b-button block variant="primary" v-b-toggle.changelog>
      <h2>Čo je nové?</h2>
    </b-button>
    <b-collapse id="changelog">
      <b-card bg-variant="success">
        <b-button variant="secondary" v-b-toggle.version1 block>
          <h6>3.Letná séria 2022</h6>
        </b-button>
        <b-collapse id="version1">
          <b-card bg-variant="success">
            Otáčanie PDFiek funguje bez komplikácii, opravené zväčšovanie
            otočených súborov ako aj urezávanie z obrázkov pri otáčaní. Veľkosť
            pdf sa pri otáčaní výrazne zmenší, čo urýchli potom switchovanie
            medzi obrázkovými riešeniami. Upload na stránky funguje 😉, stačí
            kliknúť Download All > stiahnuť pre stránky.
          </b-card>
        </b-collapse>
      </b-card>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({})
</script>