import { Link, useParams } from 'react-router-dom';
import { articleBySlug, catalogueSource, editorialDate, learningArticles } from '../content/learning';
import ContentPage from '../components/ContentPage';
import Breadcrumbs from '../components/Breadcrumbs';
import { pageMetadata } from '../seo';

export default function Learn() {
  const { slug } = useParams();
  const article = articleBySlug.get(slug);
  if (slug && !article) {
    return <main className="workspace"><h1>가이드를 찾을 수 없어요.</h1><Link to="/learn/">가이드 목록으로</Link></main>;
  }
  if (article) {
    return (
      <ContentPage page={article} breadcrumbs={pageMetadata(`/learn/${slug}/`).breadcrumbs}>
        <p className="content-source">Poke-Dict 편집 · <time dateTime={editorialDate}>2026년 11월 20일 작성</time><br />
          계산 예시와 데이터 기준: <a href={catalogueSource}>PokéAPI 고정 리비전</a></p>
      </ContentPage>
    );
  }
  return (
    <main className="workspace guide">
      <Breadcrumbs items={pageMetadata('/learn/').breadcrumbs} />
      <h1>포켓몬 도감 활용 가이드</h1>
      <p>타입과 기본 스탯을 읽는 방법부터, 폼별 수집과 팀 점검까지 실제 예시로 확인하세요.</p>
      <ul className="content-cards">{learningArticles.map((item) => (
        <li key={item.slug}><Link to={`/learn/${item.slug}/`}><strong>{item.title}</strong><span>{item.description}</span></Link></li>
      ))}</ul>
      <p className="content-source">가이드의 계산 예시는 공개 데이터와 현재 사이트 동작을 기준으로 합니다. 실제 배틀의 모든 조건이나 대회 규칙을 판정하지는 않습니다.</p>
    </main>
  );
}
