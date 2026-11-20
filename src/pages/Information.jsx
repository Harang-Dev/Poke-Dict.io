import ContentPage from '../components/ContentPage';
import { informationPages } from '../content/information';
import { pageMetadata } from '../seo';

export default function Information({ kind }) {
  return <ContentPage page={informationPages[kind]} breadcrumbs={pageMetadata(`/${kind}/`).breadcrumbs} />;
}
