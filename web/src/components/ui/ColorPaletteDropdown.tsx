import { useCallback, useState } from "react";
import { useStoryColors } from "../../hooks/useStoryColors";
import { useClickOutside } from "../../hooks/useClickOutside";

export type ColorPaletteDropdownProps = {
  storyId: string | null;
  value: string;
  onChange: (color: string) => void;
};

export function ColorPaletteDropdown({
  storyId,
  value,
  onChange,
}: ColorPaletteDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: colors = [] } = useStoryColors(storyId ?? "");

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);
  const { containerRef } = useClickOutside<HTMLDivElement>({
    onClickOutside: close,
  });

  const visibleColors = storyId
    ? [...colors]
        .filter((c) => !c.ignored)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const handleSwatchClick = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const onClickPrevent = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger */}
      <button
        type="button"
        aria-label="Open color palette"
        onClick={() => setIsOpen((v) => !v)}
        className="h-8 w-8 rounded-full border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        style={{ backgroundColor: value }}
      />

      {/* Popover */}
      {isOpen && (
        <div className="absolute left-0 top-10 z-50 min-w-[180px] rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          {visibleColors.length > 0 && (
            <>
              <div className="mb-2 flex flex-wrap gap-2">
                {visibleColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={`Select color ${c.color}`}
                    onClick={() => handleSwatchClick(c.color)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      c.color === value
                        ? "border-blue-500 ring-2 ring-blue-300"
                        : "border-slate-200"
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
              <hr className="mb-2 border-slate-100" />
            </>
          )}

          {/* Custom color picker */}
          <label
            onClick={onClickPrevent}
            className="flex cursor-pointer items-center gap-2 text-xs text-slate-500"
          >
            <input
              type="color"
              value={value}
              onChange={handleCustomChange}
              className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Custom color"
            />
            Custom
          </label>
        </div>
      )}
    </div>
  );
}
