import { Button } from '../components/ui/button';
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
        <div className="quiz-result">
          <span className="meta-badge" data-tone={solved ? 'success' : undefined} role="status">
            {solved ? '정답이에요!' : '정답 공개'}<span className="sr-only"> {answer.name}</span>
          </span>
          <Button asChild variant="default" className="no-underline">
            <Link to={`/pokemon/${answer.id}`}>포켓몬 상세 보기</Link>
          </Button>
        </div>
      ) : (
        <>
          {guesses.length > 0 && (
            <ul className="quiz-badges" aria-label="힌트">
              {answer.types.map((type) => <li key={type} className="type-badge" data-type={type}>{typeNames[type] ?? type}</li>)}
              {guesses.length >= 2 && <li className="meta-badge">{answer.generation}세대</li>}
              {guesses.length >= 3 && answer.height != null && <li className="meta-badge">키 {answer.height / 10} m</li>}
            </ul>
          )}
          {guesses.length < 20 && <PokemonPicker label="정답 입력" options={defaultEntries} excluded={guesses}
            onPick={(id) => save([...guesses, id], false)} />}
          <Button variant="ghost" type="button" onClick={() => save(guesses, true)}>정답 공개</Button>
        </>
      )}
      {guesses.length > 0 && (
        <div className="quiz-guesses">
          <span>시도 {guesses.length}회</span>
          <ul className="quiz-badges" aria-label="시도한 포켓몬">
            {guesses.map((id) => (
              <li key={id} className="meta-badge" data-tone={id === answer.id ? 'success' : undefined}>
                {entryById.get(id)?.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
