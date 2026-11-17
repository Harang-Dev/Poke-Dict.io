export const siteUrl = new URL(process.env.POKEDICT_SITE_URL || 'https://harang-dev.github.io/Poke-Dict.io/');
siteUrl.pathname = siteUrl.pathname.replace(/\/*$/, '/');
siteUrl.search = '';
siteUrl.hash = '';
