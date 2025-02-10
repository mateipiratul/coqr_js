# **COQR by S&M**

Script scris de Cocu Matei-Iulian (grupa 152) și Smădu Andrei (grupa 143)
## **Descriere**
Proiectul echipei noastre (*S&M*) constă într-o pagină HTML interactivă simplistă, care oferă posibilitatea de a alege una dintre primele 5 variante de cod QR. Utilizatorul poate selecta:

- **Nivelul de corecție a erorilor** (Low, Medium, Quartile & High);
- **Una dintre cele 8 măști** standardizate internațional;
- **Calculul automat al celei mai coerente măști** pentru codul QR generat.

Conținutul acestui text documentație este împărțit în două secțiune simplificate: [**funcționalitatea generală**](#generarea-codului-qr) a implementării scriptului și o [**explicație ulterioară**](#elaborarea-algoritmilor-folosiți) în detaliu a ideilor din spatele algoritmilor utilizați pentru *procedeele mai complexe* din script.

[*Către Bibliografie*](#referințe-utilizate-bibliografie)

Codul QR este o **matrice pătratică**, dimensiunea sa fiind dedusă conform formulei:
`dimensiune = 17 + 4 *v_qr`, unde `v_qr` este numărul versiunii codului QR ales, iar indexarea fiind realizată de la poziția `(0, 0)`.

## **Generarea codului QR**

La apăsarea butonului de generare, codul QR este afișat **(funcția `drawTable`** inițializează matricea cu biți gri, sugestiv ideii că biții **nu au fost colorați,** fiind apelată funcția **`drawPixel` de fiecare dată când este necesar acest lucru)**, iar implementarea parcurge următorii pași:

### **1) Encodarea zonelor fixe**
Pentru aceste zone, este declarat un **vector global de dubleți**, fiecare element reprezentând poziția unui bit sub forma \( (x, y) \). Această informație este necesară pentru algoritmul de umplere a matricei QR.
- **a)** **Generarea de Timing Patterns**
    - Apel la funcția `drawTimingPatterns`
    - Situate pe rândul 6 și coloana 6;
    - Reprezintă linii de biți intermitenți (alb/negru), începând cu bitul negru;

- **b)** **Generarea de Finder Patterns**
    - Cele 3 zone din colțurile codului QR, mărginite corespunzător cu biți albi;
    - Apel la funcția `drawFinderPatterns`
    - 
- **c)** **Generarea de Alignment Pattern**
    - Pătratul de dimensiune mai mică din colțul de jos-dreapta;
    - Aplicat tuturor versiunilor (cu excepția Version 1 - 21x21);
    - Necesar pentru decodificarea poziționării și a unghiului de scanare.
    - Apel la funcția `drawAlignmentPattern`

- **d)** **Rezervarea zonelor dimprejurul Finder Patterns**
    - Necesare pentru generarea ulterioară a Format String-ului.
    - Cei 15 biți de informație sunt calculați cu ajutorul funcției `eccFormatString` și encodați în matricea codului QR cu `drawFormatString`
---

### **2) Prelucrarea datelor și generarea informației**
Fiecare matrice are un **număr fix de bytes utilizabili**, împărțiți în funcție de nivelul de corecție a erorilor. Valorile sunt **hard-coded** conform standardelor internaționale.

- **a)** Determinarea **indicatorului modulului** (4 biți) în funcție de tipul de caractere din input:
    - Numeric (doar cifre);
    - Alfanumeric (cifre și litere);
    - ASCII (toate caracterele codului ASCII).
    - *(Pentru simplitate, toate informațiile sunt codificate pe 8 biți după codul ASCII.)*

- **b)** Determinarea **numărului de caractere** din input (codificat pe 8 biți);
- **c)** Formatarea **binara a conținutului** input-ului;
- **!** Determinarea informațiilor acestor pași este realizată de funcția `convertToBinary` 
- **d)** Adăugarea **terminatorului de conținut** (4 biți de `0`);
- **e)** **Padding bytes**: intermitent, se adaugă `0xEC` și `0x11` până la completarea numărului maxim de bytes.
- Pentru această prelucrare este nevoie de `padData`
---

### **3) Generarea codurilor de corecție a erorilor (ECC)**
Folosind șirul binar generat anterior, se determină **Error Correction Codewords (ECC)**, care permit recuperarea informației în cazul deteriorării vizuale a codului QR.

