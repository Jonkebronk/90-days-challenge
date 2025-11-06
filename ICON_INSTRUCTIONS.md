# Instruktioner för att skapa PWA-ikoner

## Nödvändiga ikoner

Du behöver skapa följande ikoner från din logo (`public/images/logo.png`):

### 1. Android/Web ikoner (transparent bakgrund OK)
- `public/images/icon-192.png` - 192x192 pixels
- `public/images/icon-512.png` - 512x512 pixels

### 2. Apple iOS ikon (MÅSTE ha opak bakgrund)
- `public/images/apple-icon.png` - 180x180 pixels

## Viktigt för iOS

⚠️ **Apple-ikonen får INTE ha:**
- Transparent bakgrund
- Rundade hörn
- Dropshadows

iOS lägger automatiskt till rundade hörn och skuggor.

## Hur du skapar ikonerna

### Alternativ 1: Använd ett online-verktyg
1. Gå till https://realfavicongenerator.net/
2. Ladda upp din logo
3. Justera inställningar för varje plattform
4. Ladda ner ikonerna

### Alternativ 2: Använd Photoshop/GIMP
1. Öppna `logo.png`
2. Skapa en ny canvas för varje storlek
3. För Android: Behåll transparent bakgrund
4. För Apple: Lägg till en solid bakgrund (förslag: #FFD700 eller #0a0a0a)
5. Exportera som PNG

### Alternativ 3: Använd ImageMagick (kommandorad)

```bash
# Android ikoner (behåller transparens)
magick public/images/logo.png -resize 192x192 public/images/icon-192.png
magick public/images/logo.png -resize 512x512 public/images/icon-512.png

# Apple ikon (lägg till bakgrund)
magick public/images/logo.png -background "#FFD700" -alpha remove -alpha off -resize 180x180 public/images/apple-icon.png
```

## Testa ikonerna

Efter att du skapat ikonerna:

1. Bygg projektet: `npm run build`
2. Testa på Android: Öppna sidan i Chrome och klicka på "Lägg till på startskärmen"
3. Testa på iOS: Öppna sidan i Safari och klicka på dela-knappen, sedan "Lägg till på hem-skärmen"

## Manifest och metadata

Manifest-filen (`public/manifest.json`) och metadata i `app/layout.tsx` är redan konfigurerade med:

- ✅ App namn: "90-Dagars Challenge"
- ✅ Tema-färg: #FFD700 (guld)
- ✅ Bakgrundsfärg: #0a0a0a (svart)
- ✅ Display mode: standalone (fullskärm utan webbläsar-UI)
- ✅ Ikoner i rätt storlekar
