<template>
  <b-container
    fluid
    style="max-height: 100vh; overflow: hidden"
  >
    <b-jumbotron
      bg-variant="success"
      fluid
    >
      <h2 class="text-white">
        Pomoc
      </h2>
    </b-jumbotron>
    <b-button
      class="backButton"
      @click="back"
    >
      <span class="material-icons">arrow_back</span>
    </b-button>
    <b-row class="content">
      <b-col
        cols="4"
        class="h-100"
      >
        <b-navbar
          v-b-scrollspy:scrollspy-nested
          class="flex-column nav"
        >
          <b-navbar-brand href="#">
            Obsah
          </b-navbar-brand>
          <b-nav
            pills
            vertical
            class="w-100"
          >
            <b-nav-item href="#GettingStarted">
              Ako začať?
            </b-nav-item>
            <b-nav-item href="#MainView">
              Základné zobrazenie
            </b-nav-item>
            <b-nav
              pills
              vertical
            >
              <b-nav-item
                class="ml-3 my-1"
                href="#Sidebar"
              >
                Ľavá lišta
              </b-nav-item>
              <b-nav-item
                class="ml-3 my-1"
                href="#Topbar"
              >
                Horná lišta
              </b-nav-item>
            </b-nav>
            <b-nav-item href="#Tools">
              Nástroje
            </b-nav-item>
            <b-nav
              pills
              vertical
            >
              <b-nav-item
                class="ml-3 my-1"
                href="#Text"
              >
                Text
              </b-nav-item>
              <b-nav-item
                class="ml-3 my-1"
                href="#Sign"
              >
                Podpis
              </b-nav-item>
              <b-nav-item
                class="ml-3 my-1"
                href="#Rect"
              >
                Elipsa, obdĺžnik
              </b-nav-item>
              <b-nav-item
                class="ml-3 my-1"
                href="#Draw"
              >
                Kreslenie
              </b-nav-item>
              <b-nav-item
                class="ml-3 my-1"
                href="#Arrow"
              >
                Šípka
              </b-nav-item>
              <b-nav-item
                class="ml-3 my-1"
                href="#Image"
              >
                Obrázok / Pečiatka
              </b-nav-item>
            </b-nav>
            <b-nav-item href="#Settings">
              Nastavenia
            </b-nav-item>
            <b-nav
              pills
              vertical
            >
              <b-nav-item
                class="ml-3 my-1"
                href="#ToolsSettings"
              >
                Nástroje
              </b-nav-item>
              <b-nav-item
                class="ml-3 my-1"
                href="#Shortcuts"
              >
                Klávesové skratky
              </b-nav-item>
              <b-nav-item
                class="ml-3 my-1"
                href="#OtherSettings"
              >
                Ostatné
              </b-nav-item>
            </b-nav>
            <b-nav-item href="#Scoring">
              Bodovanie
            </b-nav-item>
            <b-nav-item href="#Tags">
              Tagy
            </b-nav-item>
            <b-nav-item href="#NotWorking">
              Niečo nefunguje?
            </b-nav-item>
          </b-nav>
        </b-navbar>
      </b-col>

      <b-col
        cols="8"
        class="h-100"
      >
        <div
          id="scrollspy-nested"
          style="position: relative; height: 100%; overflow-y: auto"
        >
          <h4
            id="GettingStarted"
            style=""
          >
            Ako začať?
          </h4>
          Používanie arnolda je jednoduché, na začatie opravovania sú potrebné
          len 3 kroky:
          <ol>
            <li>
              Stiahnutie zip súboru z
              <a href="https://interne.p-mat.sk">interných</a>(zip súbor netreba
              extrahovať, o to sa už postarám 😎).
            </li>
            <li>Súbor nahráš do mojej hlavnej stránky.</li>
            <li>
              Po chvíli sa zobrazia všetky riešenia roztriedené po
              kategóriach, z ktorých si vyberieš tie, ktoré ideš opravovať.
            </li>
            <li>Klikneš začať opravovať a môžeš opravovať.</li>
          </ol>
          <i>
            Pokiaľ máš dosť rýchly počítač, tak vieš vybrať všetky kategórie,
            ale pri viac ako 100 riešeniach načítaných naraz zvyknem byť celkom
            spomalený, takže ak chceš aby som bol rýchly🚀, otvor čo najmenej
            riešení naraz
          </i>
          <br>
          <h6>Inštalácia</h6>
          <p>
            Ak chceš, aby som fungoval aj offline, tak si ma vieš nainštalovať.
            Tento krok je nepovinný, nemusíš ma mať nainštalovaného, aby som bol
            plne funkčný. Ak si ma nainštaluješ, tak ma vieš nájsť medzi svojimi
            aplikáciami ako aj na svojej pracovnej ploche.
          </p>
          <b-alert
            show
            variant="danger"
          >
            Ak si na chrome, tak je veľmi odporúčané si Arnolda nainštalovať a
            pridať do záložiek, inak v prípade málo miesta na disku vie Chrome
            automaticky premazať riešenia bez upozornenia. V prípade Firefoxu treba
            povoliť persistent storage.
          </b-alert>
          <img
            src="@/assets/Help/Install.png"
            class="img"
          >
          <h4
            id="MainView"
            style=""
          >
            Základné zobrazenie
          </h4>
          <img
            src="@/assets/Help/Main-edited.png"
            class="mw-100 img"
          >
          <h5
            id="Sidebar"
            style=""
          >
            Ľavá lišta
          </h5>
          <p>Hore vieš vyhľadávať podľa mena a keď si to rozbalíš, pomocou modrého tlačidla, tak vieš riešenia filtrovať aj podľa <a href="#Tags">tagov</a> a kategórií. Pod hľadaním vieme nájsť jednotlivé riešenia. Každé riešenie má vyobrazených 6 údajov:</p>
          <ul>
            <li>Meno riešiteľa</li>
            <li>Jeho kategóriu (5,6,7,8,9,Pri,Sek,Ter,Kva)</li>
            <li>Či jeho riešenie obsahuje komentár (Zmení sa ikonka vedľa kategórie)</li>
            <li>Zadané body</li>
            <li>Či už boli body finalizované</li>
          </ul>
          <p>V prípade, že máš malú obrazovku, sa ľavá lišta dá skryť pomocou zelenej šípky dole</p>
          <h5
            id="Topbar"
            style=""
          >
            Horná lišta
          </h5>
          <p>Vysvetlenie jednotlivých tlačidiel:</p>
          <ul>
            <li><b>Uzavrieť opravovanie</b> - Zmaže všetky riešenia a pripraví Arnolda na použitie pri ďalšej sérii. Pri stlačení sa zobrazí varovný popup, takže sa nemusíte báť, že si to omylom zmažete</li>
            <li><b>Uložiť</b> - Uloží terajšie riešenie. Ekvivalent sa stane ak prepneš na ďalšie riešenie a máš zapnutý AutoSave, alebo stlačíš <kbd>CTRL+S</kbd>, alebo inú skratku akú si nastavíš</li>
            <li><b>Stiahnuť všetky</b> - Vyexportuje všetky <b>Obodované</b> riešenia a stiahne ti do počítača jeden zip</li>
            <li><b>Stiahnuť</b> - stiahne ti otvorené riešenie</li>
            <li><b>Pridať ďalšie riešenie</b> - otvorí ti okno, kde vieš pridať niekoľko ďalších riešení ako PDFka.</li>
            <li><b>Štatistiky a Nastavenia</b> - otvoria ti okná o ktorých viac nájdeš ďalej</li>
          </ul>
          <h4
            id="Tools"
            style=""
          >
            Nástroje
          </h4>
          <p>
            Narábanie s nástrojmi je celkom intuitívne - rovnaké ako pri
            ostatných pdfkových editoroch. Poskytujem zatiaľ 6 základných
            nástrojov na písanie do riešení - Text, Kreslenie, Šípka, Elipsa,
            Obdĺžnik, Podpis
          </p>
          <i>Ďalšie nástroje ako obrázok možno pribudnú neskôr.</i>
          <h5
            id="Text"
            style=""
          >
            Text
          </h5>
          <p>
            Keď mám vybratý nástroj text, tak kliknutím na riešenie viem pridať
            textové pole. Viem mu meniť veľkosť a dokonca aj otáčať. Text viem
            meniť dvojkliknutím.
          </p>
          <h5
            id="Sign"
            style=""
          >
            Podpis
          </h5>
          <p>
            Nástroj podpis je asi ako jediný menej intuitívny, jeho použitie
            pozostáva z 2 krokov.
          </p>
          <img
            src="@/assets/Help/SignModal.png"
            class="img"
          >
          <ol>
            <li>
              Kliknem Open Sign Menu a otvorí sa mi okno sa editovanie podpisov.
              Keď kliknem na plus, tak viem vytvoriť nový podpis, ktorý si potom
              nakreslím, ako má vyzerať. Keď zavriem okno stlačením OK, tak
              podpis viem použiť.
            </li>
            <li>
              Ak už mám podpis nakreslený viem ho jedným klikom pridať do
              riešenia ako takú pečiatku. Viem ho potom posúvať, aj zmenšovať,
              prípadne zväčšovať. Zároveň teraz je ten moment, kedy viem
              nastaviť farbu ako aj hrúbku čiary môjho podpisu.
            </li>
          </ol>
          <h5
            id="Rect"
            style=""
          >
            Elipsa, obdĺžnik
          </h5>
          <p>Najskôr kliknutím pridám, potom viem nastaviť veľkosť.</p>
          <h5
            id="Draw"
            style=""
          >
            Kreslenie
          </h5>
          <p>
            Kreslím po riešení, viem si nastaviť veľkosť a šírku čiary, ktorou
            kreslím.
          </p>
          <h5
            id="Arrow"
            style=""
          >
            Šípka
          </h5>
          <p>
            Potiahnutím myši vytvorím šípku, potom viem ešte prípadne poposúvať
            konce.
          </p>
          <h5
            id="Arrow"
            style=""
          >
            Obrázok
          </h5>
          <p>
            Obrázky fungujú podobne ako podpisy. Otvorím si menu s obrázkami a
            môžem si tam pridať obrázok aký chcem. Formát obrázka ale musí byť
            PNG, inak nebude fungovať. Potom viem rovnako ako pri podpisoch
            kliknúť na stránku a pridať obrázok do riešenia.
          </p>
          <h4
            id="Settings"
            style=""
          >
            Nastavenia
          </h4>
          <img
            src="@/assets/Help/Settings.png"
            class="img"
          >
          <p>
            Viem ich zobraziť kliknutím na tlačidlo nastavenia v hornej lište.
            Nastavenia majú v sebe 3 kategórie - Nástroje, klávesové skratky,
            ostatné.
          </p>
          <h5
            id="ToolsSettings"
            style=""
          >
            Nástroje
          </h5>
          <p>
            Tu si viem nastaviť základné nastavenie pre všetky nástroje, aby som
            nemusel stále meniť farbu a veľkosť textu. Nástroj scoring slúži na
            štýly pre text s bodmi. o bodovaní zistíš viac v sekcií
            <a href="#Scoring">bodovanie</a>.
          </p>
          <h5
            id="Shortcuts"
            style=""
          >
            Klavesové skratky
          </h5>
          <p>
            Tu vieš si nastaviť všetky klávesové skratky, ktoré Arnold používa,
            tak aby ti boli pohodlné. To, že ako sa nastavujú nájdeš priamo v
            nastaveniach.
          </p>
          <h5
            id="OtherSettings"
            style=""
          >
            Ostatné
          </h5>
          <p>
            Vysvetlenie ostatných nastavení:
            <ul>
              <li>Ukázať preview - Má sa ukazovať v ľavej lište preview? Možno sa oplatí vypnúť ak je problém s výkonom, alebo malou obrazovkou</li>
              <li>AutoSave - majú sa ukladať riešenia pri prepnutí? Je veľmi odporúčané nechať zapnuté, ale ak to vypneš, tak sa vieš rýchlejšie prepínať medzi riešeniami.</li>
              <li>Ukázať Timer - či sa má pri každom riešení ukazovať časovač, koľko ste na ňom strávili času. Dopredu upozorňujem, že časovače nefungujú až tak dobre (niekedy ukazujú zlý čas).</li>
            </ul>
          </p>
          <h4
            id="Scoring"
            style=""
          >
            Bodovanie
          </h4>
          <p>
            Arnold disponuje taktiež systémom na bodovanie. Keď si rozbalíš
            bodovacie okno, vieš napísať body pre dané riešenie. Taktiež si tu
            vieš definovať svoju bodovaciu schému, že za čo dávaš koľko bodov.
            Potom si len vyklikáš, ktoré kritéria boli splnené a Arnold ti zráta
            body. Stlačením zfinalizuj hodnotenie automaticky pridáš body do
            riešenia a v ľavej lište sa ti ukáže, že toto riešenie už má finálne
            body - poznámka pre mňa, že v tomto riešení tie body už neplánujem
            meniť (V budúcnosti sa tie body možno aj rovno nahrajú na stránku).
          </p>
          <h4
            id="Tags"
            style=""
          >
            Tagy
          </h4>
          <p>
            Tagy slúžia hlavne na filtrovanie riešení. Pomocou tagov si viem každé
            riešenie označiť napríklad podľa toho, či to má riešiteľ dobre, alebo
            si ukladať riešenie na neskôr ak sa s ním práve nechcem zaoberať. Ak
            kliknem na upraviť tagy, tak viem jednoducho pridať tag, pomenovať ho
            a zmeniť mu aj farbu. Ak mám tagy definované viem ich pridavať do
            jednotlivých riešení.
          </p>
          <p>
            Ak chcem zobraziť len riešenia s tagom "Super", tak stačí si rozbaliť
            vyhľadávanie a napísať tam moje tagy.
          </p>
          <h4
            id="Stats"
            style=""
          >
            Štatistiky
          </h4>
          <p>
            Pomocou horného tlačidla štatistiky si vieš pozrieť nejaké dáta a svojom opravovaní. Vidíš tam 4 rôzne veci:
            <ul>
              <li><b>Otvorené</b> - na koľko riešení si sa už pozrel</li>
              <li><b>Komentár</b> - v koľkých riešeniach si už niečo napísal pomocou nástroju text</li>
              <li><b>Obodovane</b> - počet riešení, ktorým si priradil body. Túto časť vieš rozkliknúť a pozrieť si celkové rozloženie bodov v koláčovom grafe.</li>
              <li><b>Hotovo</b> - riešenia, ktoré majú komentár aj finálne body, takže sú pripravené na stiahnutie a uploadnutie na stránku.</li>
            </ul>
          </p>
          <img
            src="@/assets/Help/StatsModal.png"
            class="img"
          >
          <h4
            id="NotWorking"
            style=""
          >
            Niečo nefunguje?
          </h4>
          <p>2 základné kroky:</p>
          <ul>
            <li>
              Obnovenie stránky (<kbd>CTRL+R</kbd>). Ak by ste obnovovali často kvôli tej istej veci,
              tak napíšte na slack do kanálu #arnold.
            </li>
            <li>
              Ak ani obnovenie nepomohlo, tak asi jediná možnosť je napísať na slack do kanálu #arnold.
            </li>
          </ul>
        </div>
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';

@Component
export default class Help extends Vue {
  back() {
    this.$router.back()
  }
}
</script>

<style>
.img {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 700px;
  margin-top: 20px;
  margin-bottom: 20px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}
.content {
  height: calc(100vh - 205px);
}
.content:first-child::-webkit-scrollbar {
  display: none;
}
h4,
h5,
h6 {
  margin-top: 2rem;
}
.backButton {
  position: absolute;
  top: 60px;
  left: 20px;
}
</style>
