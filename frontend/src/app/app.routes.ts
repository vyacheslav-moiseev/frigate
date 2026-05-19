import { Routes } from '@angular/router';
import { InspectionListComponent } from './pages/inspection-list/inspection-list.component';
import { InspectionFormComponent } from './pages/inspection-form/inspection-form.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inspections',
    pathMatch: 'full',
  },
  {
    path: 'inspections',
    component: InspectionListComponent,
  },
  {
    path: 'inspections/create',
    component: InspectionFormComponent,
  },
  {
    path: 'inspections/:id/edit',
    component: InspectionFormComponent,
  },
];
