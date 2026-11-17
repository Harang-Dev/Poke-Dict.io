import { lazy, Suspense } from 'react';
import { HashRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Detail from './pages/Detail';
import Home from './pages/Home';
import { Toaster } from './components/ui/sonner';
import { CollectionProvider } from './dex/collection';

const Collection = lazy(() => import('./pages/Collection'));
const SharedBinder = lazy(() => import('./pages/Collection').then((module) => ({ default: module.SharedBinder })));
const Compare = lazy(() => import('./pages/Compare'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Team = lazy(() => import('./pages/Team'));
const MoveList = lazy(() => import('./pages/Moves').then((module) => ({ default: module.MoveList })));
const MoveDetail = lazy(() => import('./pages/Moves').then((module) => ({ default: module.MoveDetail })));

export default function App() {
  return (
    <HashRouter>
      <CollectionProvider>
        <header className="site-header">
          <div>
            <Link className="site-brand" to="/" aria-label="Poke-Dict 홈">Poke-Dict</Link>
            <nav aria-label="주 메뉴">
              <NavLink end to="/">도감</NavLink>
              <NavLink to="/collection">내 컬렉션</NavLink>
              <NavLink to="/compare">비교</NavLink>
              <NavLink to="/moves">기술</NavLink>
              <NavLink to="/quiz">퀴즈</NavLink>
              <NavLink to="/team">내 팀</NavLink>
            </nav>
          </div>
        </header>
        <Suspense fallback={<main className="workspace"><p role="status">화면을 불러오는 중…</p></main>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pokemon/:id" element={<Detail />} />
            <Route path="/detail" element={<Navigate to="/" replace />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/binder" element={<SharedBinder />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/moves" element={<MoveList />} />
            <Route path="/moves/:id" element={<MoveDetail />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/team" element={<Team />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </CollectionProvider>
    </HashRouter>
  );
}

function NotFound() {
  return (
    <main className="detail">
      <h1>페이지를 찾을 수 없어요.</h1>
      <Link to="/">도감 목록으로</Link>
    </main>
  );
}
