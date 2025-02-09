# coqr_js
# **Proiectul echipei noastre**

## **Descriere**
Proiectul echipei noastre (*nume echipă*) constă într-o pagină HTML interactivă simplistă, care oferă posibilitatea de a alege una dintre primele 5 variante de cod QR. Utilizatorul poate selecta:

- **Nivelul de corecție a erorilor** (Low, Medium, Quartile & High);
- **Una dintre cele 8 măști** standardizate internațional;
- **Calculul automat al celei mai coerente măști** pentru codul QR generat.

Codul QR este o **matrice pătratică**, dimensiunea sa fiind dedusă conform formulei:

\[ \text{dimensiune} = 17 + 4 \times v_{qr} \]

unde \( v_{qr} \) este numărul versiunii codului QR ales, indexarea fiind realizată de la poziția \( (0, 0) \).

## **Generarea codului QR**

La apăsarea butonului de generare, codul QR este afișat, iar implementarea parcurge următorii pași:

### **1) Encodarea zonelor fixe**
Pentru aceste zone, este declarat un **vector global de dubleți**, fiecare element reprezentând poziția unui bit sub forma \( (x, y) \). Această informație este necesară pentru algoritmul de umplere a matricei QR.

- **a)** **Generarea de Timing Patterns**
    - Situate pe rândul 6 și coloana 6;
    - Reprezintă linii de biți intermitenți (alb/negru), începând cu bitul negru;

- **b)** **Generarea de Finder Patterns**
    - Cele 3 zone din colțurile codului QR, mărginite corespunzător cu biți albi;

- **c)** **Generarea de Alignment Pattern**
    - Pătratul de dimensiune mai mică din colțul de jos-dreapta;
    - Aplicat tuturor versiunilor (cu excepția Version 1 - 21x21);
    - Necesar pentru decodificarea poziționării și a unghiului de scanare.

- **d)** **Rezervarea zonelor dimprejurul Finder Patterns**
    - Necesare pentru generarea ulterioară a Format String-ului.

---

### **2) Prelucrarea și generarea datelor**
Fiecare matrice are un **număr fix de bytes utilizabili**, împărțiți în funcție de nivelul de corecție a erorilor. Valorile sunt **hard-coded** conform standardelor internaționale.

- **a)** Determinarea **indicatorului modulului** (4 biți) în funcție de tipul de caractere din input:
    - Numeric (doar cifre);
    - Alfanumeric (cifre și litere);
    - ASCII (toate caracterele codului ASCII).
    - *(Pentru simplitate, toate informațiile sunt codificate pe 8 biți după codul ASCII.)*

- **b)** Determinarea **numărului de caractere** din input (codificat pe 8 biți);
- **c)** Formatarea **binara a conținutului** input-ului (funcția `convertToBinary`);
- **d)** Adăugarea **terminatorului de conținut** (4 biți de `0`);
- **e)** **Padding bytes**: intermitent, se adaugă `0xEC` și `0x11` până la completarea numărului maxim de bytes.

---

### **3) Generarea codurilor de corecție a erorilor (ECC)**
Folosind șirul binar generat anterior, se determină **Error Correction Codewords (ECC)**, care permit recuperarea informației în cazul deteriorării vizuale a codului QR.

- Se utilizează **Galois Field** și **algoritmul Reed-Solomon**;
- Datele sunt transformate în **valori între [0, 255]** și tratate ca **indici ai unui polinom**;
- Se calculează **restul împărțirii** la un **polinom generator**, rezultatul fiind **bytes de corectare a erorilor**;
- Se folosesc **funcțiile**:
    - `generatePolynomial`;
    - `reedSolomonEncode`;
    - **clasa** `GaloisField`.

---

### **4) Encodarea informației și a codurilor de corecție**
Datele sunt plasate în matrice conform unui **algoritm de umplere în zig-zag**:

- Se ține cont de **vectorul de poziții rezervate**;
- Biții sunt plasați intermitent **de jos în sus și de sus în jos**;
- 7 biți rămân neutilizați (`rest bits`), fiind setați pe `0` (alb);
- Se generează **Format String-ul**:
    - 5 biți de informație;
    - 10 biți pentru corecția erorilor;
    - Format: `[2 biți ECC] + [3 biți număr mască]`.

⚠ **În cazul în care input-ul și ECC depășesc capacitatea maximă a versiunii QR, generarea este anulată, iar utilizatorul este alertat.**

---

### **5) Aplicarea unei măști**
Măștile sunt utilizate pentru **dispersarea zonelor de biți de aceeași culoare** (*clustered bits*), îmbunătățind lizibilitatea codului QR.

- Dacă utilizatorul selectează o mască manuală, aceasta este aplicată direct;
- Dacă utilizatorul alege **mască automată**, se calculează **cea mai eficientă mască** în funcție de biții de informație ai codului QR;
- Funcția `bitFlip` inversează biții (*0 → 1 și 1 → 0*).

---

## **Concluzie**
Proiectul nostru permite generarea unui cod QR personalizat, oferind utilizatorului un control detaliat asupra versiunii, nivelului de corecție a erorilor și măștii utilizate. Prin implementarea standardelor internaționale, utilizarea **Galois Field**, **Reed-Solomon Encoding** și a unui **algoritm optimizat de umplere a matricii**, codurile QR produse sunt eficiente și ușor de decodat, indiferent de condițiile de scanare.

---

