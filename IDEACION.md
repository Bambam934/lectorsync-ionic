# Foro de Ideación — Módulo Énfasis en Programación Móvil

**Equipo**: EquipoEPMB02 - 4  
**Programa**: Especialización Tecnológica en Desarrollo de Aplicaciones para Redes Móviles  
**Módulo**: Énfasis en Programación Móvil  
**Fecha**: Mayo 2026

---

## Sinopsis

LectorSync es una aplicación móvil multiplataforma orientada a transformar la experiencia de lectura digital mediante la integración de síntesis de voz (Text-to-Speech) sincronizada con resaltado visual palabra por palabra en tiempo real. A través de la app, los usuarios pueden importar libros en formatos EPUB, PDF y TXT, organizarlos en una biblioteca personal con visualización de portadas y progreso de lectura, navegar por capítulos con tabla de contenidos interactiva, y escuchar el contenido con voces naturales mientras el texto se ilumina en pantalla al ritmo de la lectura. La interfaz de lectura permite personalizar el tamaño de fuente, controlar la velocidad de reproducción (0.75x, 1x, 1.5x), y retomar la lectura exactamente donde se dejó gracias a la sincronización de progreso con el servidor. LectorSync está dirigida tanto a estudiantes y lectores habituales que buscan una experiencia de lectura enriquecida, como a personas con dislexia, baja visión o dificultades de aprendizaje que se benefician de la estimulación audiovisual simultánea. La aplicación está diseñada para funcionar en Android, iOS y navegador web desde su primera versión gracias a Ionic con Capacitor, y cuenta con un backend en Node.js con API REST, PostgreSQL y autenticación JWT.

---

## Referencias de Aplicaciones Pertinentes

Según Atlas AI Dev (2026), existe un ecosistema creciente de aplicaciones de lectura con Text-to-Speech que atienden diferentes segmentos del mercado. A continuación se presentan las referencias más pertinentes para LectorSync, comparando sus atributos principales, característica diferenciadora y modelo de precios:

| Software | Lo mejor para | Característica destacada | Precio inicial |
|---|---|---|---|
| **Speechify** | Estudiantes y profesionales que necesitan escuchar documentos | Más de 200 voces premium con IA, OCR para escanear páginas físicas, ganadora del Apple Design Award en WWDC 2025 | Gratis (básico) / $139 USD/año (Premium) |
| **Voice Dream Reader** | Personas con dislexia y discapacidad visual | Resaltado palabra por palabra sincronizado con TTS, casi 200 voces en 25+ idiomas, referente en accesibilidad educativa | $19.99 USD (compra única iOS) |
| **NaturalReader** | Lectura de documentos y páginas web en voz alta | 1.000+ voces con tecnología neural TTS y LLM, disponible como app web, móvil y extensión de Chrome | Gratis (básico) / $60 USD/año (Premium) |
| **Moon+ Reader** | Lectores digitales en Android que buscan personalización | Soporte para EPUB, PDF, MOBI, CBR; más de 50 millones de descargas en Google Play; TTS integrado con alta personalización visual | Gratis / $6.99 USD (Pro) |
| **Amazon Kindle** | Ecosistema completo de lectura y audiolibros | Sincronización Whispersync entre dispositivos, integración con Audible, VoiceView para accesibilidad, más de 100 millones de usuarios | Gratis (app) / $11.99 USD/mes (Unlimited) |

**Análisis comparativo**: Speechify y Voice Dream Reader lideran en calidad de TTS y accesibilidad, pero su enfoque es primordialmente la reproducción de documentos existentes sin una experiencia de lectura inmersiva por capítulos. Moon+ Reader ofrece la mejor personalización de lectura pero su TTS carece de sincronización visual avanzada. Kindle domina el mercado pero su modelo es cerrado y dependiente del ecosistema Amazon. LectorSync se diferencia al combinar una experiencia de lectura por capítulos con TTS sincronizado palabra por palabra, soporte multiformat abierto (EPUB/PDF/TXT) y sincronización de progreso con backend propio, todo desde una base de código multiplataforma con Ionic.

---

## Objetivos

### Objetivo General

