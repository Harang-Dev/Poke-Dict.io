import { useState } from 'react';
import { Link } from 'react-router-dom';
import { defaultEntries, entryById, typeNames } from '../dex/catalogue';
import { CardFaces } from '../components/PokeCard';
import PokemonPicker from '../components/PokemonPicker';
import PokemonSprite from '../components/PokemonSprite';

const quizKey = 'poke-dict-daily-quiz';
const dayInKorea = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });

function readAttempt(day, answerId) {
  try {
    const saved = JSON.parse(localStorage.getItem(quizKey));
    if (saved?.day === day && saved.answerId === answerId && Array.isArray(saved.guesses)) {
      return {
        guesses: saved.guesses.filter((id) => entryById.has(id)).slice(0, 20),
        revealed: saved.revealed === true,
      };
    }
  } catch {
    // The current round can still be played without persistent storage.
  }
  return { guesses: [], revealed: false };
}

export default function Quiz() {
  const day = dayInKorea.format(new Date());
  const dayNumber = Math.floor(Date.parse(day) / 86_400_000);
  const answer = defaultEntries[(dayNumber * 97 + 19) % defaultEntries.length];
  return <QuizRound key={day} day={day} answer={answer} />;
}

function QuizRound({ day, answer }) {
  const [{ guesses, revealed }, setAttempt] = useState(() => readAttempt(day, answer.id));
  const solved = guesses.includes(answer.id);
  const finished = solved || revealed;

  function save(nextGuesses, show) {
    setAttempt({ guesses: nextGuesses, revealed: show });
    try {
      localStorage.setItem(quizKey, JSON.stringify({ day, answerId: answer.id, guesses: nextGuesses, revealed: show }));
    } catch {
      // The answer remains visible for the current visit.
    }
  }

  return (
    <main className="workspace quiz">
      <h1>오늘의 실루엣</h1>
      <p><time dateTime={day}>{day}</time> · 한국 시간 기준</p>
      <div className="pokemon-card pokemon-card--quiz" data-flipped={finished}>
        <CardFaces
          front={<span className="pokemon-card__media"><PokemonSprite entry={answer} silhouette /></span>}
          back={finished ? (
            <>
              <span className="pokemon-card__media"><PokemonSprite entry={answer} /></span>
              <span className="pokemon-card__label">{answer.name}</span>
            </>
          ) : null}
        />
      </div>
      {finished ? (
        <div>
          <p role="status">{solved ? '정답이에요!' : '오늘의 정답'} {answer.name}</p>
          <Link to={`/pokemon/${answer.id}`}>포켓몬 상세 보기</Link>
        </div>
      ) : (
        <>
          <ul className="quiz-hints">
            <li>{guesses.length >= 1 ? `타입 · ${answer.types.map((type) => typeNames[type] ?? type).join(' · ')}` : '한 번 도전하면 타입 힌트를 볼 수 있어요.'}</li>
            {guesses.length >= 2 && <li>세대 · {answer.generation}세대</li>}
            {guesses.length >= 3 && answer.height != null && <li>키 · {answer.height / 10} m</li>}
          </ul>
          {guesses.length < 20 && <PokemonPicker label="정답 입력" options={defaultEntries} excluded={guesses}
            onPick={(id) => save([...guesses, id], false)} />}
          <button type="button" onClick={() => save(guesses, true)}>정답 공개</button>
        </>
      )}
      {guesses.length > 0 && <p>시도한 포켓몬 · {guesses.map((id) => entryById.get(id)?.name).filter(Boolean).join(', ')}</p>}
    </main>
  );
}
