import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  isRegister = false;
  showPassword = false;
  name = '';
  email = '';
  password = '';

  ionViewWillEnter(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigateByUrl('/library');
    }
  }

  get canSubmit(): boolean {
    if (!this.email.trim() || !this.password) return false;
    if (this.isRegister && !this.name.trim()) return false;
    if (this.password.length < 4) return false;
    return this.isValidEmail(this.email.trim());
  }

  async submit(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.showToast('Completa todos los campos');
      return;
    }
    if (!this.isValidEmail(this.email.trim())) {
      this.showToast('Introduce un correo válido');
      return;
    }
    if (this.password.length < 4) {
      this.showToast('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (this.isRegister && !this.name.trim()) {
      this.showToast('Introduce tu nombre');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.isRegister ? 'Creando cuenta...' : 'Iniciando sesión...',
      spinner: 'crescent',
    });
    await loading.present();

    const obs = this.isRegister
      ? this.authService.register({
          name: this.name.trim(),
          email: this.email.trim(),
          password: this.password,
        })
      : this.authService.login({
          email: this.email.trim(),
          password: this.password,
        });

    obs.subscribe({
      next: () => {
        loading.dismiss();
        this.router.navigateByUrl('/library');
      },
      error: (err) => {
        loading.dismiss();
        this.showToast(err?.error?.message || 'Error de autenticación');
      },
    });
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2800,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }
}
