import { useState } from 'react';
import { useHref } from 'react-router-dom';

export default function ShareLink({ to, children = '이 화면 공유' }) {
  const href = useHref(to);
  const url = new URL(href, window.location.href).href;
  const [state, setState] = useState('');

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      setState('fallback');
    }
  }

  return (
    <div className="share-link">
      <button type="button" onClick={copy}>{children}</button>
      {state === 'copied' && <span role="status">링크를 복사했어요.</span>}
      {state === 'fallback' && <input aria-label="공유 주소" readOnly value={url} onFocus={(event) => event.target.select()} />}
    </div>
  );
}
