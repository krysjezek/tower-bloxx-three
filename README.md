# Tower Bloxx Three.JS Game

Tower Bloxx bývala legendární hra na mobilních telefonech Nokia. Princip je jednoduchý - stavět vež z kostiček, které musí hráč trefit na sebe aby mu věž nespadla.
Tato aplikace je pokus o oživení této hry v prostředí webové aplikace pomocí WebGL.

Cílem projektu bylo vytvořit klon hry Tower Bloxx s použitím technologie Three.js a Cannon.js, které umožňují vykreslování 3D grafiky ve webovém prostředí. Mým osobním cílem bylo ozkoušet si tyto technologie v rámci React aplikace a rozšířit své znalosti v oblasti WebGL a celkově implementace 3D hry.

Hlavní funkčnost hry spočívá v simulaci stavby věží. Pomocí Three.js, knihovny pro 3D grafiku, a Cannon.js, fyzikální knihovny pro JavaScript, hráči mají možnost vytvářet věže skládáním bloků, přičemž musejí dávat pozor aby jim věž nespadla v důsledku nepřesného položení dalšího blocky.

Navíc je implementováno ukládání skóre do Firestore, což je cloudová databáze od společnosti Google. Po dokončení hry je skóre hráče odesláno do Firestore, kde je uchováno společně s informacemi o hráči. Poté je zobrazováno na žebříčku (leaderboards), kde hráči mohou porovnávat své skóre s ostatními hráči a soutěžit o nejvyšší pozice.

## Body hodnotící tabulky

### HTML - Validita

Vše podle validatoru od W3 je validní:
https://validator.w3.org/nu/?doc=https%3A%2F%2Ftower-bloxx-three.web.app%2F

Testoval jsem aplikaci na různých zařízeních i prohlížečích a fungovala správně.

### HTML - Sémantické značky

* Menu je `<nav>`
* Doplňkové informace jsou `<aside>`
* Leaderboard je `<section>`
* Hlavní obrazovky jsou v `<main>`

### HTML - Grafika SVG / Canvas

Three JS využívá k renderování WebGL, které vykresluje 3D grafiku a výstupem je kreslení na canvas v html dokumentu.

### HTML - Média - Audio/Video

Background hudba, kod v App.jsx

```
<audio id="background-music" loop>
    <source src="./music.mp3" type="audio/mp3" />
    Your browser does not support the audio element.
</audio>
```

### HTML - Formulářové prvky

Formulář pro ukládání skore:

* autoFocus
* required
* validace typu
* placeholder

```
<form onSubmit={(e) => {
    e.preventDefault();
    if (name.trim() === '') {
        alert('Please enter a name.');
        return;
    }
    handleSaveScore();
}}>
    <div className='score-tab'>
        <div>SCORE</div>
        <div className='score'>{score}</div>
    </div>
    <div className='save-score'>
        <label htmlFor="name">Enter your name:</label>
        <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            required
        />
        <label htmlFor="email">Email (optional):</label>
        <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
        />
        <button className='button-yellow' type="submit">Save Score</button>
    </div>
</form>
```

### HTML - Offline aplikace

Není

### CSS - Pokročilé selektory

U leaderboard, každý druhý řádek je tmavší

```
tbody tr:nth-child(even) {
  background-color: rgb(48, 48, 48);
}
```

### CSS - Vendor prefixy

Například u tlačítek v App.css

```
  -webkit-border-radius: 20px;
  -moz-border-radius: 20px;
  -o-border-radius: 20px;

```

Nebo

```
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px rgb(20, 20, 20);
  border-radius: 10px;
}
```

### CSS - Transformace 2D/3D

Například tlačítko při hover, mění pozici, nebo interaktivní kolečka na hlavní obrazovce (implementace v assets/InteractiveCircles.css)

### CSS - Transitions Animace

U tlačítka jsou animace při hover

`transition: transform 0.2s ease, box-shadow 0.2s ease, top 0.2s ease;`

nebo u InteractiveCircles

`animation: rotate 1s linear;`

### CSS - Media queries

Funguje, lze vidět v App.css

`@media (max-width: 768px)`

### JS - OOP Přístup

Třída GameObject reprezentuje základní herní objekt v Three, dědí z ní Block (stavební kostka věže) a Cloud (mrakt, které se postupně generují).

### JS - Použítí JS frameworku

React (aplikace), Vite (aplikace), Three (3d grafika), Canon (fyzika)

### JS - Použítí JS API

Three JS, Cannon JS a LocalStorage pro uložení skore do cache

Popis funkčnosti LocalStorage:
* Při ukládání skore se uloží jméno hráče do localStorage
* Při načtení skore v LeaderBoards se u jména daného hráce napíše (you) a celé jméno je ve zlaté barvě

### JS - Historie

Funguje. Navigace mezi obrazovkami. Implementace v App.jsx

### JS - Ovládání medií

U background hudby

```
const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing music:", error);
        });
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };
```

### JS - Offline aplikace

Není

### JS - JS Práce se SVG

Asi by se za tento bod dala považovat i implementace Three JS nicméně jsem přidal Interaktivní kolečka do Main menu. Implementace v assets/InteractiveCircle.jsx



