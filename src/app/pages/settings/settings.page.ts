import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth';
import {
  AppPreferences,
  PreferencesService,
  ThemeMode,
} from '../../services/preferences';
import { AvailableVoice, TtsService } from '../../services/tts';

interface VoiceGroup {
  lang: string;
  voices: AvailableVoice[];
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  private prefs = inject(PreferencesService);
  private tts = inject(TtsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  state: AppPreferences = this.prefs.current;
  voiceGroups: VoiceGroup[] = [];
  loadingVoices = true;
  appVersion = '1.0.0';
  userName = '';
  userEmail = '';

  readonly themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'auto', label: 'Automático', icon: 'contrast-outline' },
    { value: 'light', label: 'Claro', icon: 'sunny-outline' },
    { value: 'dark', label: 'Oscuro', icon: 'moon-outline' },
  ];

  readonly rateOptions = [0.75, 1.0, 1.25, 1.5, 1.75];

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    this.userName = user?.name ?? 'Invitado';
    this.userEmail = user?.email ?? '';
    await this.loadVoices();
  }

  setTheme(theme: ThemeMode): void {
    this.prefs.setTheme(theme);
    this.state = this.prefs.current;
    this.cdr.markForCheck();
  }

  setVoice(voiceURI: string | null): void {
    this.prefs.setVoice(voiceURI);
    this.tts.setVoice(voiceURI);
    this.state = this.prefs.current;
    this.cdr.markForCheck();
  }

  setRate(rate: number): void {
    this.prefs.setDefaultRate(rate);
    this.tts.setRate(rate);
    this.state = this.prefs.current;
    this.cdr.markForCheck();
  }

  setFontSize(size: number | undefined | null): void {
    if (typeof size !== 'number' || Number.isNaN(size)) return;
    this.prefs.setDefaultFontSize(size);
    this.state = this.prefs.current;
    this.cdr.markForCheck();
  }

  async testVoice(): Promise<void> {
    await this.tts.speak(
      'Hola, así sonará la lectura sincronizada en LectorSync.',
      this.state.language,
    );
  }

  async clearReadingData(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Borrar biblioteca local',
      message:
        'Se eliminarán los libros importados y los capítulos almacenados en este dispositivo. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Borrar',
          role: 'destructive',
          handler: () => {
            this.prefs.clearReadingData();
            this.showToast('Biblioteca local borrada');
          },
        },
      ],
    });
    await alert.present();
  }

  async resetPreferences(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Restablecer preferencias',
      message:
        '¿Volver al tema, voz y velocidad predeterminados? Tus libros no se borrarán.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Restablecer',
          handler: () => {
            this.prefs.reset();
            this.tts.setVoice(null);
            this.tts.setRate(1.0);
            this.state = this.prefs.current;
            this.cdr.markForCheck();
            this.showToast('Preferencias restablecidas');
          },
        },
      ],
    });
    await alert.present();
  }

  async logout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Quieres cerrar tu sesión en LectorSync?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            this.auth.logout();
            this.router.navigateByUrl('/login');
          },
        },
      ],
    });
    await alert.present();
  }

  trackVoice(_: number, v: AvailableVoice): string {
    return v.voiceURI;
  }

  trackGroup(_: number, g: VoiceGroup): string {
    return g.lang;
  }

  private async loadVoices(): Promise<void> {
    this.loadingVoices = true;
    this.cdr.markForCheck();
    try {
      const all = await this.tts.listVoices();
      this.voiceGroups = this.groupByLang(all);
    } catch {
      this.voiceGroups = [];
    } finally {
      this.loadingVoices = false;
      this.cdr.markForCheck();
    }
  }

  private groupByLang(voices: AvailableVoice[]): VoiceGroup[] {
    const map = new Map<string, AvailableVoice[]>();
    for (const v of voices) {
      const key = v.lang || 'otros';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return Array.from(map.entries())
      .map(([lang, voices]) => ({
        lang,
        voices: voices.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => {
        if (a.lang.startsWith('es') && !b.lang.startsWith('es')) return -1;
        if (!a.lang.startsWith('es') && b.lang.startsWith('es')) return 1;
        return a.lang.localeCompare(b.lang);
      });
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      position: 'bottom',
    });
    await toast.present();
  }
}
