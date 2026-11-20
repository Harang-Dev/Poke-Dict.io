import ContentPage from '../components/ContentPage';
import { guideSections } from '../siteInfo';
import { pageMetadata } from '../seo';

export default function Guide() {
  return <ContentPage page={{ title: '이용 및 데이터 안내', description: '기록이 저장되고 공유되는 방식을 확인해 주세요.', sections: guideSections }}
    breadcrumbs={pageMetadata('/guide/').breadcrumbs} />;
}
