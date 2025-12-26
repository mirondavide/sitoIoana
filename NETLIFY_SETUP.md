# Guida Setup Netlify - 5 Minuti

Questa guida ti aiuterà a configurare il sito su Netlify per far funzionare il pannello admin automaticamente.

## Passo 1: Crea Account Netlify (1 minuto)

1. Vai su https://netlify.com
2. Clicca "Sign up"
3. Scegli "Sign up with GitHub"
4. Autorizza Netlify

✅ Account creato!

## Passo 2: Collega il Repo GitHub (2 minuti)

1. Nel dashboard Netlify, clicca **"Add new site" → "Import an existing project"**
2. Scegli **"Deploy with GitHub"**
3. Cerca e seleziona il repo: **mirondavide/sitoIoana**
4. Netlify rileverà automaticamente le configurazioni
5. **NON cliccare ancora "Deploy"** - prima dobbiamo configurare le variabili!

## Passo 3: Configura le Variabili d'Ambiente (2 minuti)

Prima di fare il deploy, devi aggiungere queste variabili d'ambiente. Clicca su **"Site settings" → "Environment variables" → "Add a variable"**

### Variabili OBBLIGATORIE:

#### 1. `ADMIN_API_KEY`
- **Valore**: Genera una stringa casuale (min 32 caratteri)
- **Esempio**: `dK9mP3xR7wQ2nF6jL8hB5vT4cY1zA0sE`
- **Come generare**: Vai su https://www.random.org/strings/ e genera una stringa casuale

#### 2. `GITHUB_TOKEN`
- **Cosa fa**: Permette di salvare i prodotti su GitHub
- **Come ottenerlo**:
  1. Vai su https://github.com/settings/tokens
  2. Clicca "Generate new token (classic)"
  3. Nome: "Netlify Admin Panel"
  4. Scadenza: "No expiration"
  5. Seleziona SOLO: `repo` (tutte le sotto-opzioni)
  6. Clicca "Generate token"
  7. **COPIA IL TOKEN** (lo vedrai solo una volta!)
- **Formato**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 3. `GITHUB_REPO`
- **Valore**: `mirondavide/sitoIoana`
- **Formato**: `owner/repo`

#### 4. `CLOUDINARY_CLOUD_NAME`
- **Cosa fa**: Carica le immagini dei prodotti
- **Come ottenerlo**:
  1. Vai su https://cloudinary.com
  2. Crea account gratuito
  3. Nel dashboard trovi il "Cloud name"
- **Esempio**: `dxxxx1234`

#### 5. `CLOUDINARY_API_KEY`
- **Dove trovarlo**: Dashboard Cloudinary, sezione "API Keys"
- **Formato**: `123456789012345`

#### 6. `CLOUDINARY_API_SECRET`
- **Dove trovarlo**: Dashboard Cloudinary, sezione "API Keys" → clicca su "Reveal"
- **Formato**: stringa alfanumerica

### Riepilogo Variabili:

```
ADMIN_API_KEY = [stringa casuale 32+ caratteri]
GITHUB_TOKEN = ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO = mirondavide/sitoIoana
CLOUDINARY_CLOUD_NAME = [tuo cloud name]
CLOUDINARY_API_KEY = [tua API key]
CLOUDINARY_API_SECRET = [tuo API secret]
```

## Passo 4: Deploy! (30 secondi)

1. Dopo aver configurato TUTTE le variabili d'ambiente
2. Torna alla pagina di deploy
3. Clicca **"Deploy site"**
4. Aspetta 1-2 minuti per il completamento

✅ Sito online!

## Passo 5: Testa il Pannello Admin

1. Vai su `https://[tuo-sito].netlify.app/admin.html`
2. Inserisci la password: `dana123`
3. Compila il form e prova ad aggiungere un prodotto
4. Se tutto funziona, vedrai il prodotto apparire su GitHub e sul sito!

## Problemi Comuni

### "API key invalid"
- Verifica che ADMIN_API_KEY sia configurato correttamente
- Riprova il deploy

### "Cloudinary authentication failed"
- Controlla CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Verifica di aver copiato correttamente i valori dal dashboard Cloudinary

### "GitHub authentication failed"
- Verifica che GITHUB_TOKEN sia valido
- Controlla che il token abbia i permessi `repo`
- GITHUB_REPO deve essere nel formato `owner/repo`

### Il prodotto non appare sul sito
- Aspetta 1-2 minuti per il rebuild automatico
- Controlla la tab "Deploys" su Netlify per vedere lo stato

## Prossimi Passi

### Cambiare la password admin
Modifica il file `admin.html` alla riga 199 e cambia `dana123` con la tua password.

### Dominio personalizzato
In Netlify: Settings → Domain management → Add custom domain

### Rendere il repo privato
Ora puoi rendere il repo GitHub privato! Il sito resterà pubblico, ma il codice sarà nascosto.

## Supporto

Se hai problemi, controlla i logs in:
Netlify Dashboard → Functions → Logs
