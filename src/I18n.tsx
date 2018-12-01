import * as React from 'react';

import { Locale } from './config';
import format from './_helpers/format';
import bbParser from './_helpers/bbParser';
import { I18nContextValue } from './Provider';
import { TranslationMap } from './fileSource';

// -----------------------------------------------------------------------------
export type I18nProps = {
  children?: (val: string, map: null | TranslationMap) => React.ReactNode,
  d?: string | TranslationMap,
  id: string,
  v?: string
};

// -------------------------------------------------------------------------------------------------

const defaultContext: I18nContextValue = {
  locale: Locale.en,
  get: (key: string): null | string => {
    console.log('I18n: Get for: ', key);
    return null;
  },
  match: (search: string): null | TranslationMap => {
    console.log('I18n: Search for: ', search);
    return null;
  },
  unregisterKey: () => {},
  registerKey: () => {},
  toString: () => ''
};

// -------------------------------------------------------------------------------------------------

// source context
const I18nContext: React.Context<I18nContextValue> = React.createContext(defaultContext);

class I18n extends React.PureComponent<I18nProps> {
  static Context = I18nContext.Consumer;
  static contextType = I18nContext;

  // // --------------------------------------------------------------------------------------------

  getEnum = (): null | { template: string, def: TranslationMap } => {
    let { id, d, v } = this.props;

    if (!this.props.id.startsWith('$') && typeof d !== 'object') {
      throw new Error('I18n: Missing default for enum key ' + id);
    }

    const children = this.props.children;

    if (typeof children !== 'function' && (typeof v === 'undefined' || v === null || v === '')) {
      throw new Error('I18n: Missing value for enum key ' + id);
    }

    const def: null | TranslationMap =
      this.context.match(id) || (typeof d === 'object' ? d : null) || null;

    if (def && typeof v !== 'undefined' && def[v]) {
      return {
        template: def[v],
        def
      };
    }
    return null;
  };

  // // --------------------------------------------------------------------------------------------

  componentDidMount(): void {
    if (process.env.REACT_APP_STAGE !== 'production') {
      this.context.registerKey(this.props.id, this.props.d);
    }
  }

  // // --------------------------------------------------------------------------------------------

  componentWillUnmount(): void {
    if (process.env.REACT_APP_STAGE !== 'production') {
      this.context.unregisterKey(this.props.id);
    }
  }

  // // --------------------------------------------------------------------------------------------

  render(): React.ReactNode {
    const { id, children, d, v, ...options } = this.props; // eslint-disable-line
    const more = options || {};
    const isFunc = typeof children === 'function';

    const { get, locale } = this.context;
    let def = d;
    let template: string = typeof def === 'string' ? def : '';

    // Enum key
    if (id.endsWith('$')) {
      let en = this.getEnum();
      if (en) {
        template = en.template;
        def = en.def;
      }
    } else {
      // Common keys
      let key = id;
      // Reusable Key
      if (key[0] === '$') {
        key = key.substr(1);
      }
      template = get(key) || template || '';
    }

    let value = template && format(template, locale, more);
    value = bbParser.toReact(value);

    if (isFunc && children) {
      return children(value, typeof def === 'object' && def !== null ? def : null);       
    }

    return value;
  }
}

export { I18nContext };

export default I18n;
