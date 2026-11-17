import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';
import { useHref } from 'react-router-dom';
import { toast } from 'sonner';

export default function ShareLink({ to, children = '이 화면 공유' }) {
  const href = useHref(to);
  const url = new URL(href, window.location.href).href;
  const [showAddress, setShowAddress] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setShowAddress(false);
      toast.success('링크를 복사했어요.', { id: 'share-link-copied' });
    } catch {
      setShowAddress(true);
    }
  }

  return (
    <div className="share-link">
      <Button type="button" onClick={copy}>{children}</Button>
      {showAddress && <Input aria-label="공유 주소" readOnly value={url} onFocus={(event) => event.target.select()} />}
    </div>
  );
}
