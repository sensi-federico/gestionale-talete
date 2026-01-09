# 📘 Gestionale Talete - Guida Amministratori

**Versione:** 0.1.2  
**Data:** Dicembre 2025  
**© Talete Spa**

---

## 1. Introduzione

Il Gestionale Talete è un'applicazione web progressive (PWA) per la gestione degli interventi sul campo. Come amministratore, hai accesso completo a tutte le funzionalità del sistema.

---

## 2. Accesso al Sistema

### 2.1 Primo accesso
1. Aprire il browser e navigare su: `https://sensi-federico.github.io/gestionale-talete/`
2. Inserire l'email e la password fornite
3. Cliccare su **"Accedi"**

### 2.2 Installazione PWA (consigliata)
L'app può essere installata come applicazione nativa:

**Su Desktop (Chrome/Edge):**
- Cliccare l'icona di installazione nella barra degli indirizzi
- Confermare "Installa"

**Su Mobile:**
- iPhone: Safari → Condividi → "Aggiungi a Home"
- Android: Chrome → Menu → "Installa app"

---

## 3. Dashboard Amministratore

Dopo il login, la dashboard mostra:

| Sezione | Descrizione |
|---------|-------------|
| **Statistiche** | Interventi totali, oggi, questa settimana |
| **Ultimi interventi** | Tabella con gli interventi più recenti |
| **Menu di navigazione** | Accesso a tutte le sezioni |

### 3.1 Menu Principale
- **Panoramica**: Dashboard con statistiche
- **Interventi**: Lista completa interventi
- **Utenti**: Gestione utenti del sistema
- **Comuni**: Gestione comuni operativi
- **Imprese**: Gestione imprese esterne

---

## 4. Gestione Utenti

### 4.1 Visualizzare gli utenti
1. Menu → **Utenti**
2. La tabella mostra: Email, Nome, Ruolo, Data creazione, Ultimo accesso

### 4.2 Creare un nuovo utente
1. Cliccare **"+ Aggiungi Utente"**
2. Compilare il form:

| Campo | Obbligatorio | Descrizione |
|-------|--------------|-------------|
| Email | ✅ | Email valida, sarà il login |
| Nome completo | ✅ | Nome e cognome |
| Password | ✅ | Minimo 8 caratteri |
| Ruolo | ✅ | Admin, Tecnico, Impresa o Responsabile |
| Impresa | Solo se ruolo=Impresa | Selezionare l'impresa di appartenenza |

3. Cliccare **"Salva"**

### 4.3 Ruoli disponibili

| Ruolo | Permessi |
|-------|----------|
| **Admin** | Accesso completo: gestione utenti, comuni, imprese, visualizzazione tutti gli interventi |
| **Tecnico** | Inserimento interventi dettagliati, visualizzazione solo propri interventi |
| **Impresa** | Inserimento interventi semplificato, visualizzazione interventi della propria impresa |
| **Responsabile** | Supervisione e consultazione interventi; permessi intermedi per supervisione e reportistica. Può filtrare e scaricare report CSV, ma **non vede data, orario e posizione (GPS)** degli interventi nei report e nella vista. |

### 4.4 Modificare un utente
1. Cliccare l'icona **✏️** nella riga dell'utente
2. Modificare i campi desiderati
3. Lasciare vuoto il campo password per non modificarla
4. Cliccare **"Salva"**

### 4.5 Eliminare un utente
1. Cliccare l'icona **🗑️** nella riga dell'utente
2. Confermare l'eliminazione nel popup

> ⚠️ **Attenzione**: L'eliminazione è irreversibile. Gli interventi dell'utente rimarranno nel sistema.

---

## 5. Gestione Comuni

### 5.1 Visualizzare i comuni
Menu → **Comuni**

### 5.2 Aggiungere un comune
1. Cliccare **"+ Aggiungi Comune"**
2. Compilare:
   - **Nome**: Nome del comune
   - **Provincia**: Sigla provincia (es. RM)
   - **Regione**: Nome regione
3. Cliccare **"Salva"**

### 5.3 Modificare/Eliminare
- **Modifica**: icona ✏️
- **Elimina**: icona 🗑️

> ⚠️ Non è possibile eliminare un comune se ha interventi associati.

---

## 6. Gestione Imprese

### 6.1 Visualizzare le imprese
Menu → **Imprese**

### 6.2 Aggiungere un'impresa
1. Cliccare **"+ Aggiungi Impresa"**
2. Compilare:

| Campo | Obbligatorio | Descrizione |
|-------|--------------|-------------|
| Nome | ✅ | Ragione sociale |
| P.IVA | ❌ | Partita IVA |
| Telefono | ❌ | Recapito telefonico |
| Email | ❌ | Email aziendale |
| Indirizzo | ❌ | Sede legale |

3. Cliccare **"Salva"**

### 6.3 Associare utenti a un'impresa
Quando crei un utente con ruolo "Impresa", seleziona l'impresa di appartenenza dal menu a tendina.

---

## 7. Visualizzazione Interventi

### 7.1 Lista interventi
Menu → **Interventi**

La tabella mostra tutti gli interventi con:
- Data e ora
- Indirizzo (via e civico)
- Comune
- Tipo lavorazione
- Tecnico/Impresa
- Stato sincronizzazione

### 7.2 Filtri disponibili
- **Ricerca**: per via o comune
- **Tipo lavorazione**: filtra per tipologia
- **Data da/a**: intervallo temporale
- **Tecnico**: filtra per operatore

### 7.3 Dettaglio intervento
Cliccare su una riga per vedere:
- Foto dell'intervento
- Tutti i dettagli inseriti
- Coordinate GPS
- Timestamp di invio
- Note

### 7.4 Export CSV
1. Applicare i filtri desiderati
2. Cliccare **"Esporta CSV"**
3. Il file verrà scaricato con tutti i dati filtrati

---

## 8. Profilo Personale

### 8.1 Accedere al profilo
Cliccare sull'icona utente in alto a destra → **Profilo**

### 8.2 Modificare i dati
- **Nome**: modificabile liberamente
- **Password**: inserire la nuova password (minimo 8 caratteri)

### 8.3 Logout
Cliccare **"Esci"** nel menu profilo

---

## 9. Risoluzione Problemi

| Problema | Soluzione |
|----------|-----------|
| Utente non riesce ad accedere | Verificare email corretta, resettare password |
| Dati non si caricano | Verificare connessione, ricaricare pagina (Ctrl+R) |
| Impresa non visibile nel form utente | Assicurarsi di aver creato prima l'impresa |
| CSV vuoto | Verificare che ci siano interventi nel periodo filtrato |
| PWA non si aggiorna | Chiudere tutte le istanze, riaprire l'app |

---

## 10. Contatti Supporto

Per assistenza tecnica contattare l'amministratore di sistema.

---

**Gestionale Talete v0.1.2**  
**© 2025 Talete Spa - Tutti i diritti riservati**
