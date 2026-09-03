  # Google OAuth2 preko ručno podešenog Keycloak Identity Provider-a

  ## Sažetak

  Google Client ID i Client Secret biće ručno uneti u Keycloak Admin Console. Neće biti upisani u lilly-realm.json, .env, Angular kod ili repozitorijum.

  Krajnji korisnik će videti samo:

  1. Keycloak login/register stranicu.
  2. Dugme „Sign in with Google“.
  3. Google autentikaciju.
  4. Povratak u aplikaciju.

  Admin Console koristi samo administrator/developer i nije deo korisničkog OAuth toka.

  ## Implementacione izmene u projektu

  ### Keycloak tema

  U postojećoj sessions temi:

  - login stranica koristi postojeći Keycloak social.providers mehanizam;
  - register stranica dobija override register.ftl, jer parent template trenutno ne prikazuje Identity Provider dugmad;
  - dugme se prikazuje na dnu obe stranice;
  - koristi se Keycloak-ov generisani p.loginUrl, a ne ručno napravljen Google URL;
  - dugme ima klasičan izgled, Google ikonicu, tekst Sign in with Google i odgovarajući aria-label;
  - ne dodaje se Google JavaScript SDK u Angular.

  Izmena se odnosi na:

  - keycloak/themes/sessions/login/register.ftl
  - keycloak/themes/sessions/login/resources/css/styles.css

  Postojeći login, register formulari, email/password autentikacija, recaptcha i password validation ostaju nepromenjeni.

  ### Realm i backend

  Ne menjati:

  - lilly-realm.json radi Google kredencijala;
  - Spring Boot OAuth client konfiguraciju;
  - backend kontrolere i servise;
  - API JWT format.

  Backend će i dalje dobijati i validirati Keycloak JWT. Google korisnik će biti običan Keycloak korisnik iz perspektive aplikacije.

  ### Angular OAuth callback

  U web-angular/src/app/core/auth.service.ts:

  - zadržati postojeće login() i register() metode;
  - dodati state zaštitu;
  - dodati PKCE code_verifier i code_challenge sa metodom S256;
  - privremeno čuvati OAuth podatke u sessionStorage;
  - proveriti state pre razmene authorization code-a;
  - proslediti code_verifier Keycloak token endpointu;
  - zadržati postojeće nazive tokena i logout ponašanje.

  Google tokeni neće biti dostupni Angular aplikaciji. Angular razmenjuje code samo sa Keycloak-om.

  ## Podešavanja Google Identity Provider-a

  U Keycloak-u podesiti:

  - Provider: Google
  - Alias: google
  - Enabled: uključeno
  - Hide on Login Page: isključeno
  - Trust Email: uključeno
  - Store Tokens: isključeno
  - Account Linking Only: isključeno
  - First Login Flow: first broker login
  - Sync Mode: Import
  - Scope: openid profile email

  verifyEmail u realm-u ostaje uključen. Trust Email omogućava da Google korisnik sa Google claim-om email_verified=true ne dobije dodatni email za verifikaciju. Keycloak Identity Brokering dokumentacija

  Postojeći lokalni nalog sa istom email adresom neće biti automatski povezan bez potvrde/reautentikacije. Time se izbegava nesigurno povezivanje naloga samo na osnovu email adrese.

  ## Tvoj deo posla

  ### 1. Pokretanje Keycloak-a

  Pokreni aplikaciju:

  docker compose up --build

  Otvori:

  http://localhost:8080/admin/

  Prijavi se admin podacima iz lokalne Docker konfiguracije i izaberi realm lilly.

  ### 2. Dobijanje callback URL-a iz Keycloak-a

  1. Otvori Identity Providers.
  2. Izaberi Add provider → Google.
  3. Kopiraj prikazani Redirect URI.

  Za ovaj projekat očekivana vrednost je:

  http://localhost:8080/realms/lilly/broker/google/endpoint

  Google zahteva da se redirect URI potpuno poklapa sa vrednošću u konzoli. Google OpenID Connect dokumentacija

  ### 3. Kreiranje Google OAuth klijenta

  1. Otvori Google Cloud Console.
  2. Kreiraj ili izaberi projekat.
  3. Otvori Google Auth Platform → Branding.
  4. Unesi naziv aplikacije, support email i developer contact email.
  5. U Audience izaberi External.
  6. U Data Access ne dodaj dodatne scope-ove.
  7. Otvori Clients → Create client.
  8. Izaberi application type Web application.
  9. U Authorized redirect URIs dodaj:

     http://localhost:8080/realms/lilly/broker/google/endpoint

  10. Nemoj dodavati Angular adresu kao Google redirect URI.
  11. Authorized JavaScript origins nisu potrebni, jer Angular direktno ne koristi Google SDK.
  12. Kreiraj klijenta.
  13. Kopiraj Client ID i Client Secret.

  Koristiti samo:

  openid
  profile
  email

  Ne uključivati Google Drive, Calendar ili druge API scope-ove.

  ### 4. Unos kredencijala u Keycloak

  Vrati se u Keycloak Admin Console i u Google provider formu unesi:

  - Client ID
  - Client Secret
  - Display name: Google
  - Trust Email: uključeno
  - Store Tokens: isključeno
  - Account Linking Only: isključeno
  - Hide on Login Page: isključeno
  - First Login Flow: first broker login
  - Sync Mode: Import

  Klikni Save.

  Client Secret ostaje sačuvan u Keycloak konfiguraciji i ne pojavljuje se u frontend aplikaciji. Ne unositi ga u git repozitorijum.

  ## Ručna verifikacija

  1. Otvori aplikaciju na http://localhost:3002.
  2. Klikni Log in.
  3. Proveri da se dugme nalazi na dnu Keycloak login kartice.
  4. Klikni Sign in with Google.
  5. Završiti Google prijavu.
  6. Proveriti povratak u aplikaciju i uspešno učitavanje profila.
  7. Otvori Register i proveri isto dugme na dnu registration stranice.
  8. Registruj novi Google nalog.
  9. Proveri u Keycloak-u da je korisnik kreiran i da je email verifikovan.
  10. Proveri da za Google korisnika nije poslat verification email.
  11. Proveri kreiranje sastanka i My meetings.
  12. Proveri postojeći email/password login i registraciju.
  13. Proveri ponašanje za lokalni nalog sa istom email adresom.
  14. Proveri logout, otkazivanje Google prijave i light/dark temu.

  ## Važna napomena

  Pošto se koristi KC_DB=dev-file, ručno podešavanje će ostati sačuvano dok postoji lokalna Keycloak instanca i njeni podaci. Ako se lokalni Keycloak container potpuno obriše i realm kreira ponovo, Client ID i Secret moraće ponovo da
  se unesu.



 # Google OAuth2 prijava preko postojećeg Keycloak-a

  ## Rezultat

  Google će biti dodat kao Keycloak Identity Provider, bez Google SDK-a u Angular-u i bez novog OAuth endpointa u Spring backendu.

  Tok će biti:

  1. Angular otvara Keycloak Authorization Code zahtev.
  2. Keycloak prikazuje postojeću sessions login/register stranicu.
  3. Dugme „Sign in with Google“ vodi na Keycloak Google broker.
  4. Keycloak komunicira sa Google-om i validira odgovor.
  5. Keycloak kreira ili povezuje lokalnog Keycloak korisnika.
  6. Keycloak vraća authorization code Angular aplikaciji.
  7. Angular menja code za Keycloak tokene.
  8. Backend nastavlja da validira isti Keycloak JWT kao i kod obične prijave.

  Backend API i postojeći meeting feature-i ne zahtevaju izmene.

  Keycloak Identity Broker podržava kreiranje korisnika iz eksternog identiteta, First Broker Login flow i podešavanje Trust Email opcije. Keycloak dokumentacija

  ## Implementacione izmene

  ### 1. Keycloak realm konfiguracija

  U keycloak/lilly-realm.json dodati Google Identity Provider:

  - alias: google
  - provider ID: google
  - enabled: true
  - hide on login page: false
  - account linking only: false
  - trust email: true
  - store token: false
  - sync mode: IMPORT
  - first login flow: postojeći first broker login
  - default scope: openid profile email
  - clientId: ${GOOGLE_CLIENT_ID}
  - clientSecret: ${GOOGLE_CLIENT_SECRET}
  - useJwksUrl: true

  verifyEmail u realm-u ostaje true. Time se ne ukida verifikacija za klasičnu registraciju emailom; samo Google korisnici sa Google-ovim email_verified=true neće dobiti dodatni verification email.

  Ne uključivati automatsko povezivanje postojećih naloga samo na osnovu email adrese. Zadržati bezbedni Keycloak First Broker Login flow koji traži potvrdu/reautentikaciju kada već postoji lokalni nalog sa istom adresom.

  U lilly-web client dodati PKCE podešavanje:

  "attributes": {
    "pkce.code.challenge.method": "S256"
  }

  ### 2. Environment konfiguracija

  U docker-compose.yml Keycloak servisu proslediti:

  - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
  - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

  U .env.example dodati samo prazne/template vrednosti:

  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=

  Prave vrednosti idu u lokalni .env, koji je već zaštićen u .gitignore fajlu. Client secret nikada ne sme biti u Angular kodu, env.js fajlu ili git repozitorijumu.

  Keycloak podržava environment placeholder-e u realm JSON fajlovima. Važno je da startup import preskače realm koji već postoji, pa će se postojeći lokalni realm morati ažurirati kroz Admin Console ili Admin REST API. Keycloak import
  dokumentacija

  ### 3. Dugme na Keycloak login stranici

  Postojeća nasleđena Keycloak login stranica već može da prikaže social.providers listu. Ne praviti ručni Google URL. Link mora doći iz Keycloak-a jer on generiše state, broker session i povratnu adresu.

  U keycloak/themes/sessions/login/resources/css/styles.css:

  - stilizovati #kc-social-providers;
  - dugme prikazati kao belo/outlined „Sign in with Google“ dugme;
  - koristiti postojeću Keycloak Google ikonicu;
  - obezbediti aria-label;
  - postaviti social sekciju nakon login/register sadržaja, na samo dno kartice;
  - zadržati podršku za light i dark temu;
  - ne učitavati eksterne Google JavaScript biblioteke ili slike.

  ### 4. Dugme na Keycloak register stranici

  Parent register.ftl ne prikazuje social provider dugme, pa dodati verziono usklađen override:

  keycloak/themes/sessions/login/register.ftl

  Template treba zasnovati na register template-u iz Keycloak 26.3 i samo dodati social provider blok nakon postojećeg registration formulara. Ne uklanjati postojeća polja, terms acceptance, recaptcha podršku ili password validation.

  Dugme treba koristiti Keycloak-ov p.loginUrl, a tekst treba biti isti na obe stranice:

  Sign in with Google

  Klik sa register stranice vodi kroz isti broker flow; ako Google nalog još nije poznat Keycloak-u, korisnik se kreira kao novi Keycloak korisnik.

  ### 5. Angular Authorization Code flow

  U web-angular/src/app/core/auth.service.ts zadržati postojeće login() i register() metode, ali unaprediti authorization code flow:

  - generisati kriptografski siguran state;
  - generisati PKCE code_verifier;
  - izračunati code_challenge metodom S256;
  - privremeno sačuvati state/verifier u sessionStorage;
  - poslati state, code_challenge i code_challenge_method=S256 Keycloak-u;
  - pri povratku proveriti state pre razmene koda;
  - poslati code_verifier na token endpoint;
  - odbiti callback ako state ne odgovara;
  - zadržati postojeće nazive tokena u localStorage radi kompatibilnosti;
  - zadržati postojeći kc_action=register behavior;
  - nakon uspešnog callback-a ukloniti authorization code i state iz URL-a.

  Google token se nikada ne razmenjuje direktno u Angular-u. Angular dobija samo Keycloak tokene.

  ## Tačne vrednosti za lokalni setup

   Podešavanje                             Vrednost
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Google OAuth client type                Web application
  ──────────────────────────────────────  ───────────────────────────────────────────────────────────
   Google authorized redirect URI          http://localhost:8080/realms/lilly/broker/google/endpoint
  ──────────────────────────────────────  ───────────────────────────────────────────────────────────
   Keycloak realm                          lilly
  ──────────────────────────────────────  ───────────────────────────────────────────────────────────
   Keycloak client                         lilly-web
  ──────────────────────────────────────  ───────────────────────────────────────────────────────────
   Angular redirect URI                    http://localhost:3002
  ──────────────────────────────────────  ───────────────────────────────────────────────────────────
   Google scopes                           openid profile email
  ──────────────────────────────────────  ───────────────────────────────────────────────────────────
   Google authorized JavaScript origins    Nisu potrebni
  ──────────────────────────────────────  ───────────────────────────────────────────────────────────
   Google API scopes                       Ne dodavati Drive, Calendar ili druge scope-ove

  Google zahteva da redirect URI bude potpuno identičan konfigurisanom URI-ju, uključujući protokol i završnu kosu crtu. Google OpenID Connect dokumentacija

  ## Tvoj deo posla u Google Cloud Console

  1. Otvori Google Cloud Console.
  2. Kreiraj novi projekat, na primer:

     Lilly Meetings Local

     Možeš koristiti i postojeći projekat, ali je odvojeni projekat za razvoj uredniji.

  3. Otvori Google Auth Platform konfiguraciju.
  4. U delu Branding unesi:
      - Application name: Lilly Meetings
      - User support email: tvoj Google email
      - Developer contact email: tvoj Google email

     Za lokalni razvoj nije potrebno unositi lažne produkcione domene.

  5. U delu Audience izaberi:

     External

     Ovo omogućava prijavu Google korisnicima koji nisu deo jedne Google Workspace organizacije.

  6. U delu Data Access / Scopes nemoj dodavati dodatne scope-ove. Aplikaciji su potrebni samo osnovni identitetski podaci:

     openid
     profile
     email

     Za Sign in with Google sa ovim osnovnim scope-ovima ne treba tražiti pristup Google Drive-u, Calendar-u ili drugim servisima. Google navodi da se osnovni identity scope-ovi tretiraju posebno u development/testing režimu. Google
     App Audience dokumentacija

  7. U delu Clients izaberi Create client.
  8. Kao application type izaberi:

     Web application

  9. Nazovi klijenta, na primer:

     Lilly Keycloak Local

  10. U Authorized redirect URIs dodaj tačno:

     http://localhost:8080/realms/lilly/broker/google/endpoint

     Nemoj dodavati Angular adresu kao Google redirect URI. Google vraća odgovor Keycloak-u, a ne direktno Angular aplikaciji.

  11. Klikni Create.
  12. Kopiraj:
      - Client ID
      - Client Secret

     Client Secret ne slati frontend aplikaciji i ne commit-ovati u repozitorijum.

  13. U lokalnom root .env fajlu dodaj:

     GOOGLE_CLIENT_ID=ovde_ide_google_client_id
     GOOGLE_CLIENT_SECRET=ovde_ide_google_client_secret

  14. Ako Google Console prikaže listu test korisnika, dodaj Google nalog kojim ćeš testirati aplikaciju. Aplikaciju možeš ostaviti u statusu Testing dok se koristi samo lokalno. Google testing i publishing status

  ## Tvoj deo posla u Keycloak-u

  Admin Console je samo administratorski alat za podešavanje sistema; krajnji korisnici ga neće videti. Oni će videti samo Keycloak login/register stranicu i Google prijavu.

  Za već postojeći lokalni realm:

  1. Pokreni aplikaciju:

     docker compose up --build

  2. Otvori:

     http://localhost:8080/admin/

  3. Prijavi se admin podacima iz .env/docker-compose.yml.
  4. Izaberi realm lilly.
  5. Otvori Identity Providers.
  6. Izaberi Add provider → Google.
  7. Unesi:
      - Client ID: vrednost iz Google Cloud Console
      - Client Secret: vrednost iz Google Cloud Console
      - Display name: Google
      - Enabled: uključeno
      - Trust Email: uključeno
      - Store Tokens: isključeno
      - Account Linking Only: isključeno
      - Hide on Login Page: isključeno
      - Sync Mode: Import
      - First Login Flow: first broker login

  8. Sačuvaj konfiguraciju.
  9. Proveri da je prikazan Redirect URI upravo:

     http://localhost:8080/realms/lilly/broker/google/endpoint

  Za čistu novu instalaciju dovoljno je da kod koristi realm JSON sa environment placeholder-ima i da se Keycloak pokrene sa vrednostima iz .env. Za već postojeću lokalnu Keycloak bazu koristi Admin Console, jer --import-realm neće
  automatski prepisati postojeći realm.

  ## Ručna verifikacija

  U skladu sa pravilima repozitorijuma ne dodavati automated testove; proveru izvršiti ručno:

  1. Na login stranici proveriti da se Google dugme nalazi na dnu kartice.
  2. Na register stranici proveriti isto dugme i isti izgled.
  3. Kliknuti dugme i potvrditi da browser ide na Google, a ne na Google Admin Console.
  4. Prijaviti se novim Google nalogom.
  5. Proveriti da se korisnik kreirao u Keycloak-u.
  6. Proveriti da je emailVerified=true.
  7. Proveriti da se ne šalje email za verifikaciju tom Google korisniku.
  8. Proveriti Profile, My meetings, kreiranje sastanka i backend pozive.
  9. Odjaviti se i ponovo prijaviti istim Google nalogom.
  10. Proveriti postojeći email/password login i klasičnu registraciju.
  11. Kod postojećeg lokalnog naloga sa istim emailom proveriti da Keycloak traži potvrdu/reautentikaciju, a ne da automatski poveže naloge.
  12. Proveriti otkazivanje Google prijave, odbijanje consent-a i nevažeći OAuth callback.
  13. Proveriti light/dark temu i prikaz na užem ekranu.

  ## Pretpostavke

  - Obuhvaćen je samo lokalni Docker setup.
  - Koristi se postojeći lilly realm i lilly-web public client.
  - Google se koristi isključivo za autentikaciju identiteta.
  - Ne čuvaju se Google access/refresh tokeni.
  - Email verifikacija ostaje uključena za klasične registracije.
  - Postojeći Keycloak korisnici se ne povezuju automatski samo na osnovu email adrese.
