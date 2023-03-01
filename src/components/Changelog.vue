<template>
  <div>
    <b-button
      v-b-toggle.changelog
      block
      variant="primary"
    >
      <h2>Čo je nové?</h2>
    </b-button>
    <b-collapse id="changelog">
      <b-card bg-variant="success">
        <b-button
          v-b-toggle.version1
          variant="secondary"
          block
        >
          <h6>3. Letná séria 2021/22</h6>
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
        <b-button
          v-b-toggle.version2
          variant="secondary"
          block
        >
          <h6>1. Zimná séria 2022/23</h6>
        </b-button>
        <b-collapse id="version2">
          <b-card bg-variant="success">
            <ul>
              <li>
                Pridané kopírovanie objektov. Vybraté objekty sa dajú kopírovať
                pomocou <kbd>Ctrl+C</kbd> a prilepiť pomocou <kbd>Ctrl+V</kbd>,
                prípadne pomocou menu pri stlačení pravého tlačidla, alebo pomocou
                tlačítok v lište s nástrojmi.
              </li>
              <li>
                Lišta s nástrojmi dostala trochu
                redesign, niektoré ikonky sú zmenené.
              </li>
              <li>🌙 Tmavý mód - aktivuj si ho v nastaveniach</li>
              <li>Použité P-mat farbičky 😁</li>
            </ul>
          </b-card>
        </b-collapse>
        <b-button
          v-b-toggle.version3
          variant="secondary"
          block
        >
          <h6>3. Zimná séria 2022/23</h6>
        </b-button>
        <b-collapse id="version3">
          <b-card bg-variant="success">
            <ul>
              <li>
                Pridané štýlovanie textu - <strong>bold</strong>, <i>italic</i>, <sup>horný</sup> a <sub>dolný</sub> index. Funguje presne tak ako by človek očakával. Klávesové skratky na štýlovanie textu zatiaľ nie sú, pribudnú niekedy v budúcnosti.
              </li>
              <li>
                Pridávanie bodov do riešenia úplne zmenené - odteraz si vieš povedať, kam chceš vložiť body do riešenia ako aj použiť obrázky namiesto čistého textu s bodmi. Funguje to zhruba takto:
                <ol>
                  <li>
                    Pridám si obrázky na bodovanie pomocou obrázkového nástroja.
                  </li>
                  <li>
                    V nastaveniach si poviem ktorý obrázok chcem použiť pri koľkých bodoch (sekcia nástroje > bodovanie > Bodovacie podpisy a obrázky)
                  </li>
                  <li>
                    Ak dám Zfinalizovať hodnotenie a kliknem kam chcem pridať body, tak sa mi tam pridá príslušný obrázok (ak nie je, tak sa pridá text)
                  </li>
                </ol>
              </li>
              <li>
                Toolbar je viac funkčný na menších obrazovkách
              </li>
              <li>
                Na obrázky sa dá nastaviť defaultný scale, nech ich netreba stále zmenšovať, ak sú vo veľkom rozlíšení. Kvalita obrázkov sa nijak nezmenší.
              </li>
            </ul>
          </b-card>
        </b-collapse>
        <b-button
          v-b-toggle.version4
          variant="secondary"
          block
        >
          <h6>1. Letná séria 2022/23</h6>
        </b-button>
        <b-collapse id="version4">
          <b-card bg-variant="success">
            <ul>
              <li>
                Pridané automatické aktualizácie. Táto verzia sa tým stáva poslednou verziu na ktorú treba aktualizovať manuálne.
                V budúcnosti sa automaticky zjaví popup, ktorý vás upozorní na novú verziu a dá vám možnosť na ňu aktualizovať jedným kliknutím.
                Ak sa v tom momente rozhodnete, že aktualizáciu ešte nechcete, tak sa vám popup zobrazí znova pri ďalšej návšteve stránky a v nastaveniach sa vám zobrazí možnosť aktualizovať.<br>
                <b>Automatické aktualizácie fungujú iba ak máte aktívne pripojenie k internetu!</b>
              </li>
              <li>
                V nastaveniach si môžete nastaviť, ktoré farby sa zobrazia ako prednastavené pri vyberaní farby (pre nástroje, tagy, ...). Stále zostáva možnosť vybrať si farbu z palety.
                <ul>
                  <li>
                    Do prednastavených farieb boli pridané dve nové farby: <a 
                      href="https://www.color-name.com/hex/e477e4"
                      target="_blank"
                      style="color: #E477E4; font-weight: bold"
                    >"Lavender Magenta"</a> a <a
                      href="https://www.color-name.com/hex/e52ae5"
                      target="_blank"
                      style="color: #E52AE5; font-weight: bold"
                    >"Steel Pink"</a>
                  </li>
                </ul>
              </li>
              <li>
                Bugfixy:
                <ul>
                  <li>Opravený problém ktorý spôsoboval, že po uzatvorení opravovania jednej úlohy ste stratili prístup aj ku ostatným úlohám</li>
                  <li>Opravená malá chyba pri generovaní zip súboru pri stiahnutí pre Arnolda</li>
                  <li>Opravené správanie pri duplicitnom načítaní úlohy (resp. niektorých riešení)</li>
                  <li>Predvolená téma zmenená zo svetlej na systémovú (takže sa zobrazí tmavá alebo svetlá podľa nastavení systému)</li>
                  <li>Obdĺžniky aj elipsy sa už dajú normálne škálovať (nedochádza k rozmazaniu pri škálovaní).</li>
                  <li>Iné interné/menšie veci</li>
                </ul>
              </li>
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