- Se utilizează *câmpul Galois* și *algoritmul Reed-Solomon*;
- Datele sunt transformate în **valori între [0, 255]** și tratate ca **indici ai unui polinom**;
- Se calculează **restul împărțirii** la un **polinom generator**, rezultatul fiind **bytes de corectare a erorilor**;
- Se folosesc **funcțiile**:
    - `generatePolynomial`;
    - `reedSolomonEncode`;
    - **clasa** `GaloisField`.

---

### **4) Encodarea informației și a codurilor de corecție**
Informația este plasată în matrice conform unui **algoritm de umplere în zig-zag**; de asemenea este esențial ca *String-urile* de 8 biți să fie inversate înainte să fie furnizate (bitul cel mai semnificativ *(MSB)* este pe prima poziție din cele 8, iar bitul cel mai puțin semnificativ *(LSB)* este pe ultima poziție).

- Se ține cont de **vectorul de poziții rezervate**;
- Biții sunt plasați intermitent **de jos în sus și de sus în jos**;
- 7 biți rămân neutilizați (`rest bits`), fiind setați pe `0` (alb);
- Se generează **Format String-ul**:
    - 5 biți de informație;
    - 10 biți pentru corecția erorilor;
    - Format: `[2 biți ECC] + [3 biți număr mască]`;
    - Calculul este determinat de funcția `eccFormatString`.

⚠ **În cazul în care input-ul și ECC depășesc capacitatea maximă a versiunii QR, generarea este anulată, iar utilizatorul este alertat.**

---

### **5) Aplicarea unei măști**
Măștile sunt utilizate pentru **dispersarea zonelor de biți de aceeași culoare** (*clustered bits*), îmbunătățind lizibilitatea codului QR.

- Dacă utilizatorul selectează o mască manuală, aceasta este aplicată direct;
- Dacă utilizatorul alege **aplicarea unei măști automate**, este calculată **cea mai eficientă mască** în funcție de biții de informație ai codului QR;
- Funcția `bitFlip` inversează biții (*0 → 1, iar 1 → 0*).

