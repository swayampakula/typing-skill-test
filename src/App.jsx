import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const defaultParagraph =
  "Typing regularly improves speed, accuracy, and confidence. Focus on steady rhythm and minimize mistakes for better results over time. Practicing with longer passages helps build endurance, consistency, and stronger muscle memory. Stay relaxed, keep your eyes moving ahead, and aim for controlled precision before chasing speed.";
const MIN_PARAGRAPH_LENGTH = 250;

const countCorrectChars = (typed, target) => {
  let correct = 0;
  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === target[index]) {
      correct += 1;
    }
  }
  return correct;
};

function App() {
  const paragraphPaneRef = useRef(null);
  const [paragraph, setParagraph] = useState(defaultParagraph);
  const [typedText, setTypedText] = useState("");
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(true);
  const [isNormalizedView, setIsNormalizedView] = useState(false);
  const trimmedParagraphLength = paragraph.trim().length;
  const canStartTest = trimmedParagraphLength >= MIN_PARAGRAPH_LENGTH;
  const activeParagraphText = isNormalizedView
    ? paragraph.replace(/\s+/g, " ").trim()
    : paragraph;

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          clearInterval(intervalId);
          setIsRunning(false);
          setIsFinished(true);
          return 0;
        }
        return previousTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !activeParagraphText) {
      return;
    }

    const isParagraphCompleted =
      typedText.trimEnd() === activeParagraphText.trimEnd();

    if (isParagraphCompleted) {
      setIsRunning(false);
      setIsFinished(true);
    }
  }, [typedText, activeParagraphText, isRunning]);

  const elapsedSeconds = isRunning || isFinished ? duration - timeLeft : 0;
  const isTimerCritical =
    (isRunning || isFinished) && timeLeft <= duration * 0.1;
  const paragraphWordCount = activeParagraphText.trim()
    ? activeParagraphText.trim().split(/\s+/).length
    : 0;
  const activeCharIndex = Math.min(
    Math.max(typedText.length - 1, 0),
    Math.max(activeParagraphText.length - 1, 0),
  );

  const highlightedParagraphChars = useMemo(
    () =>
      activeParagraphText.split("").map((char, index) => {
        const typedChar = typedText[index];

        if (typedChar === undefined) {
          return { char, status: "pending", key: `char-${index}` };
        }

        return {
          char,
          status: typedChar === char ? "correct" : "incorrect",
          key: `char-${index}`,
        };
      }),
    [activeParagraphText, typedText],
  );

  useEffect(() => {
    if (!isRunning || !paragraphPaneRef.current || !activeParagraphText) {
      return;
    }

    const activeCharacterElement = paragraphPaneRef.current.querySelector(
      `[data-char-index=\"${activeCharIndex}\"]`,
    );

    if (activeCharacterElement) {
      activeCharacterElement.scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    }
  }, [isRunning, activeCharIndex, activeParagraphText]);

  const stats = useMemo(() => {
    const typedChars = typedText.length;
    const typedWordCount = typedText.trim()
      ? typedText.trim().split(/\s+/).length
      : 0;
    const correctChars = countCorrectChars(typedText, activeParagraphText);
    const accuracy = typedChars > 0 ? (correctChars / typedChars) * 100 : 0;
    const elapsedMinutes = elapsedSeconds / 60;
    const wordsPerMinute =
      elapsedMinutes > 0 ? correctChars / 5 / elapsedMinutes : 0;

    return {
      typedChars,
      paragraphWordCount,
      typedWordCount,
      correctChars,
      accuracy,
      wordsPerMinute,
    };
  }, [typedText, activeParagraphText, elapsedSeconds]);

  const handleStart = () => {
    if (!canStartTest) {
      return;
    }

    setTypedText("");
    setTimeLeft(duration);
    setIsRunning(true);
    setIsFinished(false);
  };

  const handleParagraphChange = (event) => {
    setParagraph(event.target.value);

    if (!isRunning) {
      setTypedText("");
      setIsFinished(false);
      setTimeLeft(duration);
    }
  };

  const handleTypingCopy = (event) => {
    event.preventDefault();
  };

  const handleTypingPaste = (event) => {
    event.preventDefault();
  };

  const handleParagraphCopy = (event) => {
    event.preventDefault();
  };

  return (
    <main className="container">
      <h1>Typing Skill Test</h1>

      <div className="panel">
        <label htmlFor="paragraph">Paragraph Input</label>
        <textarea
          id="paragraph"
          value={paragraph}
          onChange={handleParagraphChange}
          rows={8}
          disabled={isRunning}
        />
        <p className="input-hint">
          Minimum {MIN_PARAGRAPH_LENGTH} characters required (
          {trimmedParagraphLength}/{MIN_PARAGRAPH_LENGTH})
        </p>

        <label htmlFor="duration">Countdown Timer (seconds)</label>
        <input
          id="duration"
          type="number"
          min="10"
          step="5"
          value={duration}
          onChange={(event) => {
            const nextDuration = Number(event.target.value);
            const validDuration = Number.isNaN(nextDuration)
              ? 60
              : Math.max(10, nextDuration);
            setDuration(validDuration);
            if (!isRunning) {
              setTimeLeft(validDuration);
            }
          }}
          disabled={isRunning}
        />

        <button
          type="button"
          onClick={handleStart}
          disabled={isRunning || !canStartTest}
        >
          {isFinished ? "Restart Test" : "Start Test"}
        </button>
      </div>

      <div className="panel">
        <h2>Type This Paragraph</h2>
        <div className="typing-layout">
          <section className="pane">
            <div className="pane-header">
              <h3>Paragraph</h3>
              <div className="toggle-group">
                <label className="toggle-control" htmlFor="highlight-toggle">
                  <input
                    id="highlight-toggle"
                    type="checkbox"
                    checked={isHighlightEnabled}
                    onChange={(event) =>
                      setIsHighlightEnabled(event.target.checked)
                    }
                  />
                  <span>Highlight</span>
                </label>
                <label className="toggle-control" htmlFor="normalize-toggle">
                  <input
                    id="normalize-toggle"
                    type="checkbox"
                    checked={isNormalizedView}
                    onChange={(event) =>
                      setIsNormalizedView(event.target.checked)
                    }
                  />
                  <span>Remove line breaks/extra spaces</span>
                </label>
              </div>
            </div>
            <p
              className="target-text"
              ref={paragraphPaneRef}
              onCopy={handleParagraphCopy}
            >
              {activeParagraphText
                ? highlightedParagraphChars.map(
                    ({ char, status, key }, index) => (
                      <span
                        key={key}
                        className={isHighlightEnabled ? `word ${status}` : ""}
                        data-char-index={index}
                      >
                        {char}
                      </span>
                    ),
                  )
                : "Enter a paragraph to begin."}
            </p>
          </section>

          <section className="pane">
            <h3>Your Typing</h3>
            <textarea
              className="typing-input"
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              onCopy={handleTypingCopy}
              onPaste={handleTypingPaste}
              onDrop={handleTypingPaste}
              disabled={!isRunning}
              placeholder={
                isRunning ? "Start typing here..." : "Click Start Test to begin"
              }
            />
          </section>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Paragraph Words</span>
          <strong>{stats.paragraphWordCount}</strong>
        </div>
        <div className="stat-card">
          <span>Words Typed</span>
          <strong>{stats.typedWordCount}</strong>
        </div>
        <div className="stat-card">
          <span>Time Left</span>
          <strong className={isTimerCritical ? "timer-critical" : ""}>
            {timeLeft}s
          </strong>
        </div>
        <div className="stat-card">
          <span>Accuracy</span>
          <strong>{stats.accuracy.toFixed(2)}%</strong>
        </div>
        <div className="stat-card">
          <span>Words Per Minute</span>
          <strong>{stats.wordsPerMinute.toFixed(2)}</strong>
        </div>
      </div>
    </main>
  );
}

export default App;