Desarrollar LectorSync, una aplicación móvil multiplataforma (Android, iOS y Web) que permita a los usuarios importar, leer y escuchar libros digitales con síntesis de voz sincronizada y resaltado visual palabra por palabra, utilizando el framework Ionic con Angular y Capacitor, logrando que al menos el 90% de las funcionalidades operen correctamente en las tres plataformas y que los usuarios de prueba reporten una mejora percibida en su experiencia de lectura durante las 8 semanas del módulo.

### Objetivos Específicos

1. **Diseñar la arquitectura de la aplicación multiplataforma en Ionic con Angular**, contemplando los módulos de autenticación (JWT), biblioteca digital personal, lector con TTS sincronizado y panel de configuración de lectura, en un plazo de dos semanas desde el inicio del módulo.

2. **Implementar un sistema de autenticación seguro** con registro e inicio de sesión mediante JSON Web Tokens (access + refresh tokens), validación de credenciales con mínimo 8 caracteres de contraseña y correo electrónico válido, y cierre de sesión con revocación de tokens, funcional antes de la entrega del prototipo en el Escenario 3.

3. **Desarrollar una biblioteca digital personal** que soporte la importación de libros en al menos 3 formatos (EPUB, PDF, TXT), visualización de portadas, metadatos (autor, formato, capítulos) y barra de progreso de lectura, con búsqueda y filtrado por título y autor, medible por la cantidad de formatos soportados y la velocidad de respuesta en la carga de la biblioteca (<2 segundos para 50 libros), completado en las semanas 2-4.

4. **Integrar un motor de Text-to-Speech (TTS)** que utilice la Web Speech API del navegador y las APIs nativas de cada plataforma vía Capacitor, con resaltado visual palabra por palabra sincronizado en tiempo real, controles de reproducción (play/pause/stop) y ajuste de velocidad (0.75x, 1x, 1.5x), reduciendo la fricción de lectura en al menos un 30% respecto a la lectura silenciosa según las pruebas con usuarios, disponible en la versión beta del producto (semanas 4-6).

5. **Implementar persistencia de progreso de lectura** que almacene la posición exacta del usuario (capítulo y palabra) y la sincronice con el backend mediante API REST, permitiendo retomar la lectura desde cualquier dispositivo con una desviación máxima de 0 palabras en la posición guardada, durante las semanas 5-7.

6. **Validar la usabilidad y compatibilidad multiplataforma** con al menos 8 usuarios reales (4 lectores habituales y 4 personas con necesidades de accesibilidad), desplegando en Android (Capacitor), iOS (Capacitor) y navegador web, obteniendo un puntaje mínimo de 4/5 en criterios de experiencia de usuario y confirmando que el TTS sincronizado funcione en las tres plataformas, antes de la entrega final del módulo.

---

## Justificación

El sector de la lectura digital y los audiolibros representa uno de los mercados de mayor crecimiento sostenido a nivel global. De acuerdo con Statista (2025), el mercado mundial de ebooks fue valorado en 22.400 millones de dólares en 2024 y se proyecta que alcance los 34.500 millones en 2033, con un crecimiento anual compuesto (CAGR) del 4,9%. Paralelamente, el mercado de audiolibros alcanzó los 8.150 millones de dólares en 2024 y se estima que crezca a un ritmo del 26,5% anual hasta superar los 67.000 millones en 2033 (GMInsights, 2025), lo que evidencia una demanda creciente por experiencias de lectura que integren texto y audio. En este sentido, LectorSync se posiciona en la intersección de ambos mercados al ofrecer lectura digital con síntesis de voz sincronizada.

Desde la perspectiva de la accesibilidad, la Organización Mundial de la Salud (OMS, 2023) estima que al menos 2.200 millones de personas en el mundo tienen algún tipo de deficiencia visual o ceguera. Las aplicaciones que integran Text-to-Speech con resaltado visual facilitan el acceso a la lectura para personas con dislexia, baja visión o dificultades de aprendizaje, alineándose con los principios del Diseño Universal para el Aprendizaje (UDL) de CAST (2022), cuyas directrices versión 3.0 promueven múltiples medios de representación, acción y expresión, y compromiso en el aprendizaje. El mercado global de TTS fue valorado en 4.000 millones de dólares en 2024 y se proyecta que alcance los 7.600 millones para 2029 (MarketsandMarkets, 2025), donde el segmento educativo constituye uno de los principales motores de crecimiento: aproximadamente el 50% de las plataformas de educación en línea a nivel global ya integran TTS para mejorar la participación de estudiantes con discapacidades de aprendizaje.

