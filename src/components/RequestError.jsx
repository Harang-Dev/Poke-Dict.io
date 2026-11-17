export default function RequestError({ message, retry, retrying = false }) {
  return (
    <div className="request-error">
      <p role="alert">{message}</p>
      <button type="button" onClick={retry} disabled={retrying}>
        {retrying ? '다시 불러오는 중…' : '다시 시도'}
      </button>
    </div>
  );
}
