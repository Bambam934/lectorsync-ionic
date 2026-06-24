# Generación del APK de LectorSync

La carpeta `android/` es generada por Capacitor — **no se commitea al repo**. Cualquier integrante del equipo puede regenerarla con los comandos de abajo.

## Requisitos

- Node 20+ y npm
- **Android Studio** instalado (trae JDK 17/21 + SDK + Gradle integrados)
  - Descarga: https://developer.android.com/studio
- Variables de entorno (opcional si compilas desde Android Studio, requerido si usas terminal):
  - `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk` (Windows)
  - `JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`

## Generar el APK desde cero

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Build del bundle web de producción
npm run build -- --configuration=production

# 3. Añadir plataforma Android (solo la primera vez)
npx cap add android

# 4. Sincronizar bundle web con el proyecto Android
npx cap sync android
```

## Compilar el APK debug

### Opción A: terminal (Windows PowerShell)

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
cd android
.\gradlew.bat assembleDebug
```

El APK queda en:
`android\app\build\outputs\apk\debug\app-debug.apk`

### Opción B: Android Studio

```bash
npx cap open android
```

Eso abre el proyecto en Android Studio. Luego:
1. Menú **Build → Build App Bundle(s) / APK(s) → Build APK(s)**
2. Cuando termine, click en el link **locate** del popup para ir al `.apk`

## Después de cambios en el código

Tras editar `src/`:

```bash
npm run build -- --configuration=production
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

`cap sync` copia el bundle web actualizado al proyecto Android y reaplica plugins.

## APK release (firmado)

Para publicar en Google Play o distribuir oficialmente hay que generar un APK firmado:

```bash
cd android
.\gradlew.bat assembleRelease
```

Pero requiere un **keystore** propio. Para una entrega académica el APK debug es suficiente — se instala con:

```bash
adb install LectorSync-debug.apk
```

O subiéndolo directo al dispositivo (habilitar "Orígenes desconocidos" en Android).

## Notas

- **Tamaño actual del APK debug**: ~5.6 MB
- **App ID**: `io.ionic.starter` (el default de Capacitor). Si quieren cambiarlo para producción, edita `capacitor.config.ts` (campo `appId`), borra `android/` y regenera con `npx cap add android`.
- **Permisos**: el `AndroidManifest.xml` ya incluye los necesarios para TTS (síntesis de voz). Si añaden plugins nuevos (cámara, mic, etc.) Capacitor inyecta los permisos automáticamente al hacer `cap sync`.
