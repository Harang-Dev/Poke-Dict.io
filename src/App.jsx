import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import Detail from './pages/Detail';
import Home from './pages/Home';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pokemon/:id" element={<Detail />} />
        <Route path="/detail" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
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
