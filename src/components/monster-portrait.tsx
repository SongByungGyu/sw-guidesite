"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/icon";
import type { Monster } from "@/lib/monster-data";

type MonsterPortraitProps = {
  monster: Monster;
  selected?: boolean;
  selectionOrder?: number;
  leader?: boolean;
  compact?: boolean;
};

export function MonsterPortrait({
  monster,
  selected = false,
  selectionOrder,
  leader = false,
  compact = false,
}: MonsterPortraitProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallback = monster.displayName.slice(-2);

  return (
    <div className={`monster-portrait${compact ? " is-compact" : ""}`}>
      <div
        className={`portrait-placeholder element-${monster.element.toLowerCase()}${
          selected ? " is-selected" : ""
        }`}
        role="img"
        aria-label={`${monster.displayName} 몬스터 이미지`}
      >
        {imageFailed ? (
          <span className="portrait-fallback">{fallback}</span>
        ) : (
          <Image
            alt=""
            className="monster-image"
            height={120}
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={monster.imageUrl}
            unoptimized
            width={120}
          />
        )}
      </div>
      {selectionOrder ? <span className="selection-order">{selectionOrder}</span> : null}
      {leader ? (
        <span className="leader-mark" aria-label="리더 몬스터">
          <Icon name="crown" size={13} />
        </span>
      ) : null}
      <span className="monster-name">{monster.displayName}</span>
      <span className="monster-grade" aria-label={`태생 ${monster.grade}성`}>
        {"★".repeat(monster.grade)}
      </span>
    </div>
  );
}
