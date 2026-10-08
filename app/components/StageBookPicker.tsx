"use client";

import { BOOK_STAGES, PUBLISHED_BOOK_SHORT_NAMES, availableBookStages, booksForStage, type BookStage } from "../lib/app/books";
import type { BookDirectory } from "../lib/app/types";

type Props = {
  books: BookDirectory[];
  stage: BookStage;
  selectedBookKey: string;
  onStageChange: (stage: BookStage) => void;
  onSelectBook: (bookKey: string) => void;
  allOption?: { key: string; label: string };
  className?: string;
  bookListClassName?: string;
  ariaLabel?: string;
};

/** A shared stage and published-volume selector for pages with a real book filter. */
export function StageBookPicker({
  books,
  stage,
  selectedBookKey,
  onStageChange,
  onSelectBook,
  allOption,
  className = "",
  bookListClassName = "",
  ariaLabel = "按教材册别筛选",
}: Props) {
  const stages = availableBookStages(books);
  if (stages.length < 2) return null;

  const stageBooks = booksForStage(books, stage);
  const selectStage = (nextStage: BookStage) => {
    if (nextStage === stage) return;
    const nextBooks = booksForStage(books, nextStage);
    if (!nextBooks.length) return;
    onStageChange(nextStage);
    onSelectBook(allOption ? allOption.key : nextBooks[0].key);
  };
  const selectBook = (bookKey: string) => {
    onSelectBook(bookKey);
  };

  return <div className={`stage-book-picker ${className}`.trim()}>
    <div className="stage-book-picker__desktop">
      <div className="stage-book-picker__stages" role="group" aria-label="选择学段">
        {BOOK_STAGES.filter((item) => stages.includes(item)).map((item) => <button
          aria-pressed={stage === item}
          className={stage === item ? "is-active" : ""}
          key={item}
          onClick={() => selectStage(item)}
          type="button"
        >{item}</button>)}
      </div>
      <nav aria-label={ariaLabel} className={`stage-book-picker__books ${bookListClassName}`.trim()}>
        {allOption && <button
          aria-current={selectedBookKey === allOption.key ? "page" : undefined}
          className={selectedBookKey === allOption.key ? "is-active" : ""}
          key={allOption.key || "all"}
          onClick={() => selectBook(allOption.key)}
          type="button"
        >{allOption.label}</button>}
        {stageBooks.map((book) => <button
          aria-current={book.key === selectedBookKey ? "page" : undefined}
          className={book.key === selectedBookKey ? "is-active" : ""}
          key={book.key}
          onClick={() => selectBook(book.key)}
          type="button"
        >{PUBLISHED_BOOK_SHORT_NAMES[book.key] ?? `${book.grade}${book.semester.replace(/册$/, "")}`}</button>)}
      </nav>
    </div>
    <div className="stage-book-picker__mobile">
      <label>
        <span>学段</span>
        <select aria-label="选择学段" value={stage} onChange={(event) => selectStage(event.currentTarget.value as BookStage)}>
          {BOOK_STAGES.filter((item) => stages.includes(item)).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label>
        <span>册别</span>
        <select aria-label="选择册别" value={selectedBookKey} onChange={(event) => selectBook(event.currentTarget.value)}>
          {allOption && <option value={allOption.key}>{allOption.label}</option>}
          {stageBooks.map((book) => <option key={book.key} value={book.key}>
            {PUBLISHED_BOOK_SHORT_NAMES[book.key] ?? `${book.grade}${book.semester.replace(/册$/, "")}`}
          </option>)}
        </select>
      </label>
    </div>
  </div>;
}
