import messages from './messages';

export const initReactIntl = () => {
    let locale = (navigator.languages?.[0] || navigator.language || navigator.userLanguage || 'en')
        .toLowerCase().split(/[_-]+/)[0];
    const localeMessages = messages[locale] || messages[localeWithoutRegionCode] || messages['en'];

    locale = localeMessages === messages['en'] ? 'en' : locale;

    return {locale, messages: localeMessages};
}