En el contexto colombiano, la pertinencia de una solución multiplataforma se sustenta en que Colombia superó los 48 millones de accesos a internet móvil en el tercer trimestre de 2024, de los cuales el 85,4% operó en tecnología 4G y el 5,8% en 5G (MinTIC, 2024). La penetración de smartphones en el país alcanza el 79% y se proyecta que llegue al 97% en 2030, con 87,4 millones de líneas de telefonía móvil activas (Trustonic, 2024), lo que hace indispensable que LectorSync contemple Android, iOS y Web de manera nativa desde su primera versión.

Finalmente, la elección de Ionic como framework se justifica por su arquitectura basada en estándares web (HTML, CSS, TypeScript/Angular), lo que facilita el aprendizaje en un contexto de especialización tecnológica. Ionic respalda más de 5 millones de aplicaciones en más de 200 países (Ionic Framework, 2024) y, junto con Capacitor, permite acceder a APIs nativas de cada plataforma (TTS, sistema de archivos, notificaciones) desde una única base de código, reduciendo costos y tiempos de desarrollo entre un 30% y un 50% respecto al desarrollo nativo (Biørn-Hansen et al., 2020). La adopción de tecnologías híbridas ha crecido hasta el 74% de los desarrolladores en 2025 (RipenApps, 2025), consolidando este enfoque como una estrategia viable y competitiva para el desarrollo móvil actual.

---

## Referencias

Atlas AI Dev. (2026). *9 Best Text-to-Speech Book Readers in 2026 (Free and Paid)*. Atlas AI Dev. https://atlasaidev.com/best-text-to-speech-book-readers/

Biørn-Hansen, A., Majchrzak, T. A., & Grønli, T.-M. (2020). Progressive Web Apps for the Unified Development of Mobile Applications. *Web Information Systems and Technologies*, 64-86. Springer. https://doi.org/10.1007/978-3-030-35510-4_4

CAST. (2022). *Universal Design for Learning Guidelines version 3.0*. CAST, Inc. https://udlguidelines.cast.org/

GMInsights. (2025). *Audiobooks Market Trends, Share and Forecast, 2025-2034*. Global Market Insights. https://www.gminsights.com/industry-analysis/audiobooks-market

Ionic Framework. (2024). *Ionic Framework - Cross-Platform Mobile App Development Leader*. Ionic. https://ionicframework.com/

MarketsandMarkets. (2025). *Text-to-Speech Market Size, Share, Trends & Industry Analysis 2033*. MarketsandMarkets. https://www.marketsandmarkets.com/Market-Reports/text-to-speech-market-2434298.html

MinTIC. (2024). *Colombia superó los 48 millones de accesos a Internet móvil en el tercer trimestre del 2024*. Ministerio de Tecnologías de la Información y las Comunicaciones. https://www.mintic.gov.co/portal/715/w3-article-399983.html

MoonReader Inc. (2024). *Moon+ Reader - eBook Reader*. Google Play Store. https://play.google.com/store/apps/details?id=com.flyersoft.moonreader

Organización Mundial de la Salud. (2023). *Ceguera y discapacidad visual: Datos y cifras*. OMS. https://www.who.int/es/news-room/fact-sheets/detail/blindness-and-visual-impairment

RipenApps. (2025). *Cross-Platform App Development Statistics 2025: Key Insights for Business Leaders*. RipenApps. https://ripenapps.com/blog/cross-platform-app-development-statistics/

Speechify. (2025). *Voice Dream Reader vs NaturalReader*. Speechify. https://speechify.com/blog/natural-reader-vs-voice-dream/

Statista. (2025). *eBooks - Worldwide: Statista Market Forecast*. Statista Research Department. https://www.statista.com/outlook/dmo/digital-media/epublishing/ebooks/worldwide

Trustonic. (2024). *Brecha digital en Colombia: conectividad y 5G*. Trustonic Latin America. https://www.trustonic.com/la-es/opinion/brecha-digital-colombia-conectividad-5g/

UNESCO. (2023). *Informe de seguimiento de la educación en el mundo 2023: Tecnología en la educación: ¿Una herramienta en los términos de quién?*. UNESCO. https://www.unesco.org/gem-report/2023