Continuând cu algoritmul de determinare a celei mai eficiente măști, sunt aplicate, pe rând, fiecare dintre cele 8 măști valabile la nivelul standardizat și mai apoi sunt parcurse și trecute prin 4 teste, acestea calculând pentru fiecare în parte un scor al inconsistențelor (penalty score). (informații reinterpretate din sursa **https://www.thonky.com/qr-code-tutorial/data-masking**):

- **Pentru prima condiție de evaluare**, verifică fiecare rând, unul câte unul. Dacă există cinci pixeli consecutivi de aceeași culoare, adaugă *3* la penalizare. Dacă există pixeli suplimentari de aceeași culoare după primele cinci, adaugă *1* pentru fiecare pixel suplimentar de aceeași culoare. Apoi, verifică fiecare coloană, unul câte unul, respectând aceeași condiție. Adaugă totalul orizontal și vertical pentru a obține scorul de penalizare #1.
- **Pentru a doua condiție de evaluare**, trebuie identificate zone de aceeași culoare care au dimensiunea de cel puțin `2×2` pixeli sau mai mare. Specificațiile codului QR stabilesc că, pentru un bloc de culoare solidă cu dimensiunea `m × n`, scorul de penalizare se calculează ca `3 × (m - 1) × (n - 1)`. **Prin urmare**, în loc să căutăm blocuri mai mari de `2×2`, putem adopta o metodă mai simplă: adăugăm *3* puncte la scorul de penalizare pentru fiecare bloc `2×2` de aceeași culoare din codul QR, luând în considerare și blocurile suprapuse. De exemplu, un bloc de `3×2` pixeli trebuie considerat ca două blocuri `2×2` suprapuse, fiecare contribuind separat la penalizare.
- **A treia regulă de penalizare** verifică existența unui model specific de module în codul QR, având structura: `negru - alb - negru - negru - negru - alb - negru`, cu patru pixeli albi pe fiecare parte a acestui model. De fiecare dată când acest tipar apare în codul QR, se adaugă *40* de puncte la scorul de penalizare.
- **Pentru a patra condiție de evaluare**, se analizează echilibrul dintre pixelii albi și cei negri. Se aplică următorii pași:
  1. Se calculează procentul de module întunecate din matrice.
  2. Se determină cei mai apropiați multipli de 5 ai acestui procent.
  3. Se calculează diferența față de 50% pentru fiecare dintre acești multipli.
  4. Se selectează cea mai mică valoare, se împarte la 5 și se înmulțește cu 10.
  5. **Scorul final de penalizare** pentru acest pas de evaluare este rezultatul obținut în ultimul pas.

Pentru a completa evaluarea matricei, se însumează scorurile celor *4* evaluări, acest total reprezentând media scorului de penalizare pentru codul QR.
Bineînțeles, masca aleasă este cea cu scorul cel mai mic, fiind aplicată aceasta asupra matricei.

---

## **Elaborarea algoritmilor folosiți**
Pentru calcularea Format String-ului, cât și pentru determinarea de **Error Correction Codewords**, este utilizată ideea de "împărțire a polinoamelor", operație bine-cunoscută în algebră, care consistă într-un algoritm de adunări, scăderi și înmulțiri repetate, până la ajungerea la un rezultat satisfăcător. Pentru o simplificare implicită necesară, aceste operații sunt înlocuite cu operația de disjuncție exclusivă *(pe scurt, `XOR`)*.
### Funcția `eccFormatString`
Singurul parametru este string-ul de 5 biți format prin concatenarea (în această ordine) a indicelui nivelului de detecție și corecție a erorilor (`Low = 1`, `Medium = 0`, `Quartile = 3`, `High = 2`), encodat pe 2 biți de informație și numărul de ordine al măștii aplicate (un număr natural din intervalul `[0, 7]`), encodat pe 3 biți de informație. Acesta primește un padding de 10 biți în partea dreaptă a acestuia, și astfel este definit polinomul de împărțit.
Acest polinom format este mai apoi prelucrat prin algoritmul descris mai sus, fiind supus împărțirii la polinomul: $$x^{10} + x^8 + x^5 + x^4 + x^2 + x + 1$$scris în formă binară simplificată `10100110111`; această operație de *XOR-are* este aplicată repetitiv, până când polinomul dat ca parametru are lungimea mai mică sau egală cu *10*; ulterior, acesta primește biți de padding la stânga până ajunge la lungimea de *10*, în cazul în care acesta nu este deja, acest șir fiind concatenat șirului de 5 biți inițiali, rezultatul acesta fiind *XOR-at* la rândul lui cu un polinom prestabilit de standardele codurilor QR:$$x^{14} + x^{12} + x^9 + x^4 + x^1$$în format simplificat binar `101010000010010`; ulterior, acestui număr îi sunt adăugați biți de padding *0* la stânga până la lungimea de *15*, funcția returnând astfel un `String` de *15* biți ce urmează ulterior să fie encodat în matrice.
### Funcția `convertToBinary`
Algoritmul preia textul dat de utilizator din tagul de tip input, acesta fiind verificat cu ajutorul expresiilor regulate pentru determinarea indicatorului de modul (`Numeric = 0 -> "0001"`, `Alfanumeric = 1 -> "0010"`, `ASCII = 2 -> "0100"`), ca mai apoi fiecare caracter să fie transformat într-un *string binar encodat pe 8 biți*; astfel, funcția returnează indicatorul de modul determinat, lungimea șirului de caractere și conținutul în sine al acestuia în *format binar*, sub formă de *vector*. 
### Clasa `GaloisField`
#### Constructorul de câmpuri Galois
```
constructor() {
    this.exp = new Array(512);  // Tabelul exponențial (dimensiune 512 pentru gestionarea depășirilor)
    this.log = new Array(256);  // Tabelul logaritmic (dimensiune 256)
    let x = 1; // Se începe cu 1 (deoarece orice număr ridicat la puterea 0 este 1)
    
    // Generarea tabelului logaritmic și exponențial pe baza polinomului primitiv x^8 + x^4 + x^3 + x + 1 (0x11D)
    for (let i = 0; i < 255; i++) {
        this.exp[i] = x;  // Stochează rezultatele exponențierii
        this.log[x] = i;  // Stochează logaritmul (mapare inversă)
        
        x <<= 1; // Înmulțire cu 2 în GF(2^8)

        // Dacă x depășește 8 biți, se reduce folosind polinomul ireductibil (modulo 0x11D)
        if (x & 0x100) { 
            x ^= 0x11D; // Se efectuează reducerea modulo
        }
    }

    // Extinderea tabelului exponențial pentru a facilita calculele (evită operațiile % 255)
    for (let i = 255; i < 512; i++) {
        this.exp[i] = this.exp[i - 255]; // Se reia periodicitatea
    }
}
```
#### Operația de înmulțire într-un câmp Galois
```
    multiply(x, y) {
        if (x === 0 || y === 0) // Orice element înmulțit cu 0 dă 0
            return 0;
        return this.exp[(this.log[x] + this.log[y]) % 255];
    }
```

### Funcția generatePolynomial
Funcția generatePolynomial(numErrorWords) generează polinomul generator utilizat în codurile Reed-Solomon pentru corecția erorilor. Inițializează câmpul Galois (gf), necesar pentru operațiile matematice. Pornește cu polinomul de bază g = [1]. Parcurge numErrorWords pași, în fiecare iterând:
Înmulțește fiecare coeficient al polinomului existent cu un element din tabelul exponențial (gf.exp[i]). Aplică operația XOR pentru a obține noul polinom. Returnează polinomul rezultat g, care va fi folosit pentru generarea simbolurilor de paritate în codul QR. Această funcție este esențială pentru adăugarea capacității de corecție a erorilor în QR code.
```
    const gf = new GaloisField(); // obiectul camp Galois
    let g = [1];

    for (let i = 0; i < numErrorWords; i++) {
        let temp = new Array(g.length + 1).fill(0);

        for (let j = 0; j < g.length; j++)
            temp[j + 1] = gf.multiply(g[j], gf.exp[i]);
        for (let j = 0; j < g.length; j++)
            temp[j] ^= g[j];

        g = temp;
    }
    return g;
```

### Funcția reedSolomonEncode
Rezumat al funcției
Această funcție generează cuvintele de paritate necesare pentru corecția erorilor într-un cod QR, utilizând codurile Reed-Solomon.

Inițializează câmpul Galois (gf) și polinomul generator (generator).
Construiește mesajul prin concatenarea dataWords (datele inițiale) cu numErrorWords zerouri (rezervate pentru paritate).
Aplică împărțirea polinomială pentru a calcula cuvintele de paritate:
Parcurge fiecare coeficient al dataWords.
Dacă coeficientul curent nu este 0, înmulțește și aplică XOR cu polinomul generator.
Returnează ultimele numErrorWords elemente din message, care reprezintă cuvintele de paritate.
```
    const gf = new GaloisField(); // obiectul camp Galois
    const generator = generatePolynomial(numErrorWords);
    let message = [...dataWords, ...new Array(numErrorWords).fill(0)];

    for (let i = 0; i < dataWords.length; i++) {
        const coef = message[i];
        if (coef !== 0)
            for (let j = 0; j < generator.length; j++)
                message[i + j] ^= gf.multiply(generator[j], coef);
    }

    return message.slice(dataWords.length);
```

### Funcția `placeDataBits`
Este inițializat un contor (`bitIndex`) pentru iterarea prin șirul de caractere dat ca parametru, și o variabilă booleană care determină sensul de parcurgere al perechii de coloane *(fie de jos în sus, fie de sus în jos; inițial, prima pereche se începe de jos în sus, și se continuă intermitent)*.
Astfel, matricea este parcursă de la dreapta la stânga, în perechi de coloane apropiate una de alta.
```
for (let rightCol = size - 1; rightCol >= 0; rightCol -= 2)
let leftCol = rightCol - 1;
```
Singura coloană care este omisă este cea cu indexul *6 (hardcodată cu Finder Pattern-uri și un Timing Pattern)*.
Apoi, conform algoritmului prezentat mai jos, biții de informație sunt encodați pe pozițiile posibile ale matricei, indicele ce iterează prin șirul de caractere ce conține totalitatea biților de date encodate și, implicit, și biții de corecție a acestora fiind iterat doar la colorarea unui bit.
```
        while ((goingUp && row >= 0) || (!goingUp && row < size) && bitIndex < bits.length) {
            if (!protected_areas.some(area => area[0] === row && area[1] === rightCol)) {
                const color = bits[bitIndex] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
                drawPixel(row, rightCol, color);
                bitIndex++;
            } // amplasarea bitului de pe coloana din dreapta (dacă aceasta există)
            if (leftCol >= 0 && bitIndex < bits.length && !protected_areas.some(area => area[0] === row && area[1] === leftCol)) {
                const color = bits[bitIndex] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
                drawPixel(row, leftCol, color);
                bitIndex++;
            } // amplasarea bitului de pe coloana din stânga (dacă aceasta există)
            row += goingUp ? -1 : 1;
        }
```

### Funcția `applyMask`
Algoritmul are o implementare cât se poate de directă, parcurgând în întregime matricea codului QR, și în funcție de masca ce este cerută să fie aplicată, este verificată condiția pentru poziția respectivă; dacă aceasta este satisfăcută, bitul este inversat *(apelând la funcția `flipBit`)*

### Funcțiile de calcul al scorului de penalizare al măștilor aplicate pe matrice
Regulile pentru calcularea penalty score-ului:
- Regula 1 (funcția `calculatePenaltyRule1`) (Grupuri consecutive de module de aceeași culoare): se penalizează apariția a 5 sau mai multe module consecutive de aceeași culoare într-un rând sau coloană. Penalizarea este de (număr_de_module - 2) pentru fiecare astfel de secvență.
- Regula 2 (funcția `calculatePenaltyRule2`) (Blocuri de 2x2 de aceeași culoare): se penalizează blocurile de 2x2 în care toate modulele au aceeași culoare. Fiecare astfel de bloc adaugă o penalizare de 3 puncte.
- Regula 3 (funcția `calculatePenaltyRule3`) (Secvențe similare unui model specific): se penalizează apariția modelelor `1011101` sau `00001011101` în orice rând sau coloană. Fiecare apariție adaugă o penalizare de 40 puncte.
- Regula 4 (funcția `calculatePenaltyRule4`) (Procentajul modulelor întunecate):
  - Se penalizează abaterile procentuale ale modulelor negre față de 50% din total.
  - Se calculează distanța până la cel mai apropiat multiplu de 5 și se înmulțește cu 2.
  - Funcția de alegere a măștii optime:
  - Se testează fiecare dintre cele 8 măști standard QR Code.
  - Se aplică fiecare mască, apoi se calculează scorul de penalizare.
  - Se păstrează masca cu cel mai mic penalty score.
- Masca optimă este aplicată asupra matricei codului QR.
---

## **Concluzie**
Proiectul nostru permite generarea unui cod QR personalizat, oferind utilizatorului un control detaliat asupra versiunii, nivelului de corecție a erorilor și măștii utilizate prin implementarea standardelor internaționale, utilizarea **Galois Field**, **Reed-Solomon Encoding** și a unui **algoritm optimizat de umplere a matricii**.

Ca notă de final, codul nu funcționează până la final... `:(((` Scanner-ul unui telefon identifică faptul că se încearcă scanarea unui cod QR, însă nu reușește descifrarea acestuia. Pentru a urmări îndeaproape eventuale scăpări de logică am implementat de-a lungul progresului nostru mai multe test-case uri și algoritmi de verificare pentru datele rezultate, ajungând la concluzia nefavorabilă că toate testele noastre funcționează, astfel nereușind să identificăm sursa problemei. Am lăsat câteva din console-log-urile utile și de interes pentru munca de până acum, cu promisiunea că vom reveni asupra acestui stadiu al proiectului și îl vom aduce într-o formă finală și perfect funcțională!

Posibile implementări viitoare (?): secțiunea de cititor a codului QR; este primită ca input o imagine, și, utilizând o librărie de procesare a imaginilor, `image-js`, este analizată structura codului QR.
- Este calculată poziția Allignment Pattern-ului, și, implicit, și distanța de la aceasta la Finder Pattern-uri. Pe baza acestor măsuri, imaginea este digitalizată și adusă la o formă cât se poate de simplă pentru pașii următori. Sunt identificate Timing Pattern-urile și, pe baza dimensiunilor acestora, este determinată versiunea codului QR. Ulterior, sunt procesate informațiile Format String-ului, fiind aflate astfel *indicatorul de modul* și *masca aplicată codului QR*, urmând astfel ca masca să fie înlăturată printr-un algoritm identic cu cel de aplicare. Algoritmul de decodificare al codului QR în sine se bazează pe aceleași idei mari ale unui generator, fiind necesari algoritmi precum *Reed-Solomon* encoding & decoding, aplicații ale *Galois Field* ș.a.m.d..

---
## **Referințe utilizate (bibliografie)**
- **https://www.thonky.com/qr-code-tutorial/**
- **https://www.nayuki.io/page/creating-a-qr-code-step-by-step**
- **https://pewscorner.github.io/barcodes/qrcode_generator.html**
- [**Veritasium**](https://www.youtube.com/watch?v=w5ebcowAJD8&t=884s&pp=ygUSdmVyaXRhc2l1bSBxciBjb2Rl)
- [**mattbatwings**](https://www.youtube.com/watch?v=ZizmvuZ3EFk&t=942s&pp=ygUecXIgY29kZSBnZW5lcmF0b3IgaW4gbWluZWNyYWZ0)
- [**Wikipedia**](https://upload.wikimedia.org/wikipedia/commons/d/d5/QRCode-3-Layout%2CEncoding.png)
- [**Reed-Solomon Calculator**](https://repo.progsbase.com/repoviewer/no.inductive.libraries/ReedSolomon/latest///ComputeReadSolomonCodes/online/)
- [**Reed-Solomon Algorithm Functionality**](https://www.cs.cmu.edu/~guyb/realworld/reedsolomon/reed_solomon_codes.html)
---