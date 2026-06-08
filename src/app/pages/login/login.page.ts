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
  name = '';
  email = '';
  password = '';

  ionViewWillEnter(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigateByUrl('/library');
    }
  }

  toggleMode(): void {
    this.isRegister = !this.isRegister;
  }

  async submit(): Promise<void> {
    if (!this.email || !this.password) {
      this.showToast('Completa todos los campos');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Cargando...' });
    await loading.present();

    const obs = this.isRegister
      ? this.authService.register({
          name: this.name,
          email: this.email,
          password: this.password,
        })
      : this.authService.login({ email: this.email, password: this.password });

    obs.subscribe({
      next: () => {
        loading.dismiss();
        this.router.navigateByUrl('/library');
      },
      error: (err) => {
        loading.dismiss();
        this.showToast(err.error?.message || 'Error de autenticación');
      },
    });
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }
}
