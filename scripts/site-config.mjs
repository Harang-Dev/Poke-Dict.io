try {
  process.loadEnvFile('.env.local');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

export const siteUrl = new URL(process.env.POKEDICT_SITE_URL || 'https://harang-dev.github.io/Poke-Dict.io/');
if (siteUrl.protocol !== 'https:' || siteUrl.username || siteUrl.password) {
  throw new Error('POKEDICT_SITE_URL must be a public HTTPS URL without credentials.');
}
siteUrl.pathname = siteUrl.pathname.replace(/\/*$/, '/');
siteUrl.search = '';
siteUrl.hash = '';

export const adsensePublisherId = (process.env.POKEDICT_ADSENSE_PUBLISHER_ID || '').trim();
if (adsensePublisherId && !/^ca-pub-\d{16}$/.test(adsensePublisherId)) {
  throw new Error('POKEDICT_ADSENSE_PUBLISHER_ID must be a real ca-pub- publisher ID with 16 digits.');
}
