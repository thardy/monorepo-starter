import { createCrudEvents } from '@ng-common/data/crud-events.factory';
import { IProduct } from '../product.model';

export const productEvents = createCrudEvents<IProduct>('Product');

// Also export individual groups for convenience if needed
export const { listPageEvents, editPageEvents, apiEvents } = productEvents;

// This gives us:
// - productEvents.listPageEvents.opened, productEvents.listPageEvents.refreshed, etc.
// - productEvents.editPageEvents.createButtonClicked, productEvents.editPageEvents.updateButtonClicked, etc.
// - productEvents.apiEvents.loadAllSuccess, productEvents.apiEvents.createSuccess, etc.
//
// For any new entity, it's just one line:
// export const entityEvents = createCrudEvents<IEntity>('EntityName');
