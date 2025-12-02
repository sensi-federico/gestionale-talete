# 📘 Gestionale Talete - Guida Tecnici

**Versione:** 0.1.2  
**Data:** Dicembre 2025  
**© Talete Spa**

---

## 1. Introduzione

Il Gestionale Talete è un'applicazione per registrare gli interventi sul campo. Questa guida spiega come utilizzare l'app per inserire e visualizzare i tuoi interventi.

---

## 2. Accesso al Sistema

### 2.1 Primo accesso
1. Aprire il browser sul tuo dispositivo
2. Andare su: `https://sensi-federico.github.io/gestionale-talete/`
3. Inserire email e password fornite dall'amministratore
4. Cliccare **"Accedi"**

### 2.2 Installazione App (Consigliata)

L'app può essere installata sul tuo dispositivo per un accesso più rapido e funzionalità offline.

**Su iPhone/iPad:**
1. Aprire **Safari** (importante: usare Safari, non Chrome)
2. Andare sul sito dell'app
3. Toccare l'icona **Condividi** (quadrato con freccia in alto)
4. Scorrere e toccare **"Aggiungi a Home"**
5. Toccare **"Aggiungi"** in alto a destra
6. L'icona apparirà nella schermata home

**Su Android:**
1. Aprire **Chrome**
2. Andare sul sito dell'app
3. Toccare i **tre puntini** in alto a destra
4. Selezionare **"Installa app"** o **"Aggiungi a Home"**
5. Confermare l'installazione

---

## 3. Schermata Home

Dopo il login vedrai:

