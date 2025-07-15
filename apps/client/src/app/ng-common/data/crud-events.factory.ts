import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export function createCrudEvents<T>(entityName: string) {
  const listPageEvents = eventGroup({
    source: `${entityName}List Page`,
    events: {
      opened: type<void>(),
      refreshed: type<void>(),
      deleteButtonClicked: type<string>(),
    },
  });

  const editPageEvents = eventGroup({
    source: `${entityName}Edit Page`,
    events: {
      opened: type<void>(),
      refreshed: type<void>(),
      createButtonClicked: type<T>(),
      updateButtonClicked: type<T>(),
      deleteButtonClicked: type<string>(),
    },
  });

  const apiEvents = eventGroup({
    source: `${entityName} API`,
    events: {
      loadAllSuccess: type<T[]>(),
      loadAllFailure: type<string>(),
      createSuccess: type<T>(),
      createFailure: type<string>(),
      updateSuccess: type<T>(),
      updateFailure: type<string>(),
      deleteSuccess: type<string>(),
      deleteFailure: type<string>(),
    },
  });

  return {
    listPageEvents,
    editPageEvents,
    apiEvents,
  };
} 