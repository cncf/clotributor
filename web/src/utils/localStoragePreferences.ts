import { detectActiveThemeMode } from 'clo-ui/utils/detectActiveThemeMode';
import { isEmpty, sortBy } from 'lodash';

import { DEFAULT_SEARCH_LIMIT, DEFAULT_SORT_BY } from '../data';
import { Prefs } from '../types';

export interface PreferencesList {
  [key: string]: Prefs;
}

const LS_ITEM = 'clotributorPrefs';
const APPLIED_MIGRATION = 'clotributorAppliedMigration';
const DEFAULT_THEME = 'automatic';

interface Migration {
  key: number;
  description: string;
  method: (lsActual: PreferencesList) => PreferencesList;
}

const DEFAULT_PREFS: Prefs = {
  search: {
    limit: DEFAULT_SEARCH_LIMIT,
    sort: { by: DEFAULT_SORT_BY },
  },
  theme: { configured: DEFAULT_THEME, effective: detectActiveThemeMode() },
};

const migrations: Migration[] = [];

export const applyMigrations = (lsActual: PreferencesList): PreferencesList => {
  let lsUpdated: PreferencesList = { ...lsActual };
  const lastMigration = getLastMigrationNumber();

  if (isEmpty(lsUpdated)) {
    lsUpdated = { guest: DEFAULT_PREFS };
  } else {
    if (isEmpty(migrations)) return lsUpdated;
    const sortedMigrations: Migration[] = sortBy(migrations, 'key');
    let migrationsToApply = [...sortedMigrations];
    const migrationApplied = window.localStorage.getItem(APPLIED_MIGRATION);

    if (migrationApplied) {
      // If latest migration has been applied, we don't do anything
      if (lastMigration === parseInt(migrationApplied)) {
        migrationsToApply = [];
      } else {
        // Migrations newest than current one are applied to prefs
        migrationsToApply = sortedMigrations.filter(
          (migration: Migration) => migration.key > parseInt(migrationApplied)
        );
      }
    }

    migrationsToApply.forEach((migration: Migration) => {
      lsUpdated = migration.method(lsUpdated);
    });
  }

  // Saved last migration
  try {
    window.localStorage.setItem(LS_ITEM, JSON.stringify(lsUpdated));
    window.localStorage.setItem(APPLIED_MIGRATION, lastMigration.toString());
  } catch {
    // Incognite mode
  }
  return lsUpdated;
};

const getLastMigrationNumber = (): number => {
  const sortedMigrations = sortBy(migrations, 'key');
  if (isEmpty(sortedMigrations)) return 0;
  return sortedMigrations[sortedMigrations.length - 1].key;
};

export class LocalStoragePreferences {
  private savedPreferences: PreferencesList = { guest: DEFAULT_PREFS };

  constructor() {
    try {
      const preferences = window.localStorage.getItem(LS_ITEM);
      if (preferences) {
        this.savedPreferences = applyMigrations(JSON.parse(preferences));
      } else {
        this.setPrefs(DEFAULT_PREFS);
      }
    } catch {
      // Incognite mode
    }
  }

  public setPrefs(prefs: Prefs) {
    const preferences = { ...this.savedPreferences, guest: prefs };
    this.savedPreferences = preferences;

    try {
      window.localStorage.setItem(LS_ITEM, JSON.stringify(preferences));
    } catch {
      // Incognite mode
    }
  }

  public getPrefs(): Prefs {
    return {
      ...DEFAULT_PREFS,
      ...this.savedPreferences.guest,
    };
  }
}

const lsPreferences = new LocalStoragePreferences();
export default lsPreferences;