```
┌─────────────────────────────────┐
│  🏠 Home                        │
├─────────────────────────────────┤
│                                 │
│  ┌─────────┐  ┌─────────┐      │
│  │  ➕     │  │  📋     │      │
│  │ Nuovo   │  │ I miei  │      │
│  │Interv.  │  │Interv.  │      │
│  └─────────┘  └─────────┘      │
│                                 │
│  📊 Statistiche                 │
│  • Oggi: 3 interventi           │
│  • Settimana: 12 interventi     │
│  • Totale: 156 interventi       │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Inserimento Nuovo Intervento

### 4.1 Aprire il form
- Dalla Home: toccare **"Nuovo Intervento"**
- Dal menu: toccare **"Nuovo"**

### 4.2 Compilare il form

#### Sezione 📍 LUOGO

| Campo | Come compilare |
|-------|----------------|
| **Comune** | Selezionare dalla lista il comune dell'intervento |
| **Via** | Scrivere il nome della strada (es. "Via Roma") |
| **Civico** | Inserire il numero civico (es. "15" o "15/A") |

#### Sezione 📅 DATA E ORA

| Campo | Come compilare |
|-------|----------------|
| **Data** | Selezionare la data dell'intervento |
| **Ora** | Selezionare l'ora di inizio |

#### Sezione 🔧 DETTAGLI LAVORO

| Campo | Come compilare |
|-------|----------------|
| **Tipo lavorazione** | Selezionare: Riparazione, Sostituzione, Allaccio, ecc. |
| **Impresa** | Selezionare l'impresa che ha eseguito il lavoro |
| **N° operai** | Indicare quanti operai hanno lavorato |
| **Materiale tubo** | Opzionale: tipo di materiale (PVC, Ghisa, ecc.) |
| **Diametro** | Opzionale: diametro in mm |

#### Sezione 🚛 MEZZI UTILIZZATI

Toccare per selezionare i mezzi usati (selezione multipla):

| Icona | Mezzo |
|-------|-------|
| 🚐 | Furgone |
| 🚛 | Camion |
| 🚗 | Auto |
| 🏗️ | Escavatore |
| 🚜 | Minipala |
| 🚚 | Autocarro |
| 🏗️ | Gru |
| ⚙️ | Compressore |
| 🔌 | Generatore |
| 📦 | Altro |

#### Sezione 📸 FOTO

1. Toccare **"Scatta foto"** per usare la fotocamera
2. Oppure **"Carica foto"** per scegliere dalla galleria
3. La foto apparirà nell'anteprima

> 💡 **Consiglio**: Scatta una foto chiara dell'intervento completato

#### Sezione 📝 NOTE

Campo libero per annotazioni aggiuntive (opzionale).

### 4.3 Inviare l'intervento

1. Verificare che tutti i campi obbligatori siano compilati
2. Toccare il pulsante **"Invia intervento"**
3. Attendere il messaggio di conferma
4. Scegliere:
   - **"Nuovo intervento"**: per inserirne un altro
   - **"I miei interventi"**: per vedere la lista
   - **"Home"**: per tornare alla schermata principale

---

## 5. Visualizzare i Miei Interventi

### 5.1 Accedere alla lista
- Dalla Home: toccare **"I miei interventi"**
- Dal menu: toccare **"I miei"**

### 5.2 Leggere la lista

Ogni intervento mostra:
- 📅 Data e ora
- 📍 Via e numero civico
- 🏘️ Comune
- 🔧 Tipo lavorazione

### 5.3 Filtri

Puoi filtrare gli interventi per:
- **Ricerca**: scrivi via o comune
- **Tipo lavorazione**: seleziona dalla lista
- **Date**: da/a per intervallo temporale

### 5.4 Vedere il dettaglio

1. Toccare un intervento nella lista
2. Si apre la schermata dettaglio con:
   - Foto (se presente)
   - Tutti i dati inseriti
   - Mappa con posizione GPS
   - Data e ora di invio

3. Toccare **"Indietro"** per tornare alla lista

---

## 6. Funzionamento Offline

### 6.1 Come funziona

L'app funziona anche **senza connessione internet**:

1. **I dati dei menu** (comuni, tipi lavorazione, imprese) vengono salvati sul dispositivo
2. **Gli interventi inseriti offline** vengono salvati localmente
3. **Quando torni online**, si sincronizzano automaticamente

### 6.2 Indicatore offline

Quando sei offline vedrai:

```
┌─────────────────────────────────┐
│ 🟠 Offline - 2 in coda          │
└─────────────────────────────────┘
```

Questo significa che hai 2 interventi in attesa di sincronizzazione.

### 6.3 Sincronizzazione

Quando torni online:
1. L'app rileva la connessione
2. Gli interventi in coda vengono inviati automaticamente
3. Ricevi una notifica di conferma

> ⚠️ **Non eliminare l'app** se hai interventi in coda, perché andrebbero persi!

---

## 7. Profilo Personale

### 7.1 Accedere al profilo
Dal menu toccare **"Profilo"**

### 7.2 Cosa puoi modificare

| Campo | Modificabile |
|-------|--------------|
| Email | ❌ No |
| Nome | ✅ Sì |
| Password | ✅ Sì |

### 7.3 Cambiare password

1. Andare su Profilo
2. Inserire la nuova password nel campo apposito
3. Confermare
4. La nuova password deve avere almeno 8 caratteri

### 7.4 Logout

Toccare **"Esci"** per uscire dall'account.

---

## 8. Risoluzione Problemi

| Problema | Soluzione |
|----------|-----------|
| **Non riesco ad accedere** | Verificare email e password. Se non ricordi la password, contatta l'admin |
| **I comuni non si caricano** | Verifica connessione internet, poi ricarica la pagina |
| **La foto non si carica** | Prova con una foto più piccola o scattane una nuova |
| **Intervento non inviato** | Se sei offline, verrà inviato quando torni online |
| **App lenta** | Chiudi e riapri l'app. Se persiste, reinstalla la PWA |
| **GPS non funziona** | Abilita localizzazione nelle impostazioni del telefono |

---

## 9. Consigli Utili

### ✅ Buone pratiche

1. **Installa l'app** come PWA per accesso rapido
2. **Compila subito** l'intervento quando sei sul posto
3. **Scatta sempre una foto** dell'intervento completato
4. **Verifica i dati** prima di inviare
5. **Controlla periodicamente** "I miei interventi" per verificare che siano stati sincronizzati

### ❌ Da evitare

1. Non chiudere l'app mentre sta inviando
2. Non eliminare l'app con interventi in coda
3. Non usare password troppo semplici

---

## 10. Supporto

Per problemi o domande, contatta il tuo responsabile o l'amministratore del sistema.

---

**Gestionale Talete v0.1.2**  
**© 2025 Talete Spa - Tutti i diritti riservati**
