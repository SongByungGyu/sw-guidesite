"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { MonsterPortrait } from "@/components/monster-portrait";
import { monsters, type Element } from "@/lib/monster-data";

type MonsterPickerProps = {
  open: boolean;
  initialSelection: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
  replaceSlot?: number | null;
  selectionKind?: "defense" | "offense" | "team";
  maxSelection?: number;
};

const elements: Array<{ value: "ALL" | Element; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "FIRE", label: "불" },
  { value: "WATER", label: "물" },
  { value: "WIND", label: "바람" },
  { value: "LIGHT", label: "빛" },
  { value: "DARK", label: "어둠" },
];

const grades: Array<{ value: "ALL" | 2 | 3 | 4 | 5; label: string }> = [
  { value: "ALL", label: "등급 전체" },
  { value: 2, label: "태생 2성" },
  { value: 3, label: "태생 3성" },
  { value: 4, label: "태생 4성" },
  { value: 5, label: "태생 5성" },
];

export function MonsterPicker({
  open,
  initialSelection,
  onClose,
  onConfirm,
  replaceSlot = null,
  selectionKind = "defense",
  maxSelection = 3,
}: MonsterPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [element, setElement] = useState<"ALL" | Element>("ALL");
  const [grade, setGrade] = useState<"ALL" | 2 | 3 | 4 | 5>("ALL");
  const [selected, setSelected] = useState<string[]>(initialSelection);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSelected(initialSelection);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [initialSelection, open]);

  const filtered = monsters.filter((monster) => {
    const matchesQuery = `${monster.displayName} ${monster.englishName}`.toLowerCase().includes(deferredQuery);
    const matchesElement = element === "ALL" || monster.element === element;
    const matchesGrade = grade === "ALL" || monster.grade === grade;
    return matchesQuery && matchesElement && matchesGrade;
  });

  function toggleMonster(id: string) {
    if (replaceSlot !== null) {
      const usedByAnotherSlot = initialSelection.some(
        (selectedId, index) => index !== replaceSlot && selectedId === id,
      );
      if (usedByAnotherSlot) return;
      const nextSelection = [...initialSelection];
      nextSelection[replaceSlot] = id;
      onConfirm(nextSelection);
      onClose();
      return;
    }

    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length === maxSelection) return current;
      return [...current, id];
    });
  }

  function confirmSelection() {
    if (selected.length !== maxSelection) return;
    onConfirm(selected);
    onClose();
  }

  return (
    <dialog
      aria-labelledby="monster-picker-title"
      className="monster-dialog"
      onCancel={onClose}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="dialog-shell">
        <header className="dialog-header">
          <div>
            <p className="eyebrow">{replaceSlot === null ? (selectionKind === "defense" ? "상대 방어덱" : selectionKind === "offense" ? "사용할 공격덱" : "몬스터 편성") : `${replaceSlot + 1}번 슬롯 즉시 교체`}</p>
            <h2 id="monster-picker-title">
              {replaceSlot === null ? `몬스터 ${maxSelection}마리를 선택하세요` : "변경할 몬스터를 선택하세요"}
            </h2>
          </div>
          <button className="icon-button" type="button" aria-label="몬스터 선택 닫기" onClick={onClose}>
            <Icon name="x" />
          </button>
        </header>

        <div className="picker-toolbar">
          <label className="search-field">
            <Icon name="search" size={18} />
            <span className="sr-only">몬스터 이름 검색</span>
            <input
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
              placeholder="몬스터 이름 검색"
              type="search"
              value={query}
            />
          </label>
          <div className="element-filters" aria-label="속성 필터">
            {elements.map((item) => (
              <button
                aria-pressed={element === item.value}
                className={`filter-chip element-filter-${item.value.toLowerCase()}`}
                key={item.value}
                onClick={() => setElement(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="grade-filters" aria-label="태생 등급 필터">
            {grades.map((item) => (
              <button
                aria-pressed={grade === item.value}
                className="filter-chip"
                key={item.value}
                onClick={() => setGrade(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="picker-count">{filtered.length.toLocaleString("ko-KR")} / {monsters.length.toLocaleString("ko-KR")}마리</p>
        </div>

        <div className="monster-grid" aria-live="polite">
          {filtered.map((monster) => {
            const index = selected.indexOf(monster.id);
            const isSelected = index >= 0;
            const usedByAnotherSlot = replaceSlot !== null
              && initialSelection.some(
                (selectedId, slotIndex) => slotIndex !== replaceSlot && selectedId === monster.id,
              );
            return (
              <button
                aria-label={`${monster.displayName}${usedByAnotherSlot ? ", 다른 슬롯에서 선택됨" : isSelected ? `, ${index + 1}번째 선택됨` : " 선택"}`}
                aria-pressed={isSelected}
                className="monster-option"
                disabled={usedByAnotherSlot}
                key={monster.id}
                onClick={() => toggleMonster(monster.id)}
                type="button"
              >
                <MonsterPortrait
                  monster={monster}
                  selected={isSelected}
                  selectionOrder={isSelected ? index + 1 : undefined}
                />
                {isSelected ? <Icon className="selected-check" name="check" size={17} /> : null}
              </button>
            );
          })}
          {!filtered.length ? (
            <div className="monster-empty">
              <Icon name="search" />
              <strong>검색 결과가 없습니다.</strong>
              <span>한국어 약칭이나 영문 각성명으로 다시 검색해 주세요.</span>
            </div>
          ) : null}
        </div>

        <footer className="dialog-footer">
          <div className="selection-preview">
            <strong>{replaceSlot === null ? `${selected.length}/${maxSelection} 선택` : `${replaceSlot + 1}번 몬스터 선택`}</strong>
            <span>{replaceSlot === null
              ? selected.map((id) => monsters.find((item) => item.id === id)?.displayName).join(" · ")
              : "몬스터를 누르면 바로 교체됩니다."}</span>
          </div>
          <button className="button secondary" onClick={onClose} type="button">취소</button>
          {replaceSlot === null ? (
            <button className="button primary" disabled={selected.length !== maxSelection} onClick={confirmSelection} type="button">
              {selectionKind === "defense" ? "이 방덱 선택" : selectionKind === "offense" ? "이 공덱 선택" : "이 편성 선택"}
            </button>
          ) : null}
        </footer>
      </div>
    </dialog>
  );
}
