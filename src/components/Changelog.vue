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
            pdf sa pri otáčaní výrazne zmenší, čo urýchli potom prepínanie
            medzi obrázkovými riešeniami. Upload na stránky funguje 😉, stačí
            kliknúť Download All > stiahnuť pre stránky.
          </b-card>
        </b-collapse>
        <b-button variant="secondary" v-b-toggle.version2 block>
          <h6>1.Zimná séria 2023</h6>
        </b-button>
        <b-collapse id="version2">
          <b-card bg-variant="success">
            <ul>
              <li>Pridané kopírovanie objektov. Vybraté objekty sa dajú kopírovať
            pomocou <kbd>Ctrl+C</kbd> a prilepiť pomocou <kbd>Ctrl+V</kbd>,
            prípadne pomocou menu pri stlačení pravého tlačidla, alebo pomocou
            tlačidiel v lište s nástrojmi. </li>
            <li>Lišta s nástrojmi dostala trochu
            redesign, niektoré ikonky sú zmenené. </li>
              <li>🌙 Tmavý mód - aktivuj si ho v nastaveniach</li>
              <li>Použité P-mat farbičky 😁</li>
            </ul>
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
