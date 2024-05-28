import { detectActiveThemeMode, useSystemThemeMode } from 'clo-ui';
import isNull from 'lodash/isNull';
import { createContext, Dispatch, useContext, useEffect, useReducer, useState } from 'react';

import { AVAILABLE_THEMES, DEFAULT_SORT_BY, DEFAULT_THEME, EMBED_PARAM, EMBED_SEARCH_LIMIT } from '../data';
import { Prefs, SortBy, ThemePrefs } from '../types';
import lsStorage from '../utils/localStoragePreferences';

interface AppState {
  prefs: Prefs;
  isEmbed: boolean;
}

interface Props {
  children: JSX.Element;
}

const initialState: AppState = {
  prefs: lsStorage.getPrefs(),
  isEmbed: false,
};

type Action =
  | { type: 'updateTheme'; theme: string; isEmbed?: boolean }
  | { type: 'updateEffectiveTheme'; theme: string }
  | { type: 'updateLimit'; limit: number }
  | { type: 'updateSort'; by: SortBy }
  | { type: 'updateEmbedStatus'; isEmbed: boolean; theme: ThemePrefs };

export const AppContext = createContext<{
  ctx: AppState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: Dispatch<any>;
}>({
  ctx: initialState,
  dispatch: () => null,
});

export function updateEmbedStatus(isEmbed: boolean, theme: ThemePrefs) {
  return { type: 'updateEmbedStatus', isEmbed, theme };
}

export function updateTheme(theme: string, isEmbed?: boolean) {
  return { type: 'updateTheme', theme, isEmbed };
}

export function updateEffectiveTheme(theme: string) {
  return { type: 'updateTheme', theme };
}

export function updateLimit(limit: number) {
  return { type: 'updateLimit', limit };
}

export function updateSort(by: SortBy) {
  return { type: 'updateSort', by };
}

export function updateActiveStyleSheet(current: string, isEmbed?: boolean) {
  document.getElementsByTagName('html')[0].setAttribute('data-theme', current);
  document
    .querySelector(`meta[name='theme-color']`)!
    .setAttribute('content', current === 'light' ? (isEmbed ? '#343a40' : '#2a0552') : '#0f0e11');
}

const updateEmbedColorsTheme = () => {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(''));
  document.head.appendChild(style);

  const colorsList = [
    '--clo-primary: #31363F;',
    '--clo-secondary: #343a40;',
    '--clo-primary-50: rgba(49, 54, 63, 0.5);',
    '--clo-primary-5: rgba(49, 54, 63, 0.05);',
    '--clo-secondary-900: #1a1a1a;',
    '--clo-secondary-50: rgba(52, 58, 64, 0.5);',
    '--clo-secondary-15: rgba(52, 58, 64, 0.15);',
    '--clo-secondary-5: rgba(52, 58, 64, 0.05);',
    '--highlighted: #0175e4;',
  ];

  const darkColorsList = ['--highlighted: #343a40;'];

  style.sheet!.insertRule(`[data-theme='light'] { ${colorsList.join('')} }`, 0);
  style.sheet!.insertRule(`[data-theme='dark'] { ${darkColorsList.join('')} }`, 0);
};

export function appReducer(state: AppState, action: Action) {
  let prefs;
  let effective;

  switch (action.type) {
    case 'updateEmbedStatus':
      if (action.isEmbed) {
        updateEmbedColorsTheme();
        // Add style to html
        document.getElementsByTagName('html')[0].classList.add('embed');
      }

      prefs = {
        theme: { ...action.theme },
        search: {
          limit: EMBED_SEARCH_LIMIT,
          sort: { by: DEFAULT_SORT_BY },
        },
      };

      return {
        prefs: prefs,
        isEmbed: action.isEmbed,
      };

    case 'updateTheme':
      effective = action.theme === 'automatic' ? detectActiveThemeMode() : action.theme;
      prefs = {
        ...state.prefs,
        theme: {
          configured: action.theme,
          effective: effective,
        },
      };

      lsStorage.setPrefs(prefs);
      updateActiveStyleSheet(effective, action.isEmbed);
      return {
        ...state,
        prefs: prefs,
      };

    case 'updateEffectiveTheme':
      prefs = {
        ...state.prefs,
        theme: {
          ...state.prefs.theme,
          effective: action.theme,
        },
      };
      lsStorage.setPrefs(prefs);
      updateActiveStyleSheet(action.theme);
      return {
        ...state,
        prefs: prefs,
      };

    case 'updateLimit':
      prefs = {
        ...state.prefs,
        search: {
          ...state.prefs.search,
          limit: action.limit,
        },
      };
      lsStorage.setPrefs(prefs);
      return {
        ...state,
        prefs: prefs,
      };

    case 'updateSort':
      prefs = {
        ...state.prefs,
        search: {
          ...state.prefs.search,
          sort: {
            by: action.by,
          },
        },
      };
      lsStorage.setPrefs(prefs);
      return {
        ...state,
        prefs: prefs,
      };

    default:
      return { ...state };
  }
}

function AppContextProvider(props: Props) {
  const activeProfilePrefs = lsStorage.getPrefs();
  const [ctx, dispatch] = useReducer(appReducer, {
    prefs: activeProfilePrefs,
    isEmbed: false,
  });
  const [activeInitialTheme, setActiveInitialTheme] = useState<string | null>(null);
  const [isAutomatic, setIsAutomatic] = useState<boolean>(ctx.prefs.theme.configured === 'automatic');

  useEffect(() => {
    let isEmbed = false;
    let theme = detectActiveThemeMode() as string;
    let configured = DEFAULT_THEME;
    const search = new URLSearchParams(location.search);
    if (search.has(EMBED_PARAM) && search.get(EMBED_PARAM) === 'true') {
      isEmbed = true;

      if (search.has('theme') && AVAILABLE_THEMES.includes(search.get('theme')!)) {
        configured = search.get('theme')!;
        theme = search.get('theme')!;
        if (search.get('theme')! === 'auto') {
          configured = 'automatic';
          theme = detectActiveThemeMode();
          setIsAutomatic(true);
        }
      } else {
        setIsAutomatic(true);
      }

      dispatch({
        type: 'updateEmbedStatus',
        isEmbed,
        theme: {
          effective: theme,
          configured: configured,
        },
      });
    }

    if (!isEmbed) {
      theme =
        activeProfilePrefs.theme.configured === 'automatic'
          ? detectActiveThemeMode()
          : activeProfilePrefs.theme.configured || activeProfilePrefs.theme.effective; // Use effective theme if configured is undefined
    }
    updateActiveStyleSheet(theme);
    setActiveInitialTheme(theme);
  }, []);

  useSystemThemeMode(isAutomatic, dispatch);

  if (isNull(activeInitialTheme)) return null;

  return <AppContext.Provider value={{ ctx, dispatch }}>{props.children}</AppContext.Provider>;
}

function useAppContext() {
  return useContext(AppContext);
}

export { AppContextProvider, useAppContext };
