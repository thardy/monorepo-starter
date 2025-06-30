import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { loadHostConfig } from '@app/ng-common/config/services/config.service';

loadHostConfig('/config/config.json')
  .then(() => {
    return bootstrapApplication(AppComponent, appConfig);
  })
  .catch((err) => console.error(err));
