import { Routes } from '@angular/router';
import { FirstPageComponent } from './first-page/first-page.component';

import { PortfolioComponent } from './portfolio/portfolio.component';

export const routes: Routes = [
  { path: '', component: FirstPageComponent },
  { path: 'first/:symbol', component: FirstPageComponent },
  { path: 'portfolio', component: PortfolioComponent },
];
