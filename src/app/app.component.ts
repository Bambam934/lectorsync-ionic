import { Component, inject } from '@angular/core';
import { PreferencesService } from './services/preferences';
import { TtsService } from './services/tts';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private prefs = inject(PreferencesService);
  private tts = inject(TtsService);

  constructor() {
    this.prefs.applyInitialTheme();
    const state = this.prefs.current;
    this.tts.setRate(state.defaultRate);
    this.tts.setVoice(state.voiceURI);
  }
}
